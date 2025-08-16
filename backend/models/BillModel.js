import { BaseModel } from './BaseModel.js';
import { handleAsyncOperation, NotFoundError, AuthorizationError, ConflictError, BusinessLogicError } from '../utils/errors.js';
import { executeQuery, isHangoutParticipant, logHangoutActivity } from '../utils/supabase.js';
import { calculateBillTotals, calculateItemAssignments, calculateParticipantBalances } from '../utils/helpers.js';

/**
 * Bill model for managing bills, items, and assignments
 */
export class BillModel extends BaseModel {
  constructor(accessToken) {
    super('bills', accessToken);
  }

  /**
   * Get bill for a hangout
   * @param {string} hangoutId - Hangout ID
   * @param {string} userId - User ID (for access control)
   * @returns {Promise<Object|null>} Bill with full details or null if no bill exists
   */
  async getBillForHangout(hangoutId, userId) {
    return handleAsyncOperation(async () => {
      // Verify user is a participant
      const isParticipant = await isHangoutParticipant(this.supabase, hangoutId, userId);
      if (!isParticipant) {
        throw new AuthorizationError('Access denied: not a participant in this hangout');
      }

      const bill = await this.supabase
        .from('bills')
        .select(`
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
        `)
        .eq('hangout_id', hangoutId)
        .single();

      if (bill.error && bill.error.code === 'PGRST116') {
        return null; // No bill found
      }

      if (bill.error) {
        throw new Error(`Failed to fetch bill: ${bill.error.message}`);
      }

      return bill.data;
    }, 'get bill for hangout');
  }

  /**
   * Create bill for hangout
   * @param {string} hangoutId - Hangout ID
   * @param {Object} billData - Bill data
   * @param {string} userId - User creating the bill
   * @returns {Promise<Object>} Created bill
   */
  async createBillForHangout(hangoutId, billData, userId) {
    return handleAsyncOperation(async () => {
      // Verify user is a participant
      const isParticipant = await isHangoutParticipant(this.supabase, hangoutId, userId);
      if (!isParticipant) {
        throw new AuthorizationError('Access denied: not a participant in this hangout');
      }

      // Check if bill already exists for this hangout
      const existingBill = await this.supabase
        .from('bills')
        .select('id')
        .eq('hangout_id', hangoutId)
        .single();

      if (existingBill.data) {
        throw new ConflictError('Bill already exists for this hangout');
      }

      // Verify that paid_by user is a participant
      const paidByParticipant = await this.supabase
        .from('hangout_participants')
        .select('id')
        .eq('hangout_id', hangoutId)
        .eq('user_id', billData.paid_by)
        .eq('participation_status', 'active')
        .single();

      if (!paidByParticipant.data) {
        throw new BusinessLogicError('Bill payer must be an active participant in the hangout');
      }

      // Validate bill totals
      const totals = calculateBillTotals(billData);
      if (!totals.is_valid) {
        throw new BusinessLogicError(
          `Bill total mismatch: calculated ${totals.calculated_total}, provided ${totals.provided_total}`
        );
      }

      // Create bill
      const newBill = await this.create({
        ...billData,
        hangout_id: hangoutId,
        created_by: userId
      }, `
        *,
        created_by:users!bills_created_by_fkey(id, full_name, avatar_url),
        paid_by:users!bills_paid_by_fkey(id, full_name, avatar_url)
      `);

      // Log activity
      await logHangoutActivity(
        this.supabase,
        hangoutId,
        userId,
        'bill_scanned',
        {
          bill_title: newBill.title,
          total_amount: newBill.total_amount,
          paid_by: newBill.paid_by.full_name
        }
      );

      return {
        ...newBill,
        items: [],
        participant_balances: []
      };
    }, 'create bill for hangout');
  }

