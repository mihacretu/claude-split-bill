/**
 * Full Workflow Integration Tests
 * Tests complete user journeys using real Supabase data
 */

import { UserService } from '../../services/UserService.js';
import { HangoutService } from '../../services/HangoutService.js';
import { BillService } from '../../services/BillService.js';
import { PaymentService } from '../../services/PaymentService.js';

describe('Full Workflow Integration Tests', () => {
  let userService;
  let hangoutService;
  let billService;
  let paymentService;
  let supabaseConfig;

  beforeAll(() => {
    supabaseConfig = testUtils.createMockSupabaseConfig();
    
    userService = new UserService(global.MOCK_ACCESS_TOKEN, supabaseConfig);
    hangoutService = new HangoutService(global.MOCK_ACCESS_TOKEN, supabaseConfig);
    billService = new BillService(global.MOCK_ACCESS_TOKEN, supabaseConfig);
    paymentService = new PaymentService(global.MOCK_ACCESS_TOKEN, supabaseConfig);
  });

  describe('Complete Bill Splitting Journey', () => {
    test('should complete full bill splitting workflow with existing data', async () => {
      const aliceId = global.TEST_USERS.ALICE;
      const bobId = global.TEST_USERS.BOB;
      const italianHangoutId = global.TEST_HANGOUTS.ITALIAN;
      const italianBillId = global.TEST_BILLS.ITALIAN_BILL;

      // 1. Verify Alice can see her hangouts
      const aliceHangouts = await hangoutService.getUserHangouts(aliceId);
      expect(aliceHangouts.data.length).toBeGreaterThan(0);
      
      const italianHangout = aliceHangouts.data.find(h => h.id === italianHangoutId);
      expect(italianHangout).toBeDefined();
      expect(italianHangout.title).toBe('Italian Night at Mario\'s');
      expect(italianHangout.has_bill).toBe(true);

      // 2. Get detailed hangout information
      const hangoutDetails = await hangoutService.getHangoutDetails(italianHangoutId, aliceId);
      expect(hangoutDetails.participants.length).toBeGreaterThan(1);
      
      // Verify Bob is a participant
      const bobParticipant = hangoutDetails.participants.find(p => p.user.id === bobId);
      expect(bobParticipant).toBeDefined();
      expect(bobParticipant.participation_status).toBe('active');

      // 3. Get the bill details
      const bill = await billService.getBillForHangout(italianHangoutId, aliceId);
      expect(bill).toBeDefined();
      expect(bill.title).toBe('Mario\'s Dinner Bill');
      expect(parseFloat(bill.total_amount)).toBe(116.45);

      // 4. Verify bill items are present
      expect(bill.items.length).toBeGreaterThan(0);
      const pizza = bill.items.find(item => item.item_name === 'Margherita Pizza');
      expect(pizza).toBeDefined();
      expect(parseFloat(pizza.total_amount)).toBe(37.98);

      // 5. Verify item assignments exist
      expect(pizza.assignments.length).toBeGreaterThan(0);
      const aliceAssignment = pizza.assignments.find(a => a.user.id === aliceId);
      const bobAssignment = pizza.assignments.find(a => a.user.id === bobId);
      expect(aliceAssignment).toBeDefined();
      expect(bobAssignment).toBeDefined();

      // 6. Verify participant balances
      expect(bill.participant_balances.length).toBeGreaterThan(0);
      const aliceBalance = bill.participant_balances.find(b => b.user.id === aliceId);
      const bobBalance = bill.participant_balances.find(b => b.user.id === bobId);
      
      expect(aliceBalance).toBeDefined();
      expect(bobBalance).toBeDefined();
      expect(parseFloat(aliceBalance.total_owed)).toBeGreaterThan(0);
      expect(parseFloat(bobBalance.total_owed)).toBeGreaterThan(0);

      // 7. Check payment status
      expect(bobBalance.payment_status).toBe('paid'); // Bob paid according to test data
      expect(aliceBalance.payment_status).toBe('pending'); // Alice still owes

      console.log('✅ Full bill splitting workflow verified successfully');
    });

    test('should verify coffee shop hangout workflow', async () => {
      const aliceId = global.TEST_USERS.ALICE;
      const charlieId = global.TEST_USERS.CHARLIE;
      const eveId = global.TEST_USERS.EVE;
      const coffeeHangoutId = global.TEST_HANGOUTS.COFFEE;

      // 1. Get coffee shop hangout
      const aliceHangouts = await hangoutService.getUserHangouts(aliceId);
      const coffeeHangout = aliceHangouts.data.find(h => h.id === coffeeHangoutId);
      
      expect(coffeeHangout).toBeDefined();
      expect(coffeeHangout.title).toBe('Sunday Brunch at Brew & Bite');
      expect(coffeeHangout.location_name).toBe('Brew & Bite Coffee House');

      // 2. Verify participants (should be smaller group)
      const hangoutDetails = await hangoutService.getHangoutDetails(coffeeHangoutId, aliceId);
      expect(hangoutDetails.participants.length).toBe(3); // Alice, Charlie, Eve
      
      const participantIds = hangoutDetails.participants.map(p => p.user.id);
      expect(participantIds).toContain(aliceId);
      expect(participantIds).toContain(charlieId);
      expect(participantIds).toContain(eveId);

      // 3. Get coffee shop bill
      const bill = await billService.getBillForHangout(coffeeHangoutId, aliceId);
      expect(bill).toBeDefined();
      expect(parseFloat(bill.total_amount)).toBe(62.13);

      // 4. Verify coffee shop items
      const itemNames = bill.items.map(item => item.item_name);
      expect(itemNames).toContain('Avocado Toast');
      expect(itemNames).toContain('Specialty Coffee');
      expect(itemNames).toContain('Blueberry Muffin');

      // 5. Verify Charlie paid (according to test data)
      expect(bill.paid_by.id).toBe(charlieId);

      console.log('✅ Coffee shop hangout workflow verified successfully');
    });
  });

  describe('User Social Features', () => {
    test('should verify friendship network', async () => {
      const aliceId = global.TEST_USERS.ALICE;

      // 1. Get Alice's profile
      const aliceProfile = await userService.getProfile(aliceId);
      expect(aliceProfile.full_name).toBe('Alice Smith');
      expect(aliceProfile.email).toBe('alice@example.com');

      // 2. Get Alice's friends
      const friends = await userService.getFriends(aliceId);
      expect(friends.length).toBeGreaterThan(0);

      // 3. Verify specific friendships
      const friendIds = friends.map(f => f.friend.id);
      expect(friendIds).toContain(global.TEST_USERS.BOB);
      expect(friendIds).toContain(global.TEST_USERS.CHARLIE);

      // 4. Verify friend details
      const bobFriend = friends.find(f => f.friend.id === global.TEST_USERS.BOB);
      expect(bobFriend.friend.full_name).toBe('Bob Jones');
      expect(bobFriend.status).toBe('accepted');

      // 5. Search for users
      const searchResults = await userService.searchUsers('Charlie', aliceId);
      const charlieResult = searchResults.find(u => u.id === global.TEST_USERS.CHARLIE);
      expect(charlieResult).toBeDefined();
      expect(charlieResult.full_name).toBe('Charlie Brown');

      console.log('✅ User social features verified successfully');
    });
  });

  describe('Cross-Service Data Consistency', () => {
    test('should maintain data consistency across services', async () => {
      const aliceId = global.TEST_USERS.ALICE;
      const italianHangoutId = global.TEST_HANGOUTS.ITALIAN;

      // 1. Get hangout from HangoutService
      const hangouts = await hangoutService.getUserHangouts(aliceId);
      const hangout = hangouts.data.find(h => h.id === italianHangoutId);

      // 2. Get same hangout's bill from BillService
      const bill = await billService.getBillForHangout(italianHangoutId, aliceId);

      // 3. Verify consistency
      expect(hangout.has_bill).toBe(true);
      expect(hangout.bill_total).toBe(parseFloat(bill.total_amount));
      expect(hangout.bill_status).toBe(bill.status);

      // 4. Verify participant count matches
      const hangoutDetails = await hangoutService.getHangoutDetails(italianHangoutId, aliceId);
      expect(hangout.participants_count).toBe(hangoutDetails.participants.length);

      // 5. Verify bill participants match hangout participants
      const hangoutParticipantIds = hangoutDetails.participants.map(p => p.user.id);
      const billParticipantIds = bill.participant_balances.map(b => b.user.id);
      
      // Every bill participant should be a hangout participant
      billParticipantIds.forEach(billParticipantId => {
        expect(hangoutParticipantIds).toContain(billParticipantId);
      });

      console.log('✅ Cross-service data consistency verified');
    });

    test('should verify item assignments add up to item totals', async () => {
      const aliceId = global.TEST_USERS.ALICE;
      const italianHangoutId = global.TEST_HANGOUTS.ITALIAN;

      const bill = await billService.getBillForHangout(italianHangoutId, aliceId);

      // Check each item's assignments
      bill.items.forEach(item => {
        if (item.assignments.length > 0) {
          const totalAssignedAmount = item.assignments.reduce(
            (sum, assignment) => sum + parseFloat(assignment.assigned_amount), 
            0
          );
          
          const itemTotal = parseFloat(item.total_amount);
          
          // Allow for small floating point differences
          expect(Math.abs(totalAssignedAmount - itemTotal)).toBeLessThan(0.01);
        }
      });

      console.log('✅ Item assignment totals verified');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle cascading access control', async () => {
      const nonParticipantId = testUtils.generateUUID();
      const italianHangoutId = global.TEST_HANGOUTS.ITALIAN;

      // 1. Non-participant should not access hangout details
      await expect(
        hangoutService.getHangoutDetails(italianHangoutId, nonParticipantId)
      ).rejects.toThrow('Access denied');

      // 2. Non-participant should not access bill
      await expect(
        billService.getBillForHangout(italianHangoutId, nonParticipantId)
      ).rejects.toThrow('Access denied');

      console.log('✅ Access control integration verified');
    });

    test('should handle service initialization errors', async () => {
      // Test with invalid configuration
      const invalidConfig = {
        SUPABASE_URL: 'https://invalid.supabase.co',
        SUPABASE_ANON_KEY: 'invalid-key'
      };

      const invalidUserService = new UserService(global.MOCK_ACCESS_TOKEN, invalidConfig);
      
      await expect(
        invalidUserService.getProfile(global.TEST_USERS.ALICE)
      ).rejects.toThrow();

      console.log('✅ Service initialization error handling verified');
    });
  });

  describe('Performance Integration', () => {
    test('should handle multiple concurrent operations', async () => {
      const aliceId = global.TEST_USERS.ALICE;
      const italianHangoutId = global.TEST_HANGOUTS.ITALIAN;
      const coffeeHangoutId = global.TEST_HANGOUTS.COFFEE;

      const startTime = Date.now();

      // Execute multiple operations concurrently
      const operations = await Promise.all([
        userService.getProfile(aliceId),
        userService.getFriends(aliceId),
        hangoutService.getUserHangouts(aliceId),
        hangoutService.getHangoutDetails(italianHangoutId, aliceId),
        billService.getBillForHangout(italianHangoutId, aliceId),
        billService.getBillForHangout(coffeeHangoutId, aliceId)
      ]);

      const duration = Date.now() - startTime;

      // All operations should succeed
      expect(operations.length).toBe(6);
      operations.forEach(result => {
        expect(result).toBeDefined();
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds for all operations

      console.log(`✅ Concurrent operations completed in ${duration}ms`);
    });

    test('should maintain performance with data relationships', async () => {
      const aliceId = global.TEST_USERS.ALICE;
      const startTime = Date.now();

      // Get hangouts with all related data
      const hangouts = await hangoutService.getUserHangouts(aliceId);
      
      // Get detailed info for each hangout
      const detailPromises = hangouts.data.map(hangout => 
        hangoutService.getHangoutDetails(hangout.id, aliceId)
      );
      
      const details = await Promise.all(detailPromises);
      
      // Get bills for hangouts that have them
      const billPromises = hangouts.data
        .filter(h => h.has_bill)
        .map(hangout => billService.getBillForHangout(hangout.id, aliceId));
      
      const bills = await Promise.all(billPromises);

      const duration = Date.now() - startTime;

      expect(details.length).toBe(hangouts.data.length);
      expect(bills.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds

      console.log(`✅ Relationship queries completed in ${duration}ms`);
    });
  });
});
