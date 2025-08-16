import { BaseModel } from './BaseModel.js';
import { handleAsyncOperation, NotFoundError } from '../utils/errors.js';
import { executeQuery } from '../utils/supabase.js';

/**
 * User model for managing user data and relationships
 */
export class UserModel extends BaseModel {
  constructor(accessToken, supabaseConfig = null) {
    super('users', accessToken, supabaseConfig);
  }

  /**
   * Create or update user profile (for Supabase Auth integration)
   * @param {Object} userData - User data from Supabase Auth
   * @returns {Promise<Object>} User profile
   */
  async upsertProfile(userData) {
    return handleAsyncOperation(async () => {
      return executeQuery(
        this.supabase
          .from('users')
          .upsert({
            id: userData.id,
            email: userData.email,
            full_name: userData.user_metadata?.full_name || userData.email.split('@')[0],
            avatar_url: userData.user_metadata?.avatar_url || null,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single(),
        'upsert user profile'
      );
    }, 'upsert user profile');
  }

  /**
   * Search users by name, username, or email
   * @param {string} query - Search query
   * @param {string} currentUserId - Current user ID to exclude from results
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Matching users
   */
  async searchUsers(query, currentUserId, limit = 10) {
    return handleAsyncOperation(async () => {
      return executeQuery(
        this.supabase
          .from('users')
          .select('id, username, full_name, avatar_url')
          .neq('id', currentUserId)
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(limit)
          .order('full_name'),
        'search users'
      );
    }, 'search users');
  }

  /**
   * Get user's friends with their relationship status
   * @param {string} userId - User ID
   * @param {string} status - Friendship status filter (optional)
   * @returns {Promise<Array>} User's friends
   */
  async getFriends(userId, status = 'accepted') {
    return handleAsyncOperation(async () => {
      const friendships = await executeQuery(
        this.supabase
          .from('friendships')
          .select(`
            id,
            status,
            created_at,
            updated_at,
            requester:users!friendships_requester_id_fkey(id, username, full_name, avatar_url),
            addressee:users!friendships_addressee_id_fkey(id, username, full_name, avatar_url)
          `)
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
          .eq('status', status)
          .order('created_at', { ascending: false }),
        'get user friends'
      );

      // Format friends list to show the other person in each friendship
      return friendships.map(friendship => {
        const isRequester = friendship.requester.id === userId;
        const friend = isRequester ? friendship.addressee : friendship.requester;
        
        return {
          friendship_id: friendship.id,
          friend: friend,
          status: friendship.status,
          created_at: friendship.created_at,
          is_requester: isRequester
        };
      });
    }, 'get user friends');
  }

  /**
   * Get pending friend requests for a user
   * @param {string} userId - User ID
   * @param {string} type - 'sent' or 'received' requests
   * @returns {Promise<Array>} Pending friend requests
   */
  async getFriendRequests(userId, type = 'received') {
    return handleAsyncOperation(async () => {
      const column = type === 'sent' ? 'requester_id' : 'addressee_id';
      const otherColumn = type === 'sent' ? 'addressee' : 'requester';
      
      return executeQuery(
        this.supabase
          .from('friendships')
          .select(`
            id,
            created_at,
            ${otherColumn}:users!friendships_${otherColumn}_id_fkey(id, username, full_name, avatar_url)
          `)
          .eq(column, userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        `get ${type} friend requests`
      );
    }, `get ${type} friend requests`);
  }

  /**
   * Send friend request
   * @param {string} requesterId - User sending the request
   * @param {string} addresseeId - User receiving the request
   * @returns {Promise<Object>} Created friendship request
   */
  async sendFriendRequest(requesterId, addresseeId) {
    return handleAsyncOperation(async () => {
      // Check if friendship already exists
      const existingFriendship = await this.supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
        .single();

      if (existingFriendship.data) {
        const status = existingFriendship.data.status;
        if (status === 'pending') {
          throw new Error('Friend request already sent');
        } else if (status === 'accepted') {
          throw new Error('Users are already friends');
        } else if (status === 'blocked') {
          throw new Error('Cannot send friend request');
        }
      }

      return executeQuery(
        this.supabase
          .from('friendships')
          .insert({
            requester_id: requesterId,
            addressee_id: addresseeId,
            status: 'pending'
          })
          .select(`
            id,
            status,
            created_at,
            addressee:users!friendships_addressee_id_fkey(id, username, full_name, avatar_url)
          `)
          .single(),
        'send friend request'
      );
    }, 'send friend request');
  }

  /**
   * Respond to friend request
   * @param {string} friendshipId - Friendship ID
   * @param {string} userId - User responding to the request
   * @param {string} response - 'accepted', 'declined', or 'blocked'
   * @returns {Promise<Object>} Updated friendship
   */
  async respondToFriendRequest(friendshipId, userId, response) {
    return handleAsyncOperation(async () => {
      // Verify user is the addressee of this request
      const friendship = await executeQuery(
        this.supabase
          .from('friendships')
          .select('id, requester_id, addressee_id, status')
          .eq('id', friendshipId)
          .eq('addressee_id', userId)
          .eq('status', 'pending')
          .single(),
        'get friendship request'
      );

      if (!friendship) {
        throw new NotFoundError('Friend request');
      }

      return executeQuery(
        this.supabase
          .from('friendships')
          .update({ 
            status: response,
            updated_at: new Date().toISOString()
          })
          .eq('id', friendshipId)
          .select(`
            id,
            status,
            updated_at,
            requester:users!friendships_requester_id_fkey(id, username, full_name, avatar_url)
          `)
          .single(),
        'respond to friend request'
      );
    }, 'respond to friend request');
  }

  /**
   * Remove friend or cancel friend request
   * @param {string} friendshipId - Friendship ID
   * @param {string} userId - User performing the action
   * @returns {Promise<void>}
   */
  async removeFriend(friendshipId, userId) {
    return handleAsyncOperation(async () => {
      // Verify user is part of this friendship
      const friendship = await executeQuery(
        this.supabase
          .from('friendships')
          .select('id')
          .eq('id', friendshipId)
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
          .single(),
        'get friendship'
      );

      if (!friendship) {
        throw new NotFoundError('Friendship');
      }

      await this.deleteById(friendshipId);
    }, 'remove friend');
  }

  /**
   * Get users near a location (for finding nearby friends)
   * @param {number} latitude - Current latitude
   * @param {number} longitude - Current longitude
   * @param {string} userId - Current user ID
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Promise<Array>} Nearby users
   */
  async getNearbyUsers(latitude, longitude, userId, radiusKm = 10) {
    return handleAsyncOperation(async () => {
      // This is a simplified version. In production, you might want to use PostGIS or similar
      // For now, we'll return friends who have location data
      const friends = await this.getFriends(userId, 'accepted');
      
      // Filter friends who have recent location data (this would need to be implemented)
      // For the MVP, we'll return all friends
      return friends.map(friendship => ({
        ...friendship.friend,
        distance: null, // Would calculate actual distance here
        last_seen: null // Would get last location update here
      }));
    }, 'get nearby users');
  }

  /**
   * Update user's last seen location (for nearby friends feature)
   * @param {string} userId - User ID
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Object>} Updated user
   */
  async updateLocation(userId, latitude, longitude) {
    return handleAsyncOperation(async () => {
      // This would typically go to a separate locations table
      // For now, we'll update the user record
      return this.updateById(userId, {
        // These fields would need to be added to the users table
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_update: new Date().toISOString()
      });
    }, 'update user location');
  }

  /**
   * Get user's activity summary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User activity summary
   */
  async getActivitySummary(userId) {
    return handleAsyncOperation(async () => {
      const [hangoutsCount, billsCreated, totalPaid] = await Promise.all([
        // Count hangouts participated in
        executeQuery(
          this.supabase
            .from('hangout_participants')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('participation_status', 'active'),
          'count user hangouts'
        ).then(result => result.count || 0),

        // Count bills created
        executeQuery(
          this.supabase
            .from('bills')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', userId),
          'count bills created'
        ).then(result => result.count || 0),

        // Sum of payments made
        executeQuery(
          this.supabase
            .from('payments')
            .select('amount')
            .eq('from_user_id', userId)
            .eq('status', 'completed'),
          'sum payments made'
        ).then(payments => 
          payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
        )
      ]);

      return {
        hangouts_participated: hangoutsCount,
        bills_created: billsCreated,
        total_paid: totalPaid,
        friends_count: (await this.getFriends(userId)).length
      };
    }, 'get user activity summary');
  }
}

export default UserModel;
