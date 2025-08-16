import { BillModel } from '../models/BillModel.js';
import { validate, billSchemas, billItemSchemas, assignmentSchemas } from '../utils/validation.js';
import { AuthenticationError, handleAsyncOperation, validateUUID, BusinessLogicError } from '../utils/errors.js';
import { calculateBillTotals, calculateItemAssignments } from '../utils/helpers.js';

/**
 * Bill service - handles bill-related business logic
 */
export class BillService {
  constructor(accessToken) {
    if (!accessToken) {
      throw new AuthenticationError('Access token required for BillService');
    }
    this.billModel = new BillModel(accessToken);
    this.accessToken = accessToken;
  }

  /**
   * Get bill for a hangout
   * @param {string} hangoutId - Hangout ID
   * @param {string} userId - User ID (for access control)
   * @returns {Promise<Object|null>} Bill with details or null
   */
  async getBillForHangout(hangoutId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      return this.billModel.getBillForHangout(hangoutId, userId);
    }, 'get bill for hangout');
  }

  /**
   * Create bill for hangout
   * @param {string} hangoutId - Hangout ID
   * @param {Object} billData - Bill data
   * @param {string} userId - User creating the bill
   * @returns {Promise<Object>} Created bill
   */
  async createBill(hangoutId, billData, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(hangoutId, 'hangout ID');
      const validatedData = validate(billData, billSchemas.create, 'bill data');
      
      // Validate bill totals
      const totals = calculateBillTotals(validatedData);
      if (!totals.is_valid) {
        throw new BusinessLogicError(
          `Bill total mismatch: calculated ${totals.calculated_total.toFixed(2)}, provided ${totals.provided_total.toFixed(2)}`
        );
      }

      return this.billModel.createBillForHangout(hangoutId, validatedData, userId);
    }, 'create bill');
  }

  /**
   * Update bill details
   * @param {string} billId - Bill ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User updating the bill
   * @returns {Promise<Object>} Updated bill
   */
  async updateBill(billId, updates, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      const validatedUpdates = validate(updates, billSchemas.update, 'bill updates');
      return this.billModel.updateBill(billId, validatedUpdates, userId);
    }, 'update bill');
  }

  /**
   * Add item to bill
   * @param {string} billId - Bill ID
   * @param {Object} itemData - Item data
   * @param {string} userId - User adding the item
   * @returns {Promise<Object>} Created item
   */
  async addItem(billId, itemData, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      const validatedData = validate(itemData, billItemSchemas.create, 'item data');
      return this.billModel.addItem(billId, validatedData, userId);
    }, 'add item to bill');
  }

  /**
   * Update bill item
   * @param {string} itemId - Item ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User updating the item
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(itemId, updates, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(itemId, 'item ID');
      const validatedUpdates = validate(updates, billItemSchemas.update, 'item updates');
      return this.billModel.updateItem(itemId, validatedUpdates, userId);
    }, 'update bill item');
  }

  /**
   * Remove item from bill
   * @param {string} itemId - Item ID
   * @param {string} userId - User removing the item
   * @returns {Promise<void>}
   */
  async removeItem(itemId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(itemId, 'item ID');
      return this.billModel.removeItem(itemId, userId);
    }, 'remove bill item');
  }

  /**
   * Assign item to user
   * @param {string} itemId - Item ID
   * @param {Object} assignmentData - Assignment data
   * @param {string} userId - User making the assignment
   * @returns {Promise<Object>} Created assignment
   */
  async assignItem(itemId, assignmentData, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(itemId, 'item ID');
      const validatedData = validate(assignmentData, assignmentSchemas.create, 'assignment data');
      
      // Validate assignment amount matches quantity and price
      const item = await this.billModel.supabase
        .from('bill_items')
        .select('item_price, total_quantity')
        .eq('id', itemId)
        .single();

      if (item.data) {
        const expectedAmount = item.data.item_price * validatedData.quantity;
        const tolerance = 0.01; // Allow 1 cent difference due to rounding
        
        if (Math.abs(expectedAmount - validatedData.assigned_amount) > tolerance) {
          throw new BusinessLogicError(
            `Assignment amount mismatch: expected ${expectedAmount.toFixed(2)}, provided ${validatedData.assigned_amount.toFixed(2)}`
          );
        }
      }

      return this.billModel.assignItem(itemId, validatedData, userId);
    }, 'assign item to user');
  }

  /**
   * Update item assignment
   * @param {string} assignmentId - Assignment ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User updating the assignment
   * @returns {Promise<Object>} Updated assignment
   */
  async updateAssignment(assignmentId, updates, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(assignmentId, 'assignment ID');
      const validatedUpdates = validate(updates, assignmentSchemas.update, 'assignment updates');
      return this.billModel.updateAssignment(assignmentId, validatedUpdates, userId);
    }, 'update item assignment');
  }

  /**
   * Remove item assignment
   * @param {string} assignmentId - Assignment ID
   * @param {string} userId - User removing the assignment
   * @returns {Promise<void>}
   */
  async removeAssignment(assignmentId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(assignmentId, 'assignment ID');
      return this.billModel.removeAssignment(assignmentId, userId);
    }, 'remove item assignment');
  }

  /**
   * Calculate participant balances for a bill
   * @param {string} billId - Bill ID
   * @param {string} userId - User requesting the calculation
   * @returns {Promise<Array>} Participant balances
   */
  async calculateBalances(billId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      return this.billModel.calculateParticipantBalances(billId, userId);
    }, 'calculate participant balances');
  }

  /**
   * Get bill summary with totals and statistics
   * @param {string} billId - Bill ID
   * @param {string} userId - User requesting the summary
   * @returns {Promise<Object>} Bill summary
   */
  async getBillSummary(billId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      
      // Get full bill details
      const billDetails = await this.billModel.supabase
        .from('bills')
        .select(`
          *,
          items:bill_items(
            *,
            assignments:item_assignments(*)
          ),
          participant_balances(*)
        `)
        .eq('id', billId)
        .single();

      if (billDetails.error) {
        throw new Error(`Failed to get bill details: ${billDetails.error.message}`);
      }

      const bill = billDetails.data;
      
      // Calculate statistics
      const totalItems = bill.items?.length || 0;
      const totalAssignments = bill.items?.reduce(
        (sum, item) => sum + (item.assignments?.length || 0), 0
      ) || 0;
      
      const fullyAssignedItems = bill.items?.filter(item => {
        const totalAssigned = item.assignments?.reduce((sum, a) => sum + a.quantity, 0) || 0;
        return totalAssigned === item.total_quantity;
      }).length || 0;

      const participantsWithBalance = bill.participant_balances?.length || 0;
      const settledParticipants = bill.participant_balances?.filter(
        b => b.payment_status === 'paid'
      ).length || 0;

      const totalOwed = bill.participant_balances?.reduce(
        (sum, b) => sum + parseFloat(b.balance_remaining || 0), 0
      ) || 0;

      return {
        bill_id: billId,
        title: bill.title,
        total_amount: bill.total_amount,
        subtotal: bill.subtotal,
        tax_amount: bill.tax_amount,
        tip_amount: bill.tip_amount,
        status: bill.status,
        statistics: {
          total_items: totalItems,
          total_assignments: totalAssignments,
          fully_assigned_items: fullyAssignedItems,
          assignment_completion: totalItems > 0 ? (fullyAssignedItems / totalItems) * 100 : 0,
          participants_with_balance: participantsWithBalance,
          settled_participants: settledParticipants,
          settlement_completion: participantsWithBalance > 0 ? (settledParticipants / participantsWithBalance) * 100 : 0,
          total_owed: totalOwed,
          is_fully_settled: totalOwed <= 0.01
        },
        created_at: bill.created_at,
        updated_at: bill.updated_at
      };
    }, 'get bill summary');
  }

  /**
   * Split item equally among participants
   * @param {string} itemId - Item ID
   * @param {Array} participantIds - Array of participant IDs
   * @param {string} userId - User performing the split
   * @returns {Promise<Array>} Created assignments
   */
  async splitItemEqually(itemId, participantIds, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(itemId, 'item ID');
      
      if (!Array.isArray(participantIds) || participantIds.length === 0) {
        throw new BusinessLogicError('Must provide at least one participant');
      }

      // Get item details
      const item = await this.billModel.supabase
        .from('bill_items')
        .select('item_price, total_quantity, item_name')
        .eq('id', itemId)
        .single();

      if (item.error) {
        throw new Error(`Failed to get item: ${item.error.message}`);
      }

      const itemData = item.data;
      const participantCount = participantIds.length;
      
      // Calculate equal split
      const quantityPerPerson = Math.floor(itemData.total_quantity / participantCount);
      const remainingQuantity = itemData.total_quantity % participantCount;
      const amountPerUnit = itemData.item_price;

      const assignments = [];
      
      // Create assignments
      for (let i = 0; i < participantIds.length; i++) {
        const participantId = participantIds[i];
        validateUUID(participantId, `participant ID ${i + 1}`);
        
        // First few participants get the remainder quantity
        const quantity = quantityPerPerson + (i < remainingQuantity ? 1 : 0);
        const assignedAmount = quantity * amountPerUnit;

        if (quantity > 0) {
          const assignment = await this.assignItem(itemId, {
            user_id: participantId,
            quantity,
            assigned_amount: assignedAmount
          }, userId);
          
          assignments.push(assignment);
        }
      }

      return assignments;
    }, 'split item equally');
  }

  /**
   * Auto-assign items based on preferences or patterns
   * @param {string} billId - Bill ID
   * @param {string} userId - User performing the auto-assignment
   * @param {Object} options - Auto-assignment options
   * @returns {Promise<Array>} Created assignments
   */
  async autoAssignItems(billId, userId, options = {}) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      
      const { strategy = 'equal', excludeAssigned = true } = options;
      
      // Get bill with participants and items
      const bill = await this.billModel.getBillForHangout(null, userId); // Will need hangoutId
      
      if (!bill) {
        throw new Error('Bill not found');
      }

      const participants = await this.billModel.supabase
        .from('hangout_participants')
        .select('user_id')
        .eq('hangout_id', bill.hangout_id)
        .eq('participation_status', 'active');

      if (participants.error) {
        throw new Error(`Failed to get participants: ${participants.error.message}`);
      }

      const participantIds = participants.data.map(p => p.user_id);
      const assignments = [];

      // Process each item
      for (const item of bill.items || []) {
        if (excludeAssigned && item.assignments && item.assignments.length > 0) {
          continue; // Skip already assigned items
        }

        if (strategy === 'equal') {
          const itemAssignments = await this.splitItemEqually(item.id, participantIds, userId);
          assignments.push(...itemAssignments);
        }
        // Could add more strategies here (by preferences, by past behavior, etc.)
      }

      return assignments;
    }, 'auto-assign items');
  }

  /**
   * Validate bill consistency
   * @param {string} billId - Bill ID
   * @param {string} userId - User performing the validation
   * @returns {Promise<Object>} Validation results
   */
  async validateBillConsistency(billId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      
      // Get full bill details
      const bill = await this.billModel.getBillForHangout(null, userId); // Will need hangoutId
      
      if (!bill) {
        throw new Error('Bill not found');
      }

      const issues = [];
      const warnings = [];

      // Check bill totals
      const totals = calculateBillTotals(bill);
      if (!totals.is_valid) {
        issues.push({
          type: 'total_mismatch',
          message: `Bill total mismatch: calculated ${totals.calculated_total.toFixed(2)}, recorded ${totals.provided_total.toFixed(2)}`,
          severity: 'error'
        });
      }

      // Check item assignments
      for (const item of bill.items || []) {
        const assignments = calculateItemAssignments(item, item.assignments || []);
        
        if (assignments.is_over_assigned) {
          issues.push({
            type: 'over_assigned',
            message: `Item "${item.item_name}" is over-assigned: ${assignments.total_assigned_quantity} of ${assignments.total_quantity}`,
            severity: 'error',
            item_id: item.id
          });
        }
        
        if (!assignments.is_fully_assigned && assignments.total_assigned_quantity > 0) {
          warnings.push({
            type: 'partially_assigned',
            message: `Item "${item.item_name}" is partially assigned: ${assignments.total_assigned_quantity} of ${assignments.total_quantity}`,
            severity: 'warning',
            item_id: item.id
          });
        }

        // Check assignment amounts
        for (const assignment of assignments.assignments) {
          if (!assignment.is_amount_valid) {
            issues.push({
              type: 'amount_mismatch',
              message: `Assignment amount mismatch for "${item.item_name}": calculated ${assignment.calculated_amount.toFixed(2)}, recorded ${assignment.provided_amount.toFixed(2)}`,
              severity: 'error',
              item_id: item.id,
              assignment_id: assignment.id
            });
          }
        }
      }

      return {
        is_valid: issues.length === 0,
        issues,
        warnings,
        summary: {
          total_issues: issues.length,
          total_warnings: warnings.length,
          error_count: issues.filter(i => i.severity === 'error').length,
          warning_count: warnings.length
        }
      };
    }, 'validate bill consistency');
  }
}

export default BillService;
