/**
 * HangoutService Tests
 * Tests all hangout-related business logic with real Supabase data
 */

import { HangoutService } from '../../services/HangoutService.js';

describe('HangoutService', () => {
  let hangoutService;
  let supabaseConfig;

  beforeAll(() => {
    supabaseConfig = testUtils.createMockSupabaseConfig();
  });

  beforeEach(() => {
    hangoutService = new HangoutService(global.MOCK_ACCESS_TOKEN, supabaseConfig);
  });

  describe('Constructor', () => {
    test('should create service with access token', () => {
      expect(hangoutService).toBeInstanceOf(HangoutService);
      expect(hangoutService.accessToken).toBe(global.MOCK_ACCESS_TOKEN);
    });

    test('should throw error without access token', () => {
      expect(() => {
        new HangoutService();
      }).toThrow('Access token required for HangoutService');
    });

    test('should accept supabase config parameter', () => {
      const service = new HangoutService(global.MOCK_ACCESS_TOKEN, supabaseConfig);
      expect(service).toBeInstanceOf(HangoutService);
    });
  });

  describe('getUserHangouts', () => {
    test('should get hangouts for existing user', async () => {
      const userId = global.TEST_USERS.ALICE;
      const result = await hangoutService.getUserHangouts(userId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination).toHaveProperty('offset');
      expect(result.pagination).toHaveProperty('has_more');
    });

    test('should return expected hangout structure', async () => {
      const userId = global.TEST_USERS.ALICE;
      const result = await hangoutService.getUserHangouts(userId);

      if (result.data.length > 0) {
        const hangout = result.data[0];
        
        // Check required fields
        expect(hangout).toHaveProperty('id');
        expect(hangout).toHaveProperty('title');
        expect(hangout).toHaveProperty('location_name');
        expect(hangout).toHaveProperty('status');
        expect(hangout).toHaveProperty('created_by');
        expect(hangout).toHaveProperty('participants_count');
        expect(hangout).toHaveProperty('has_bill');
        expect(hangout).toHaveProperty('created_at');

        // Check data types
        expect(typeof hangout.id).toBe('string');
        expect(typeof hangout.title).toBe('string');
        expect(typeof hangout.participants_count).toBe('number');
        expect(typeof hangout.has_bill).toBe('boolean');
        
        // Check created_by structure
        expect(hangout.created_by).toHaveProperty('id');
        expect(hangout.created_by).toHaveProperty('full_name');
      }
    });

    test('should return Italian restaurant hangout', async () => {
      const userId = global.TEST_USERS.ALICE;
      const result = await hangoutService.getUserHangouts(userId);

      const italianHangout = result.data.find(h => h.location_name === 'Mario\'s Authentic Italian');
      expect(italianHangout).toBeDefined();
      expect(italianHangout.title).toBe('Italian Night at Mario\'s');
      expect(italianHangout.participants_count).toBeGreaterThan(0);
    });

    test('should return coffee shop hangout', async () => {
      const userId = global.TEST_USERS.ALICE;
      const result = await hangoutService.getUserHangouts(userId);

      const coffeeHangout = result.data.find(h => h.location_name === 'Brew & Bite Coffee House');
      expect(coffeeHangout).toBeDefined();
      expect(coffeeHangout.title).toBe('Sunday Brunch at Brew & Bite');
      expect(coffeeHangout.participants_count).toBeGreaterThan(0);
    });

    test('should handle filters correctly', async () => {
      const userId = global.TEST_USERS.ALICE;
      
      // Test with status filter
      const activeResult = await hangoutService.getUserHangouts(userId, { status: 'active' });
      expect(activeResult.data.every(h => h.status === 'active')).toBe(true);

      // Test with limit
      const limitedResult = await hangoutService.getUserHangouts(userId, { limit: 1 });
      expect(limitedResult.data.length).toBeLessThanOrEqual(1);
    });

    test('should return empty result for user with no hangouts', async () => {
      // Use a random UUID that doesn't exist
      const nonExistentUserId = testUtils.generateUUID();
      const result = await hangoutService.getUserHangouts(nonExistentUserId);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    test('should validate user ID format', async () => {
      await expect(
        hangoutService.getUserHangouts('invalid-uuid')
      ).rejects.toThrow();
    });
  });

  describe('getHangoutDetails', () => {
    test('should get details for Italian restaurant hangout', async () => {
      const hangoutId = global.TEST_HANGOUTS.ITALIAN;
      const userId = global.TEST_USERS.ALICE;

      const result = await hangoutService.getHangoutDetails(hangoutId, userId);

      expect(result).toHaveProperty('id', hangoutId);
      expect(result).toHaveProperty('title', 'Italian Night at Mario\'s');
      expect(result).toHaveProperty('location_name', 'Mario\'s Authentic Italian');
      expect(result).toHaveProperty('participants');
      expect(Array.isArray(result.participants)).toBe(true);
    });

    test('should get details for coffee shop hangout', async () => {
      const hangoutId = global.TEST_HANGOUTS.COFFEE;
      const userId = global.TEST_USERS.ALICE;

      const result = await hangoutService.getHangoutDetails(hangoutId, userId);

      expect(result).toHaveProperty('id', hangoutId);
      expect(result).toHaveProperty('title', 'Sunday Brunch at Brew & Bite');
      expect(result).toHaveProperty('location_name', 'Brew & Bite Coffee House');
    });

    test('should deny access to non-participant', async () => {
      const hangoutId = global.TEST_HANGOUTS.ITALIAN;
      const nonParticipantUserId = testUtils.generateUUID();

      await expect(
        hangoutService.getHangoutDetails(hangoutId, nonParticipantUserId)
      ).rejects.toThrow('Access denied');
    });

    test('should validate hangout ID format', async () => {
      const userId = global.TEST_USERS.ALICE;

      await expect(
        hangoutService.getHangoutDetails('invalid-uuid', userId)
      ).rejects.toThrow('Invalid hangout ID format');
    });
  });

  describe('createHangout', () => {
    test('should create new hangout successfully', async () => {
      const creatorId = global.TEST_USERS.ALICE;
      const hangoutData = testUtils.createTestHangoutData();

      const result = await hangoutService.createHangout(hangoutData, creatorId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title', hangoutData.title);
      expect(result).toHaveProperty('location_name', hangoutData.location_name);
      expect(result).toHaveProperty('created_by');
      expect(result.created_by.id).toBe(creatorId);
      expect(result).toHaveProperty('participants_count', 1);
      expect(result).toHaveProperty('has_bill', false);

      // Cleanup: delete the created hangout
      await global.testSupabase
        .from('hangout_participants')
        .delete()
        .eq('hangout_id', result.id);
      await global.testSupabase
        .from('hangouts')
        .delete()
        .eq('id', result.id);
    });

    test('should validate hangout data', async () => {
      const creatorId = global.TEST_USERS.ALICE;
      const invalidData = {
        // Missing required fields
        location_name: 'Test Location'
      };

      await expect(
        hangoutService.createHangout(invalidData, creatorId)
      ).rejects.toThrow();
    });
  });

  describe('addParticipant', () => {
    let testHangoutId;

    beforeAll(async () => {
      // Create a test hangout for participant tests
      const creatorId = global.TEST_USERS.ALICE;
      const hangoutData = testUtils.createTestHangoutData();
      const result = await hangoutService.createHangout(hangoutData, creatorId);
      testHangoutId = result.id;
    });

    afterAll(async () => {
      // Cleanup test hangout
      if (testHangoutId) {
        await global.testSupabase
          .from('hangout_participants')
          .delete()
          .eq('hangout_id', testHangoutId);
        await global.testSupabase
          .from('hangouts')
          .delete()
          .eq('id', testHangoutId);
      }
    });

    test('should add participant to hangout', async () => {
      const newParticipantId = global.TEST_USERS.BOB;
      const addedById = global.TEST_USERS.ALICE;

      const result = await hangoutService.addParticipant(
        testHangoutId,
        newParticipantId,
        addedById
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('user_id', newParticipantId);
      expect(result).toHaveProperty('participation_status', 'active');
    });

    test('should not add duplicate participant', async () => {
      const participantId = global.TEST_USERS.ALICE; // Already a participant
      const addedById = global.TEST_USERS.ALICE;

      await expect(
        hangoutService.addParticipant(testHangoutId, participantId, addedById)
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Create service with invalid config
      const invalidService = new HangoutService(global.MOCK_ACCESS_TOKEN, {
        SUPABASE_URL: 'https://invalid-url.supabase.co',
        SUPABASE_ANON_KEY: 'invalid-key'
      });

      await expect(
        invalidService.getUserHangouts(global.TEST_USERS.ALICE)
      ).rejects.toThrow();
    });

    test('should validate UUID parameters', async () => {
      await expect(
        hangoutService.getUserHangouts('not-a-uuid')
      ).rejects.toThrow();

      await expect(
        hangoutService.getHangoutDetails('not-a-uuid', global.TEST_USERS.ALICE)
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should complete getUserHangouts within reasonable time', async () => {
      const startTime = Date.now();
      
      await hangoutService.getUserHangouts(global.TEST_USERS.ALICE);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = Array(5).fill().map(() => 
        hangoutService.getUserHangouts(global.TEST_USERS.ALICE)
      );

      const results = await Promise.all(promises);
      
      // All requests should succeed
      results.forEach(result => {
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('pagination');
      });
    });
  });
});