  /**
   * Update bill details
   * @param {string} billId - Bill ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User updating the bill (must be participant)
   * @returns {Promise<Object>} Updated bill
   */
  async updateBill(billId, updates, userId) {
    return handleAsyncOperation(async () => {
      // Get bill and verify user is participant in the hangout
      const bill = await executeQuery(
        this.supabase
          .from('bills')
          .select(`
            id,
            hangout_id,
            created_by,
            hangout:hangouts!bills_hangout_id_fkey(
              id,
              participants:hangout_participants!inner(user_id)
            )
          `)
          .eq('id', billId)
          .eq('hangout.participants.user_id', userId)
          .single(),
        'get bill for update'
      );

      if (!bill) {
        throw new NotFoundError('Bill');
      }

      // Validate bill totals if amounts are being updated
      if (updates.subtotal || updates.tax_amount || updates.tip_amount || updates.total_amount) {
        const currentBill = await this.findById(billId, 'subtotal, tax_amount, tip_amount, total_amount');
        const billData = { ...currentBill, ...updates };
        const totals = calculateBillTotals(billData);
        
        if (!totals.is_valid) {
          throw new BusinessLogicError(
            `Bill total mismatch: calculated ${totals.calculated_total}, provided ${totals.provided_total}`
          );
        }
      }

      return this.updateById(billId, updates, `
        *,
        created_by:users!bills_created_by_fkey(id, full_name, avatar_url),
        paid_by:users!bills_paid_by_fkey(id, full_name, avatar_url)
      `);
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
      // Verify user has access to this bill
      const bill = await executeQuery(
        this.supabase
          .from('bills')
          .select(`
            id,
            hangout_id,
            hangout:hangouts!bills_hangout_id_fkey(
              id,
              participants:hangout_participants!inner(user_id)
            )
          `)
          .eq('id', billId)
          .eq('hangout.participants.user_id', userId)
          .single(),
        'get bill for item addition'
      );

      if (!bill) {
        throw new NotFoundError('Bill');
      }

      // Calculate total amount
      const totalAmount = itemData.item_price * itemData.total_quantity;

      // Create bill item
      const newItem = await executeQuery(
        this.supabase
          .from('bill_items')
          .insert({
            ...itemData,
            bill_id: billId,
            total_amount: totalAmount
          })
          .select()
          .single(),
        'add item to bill'
      );

      // Log activity
      await logHangoutActivity(
        this.supabase,
        bill.hangout_id,
        userId,
        'item_added',
        {
          item_name: newItem.item_name,
          item_price: newItem.item_price,
          quantity: newItem.total_quantity
        }
      );

      return {
        ...newItem,
        assignments: []
      };
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
      // Verify user has access to this item
      const item = await executeQuery(
        this.supabase
          .from('bill_items')
          .select(`
            id,
            bill:bills!bill_items_bill_id_fkey(
              id,
              hangout_id,
              hangout:hangouts!bills_hangout_id_fkey(
                id,
                participants:hangout_participants!inner(user_id)
              )
            )
          `)
          .eq('id', itemId)
          .eq('bill.hangout.participants.user_id', userId)
          .single(),
        'get item for update'
      );

      if (!item) {
        throw new NotFoundError('Bill item');
      }

      // Recalculate total amount if price or quantity changed
      if (updates.item_price || updates.total_quantity) {
        const currentItem = await executeQuery(
          this.supabase
            .from('bill_items')
            .select('item_price, total_quantity')
            .eq('id', itemId)
            .single(),
          'get current item data'
        );

        const newPrice = updates.item_price || currentItem.item_price;
        const newQuantity = updates.total_quantity || currentItem.total_quantity;
        updates.total_amount = newPrice * newQuantity;
      }

      return executeQuery(
        this.supabase
          .from('bill_items')
          .update(updates)
          .eq('id', itemId)
          .select()
          .single(),
        'update bill item'
      );
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
      // Get item info and verify access
      const item = await executeQuery(
        this.supabase
          .from('bill_items')
          .select(`
            id,
            item_name,
            bill:bills!bill_items_bill_id_fkey(
              id,
              hangout_id,
              hangout:hangouts!bills_hangout_id_fkey(
                id,
                participants:hangout_participants!inner(user_id)
              )
            )
          `)
          .eq('id', itemId)
          .eq('bill.hangout.participants.user_id', userId)
          .single(),
        'get item for removal'
      );

      if (!item) {
        throw new NotFoundError('Bill item');
      }

      // Delete item (cascades to assignments)
      await executeQuery(
        this.supabase
          .from('bill_items')
          .delete()
          .eq('id', itemId),
        'remove bill item'
      );

      // Log activity
      await logHangoutActivity(
        this.supabase,
        item.bill.hangout_id,
        userId,
        'item_removed',
        {
          item_name: item.item_name
        }
      );
    }, 'remove bill item');
  }

