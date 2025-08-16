/**
 * BillService Tests
 * Tests all bill-related business logic with real Supabase data
 */

import { BillService } from '../../services/BillService.js';

describe('BillService', () => {
  let billService;
  let supabaseConfig;

  beforeAll(() => {
    supabaseConfig = testUtils.createMockSupabaseConfig();
  });

  beforeEach(() => {
    billService = new BillService(global.MOCK_ACCESS_TOKEN, supabaseConfig);
  });

  describe('Constructor', () => {
    test('should create service with access token', () => {
      expect(billService).toBeInstanceOf(BillService);
      expect(billService.accessToken).toBe(global.MOCK_ACCESS_TOKEN);
    });

    test('should throw error without access token', () => {
      expect(() => {
        new BillService();
      }).toThrow('Access token required for BillService');
    });
  });

  describe('getBillForHangout', () => {
    test('should get bill for Italian restaurant hangout', async () => {
      const hangoutId = global.TEST_HANGOUTS.ITALIAN;
      const userId = global.TEST_USERS.ALICE;

      const bill = await billService.getBillForHangout(hangoutId, userId);

      expect(bill).toHaveProperty('id');
      expect(bill).toHaveProperty('hangout_id', hangoutId);
      expect(bill).toHaveProperty('title', 'Mario\'s Dinner Bill');
      expect(bill).toHaveProperty('total_amount');
      expect(bill).toHaveProperty('status');
      expect(bill).toHaveProperty('created_by');
      expect(bill).toHaveProperty('paid_by');
      expect(bill).toHaveProperty('items');
      expect(bill).toHaveProperty('participant_balances');

      // Validate numeric fields
      expect(typeof bill.total_amount).toBe('string'); // Supabase returns numeric as string
      expect(parseFloat(bill.total_amount)).toBe(116.45);

      // Check items structure
      expect(Array.isArray(bill.items)).toBe(true);
      expect(bill.items.length).toBeGreaterThan(0);

      if (bill.items.length > 0) {
        const item = bill.items[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('item_name');
        expect(item).toHaveProperty('item_price');
        expect(item).toHaveProperty('total_quantity');
        expect(item).toHaveProperty('total_amount');
        expect(item).toHaveProperty('assignments');
        expect(Array.isArray(item.assignments)).toBe(true);
      }
    });

    test('should get bill for coffee shop hangout', async () => {
      const hangoutId = global.TEST_HANGOUTS.COFFEE;
      const userId = global.TEST_USERS.ALICE;

      const bill = await billService.getBillForHangout(hangoutId, userId);

      expect(bill).toHaveProperty('id');
      expect(bill).toHaveProperty('hangout_id', hangoutId);
      expect(bill).toHaveProperty('title', 'Brew & Bite Brunch');
      expect(parseFloat(bill.total_amount)).toBe(62.13);
    });

    test('should verify Italian restaurant bill items', async () => {
      const hangoutId = global.TEST_HANGOUTS.ITALIAN;
      const userId = global.TEST_USERS.ALICE;

      const bill = await billService.getBillForHangout(hangoutId, userId);
      
      // Check for expected Italian food items
      const itemNames = bill.items.map(item => item.item_name);
      expect(itemNames).toContain('Margherita Pizza');
      expect(itemNames).toContain('Spaghetti Carbonara');
      expect(itemNames).toContain('Caesar Salad');
      expect(itemNames).toContain('Tiramisu');

      // Check pizza details
      const pizza = bill.items.find(item => item.item_name === 'Margherita Pizza');
      expect(pizza).toBeDefined();
      expect(parseFloat(pizza.item_price)).toBe(18.99);
      expect(pizza.total_quantity).toBe(2);
      expect(parseFloat(pizza.total_amount)).toBe(37.98);
    });

    test('should verify coffee shop bill items', async () => {
      const hangoutId = global.TEST_HANGOUTS.COFFEE;
      const userId = global.TEST_USERS.ALICE;

      const bill = await billService.getBillForHangout(hangoutId, userId);
      
      // Check for expected coffee shop items
      const itemNames = bill.items.map(item => item.item_name);
      expect(itemNames).toContain('Avocado Toast');
      expect(itemNames).toContain('Specialty Coffee');
      expect(itemNames).toContain('Blueberry Muffin');

      // Check avocado toast details
      const toast = bill.items.find(item => item.item_name === 'Avocado Toast');
      expect(toast).toBeDefined();
      expect(parseFloat(toast.item_price)).toBe(12.99);
      expect(toast.total_quantity).toBe(2);
      expect(parseFloat(toast.total_amount)).toBe(25.98);
    });

    test('should include item assignments', async () => {
      const hangoutId = global.TEST_HANGOUTS.ITALIAN;
      const userId = global.TEST_USERS.ALICE;

      const bill = await billService.getBillForHangout(hangoutId, userId);
      
      // Find pizza item (should have assignments)
      const pizza = bill.items.find(item => item.item_name === 'Margherita Pizza');
      expect(pizza.assignments.length).toBeGreaterThan(0);

      if (pizza.assignments.length > 0) {
        const assignment = pizza.assignments[0];
        expect(assignment).toHaveProperty('id');
        expect(assignment).toHaveProperty('quantity');
        expect(assignment).toHaveProperty('assigned_amount');
        expect(assignment).toHaveProperty('user');
        expect(assignment.user).toHaveProperty('id');
        expect(assignment.user).toHaveProperty('full_name');
      }
    });

    test('should include participant balances', async () => {
      const hangoutId = global.TEST_HANGOUTS.ITALIAN;
      const userId = global.TEST_USERS.ALICE;

      const bill = await billService.getBillForHangout(hangoutId, userId);
      
      expect(Array.isArray(bill.participant_balances)).toBe(true);
      expect(bill.participant_balances.length).toBeGreaterThan(0);

      if (bill.participant_balances.length > 0) {
        const balance = bill.participant_balances[0];
        expect(balance).toHaveProperty('id');
        expect(balance).toHaveProperty('total_owed');
        expect(balance).toHaveProperty('amount_paid');
        expect(balance).toHaveProperty('balance_remaining');
        expect(balance).toHaveProperty('payment_status');
        expect(balance).toHaveProperty('user');
        expect(balance.user).toHaveProperty('full_name');
      }
    });

    test('should deny access to non-participant', async () => {
      const hangoutId = global.TEST_HANGOUTS.ITALIAN;
      const nonParticipantUserId = testUtils.generateUUID();

      await expect(
        billService.getBillForHangout(hangoutId, nonParticipantUserId)
      ).rejects.toThrow('Access denied');
    });

    test('should return null for hangout without bill', async () => {
      // Create a temporary hangout without a bill for testing
      const tempHangoutId = testUtils.generateUUID();
      const creatorId = global.TEST_USERS.ALICE;

      await global.testSupabase
        .from('hangouts')
        .insert({
          id: tempHangoutId,
          created_by: creatorId,
          title: 'Test Hangout No Bill',
          location_name: 'Test Location',
          hangout_date: new Date().toISOString()
        });

      await global.testSupabase
        .from('hangout_participants')
        .insert({
          hangout_id: tempHangoutId,
          user_id: creatorId,
          participation_status: 'active'
        });

      try {
        const bill = await billService.getBillForHangout(tempHangoutId, creatorId);
        expect(bill).toBeNull();
      } finally {
        // Cleanup
        await global.testSupabase
          .from('hangout_participants')
          .delete()
          .eq('hangout_id', tempHangoutId);
        await global.testSupabase
          .from('hangouts')
          .delete()
          .eq('id', tempHangoutId);
      }
    });

    test('should validate hangout ID format', async () => {
      const userId = global.TEST_USERS.ALICE;

      await expect(
        billService.getBillForHangout('invalid-uuid', userId)
      ).rejects.toThrow('Invalid hangout ID format');
    });
  });

  describe('createBill', () => {
    let testHangoutId;

    beforeAll(async () => {
      // Create a test hangout for bill creation tests
      testHangoutId = testUtils.generateUUID();
      const creatorId = global.TEST_USERS.ALICE;

      await global.testSupabase
        .from('hangouts')
        .insert({
          id: testHangoutId,
          created_by: creatorId,
          title: 'Test Hangout for Bill',
          location_name: 'Test Restaurant',
          hangout_date: new Date().toISOString()
        });

      await global.testSupabase
        .from('hangout_participants')
        .insert({
          hangout_id: testHangoutId,
          user_id: creatorId,
          participation_status: 'active'
        });
    });

    afterAll(async () => {
      // Cleanup test hangout and any created bills
      if (testHangoutId) {
        await global.testSupabase
          .from('bills')
          .delete()
          .eq('hangout_id', testHangoutId);
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

    test('should create bill successfully', async () => {
      const billData = testUtils.createTestBillData();
      const userId = global.TEST_USERS.ALICE;

      const result = await billService.createBill(testHangoutId, billData, userId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('hangout_id', testHangoutId);
      expect(result).toHaveProperty('title', billData.title);
      expect(result).toHaveProperty('total_amount', billData.total_amount.toString());
      expect(result).toHaveProperty('created_by');
      expect(result.created_by.id).toBe(userId);
      expect(result).toHaveProperty('items', []);
      expect(result).toHaveProperty('participant_balances', []);
    });

    test('should prevent duplicate bills for same hangout', async () => {
      const billData = testUtils.createTestBillData();
      const userId = global.TEST_USERS.ALICE;

      // Bill should already exist from previous test
      await expect(
        billService.createBill(testHangoutId, billData, userId)
      ).rejects.toThrow('Bill already exists for this hangout');
    });

    test('should validate bill data', async () => {
      const tempHangoutId = testUtils.generateUUID();
      const userId = global.TEST_USERS.ALICE;

      // Create temp hangout
      await global.testSupabase
        .from('hangouts')
        .insert({
          id: tempHangoutId,
          created_by: userId,
          title: 'Temp Hangout',
          location_name: 'Temp Location',
          hangout_date: new Date().toISOString()
        });

      await global.testSupabase
        .from('hangout_participants')
        .insert({
          hangout_id: tempHangoutId,
          user_id: userId,
          participation_status: 'active'
        });

      try {
        const invalidBillData = {
          // Missing required fields
          description: 'Invalid bill'
        };

        await expect(
          billService.createBill(tempHangoutId, invalidBillData, userId)
        ).rejects.toThrow();
      } finally {
        // Cleanup
        await global.testSupabase
          .from('hangout_participants')
          .delete()
          .eq('hangout_id', tempHangoutId);
        await global.testSupabase
          .from('hangouts')
          .delete()
          .eq('id', tempHangoutId);
      }
    });
  });

  describe('addItem', () => {
    test('should add item to Italian restaurant bill', async () => {
      const billId = global.TEST_BILLS.ITALIAN_BILL;
      const userId = global.TEST_USERS.ALICE;

      const itemData = {
        item_name: 'Test Appetizer',
        item_price: 12.50,
        total_quantity: 1
      };

      const result = await billService.addItem(billId, itemData, userId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('bill_id', billId);
      expect(result).toHaveProperty('item_name', 'Test Appetizer');
      expect(result).toHaveProperty('item_price', '12.5'); // Supabase returns as string
      expect(result).toHaveProperty('total_quantity', 1);
      expect(result).toHaveProperty('total_amount', '12.5'); // 12.50 * 1
      expect(result).toHaveProperty('assignments', []);

      // Cleanup - remove the test item
      await global.testSupabase
        .from('bill_items')
        .delete()
        .eq('id', result.id);
    });

    test('should calculate total amount correctly', async () => {
      const billId = global.TEST_BILLS.COFFEE_BILL;
      const userId = global.TEST_USERS.ALICE;

      const itemData = {
        item_name: 'Test Sandwich',
        item_price: 8.75,
        total_quantity: 3
      };

      const result = await billService.addItem(billId, itemData, userId);

      expect(parseFloat(result.total_amount)).toBe(26.25); // 8.75 * 3

      // Cleanup
      await global.testSupabase
        .from('bill_items')
        .delete()
        .eq('id', result.id);
    });

    test('should validate bill ID format', async () => {
      const userId = global.TEST_USERS.ALICE;
      const itemData = {
        item_name: 'Test Item',
        item_price: 10.00,
        total_quantity: 1
      };

      await expect(
        billService.addItem('invalid-uuid', itemData, userId)
      ).rejects.toThrow('Invalid bill ID format');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid UUID formats', async () => {
      const userId = global.TEST_USERS.ALICE;

      await expect(
        billService.getBillForHangout('not-a-uuid', userId)
      ).rejects.toThrow('Invalid hangout ID format');
    });

    test('should handle database connection errors', async () => {
      const invalidService = new BillService(global.MOCK_ACCESS_TOKEN, {
        SUPABASE_URL: 'https://invalid-url.supabase.co',
        SUPABASE_ANON_KEY: 'invalid-key'
      });

      await expect(
        invalidService.getBillForHangout(global.TEST_HANGOUTS.ITALIAN, global.TEST_USERS.ALICE)
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should complete getBillForHangout within reasonable time', async () => {
      const startTime = Date.now();
      
      await billService.getBillForHangout(global.TEST_HANGOUTS.ITALIAN, global.TEST_USERS.ALICE);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent bill requests', async () => {
      const promises = [
        billService.getBillForHangout(global.TEST_HANGOUTS.ITALIAN, global.TEST_USERS.ALICE),
        billService.getBillForHangout(global.TEST_HANGOUTS.COFFEE, global.TEST_USERS.ALICE)
      ];

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(2);
      results.forEach(bill => {
        expect(bill).toHaveProperty('id');
        expect(bill).toHaveProperty('title');
        expect(bill).toHaveProperty('items');
      });
    });
  });
});
