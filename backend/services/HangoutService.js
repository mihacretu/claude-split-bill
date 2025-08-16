import { HangoutModel } from '../models/HangoutModel.js';
import { validate, hangoutSchemas, activitySchemas, validatePagination } from '../utils/validation.js';
import { AuthenticationError, handleAsyncOperation, validateUUID } from '../utils/errors.js';

/**
 * Hangout service - handles hangout-related business logic
 */
export class HangoutService {
  constructor(accessToken, supabaseConfig = null) {
    if (!accessToken) {
      throw new AuthenticationError('Access token required for HangoutService');
    }
    this.hangoutModel = new HangoutModel(accessToken, supabaseConfig);
    this.accessToken = accessToken;
  }

  /**
   * Create a new hangout
   * @param {Object} hangoutData - Hangout data
   * @param {string} creatorId - ID of the user creating the hangout
   * @returns {Promise<Object>} Created hangout
   */
  async createHangout(hangoutData, creatorId) {
    return handleAsyncOperation(async () => {
      const validatedData = validate(hangoutData, hangoutSchemas.create, 'hangout data');
      return this.hangoutModel.createWithParticipant(validatedData, creatorId);
    }, 'create hangout');
  }

  /**
   * Get user's hangouts with pagination
   * @param {string} userId - User ID
   * @param {Object} filters - Filters (status, limit, offset)
   * @returns {Promise<Object>} Paginated hangouts
   */
  async getUserHangouts(userId, filters = {}) {
    return handleAsyncOperation(async () => {
      const validatedFilters = validate(filters, hangoutSchemas.query, 'hangout filters');
      return this.hangoutModel.getUserHangouts(userId, validatedFilters);
    }, 'get user hangouts');
  }