  /**
   * Assign item to user
   * @param {string} itemId - Item ID
   * @param {Object} assignmentData - Assignment data (user_id, quantity, assigned_amount)
   * @param {string} userId - User making the assignment
   * @returns {Promise<Object>} Created assignment
   */
  async assignItem(itemId, assignmentData, userId) {
    return handleAsyncOperation(async () => {
      // Verify user has access to this item and get item details
      const item = await executeQuery(
        this.supabase
          .from('bill_items')
          .select(`
            id,
            item_name,
            total_quantity,
            bill:bills!bill_items_bill_id_fkey(
              id,
              hangout_id,
              hangout:hangouts!bills_hangout_id_fkey(
                id,
                participants:hangout_participants!inner(user_id)
              )
            )
          `)
          .eq('id', itemId)
          .eq('bill.hangout.participants.user_id', userId)
          .single(),
        'get item for assignment'
      );

      if (!item) {
        throw new NotFoundError('Bill item');
      }

      // Verify assigned user is a participant
      const assignedParticipant = await executeQuery(
        this.supabase
          .from('hangout_participants')
          .select('id, user:users!hangout_participants_user_id_fkey(full_name)')
          .eq('hangout_id', item.bill.hangout_id)
          .eq('user_id', assignmentData.user_id)
          .eq('participation_status', 'active')
          .single(),
        'get assigned participant'
      );

      if (!assignedParticipant) {
        throw new BusinessLogicError('Assigned user must be an active participant in the hangout');
      }

      // Check if assignment already exists
      const existingAssignment = await this.supabase
        .from('item_assignments')
        .select('id')
        .eq('bill_item_id', itemId)
        .eq('user_id', assignmentData.user_id)
        .single();

      if (existingAssignment.data) {
        throw new ConflictError('Item is already assigned to this user');
      }

      // Verify quantity doesn't exceed available
      const currentAssignments = await executeQuery(
        this.supabase
          .from('item_assignments')
          .select('quantity')
          .eq('bill_item_id', itemId),
        'get current assignments'
      );

      const totalAssigned = currentAssignments.reduce((sum, a) => sum + a.quantity, 0);
      
      if (totalAssigned + assignmentData.quantity > item.total_quantity) {
        throw new BusinessLogicError('Assignment quantity exceeds available quantity');
      }

      // Create assignment
      const newAssignment = await executeQuery(
        this.supabase
          .from('item_assignments')
          .insert({
            bill_item_id: itemId,
            user_id: assignmentData.user_id,
            quantity: assignmentData.quantity,
            assigned_amount: assignmentData.assigned_amount
          })
          .select(`
            *,
            user:users!item_assignments_user_id_fkey(id, full_name, avatar_url)
          `)
          .single(),
        'create item assignment'
      );

      // Log activity
      await logHangoutActivity(
        this.supabase,
        item.bill.hangout_id,
        userId,
        'item_assigned',
        {
          item_name: item.item_name,
          assigned_to: assignedParticipant.user.full_name,
          quantity: assignmentData.quantity,
          amount: assignmentData.assigned_amount
        }
      );

      return newAssignment;
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
      // Verify user has access to this assignment
      const assignment = await executeQuery(
        this.supabase
          .from('item_assignments')
          .select(`
            id,
            bill_item:bill_items!item_assignments_bill_item_id_fkey(
              id,
              total_quantity,
              bill:bills!bill_items_bill_id_fkey(
                id,
                hangout_id,
                hangout:hangouts!bills_hangout_id_fkey(
                  id,
                  participants:hangout_participants!inner(user_id)
                )
              )
            )
          `)
          .eq('id', assignmentId)
          .eq('bill_item.bill.hangout.participants.user_id', userId)
          .single(),
        'get assignment for update'
      );

      if (!assignment) {
        throw new NotFoundError('Item assignment');
      }

      // If updating quantity, verify it doesn't exceed available
      if (updates.quantity) {
        const otherAssignments = await executeQuery(
          this.supabase
            .from('item_assignments')
            .select('quantity')
            .eq('bill_item_id', assignment.bill_item.id)
            .neq('id', assignmentId),
          'get other assignments'
        );

        const otherAssignedQuantity = otherAssignments.reduce((sum, a) => sum + a.quantity, 0);
        
        if (otherAssignedQuantity + updates.quantity > assignment.bill_item.total_quantity) {
          throw new BusinessLogicError('Updated quantity exceeds available quantity');
        }
      }

      return executeQuery(
        this.supabase
          .from('item_assignments')
          .update(updates)
          .eq('id', assignmentId)
          .select(`
            *,
            user:users!item_assignments_user_id_fkey(id, full_name, avatar_url)
          `)
          .single(),
        'update item assignment'
      );
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
      // Get assignment info and verify access
      const assignment = await executeQuery(
        this.supabase
          .from('item_assignments')
          .select(`
            id,
            user:users!item_assignments_user_id_fkey(full_name),
            bill_item:bill_items!item_assignments_bill_item_id_fkey(
              item_name,
              bill:bills!bill_items_bill_id_fkey(
                hangout_id,
                hangout:hangouts!bills_hangout_id_fkey(
                  participants:hangout_participants!inner(user_id)
                )
              )
            )
          `)
          .eq('id', assignmentId)
          .eq('bill_item.bill.hangout.participants.user_id', userId)
          .single(),
        'get assignment for removal'
      );

      if (!assignment) {
        throw new NotFoundError('Item assignment');
      }

      // Delete assignment
      await executeQuery(
        this.supabase
          .from('item_assignments')
          .delete()
          .eq('id', assignmentId),
        'remove item assignment'
      );

      // Log activity
      await logHangoutActivity(
        this.supabase,
        assignment.bill_item.bill.hangout_id,
        userId,
        'item_unassigned',
        {
          item_name: assignment.bill_item.item_name,
          unassigned_from: assignment.user.full_name
        }
      );
    }, 'remove item assignment');
  }

