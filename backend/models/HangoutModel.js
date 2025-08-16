import { BaseModel } from './BaseModel.js';
import { handleAsyncOperation, NotFoundError, AuthorizationError, ConflictError } from '../utils/errors.js';
import { executeQuery, isHangoutParticipant, isHangoutCreator, logHangoutActivity } from '../utils/supabase.js';

/**
 * Hangout model for managing hangouts and participants
 */
export class HangoutModel extends BaseModel {
  constructor(accessToken) {
    super('hangouts', accessToken);
  }

  /**
   * Create a new hangout with the creator as the first participant
   * @param {Object} hangoutData - Hangout data
   * @param {string} creatorId - ID of the user creating the hangout
   * @returns {Promise<Object>} Created hangout with participant info
   */
  async createWithParticipant(hangoutData, creatorId) {
    return handleAsyncOperation(async () => {
      // Create hangout
      const hangout = await this.create({
        ...hangoutData,
        created_by: creatorId
      }, `
        *,
        created_by:users!hangouts_created_by_fkey(id, full_name, avatar_url)
      `);

      // Add creator as participant
      await executeQuery(
        this.supabase
          .from('hangout_participants')
          .insert({
            hangout_id: hangout.id,
            user_id: creatorId,
            participation_status: 'active'
          }),
        'add creator as participant'
      );

      // Log activity
      await logHangoutActivity(
        this.supabase,
        hangout.id,
        creatorId,
        'hangout_created',
        {
          hangout_title: hangout.title,
          location: hangout.location_name
        }
      );

      return {
        ...hangout,
        participants_count: 1,
        has_bill: false
      };
    }, 'create hangout with participant');
  }

  /**
   * Get user's hangouts with participation info
   * @param {string} userId - User ID
   * @param {Object} filters - Filters (status, limit, offset)
   * @returns {Promise<Object>} Paginated hangouts
   */
  async getUserHangouts(userId, filters = {}) {
    const { status, limit = 20, offset = 0 } = filters;

    return handleAsyncOperation(async () => {
      // Step 1: Get hangout IDs where user is a participant
      const { data: participantData, error: participantError } = await this.supabase
        .from('hangout_participants')
        .select('hangout_id')
        .eq('user_id', userId)
        .eq('participation_status', 'active');

      if (participantError) {
        throw new Error(`Failed to fetch user participation: ${participantError.message}`);
      }

      if (!participantData || participantData.length === 0) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset,
            has_more: false
          }
        };
      }

      const hangoutIds = participantData.map(p => p.hangout_id);

