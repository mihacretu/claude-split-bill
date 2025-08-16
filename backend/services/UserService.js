import { UserModel } from '../models/UserModel.js';
import { validate, userSchemas } from '../utils/validation.js';
import { AuthenticationError, handleAsyncOperation } from '../utils/errors.js';

/**
 * User service - handles user-related business logic
 */
export class UserService {
  constructor(accessToken, supabaseConfig = null) {
    if (!accessToken) {
      throw new AuthenticationError('Access token required for UserService');
    }
    this.userModel = new UserModel(accessToken, supabaseConfig);
    this.accessToken = accessToken;
  }

  /**
   * Create or update user profile (typically called after Supabase Auth)
   * @param {Object} userData - User data from authentication
   * @returns {Promise<Object>} User profile
   */
  async upsertProfile(userData) {
    return handleAsyncOperation(async () => {
      const validatedData = validate(userData, userSchemas.create, 'user profile data');
      return this.userModel.upsertProfile(validatedData);
    }, 'upsert user profile');
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    return handleAsyncOperation(async () => {
      return this.userModel.findById(userId);
    }, 'get user profile');
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(userId, updates) {
    return handleAsyncOperation(async () => {
      const validatedUpdates = validate(updates, userSchemas.update, 'profile updates');
      return this.userModel.updateById(userId, validatedUpdates);
    }, 'update user profile');
  }

  /**
   * Search for users
   * @param {string} query - Search query
   * @param {string} currentUserId - Current user ID (to exclude from results)
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Matching users
   */
  async searchUsers(query, currentUserId, limit = 10) {
    return handleAsyncOperation(async () => {
      const validatedParams = validate({ query, limit }, userSchemas.search, 'search parameters');
      return this.userModel.searchUsers(validatedParams.query, currentUserId, validatedParams.limit);
    }, 'search users');
  }

  /**
   * Get user's friends
   * @param {string} userId - User ID
   * @param {string} status - Friendship status filter
   * @returns {Promise<Array>} User's friends
   */
  async getFriends(userId, status = 'accepted') {
    return handleAsyncOperation(async () => {
      return this.userModel.getFriends(userId, status);
    }, 'get user friends');
  }

  /**
   * Get friend requests
   * @param {string} userId - User ID
   * @param {string} type - 'sent' or 'received'
   * @returns {Promise<Array>} Friend requests
   */
  async getFriendRequests(userId, type = 'received') {
    return handleAsyncOperation(async () => {
      if (!['sent', 'received'].includes(type)) {
        throw new Error('Type must be "sent" or "received"');
      }
      return this.userModel.getFriendRequests(userId, type);
    }, 'get friend requests');
  }

  /**
   * Send friend request
   * @param {string} requesterId - User sending the request
   * @param {string} addresseeId - User receiving the request
   * @returns {Promise<Object>} Created friend request
   */
  async sendFriendRequest(requesterId, addresseeId) {
    return handleAsyncOperation(async () => {
      const validatedData = validate(
        { addressee_id: addresseeId }, 
        userSchemas.friendshipSchemas?.create || { addressee_id: 'uuid' }, 
        'friend request data'
      );
      return this.userModel.sendFriendRequest(requesterId, validatedData.addressee_id);
    }, 'send friend request');
  }

  /**
   * Respond to friend request
   * @param {string} friendshipId - Friendship ID
   * @param {string} userId - User responding
   * @param {string} response - 'accepted', 'declined', or 'blocked'
   * @returns {Promise<Object>} Updated friendship
   */
  async respondToFriendRequest(friendshipId, userId, response) {
    return handleAsyncOperation(async () => {
      if (!['accepted', 'declined', 'blocked'].includes(response)) {
        throw new Error('Response must be "accepted", "declined", or "blocked"');
      }
      return this.userModel.respondToFriendRequest(friendshipId, userId, response);
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
      return this.userModel.removeFriend(friendshipId, userId);
    }, 'remove friend');
  }

  /**
   * Get nearby users (friends with location data)
   * @param {number} latitude - Current latitude
   * @param {number} longitude - Current longitude
   * @param {string} userId - Current user ID
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Promise<Array>} Nearby users
   */
  async getNearbyUsers(latitude, longitude, userId, radiusKm = 10) {
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
      if (radiusKm <= 0) {
        throw new Error('Radius must be positive');
      }

      return this.userModel.getNearbyUsers(latitude, longitude, userId, radiusKm);
    }, 'get nearby users');
  }

  /**
   * Update user's location
   * @param {string} userId - User ID
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Object>} Updated user
   */
  async updateLocation(userId, latitude, longitude) {
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

      return this.userModel.updateLocation(userId, latitude, longitude);
    }, 'update user location');
  }

  /**
   * Get user activity summary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Activity summary
   */
  async getActivitySummary(userId) {
    return handleAsyncOperation(async () => {
      return this.userModel.getActivitySummary(userId);
    }, 'get user activity summary');
  }

  /**
   * Get user's social stats
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Social statistics
   */
  async getSocialStats(userId) {
    return handleAsyncOperation(async () => {
      const [friends, sentRequests, receivedRequests, activitySummary] = await Promise.all([
        this.getFriends(userId, 'accepted'),
        this.getFriendRequests(userId, 'sent'),
        this.getFriendRequests(userId, 'received'),
        this.getActivitySummary(userId)
      ]);

      return {
        friends_count: friends.length,
        pending_sent_requests: sentRequests.filter(r => r.status === 'pending').length,
        pending_received_requests: receivedRequests.filter(r => r.status === 'pending').length,
        ...activitySummary
      };
    }, 'get user social stats');
  }

  /**
   * Block user
   * @param {string} userId - User doing the blocking
   * @param {string} targetUserId - User to block
   * @returns {Promise<Object>} Blocked relationship
   */
  async blockUser(userId, targetUserId) {
    return handleAsyncOperation(async () => {
      if (userId === targetUserId) {
        throw new Error('Cannot block yourself');
      }

      // Check if there's an existing friendship
      const existingFriendship = await this.userModel.supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`)
        .single();

      if (existingFriendship.data) {
        // Update existing friendship to blocked
        return this.userModel.supabase
          .from('friendships')
          .update({ 
            status: 'blocked',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFriendship.data.id)
          .select()
          .single();
      } else {
        // Create new blocked relationship
        return this.userModel.supabase
          .from('friendships')
          .insert({
            requester_id: userId,
            addressee_id: targetUserId,
            status: 'blocked'
          })
          .select()
          .single();
      }
    }, 'block user');
  }

  /**
   * Unblock user
   * @param {string} userId - User doing the unblocking
   * @param {string} targetUserId - User to unblock
   * @returns {Promise<void>}
   */
  async unblockUser(userId, targetUserId) {
    return handleAsyncOperation(async () => {
      // Find blocked relationship
      const blockedRelationship = await this.userModel.supabase
        .from('friendships')
        .select('id')
        .eq('status', 'blocked')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`)
        .single();

      if (blockedRelationship.data) {
        // Remove the blocked relationship
        await this.userModel.supabase
          .from('friendships')
          .delete()
          .eq('id', blockedRelationship.data.id);
      }
    }, 'unblock user');
  }

  /**
   * Get blocked users
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Blocked users
   */
  async getBlockedUsers(userId) {
    return handleAsyncOperation(async () => {
      const blockedRelationships = await this.userModel.supabase
        .from('friendships')
        .select(`
          id,
          requester:users!friendships_requester_id_fkey(id, username, full_name, avatar_url),
          addressee:users!friendships_addressee_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('status', 'blocked')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (blockedRelationships.error) {
        throw new Error(`Failed to get blocked users: ${blockedRelationships.error.message}`);
      }

      // Return the other person in each blocked relationship
      return blockedRelationships.data.map(relationship => {
        const isRequester = relationship.requester.id === userId;
        return isRequester ? relationship.addressee : relationship.requester;
      });
    }, 'get blocked users');
  }
}

export default UserService;