  /**
   * Get hangout details
   * @param {string} hangoutId - Hangout ID
   * @param {string} userId - User ID (for access control)
   * @returns {Promise<Object>} Detailed hangout information
   */
  async getHangoutDetails(hangoutId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      return this.hangoutModel.getHangoutDetails(hangoutId, userId);
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
      validateUUID(hangoutId, 'hangout ID');
      const validatedUpdates = validate(updates, hangoutSchemas.update, 'hangout updates');
      return this.hangoutModel.updateHangout(hangoutId, validatedUpdates, userId);
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
      validateUUID(hangoutId, 'hangout ID');
      const validatedData = validate(
        { user_id: participantId }, 
        hangoutSchemas.addParticipant, 
        'participant data'
      );
      return this.hangoutModel.addParticipant(hangoutId, validatedData.user_id, creatorId);
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
      validateUUID(hangoutId, 'hangout ID');
      validateUUID(participantId, 'participant ID');
      return this.hangoutModel.removeParticipant(hangoutId, participantId, creatorId);
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
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      const validatedFilters = validate(filters, activitySchemas.query, 'activity filters');
      return this.hangoutModel.getActivityTimeline(hangoutId, userId, validatedFilters);
    }, 'get activity timeline');
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
      // Validate coordinates
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Latitude and longitude must be numbers');
      }
      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      if (radiusKm <= 0 || radiusKm > 100) {
        throw new Error('Radius must be between 0 and 100 kilometers');
      }

      return this.hangoutModel.getNearbyHangouts(latitude, longitude, radiusKm, userId);
    }, 'get nearby hangouts');
  }

  /**
   * Complete a hangout (creator only)
   * @param {string} hangoutId - Hangout ID
   * @param {string} creatorId - Creator ID
   * @returns {Promise<Object>} Updated hangout
   */
  async completeHangout(hangoutId, creatorId) {
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      
      const updatedHangout = await this.hangoutModel.updateHangout(
        hangoutId, 
        { status: 'completed' }, 
        creatorId
      );

      // Log completion activity
      await this.hangoutModel.supabase
        .from('hangout_activities')
        .insert({
          hangout_id: hangoutId,
          user_id: creatorId,
          activity_type: 'hangout_completed',
          activity_data: {
            completed_at: new Date().toISOString()
          }
        });

      return updatedHangout;
    }, 'complete hangout');
  }

  /**
   * Cancel a hangout (creator only)
   * @param {string} hangoutId - Hangout ID
   * @param {string} creatorId - Creator ID
   * @returns {Promise<Object>} Updated hangout
   */
  async cancelHangout(hangoutId, creatorId) {
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      
      return this.hangoutModel.updateHangout(
        hangoutId, 
        { status: 'cancelled' }, 
        creatorId
      );
    }, 'cancel hangout');
  }

  /**
   * Get hangout participants
   * @param {string} hangoutId - Hangout ID
   * @param {string} userId - User ID (for access control)
   * @returns {Promise<Array>} Hangout participants
   */
  async getParticipants(hangoutId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      
      // Get hangout details which includes participants
      const hangout = await this.hangoutModel.getHangoutDetails(hangoutId, userId);
      
      return hangout.participants.filter(p => p.participation_status === 'active');
    }, 'get hangout participants');
  }

  /**
   * Leave hangout (participant only, not creator)
   * @param {string} hangoutId - Hangout ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async leaveHangout(hangoutId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      
      // Check if user is the creator
      const hangout = await this.hangoutModel.findById(hangoutId, 'created_by');
      if (hangout.created_by === userId) {
        throw new Error('Hangout creator cannot leave the hangout. Use cancel instead.');
      }

      // Update participant status to 'left'
      await this.hangoutModel.supabase
        .from('hangout_participants')
        .update({ participation_status: 'left' })
        .eq('hangout_id', hangoutId)
        .eq('user_id', userId);

      // Log activity
      await this.hangoutModel.supabase
        .from('hangout_activities')
        .insert({
          hangout_id: hangoutId,
          user_id: userId,
          activity_type: 'participant_removed',
          activity_data: {
            left_voluntarily: true
          }
        });
    }, 'leave hangout');
  }

  /**
   * Get hangout statistics
   * @param {string} hangoutId - Hangout ID
   * @param {string} userId - User ID (for access control)
   * @returns {Promise<Object>} Hangout statistics
   */
  async getHangoutStats(hangoutId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      
      const hangout = await this.hangoutModel.getHangoutDetails(hangoutId, userId);
      
      const activeParticipants = hangout.participants.filter(p => p.participation_status === 'active');
      const totalActivities = await this.hangoutModel.supabase
        .from('hangout_activities')
        .select('*', { count: 'exact', head: true })
        .eq('hangout_id', hangoutId);

      let billStats = null;
      if (hangout.bill) {
        const totalItems = hangout.bill.items?.length || 0;
        const totalAssignments = hangout.bill.items?.reduce(
          (sum, item) => sum + (item.assignments?.length || 0), 0
        ) || 0;
        const totalAmount = hangout.bill.total_amount || 0;
        const settledBalances = hangout.bill.participant_balances?.filter(
          b => b.payment_status === 'paid'
        ).length || 0;

        billStats = {
          total_items: totalItems,
          total_assignments: totalAssignments,
          total_amount: totalAmount,
          settled_participants: settledBalances,
          total_participants_with_balance: hangout.bill.participant_balances?.length || 0,
          is_fully_settled: settledBalances === (hangout.bill.participant_balances?.length || 0)
        };
      }

      return {
        hangout_id: hangoutId,
        status: hangout.status,
        participants_count: activeParticipants.length,
        activities_count: totalActivities.count || 0,
        has_bill: !!hangout.bill,
        bill_stats: billStats,
        created_at: hangout.created_at,
        days_since_creation: Math.floor(
          (new Date() - new Date(hangout.created_at)) / (1000 * 60 * 60 * 24)
        )
      };
    }, 'get hangout statistics');
  }

  /**
   * Search hangouts by title or location
   * @param {string} query - Search query
   * @param {string} userId - User ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching hangouts
   */
  async searchHangouts(query, userId, options = {}) {
    return handleAsyncOperation(async () => {
      const { limit = 20, status = 'active' } = options;
      
      if (!query || query.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters long');
      }

      const hangouts = await this.hangoutModel.supabase
        .from('hangouts')
        .select(`
          *,
          created_by:users!hangouts_created_by_fkey(id, full_name, avatar_url),
          participants:hangout_participants!inner(
            id,
            participation_status,
            user_id
          ),
          bill:bills(id, title, total_amount, status)
        `)
        .eq('participants.user_id', userId)
        .eq('status', status)
        .or(`title.ilike.%${query}%,location_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (hangouts.error) {
        throw new Error(`Failed to search hangouts: ${hangouts.error.message}`);
      }

      // Format results
      return hangouts.data.map(hangout => ({
        id: hangout.id,
        title: hangout.title,
        location_name: hangout.location_name,
        location_address: hangout.location_address,
        hangout_date: hangout.hangout_date,
        status: hangout.status,
        created_by: hangout.created_by,
        participants_count: hangout.participants.length,
        has_bill: !!hangout.bill,
        bill_status: hangout.bill?.status || null,
        created_at: hangout.created_at
      }));
    }, 'search hangouts');
  }
}

export default HangoutService;