      // Step 2: Get hangouts basic info (no complex joins)
      let query = this.supabase
        .from('hangouts')
        .select('*')
        .in('id', hangoutIds)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: hangouts, error: hangoutsError } = await query;
      
      if (hangoutsError) {
        throw new Error(`Failed to fetch hangouts: ${hangoutsError.message}`);
      }

      // Step 3: Enrich each hangout with additional data
      const formattedHangouts = [];
      
      for (const hangout of hangouts || []) {
        try {
          // Get creator info
          const { data: creator } = await this.supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .eq('id', hangout.created_by)
            .single();

          // Get participant count
          const { data: participantCount } = await this.supabase
            .from('hangout_participants')
            .select('id', { count: 'exact' })
            .eq('hangout_id', hangout.id)
            .eq('participation_status', 'active');

          // Get bill info if exists
          const { data: bill } = await this.supabase
            .from('bills')
            .select('id, title, total_amount, status')
            .eq('hangout_id', hangout.id)
            .maybeSingle(); // Use maybeSingle to avoid error if no bill exists

          formattedHangouts.push({
            id: hangout.id,
            title: hangout.title,
            location_name: hangout.location_name,
            location_address: hangout.location_address,
            latitude: hangout.latitude,
            longitude: hangout.longitude,
            hangout_date: hangout.hangout_date,
            status: hangout.status,
            created_by: creator || { id: hangout.created_by, full_name: 'Unknown', avatar_url: null },
            participants_count: participantCount?.length || 0,
            has_bill: !!bill,
            bill_status: bill?.status || null,
            bill_total: bill?.total_amount || null,
            created_at: hangout.created_at
          });
        } catch (hangoutError) {
          console.error('Error processing hangout:', hangout.id, hangoutError);
          // Still add the hangout with basic info
          formattedHangouts.push({
            id: hangout.id,
            title: hangout.title,
            location_name: hangout.location_name,
            location_address: hangout.location_address,
            latitude: hangout.latitude,
            longitude: hangout.longitude,
            hangout_date: hangout.hangout_date,
            status: hangout.status,
            created_by: { id: hangout.created_by, full_name: 'Unknown', avatar_url: null },
            participants_count: 0,
            has_bill: false,
            bill_status: null,
            bill_total: null,
            created_at: hangout.created_at
          });
        }
      }

      return {
        data: formattedHangouts,
        pagination: {
          total: formattedHangouts.length,
          limit,
          offset,
          has_more: false
        }
      };
    }, 'get user hangouts');
  }

  /**
   * Get hangout details with full participant and bill information
   * @param {string} hangoutId - Hangout ID
   * @param {string} userId - User ID (for access control)
   * @returns {Promise<Object>} Detailed hangout information
   */
  async getHangoutDetails(hangoutId, userId) {
    return handleAsyncOperation(async () => {
      // Verify user is a participant
      const isParticipant = await isHangoutParticipant(this.supabase, hangoutId, userId);
      if (!isParticipant) {
        throw new AuthorizationError('Access denied: not a participant in this hangout');
      }

      return executeQuery(
        this.supabase
          .from('hangouts')
          .select(`
            *,
            created_by:users!hangouts_created_by_fkey(id, full_name, avatar_url),
            participants:hangout_participants(
              id,
              participation_status,
              joined_at,
              user:users!hangout_participants_user_id_fkey(id, full_name, avatar_url)
            ),
            bill:bills(
              *,
              created_by:users!bills_created_by_fkey(id, full_name, avatar_url),
              paid_by:users!bills_paid_by_fkey(id, full_name, avatar_url),
              items:bill_items(
                *,
                assignments:item_assignments(
                  *,
                  user:users!item_assignments_user_id_fkey(id, full_name, avatar_url)
                )
              ),
              participant_balances(
                *,
                user:users!participant_balances_user_id_fkey(id, full_name, avatar_url)
              )
            )
          `)
          .eq('id', hangoutId)
          .single(),
        'get hangout details'
      );
    }, 'get hangout details');
  }

  /**
   * Update hangout (creator only)
   * @param {string} hangoutId - Hangout ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User ID (must be creator)
   * @returns {Promise<Object>} Updated hangout
   */
  async updateHangout(hangoutId, updates, userId) {
    return handleAsyncOperation(async () => {
      // Verify user is the creator
      const isCreator = await isHangoutCreator(this.supabase, hangoutId, userId);
      if (!isCreator) {
        throw new AuthorizationError('Only the hangout creator can update hangout details');
      }

      return this.updateById(hangoutId, updates, `
        *,
        created_by:users!hangouts_created_by_fkey(id, full_name, avatar_url)
      `);
    }, 'update hangout');
  }

  /**
   * Add participant to hangout
   * @param {string} hangoutId - Hangout ID
   * @param {string} participantId - User ID to add
   * @param {string} creatorId - ID of user adding the participant (must be creator)
   * @returns {Promise<Object>} Added participant info
   */
  async addParticipant(hangoutId, participantId, creatorId) {
    return handleAsyncOperation(async () => {
      // Verify user is the creator
      const isCreator = await isHangoutCreator(this.supabase, hangoutId, creatorId);
      if (!isCreator) {
        throw new AuthorizationError('Only the hangout creator can add participants');
      }

      // Check if user exists
      const user = await executeQuery(
        this.supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', participantId)
          .single(),
        'get user'
      );

      if (!user) {
        throw new NotFoundError('User');
      }

      // Check if user is already a participant
      const existingParticipant = await this.supabase
        .from('hangout_participants')
        .select('id, participation_status')
        .eq('hangout_id', hangoutId)
        .eq('user_id', participantId)
        .single();

      if (existingParticipant.data) {
        if (existingParticipant.data.participation_status === 'active') {
          throw new ConflictError('User is already a participant in this hangout');
        } else {
          // Reactivate participant
          const reactivatedParticipant = await executeQuery(
            this.supabase
              .from('hangout_participants')
              .update({ 
                participation_status: 'active',
                joined_at: new Date().toISOString()
              })
              .eq('id', existingParticipant.data.id)
              .select(`
                id,
                participation_status,
                joined_at,
                user:users!hangout_participants_user_id_fkey(id, full_name, avatar_url)
              `)
              .single(),
            'reactivate participant'
          );

          // Log activity
          await logHangoutActivity(
            this.supabase,
            hangoutId,
            creatorId,
            'participant_added',
            {
              participant_name: user.full_name,
              participant_id: participantId
            }
          );

          return reactivatedParticipant;
        }
      }

      // Add new participant
      const newParticipant = await executeQuery(
        this.supabase
          .from('hangout_participants')
          .insert({
            hangout_id: hangoutId,
            user_id: participantId,
            participation_status: 'active'
          })
          .select(`
            id,
            participation_status,
            joined_at,
            user:users!hangout_participants_user_id_fkey(id, full_name, avatar_url)
          `)
          .single(),
        'add new participant'
      );

      // Log activity
      await logHangoutActivity(
        this.supabase,
        hangoutId,
        creatorId,
        'participant_added',
        {
          participant_name: user.full_name,
          participant_id: participantId
        }
      );

      return newParticipant;
    }, 'add participant');
  }

  /**
   * Remove participant from hangout
   * @param {string} hangoutId - Hangout ID
   * @param {string} participantId - User ID to remove
   * @param {string} creatorId - ID of user removing the participant (must be creator)
   * @returns {Promise<void>}
   */
  async removeParticipant(hangoutId, participantId, creatorId) {
    return handleAsyncOperation(async () => {
      // Verify user is the creator
      const isCreator = await isHangoutCreator(this.supabase, hangoutId, creatorId);
      if (!isCreator) {
        throw new AuthorizationError('Only the hangout creator can remove participants');
      }

      // Don't allow creator to remove themselves
      if (participantId === creatorId) {
        throw new ConflictError('Creator cannot remove themselves from hangout');
      }

      // Get participant info
      const participant = await executeQuery(
        this.supabase
          .from('hangout_participants')
          .select(`
            id,
            user:users!hangout_participants_user_id_fkey(id, full_name)
          `)
          .eq('hangout_id', hangoutId)
          .eq('user_id', participantId)
          .single(),
        'get participant'
      );

      if (!participant) {
        throw new NotFoundError('Participant');
      }

      // Update participant status instead of deleting (for audit trail)
      await executeQuery(
        this.supabase
          .from('hangout_participants')
          .update({ participation_status: 'left' })
          .eq('id', participant.id),
        'remove participant'
      );

      // Log activity
      await logHangoutActivity(
        this.supabase,
        hangoutId,
        creatorId,
        'participant_removed',
        {
          participant_name: participant.user.full_name,
          participant_id: participantId
        }
      );
    }, 'remove participant');
  }

  /**
   * Get hangout activity timeline
   * @param {string} hangoutId - Hangout ID
   * @param {string} userId - User ID (for access control)
   * @param {Object} filters - Filters (activity_type, limit)
   * @returns {Promise<Array>} Activity timeline
   */
  async getActivityTimeline(hangoutId, userId, filters = {}) {
    const { activity_type, limit = 50 } = filters;

    return handleAsyncOperation(async () => {
      // Verify user is a participant
      const isParticipant = await isHangoutParticipant(this.supabase, hangoutId, userId);
      if (!isParticipant) {
        throw new AuthorizationError('Access denied: not a participant in this hangout');
      }

      let query = this.supabase
        .from('hangout_activities')
        .select(`
          id,
          activity_type,
          activity_data,
          created_at,
          user:users(id, full_name, avatar_url)
        `)
        .eq('hangout_id', hangoutId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (activity_type) {
        query = query.eq('activity_type', activity_type);
      }

      return executeQuery(query, 'get hangout activities');
    }, 'get hangout activity timeline');
  }

  /**
   * Get hangouts near a location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @param {string} userId - User ID (for filtering)
   * @returns {Promise<Array>} Nearby hangouts
   */
  async getNearbyHangouts(latitude, longitude, radiusKm = 10, userId = null) {
    return handleAsyncOperation(async () => {
      // This is a simplified version. In production, you'd use PostGIS for proper geo queries
      let query = this.supabase
        .from('hangouts')
        .select(`
          *,
          created_by:users!hangouts_created_by_fkey(id, full_name, avatar_url),
          participants:hangout_participants(
            id,
            participation_status,
            user:users!hangout_participants_user_id_fkey(id, full_name)
          )
        `)
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (userId) {
        // Exclude hangouts the user is already part of
        const userHangouts = await executeQuery(
          this.supabase
            .from('hangout_participants')
            .select('hangout_id')
            .eq('user_id', userId),
          'get user hangout IDs'
        );
        
        const hangoutIds = userHangouts.map(p => p.hangout_id);
        if (hangoutIds.length > 0) {
          query = query.not('id', 'in', `(${hangoutIds.join(',')})`);
        }
      }

      const hangouts = await executeQuery(query, 'get nearby hangouts');

      // Filter by distance (simplified calculation)
      return hangouts.filter(hangout => {
        if (!hangout.latitude || !hangout.longitude) return false;
        
        // Simple distance calculation (would use proper geo functions in production)
        const distance = Math.sqrt(
          Math.pow(hangout.latitude - latitude, 2) + 
          Math.pow(hangout.longitude - longitude, 2)
        ) * 111; // Rough km conversion
        
        return distance <= radiusKm;
      }).map(hangout => ({
        ...hangout,
        distance: Math.sqrt(
          Math.pow(hangout.latitude - latitude, 2) + 
          Math.pow(hangout.longitude - longitude, 2)
        ) * 111
      }));
    }, 'get nearby hangouts');
  }
}

export default HangoutModel;
