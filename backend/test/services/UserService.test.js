/**
 * UserService Tests
 * Tests all user-related business logic with real Supabase data
 */

import { UserService } from '../../services/UserService.js';

describe('UserService', () => {
  let userService;
  let supabaseConfig;

  beforeAll(() => {
    supabaseConfig = testUtils.createMockSupabaseConfig();
  });

  beforeEach(() => {
    userService = new UserService(global.MOCK_ACCESS_TOKEN, supabaseConfig);
  });

  describe('Constructor', () => {
    test('should create service with access token', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService.accessToken).toBe(global.MOCK_ACCESS_TOKEN);
    });

    test('should throw error without access token', () => {
      expect(() => {
        new UserService();
      }).toThrow('Access token required for UserService');
    });
  });

  describe('getProfile', () => {
    test('should get profile for Alice', async () => {
      const userId = global.TEST_USERS.ALICE;
      const profile = await userService.getProfile(userId);

      expect(profile).toHaveProperty('id', userId);
      expect(profile).toHaveProperty('email', 'alice@example.com');
      expect(profile).toHaveProperty('full_name', 'Alice Smith');
      expect(profile).toHaveProperty('username', 'alice_smith');
      expect(profile).toHaveProperty('created_at');
      expect(profile).toHaveProperty('updated_at');
    });

    test('should get profile for Bob', async () => {
      const userId = global.TEST_USERS.BOB;
      const profile = await userService.getProfile(userId);

      expect(profile).toHaveProperty('id', userId);
      expect(profile).toHaveProperty('email', 'bob@example.com');
      expect(profile).toHaveProperty('full_name', 'Bob Jones');
      expect(profile).toHaveProperty('username', 'bob_jones');
    });

    test('should get profile for Charlie', async () => {
      const userId = global.TEST_USERS.CHARLIE;
      const profile = await userService.getProfile(userId);

      expect(profile).toHaveProperty('id', userId);
      expect(profile).toHaveProperty('email', 'charlie@example.com');
      expect(profile).toHaveProperty('full_name', 'Charlie Brown');
      expect(profile).toHaveProperty('username', 'charlie_brown');
    });

    test('should throw error for non-existent user', async () => {
      const nonExistentUserId = testUtils.generateUUID();
      
      await expect(
        userService.getProfile(nonExistentUserId)
      ).rejects.toThrow();
    });

    test('should validate user ID format', async () => {
      await expect(
        userService.getProfile('invalid-uuid')
      ).rejects.toThrow('Invalid user ID format');
    });
  });

  describe('searchUsers', () => {
    test('should search users by full name', async () => {
      const currentUserId = global.TEST_USERS.ALICE;
      const results = await userService.searchUsers('Bob', currentUserId);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const bobResult = results.find(user => user.full_name === 'Bob Jones');
      expect(bobResult).toBeDefined();
      expect(bobResult).toHaveProperty('id', global.TEST_USERS.BOB);
      expect(bobResult).toHaveProperty('username', 'bob_jones');
    });

    test('should search users by username', async () => {
      const currentUserId = global.TEST_USERS.ALICE;
      const results = await userService.searchUsers('charlie_brown', currentUserId);

      expect(Array.isArray(results)).toBe(true);
      const charlieResult = results.find(user => user.username === 'charlie_brown');
      expect(charlieResult).toBeDefined();
      expect(charlieResult).toHaveProperty('full_name', 'Charlie Brown');
    });

    test('should exclude current user from search results', async () => {
      const currentUserId = global.TEST_USERS.ALICE;
      const results = await userService.searchUsers('Alice', currentUserId);

      const aliceResult = results.find(user => user.id === currentUserId);
      expect(aliceResult).toBeUndefined();
    });

    test('should return empty array for no matches', async () => {
      const currentUserId = global.TEST_USERS.ALICE;
      const results = await userService.searchUsers('NonExistentUser', currentUserId);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should respect limit parameter', async () => {
      const currentUserId = global.TEST_USERS.ALICE;
      const results = await userService.searchUsers('', currentUserId, 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    test('should return user fields needed for display', async () => {
      const currentUserId = global.TEST_USERS.ALICE;
      const results = await userService.searchUsers('Bob', currentUserId);

      if (results.length > 0) {
        const user = results[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('full_name');
        expect(user).toHaveProperty('avatar_url');
        
        // Should not include sensitive fields like email in search results
        expect(user).not.toHaveProperty('phone');
      }
    });
  });

  describe('getFriends', () => {
    test('should get friends for Alice', async () => {
      const userId = global.TEST_USERS.ALICE;
      const friends = await userService.getFriends(userId);

      expect(Array.isArray(friends)).toBe(true);
      expect(friends.length).toBeGreaterThan(0);

      // Check friend structure
      if (friends.length > 0) {
        const friend = friends[0];
        expect(friend).toHaveProperty('friendship_id');
        expect(friend).toHaveProperty('friend');
        expect(friend).toHaveProperty('status', 'accepted');
        expect(friend).toHaveProperty('created_at');
        expect(friend).toHaveProperty('is_requester');

        // Check friend object structure
        expect(friend.friend).toHaveProperty('id');
        expect(friend.friend).toHaveProperty('full_name');
        expect(friend.friend).toHaveProperty('username');
        expect(friend.friend).toHaveProperty('avatar_url');
      }
    });

    test('should find Bob as Alice\'s friend', async () => {
      const userId = global.TEST_USERS.ALICE;
      const friends = await userService.getFriends(userId);

      const bobFriend = friends.find(f => f.friend.id === global.TEST_USERS.BOB);
      expect(bobFriend).toBeDefined();
      expect(bobFriend.friend.full_name).toBe('Bob Jones');
      expect(bobFriend.status).toBe('accepted');
    });

    test('should find Charlie as Alice\'s friend', async () => {
      const userId = global.TEST_USERS.ALICE;
      const friends = await userService.getFriends(userId);

      const charlieFriend = friends.find(f => f.friend.id === global.TEST_USERS.CHARLIE);
      expect(charlieFriend).toBeDefined();
      expect(charlieFriend.friend.full_name).toBe('Charlie Brown');
      expect(charlieFriend.status).toBe('accepted');
    });

    test('should handle different friendship statuses', async () => {
      const userId = global.TEST_USERS.ALICE;
      
      // Test accepted friends (default)
      const acceptedFriends = await userService.getFriends(userId, 'accepted');
      expect(acceptedFriends.every(f => f.status === 'accepted')).toBe(true);

      // Test pending friends
      const pendingFriends = await userService.getFriends(userId, 'pending');
      expect(Array.isArray(pendingFriends)).toBe(true);
    });

    test('should return empty array for user with no friends', async () => {
      const nonExistentUserId = testUtils.generateUUID();
      const friends = await userService.getFriends(nonExistentUserId);

      expect(Array.isArray(friends)).toBe(true);
      expect(friends.length).toBe(0);
    });
  });

  describe('sendFriendRequest', () => {
    test('should send friend request successfully', async () => {
      // Create a temporary test user for this test
      const tempUserId = testUtils.generateUUID();
      await global.testSupabase
        .from('users')
        .insert({
          id: tempUserId,
          email: 'temp@test.com',
          username: 'temp_user',
          full_name: 'Temp User'
        });

      try {
        const requesterId = global.TEST_USERS.ALICE;
        const result = await userService.sendFriendRequest(requesterId, tempUserId);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('status', 'pending');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('addressee');
        expect(result.addressee.id).toBe(tempUserId);

        // Cleanup
        await global.testSupabase
          .from('friendships')
          .delete()
          .eq('id', result.id);
      } finally {
        // Cleanup temp user
        await global.testSupabase
          .from('users')
          .delete()
          .eq('id', tempUserId);
      }
    });

    test('should prevent duplicate friend requests', async () => {
      // Try to send friend request between existing friends
      const requesterId = global.TEST_USERS.ALICE;
      const addresseeId = global.TEST_USERS.BOB;

      await expect(
        userService.sendFriendRequest(requesterId, addresseeId)
      ).rejects.toThrow('Users are already friends');
    });

    test('should validate user IDs', async () => {
      await expect(
        userService.sendFriendRequest('invalid-uuid', global.TEST_USERS.BOB)
      ).rejects.toThrow();

      await expect(
        userService.sendFriendRequest(global.TEST_USERS.ALICE, 'invalid-uuid')
      ).rejects.toThrow();
    });
  });

  describe('upsertProfile', () => {
    test('should create new user profile', async () => {
      const tempUserId = testUtils.generateUUID();
      const userData = {
        id: tempUserId,
        email: 'newuser@test.com',
        user_metadata: {
          full_name: 'New User',
          avatar_url: 'https://example.com/avatar.jpg'
        }
      };

      try {
        const result = await userService.upsertProfile(userData);

        expect(result).toHaveProperty('id', tempUserId);
        expect(result).toHaveProperty('email', 'newuser@test.com');
        expect(result).toHaveProperty('full_name', 'New User');
        expect(result).toHaveProperty('avatar_url', 'https://example.com/avatar.jpg');
        expect(result).toHaveProperty('last_login');
      } finally {
        // Cleanup
        await global.testSupabase
          .from('users')
          .delete()
          .eq('id', tempUserId);
      }
    });

    test('should update existing user profile', async () => {
      const userId = global.TEST_USERS.ALICE;
      
      // Get current profile
      const currentProfile = await userService.getProfile(userId);
      const originalName = currentProfile.full_name;

      // Update profile
      const userData = {
        id: userId,
        email: 'alice@example.com',
        user_metadata: {
          full_name: 'Alice Updated Smith'
        }
      };

      const result = await userService.upsertProfile(userData);
      expect(result.full_name).toBe('Alice Updated Smith');

      // Restore original name
      const restoreData = {
        id: userId,
        email: 'alice@example.com',
        user_metadata: {
          full_name: originalName
        }
      };
      await userService.upsertProfile(restoreData);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid UUID formats', async () => {
      await expect(
        userService.getProfile('not-a-uuid')
      ).rejects.toThrow('Invalid user ID format');
    });

    test('should handle database connection errors', async () => {
      const invalidService = new UserService(global.MOCK_ACCESS_TOKEN, {
        SUPABASE_URL: 'https://invalid-url.supabase.co',
        SUPABASE_ANON_KEY: 'invalid-key'
      });

      await expect(
        invalidService.getProfile(global.TEST_USERS.ALICE)
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should complete getProfile within reasonable time', async () => {
      const startTime = Date.now();
      
      await userService.getProfile(global.TEST_USERS.ALICE);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle concurrent profile requests', async () => {
      const userIds = Object.values(global.TEST_USERS);
      const promises = userIds.map(id => userService.getProfile(id));

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(userIds.length);
      results.forEach(profile => {
        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('email');
        expect(profile).toHaveProperty('full_name');
      });
    });
  });
});
