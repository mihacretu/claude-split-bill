import { PaymentModel } from '../models/PaymentModel.js';
import { validate, paymentSchemas } from '../utils/validation.js';
import { AuthenticationError, handleAsyncOperation, validateUUID, BusinessLogicError } from '../utils/errors.js';

/**
 * Payment service - handles payment-related business logic
 */
export class PaymentService {
  constructor(accessToken) {
    if (!accessToken) {
      throw new AuthenticationError('Access token required for PaymentService');
    }
    this.paymentModel = new PaymentModel(accessToken);
    this.accessToken = accessToken;
  }

  /**
   * Create a new payment
   * @param {string} billId - Bill ID
   * @param {Object} paymentData - Payment data
   * @param {string} userId - User creating the payment
   * @returns {Promise<Object>} Created payment
   */
  async createPayment(billId, paymentData, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      const validatedData = validate(paymentData, paymentSchemas.create, 'payment data');
      
      // Additional business logic validations
      if (validatedData.from_user_id === validatedData.to_user_id) {
        throw new BusinessLogicError('Cannot create payment to yourself');
      }

      if (validatedData.amount <= 0) {
        throw new BusinessLogicError('Payment amount must be positive');
      }

      return this.paymentModel.createPayment(billId, validatedData, userId);
    }, 'create payment');
  }

  /**
   * Update payment status or details
   * @param {string} paymentId - Payment ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User updating the payment
   * @returns {Promise<Object>} Updated payment
   */
  async updatePayment(paymentId, updates, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(paymentId, 'payment ID');
      const validatedUpdates = validate(updates, paymentSchemas.update, 'payment updates');
      return this.paymentModel.updatePayment(paymentId, validatedUpdates, userId);
    }, 'update payment');
  }

  /**
   * Mark payment as completed
   * @param {string} paymentId - Payment ID
   * @param {string} userId - User marking as completed
   * @param {Object} completionData - Additional completion data (transaction_id, notes)
   * @returns {Promise<Object>} Updated payment
   */
  async markPaymentCompleted(paymentId, userId, completionData = {}) {
    return handleAsyncOperation(async () => {
      validateUUID(paymentId, 'payment ID');
      
      const updates = {
        status: 'completed',
        payment_date: new Date().toISOString(),
        ...completionData
      };

      return this.paymentModel.updatePayment(paymentId, updates, userId);
    }, 'mark payment completed');
  }

  /**
   * Cancel a payment (only if pending)
   * @param {string} paymentId - Payment ID
   * @param {string} userId - User canceling the payment
   * @returns {Promise<Object>} Cancelled payment
   */
  async cancelPayment(paymentId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(paymentId, 'payment ID');
      return this.paymentModel.cancelPayment(paymentId, userId);
    }, 'cancel payment');
  }

  /**
   * Get payments for a bill
   * @param {string} billId - Bill ID
   * @param {string} userId - User requesting the payments
   * @returns {Promise<Array>} Bill payments
   */
  async getBillPayments(billId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      return this.paymentModel.getBillPayments(billId, userId);
    }, 'get bill payments');
  }

  /**
   * Get user's payment history
   * @param {string} userId - User ID
   * @param {Object} filters - Filters (status, type, limit, offset)
   * @returns {Promise<Object>} Paginated payment history
   */
  async getPaymentHistory(userId, filters = {}) {
    return handleAsyncOperation(async () => {
      const validFilters = {
        status: filters.status,
        type: filters.type, // 'sent', 'received', or undefined for all
        limit: Math.min(filters.limit || 20, 100), // Cap at 100
        offset: filters.offset || 0
      };

      // Validate type if provided
      if (validFilters.type && !['sent', 'received'].includes(validFilters.type)) {
        throw new BusinessLogicError('Payment type must be "sent" or "received"');
      }

      return this.paymentModel.getUserPayments(userId, validFilters);
    }, 'get payment history');
  }

  /**
   * Get payment summary for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Payment summary statistics
   */
  async getPaymentSummary(userId) {
    return handleAsyncOperation(async () => {
      return this.paymentModel.getPaymentSummary(userId);
    }, 'get payment summary');
  }

  /**
   * Get pending payments for a user
   * @param {string} userId - User ID
   * @param {string} type - 'owed' (user owes money) or 'owed_to' (money owed to user)
   * @returns {Promise<Array>} Pending payments
   */
  async getPendingPayments(userId, type = 'owed') {
    return handleAsyncOperation(async () => {
      if (!['owed', 'owed_to'].includes(type)) {
        throw new BusinessLogicError('Type must be "owed" or "owed_to"');
      }

      const filters = {
        status: 'pending',
        type: type === 'owed' ? 'sent' : 'received',
        limit: 50
      };

      const result = await this.paymentModel.getUserPayments(userId, filters);
      return result.data;
    }, 'get pending payments');
  }

  /**
   * Create payment request (when someone owes money)
   * @param {string} billId - Bill ID
   * @param {string} fromUserId - User who owes money
   * @param {string} toUserId - User who should receive money (usually bill payer)
   * @param {number} amount - Amount owed
   * @param {string} requesterId - User creating the request
   * @returns {Promise<Object>} Created payment request
   */
  async createPaymentRequest(billId, fromUserId, toUserId, amount, requesterId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');
      validateUUID(fromUserId, 'from user ID');
      validateUUID(toUserId, 'to user ID');

      if (amount <= 0) {
        throw new BusinessLogicError('Payment request amount must be positive');
      }

      if (fromUserId === toUserId) {
        throw new BusinessLogicError('Cannot create payment request to yourself');
      }

      // Verify the requester has permission (is participant in the hangout)
      const bill = await this.paymentModel.supabase
        .from('bills')
        .select(`
          hangout:hangouts!bills_hangout_id_fkey(
            participants:hangout_participants!inner(user_id)
          )
        `)
        .eq('id', billId)
        .eq('hangout.participants.user_id', requesterId)
        .single();

      if (bill.error) {
        throw new BusinessLogicError('Access denied or bill not found');
      }

      const paymentData = {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount,
        status: 'pending',
        payment_method: 'pending_request',
        notes: `Payment request for bill amount`
      };

      return this.paymentModel.createPayment(billId, paymentData, requesterId);
    }, 'create payment request');
  }

  /**
   * Settle all outstanding balances for a bill
   * @param {string} billId - Bill ID
   * @param {string} userId - User initiating settlement
   * @returns {Promise<Array>} Created payment requests
   */
  async settleAllBalances(billId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');

      // Get all participant balances with outstanding amounts
      const balances = await this.paymentModel.supabase
        .from('participant_balances')
        .select(`
          *,
          user:users!participant_balances_user_id_fkey(id, full_name),
          bill:bills!participant_balances_bill_id_fkey(
            paid_by,
            hangout:hangouts!bills_hangout_id_fkey(
              participants:hangout_participants!inner(user_id)
            )
          )
        `)
        .eq('bill_id', billId)
        .eq('bill.hangout.participants.user_id', userId)
        .gt('balance_remaining', 0.01);

      if (balances.error) {
        throw new Error(`Failed to get balances: ${balances.error.message}`);
      }

      const paymentRequests = [];

      // Create payment requests for each outstanding balance
      for (const balance of balances.data) {
        const paymentRequest = await this.createPaymentRequest(
          billId,
          balance.user_id,
          balance.bill.paid_by,
          balance.balance_remaining,
          userId
        );
        paymentRequests.push(paymentRequest);
      }

      return paymentRequests;
    }, 'settle all balances');
  }

  /**
   * Get payment methods used by a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Payment methods with usage statistics
   */
  async getPaymentMethods(userId) {
    return handleAsyncOperation(async () => {
      return this.paymentModel.getPaymentMethods(userId);
    }, 'get payment methods');
  }

  /**
   * Record external payment (payment made outside the app)
   * @param {string} billId - Bill ID
   * @param {Object} paymentData - External payment data
   * @param {string} userId - User recording the payment
   * @returns {Promise<Object>} Created payment record
   */
  async recordExternalPayment(billId, paymentData, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');

      const validatedData = validate({
        ...paymentData,
        status: 'completed', // External payments are already completed
        payment_date: paymentData.payment_date || new Date().toISOString()
      }, paymentSchemas.create, 'external payment data');

      return this.paymentModel.createPayment(billId, validatedData, userId);
    }, 'record external payment');
  }

  /**
   * Get payment statistics for a bill
   * @param {string} billId - Bill ID
   * @param {string} userId - User requesting statistics
   * @returns {Promise<Object>} Payment statistics
   */
  async getBillPaymentStats(billId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');

      const [payments, balances] = await Promise.all([
        this.getBillPayments(billId, userId),
        this.paymentModel.supabase
          .from('participant_balances')
          .select('*')
          .eq('bill_id', billId)
      ]);

      if (balances.error) {
        throw new Error(`Failed to get balances: ${balances.error.message}`);
      }

      const totalPaid = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalPending = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalOwed = balances.data
        .reduce((sum, b) => sum + parseFloat(b.balance_remaining || 0), 0);

      const settledParticipants = balances.data
        .filter(b => b.payment_status === 'paid').length;

      const totalParticipants = balances.data.length;

      return {
        bill_id: billId,
        total_payments: payments.length,
        completed_payments: payments.filter(p => p.status === 'completed').length,
        pending_payments: payments.filter(p => p.status === 'pending').length,
        failed_payments: payments.filter(p => p.status === 'failed').length,
        total_paid: totalPaid,
        total_pending: totalPending,
        total_owed: totalOwed,
        settlement_rate: totalParticipants > 0 ? (settledParticipants / totalParticipants) * 100 : 0,
        is_fully_settled: totalOwed <= 0.01,
        payment_methods: [...new Set(payments.map(p => p.payment_method).filter(Boolean))]
      };
    }, 'get bill payment statistics');
  }

  /**
   * Remind users about pending payments
   * @param {string} billId - Bill ID
   * @param {string} userId - User sending reminders
   * @returns {Promise<Array>} Reminder results
   */
  async sendPaymentReminders(billId, userId) {
    return handleAsyncOperation(async () => {
      validateUUID(billId, 'bill ID');

      // Get participants with outstanding balances
      const balances = await this.paymentModel.supabase
        .from('participant_balances')
        .select(`
          *,
          user:users!participant_balances_user_id_fkey(id, full_name, email),
          bill:bills!participant_balances_bill_id_fkey(
            title,
            paid_by,
            hangout:hangouts!bills_hangout_id_fkey(
              title,
              participants:hangout_participants!inner(user_id)
            )
          )
        `)
        .eq('bill_id', billId)
        .eq('bill.hangout.participants.user_id', userId)
        .gt('balance_remaining', 0.01);

      if (balances.error) {
        throw new Error(`Failed to get balances: ${balances.error.message}`);
      }

      const reminders = [];

      // In a real app, you would integrate with email/SMS services here
      // For now, we'll just create activity records
      for (const balance of balances.data) {
        // Log reminder activity
        await this.paymentModel.supabase
          .from('hangout_activities')
          .insert({
            hangout_id: balance.bill.hangout.id,
            user_id: userId,
            activity_type: 'payment_reminder_sent',
            activity_data: {
              reminded_user: balance.user.full_name,
              amount_owed: balance.balance_remaining,
              bill_title: balance.bill.title
            }
          });

        reminders.push({
          user_id: balance.user_id,
          user_name: balance.user.full_name,
          amount_owed: balance.balance_remaining,
          reminder_sent: true
        });
      }

      return reminders;
    }, 'send payment reminders');
  }
}

export default PaymentService;