  /**
   * Calculate and update participant balances for a bill
   * @param {string} billId - Bill ID
   * @param {string} userId - User requesting the calculation
   * @returns {Promise<Array>} Updated participant balances
   */
  async calculateParticipantBalances(billId, userId) {
    return handleAsyncOperation(async () => {
      // Verify user has access to this bill
      const bill = await executeQuery(
        this.supabase
          .from('bills')
          .select(`
            id,
            hangout_id,
            hangout:hangouts!bills_hangout_id_fkey(
              participants:hangout_participants!inner(user_id)
            )
          `)
          .eq('id', billId)
          .eq('hangout.participants.user_id', userId)
          .single(),
        'get bill for balance calculation'
      );

      if (!bill) {
        throw new NotFoundError('Bill');
      }

      // Get all assignments and payments for this bill
      const [assignments, payments] = await Promise.all([
        executeQuery(
          this.supabase
            .from('item_assignments')
            .select(`
              user_id,
              assigned_amount,
              bill_item:bill_items!item_assignments_bill_item_id_fkey(bill_id)
            `)
            .eq('bill_item.bill_id', billId),
          'get bill assignments'
        ),
        executeQuery(
          this.supabase
            .from('payments')
            .select('from_user_id, amount, status')
            .eq('bill_id', billId),
          'get bill payments'
        )
      ]);

      // Calculate balances
      const balances = calculateParticipantBalances(assignments, payments);

      // Update or create participant balance records
      const balanceUpdates = Object.values(balances).map(balance => ({
        bill_id: billId,
        user_id: balance.user_id,
        total_owed: balance.total_owed,
        amount_paid: balance.amount_paid,
        balance_remaining: balance.balance_remaining,
        payment_status: balance.payment_status,
        last_payment_date: balance.amount_paid > 0 ? new Date().toISOString() : null
      }));

      // Upsert balance records
      const updatedBalances = await executeQuery(
        this.supabase
          .from('participant_balances')
          .upsert(balanceUpdates, { 
            onConflict: 'bill_id,user_id',
            ignoreDuplicates: false 
          })
          .select(`
            *,
            user:users!participant_balances_user_id_fkey(id, full_name, avatar_url)
          `),
        'update participant balances'
      );

      return updatedBalances;
    }, 'calculate participant balances');
  }
}

export default BillModel;
