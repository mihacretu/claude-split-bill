import { BaseModel } from './BaseModel.js';
import { handleAsyncOperation, NotFoundError, AuthorizationError, BusinessLogicError } from '../utils/errors.js';
import { executeQuery, isHangoutParticipant, logHangoutActivity } from '../utils/supabase.js';

/**
 * Payment model for managing payments between users
 */
export class PaymentModel extends BaseModel {
  constructor(accessToken) {
    super('payments', accessToken);
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
      // Get bill details and verify access
      const bill = await executeQuery(
        this.supabase
          .from('bills')
          .select(`
            id,
            hangout_id,
            paid_by,
            hangout:hangouts!bills_hangout_id_fkey(
              id,
              participants:hangout_participants!inner(user_id)
            )
          `)
          .eq('id', billId)
          .eq('hangout.participants.user_id', userId)
          .single(),
        'get bill for payment'
      );

      if (!bill) {
        throw new NotFoundError('Bill');
      }

      // Verify payment is valid
      if (paymentData.from_user_id === paymentData.to_user_id) {
        throw new BusinessLogicError('Cannot create payment to yourself');
      }

      // Verify both users are participants
      const participants = bill.hangout.participants.map(p => p.user_id);
      if (!participants.includes(paymentData.from_user_id) || !participants.includes(paymentData.to_user_id)) {
        throw new BusinessLogicError('Both users must be participants in the hangout');
      }

      // Verify payment amount is positive
      if (paymentData.amount <= 0) {
        throw new BusinessLogicError('Payment amount must be positive');
      }

      // Get participant balance to verify payment doesn't exceed amount owed
      const balance = await this.supabase
        .from('participant_balances')
        .select('balance_remaining')
        .eq('bill_id', billId)
        .eq('user_id', paymentData.from_user_id)
        .single();

      if (balance.data && paymentData.amount > balance.data.balance_remaining) {
        throw new BusinessLogicError('Payment amount exceeds amount owed');
      }

      // Create payment
      const newPayment = await this.create({
        ...paymentData,
        bill_id: billId,
        status: paymentData.status || 'pending'
      }, `
        *,
        from_user:users!payments_from_user_id_fkey(id, full_name, avatar_url),
        to_user:users!payments_to_user_id_fkey(id, full_name, avatar_url)
      `);

      // Log activity
      await logHangoutActivity(
        this.supabase,
        bill.hangout_id,
        userId,
        'payment_made',
        {
          amount: newPayment.amount,
          from_user: newPayment.from_user.full_name,
          to_user: newPayment.to_user.full_name,
          payment_method: newPayment.payment_method
        }
      );

      return newPayment;
    }, 'create payment');
  }

  /**
   * Update payment status
   * @param {string} paymentId - Payment ID
   * @param {Object} updates - Updates to apply (typically status changes)
   * @param {string} userId - User updating the payment
   * @returns {Promise<Object>} Updated payment
   */
  async updatePayment(paymentId, updates, userId) {
    return handleAsyncOperation(async () => {
      // Get payment and verify user has access
      const payment = await executeQuery(
        this.supabase
          .from('payments')
          .select(`
            id,
            from_user_id,
            to_user_id,
            status,
            bill:bills!payments_bill_id_fkey(
              hangout_id,
              hangout:hangouts!bills_hangout_id_fkey(
                participants:hangout_participants!inner(user_id)
              )
            )
          `)
          .eq('id', paymentId)
          .eq('bill.hangout.participants.user_id', userId)
          .single(),
        'get payment for update'
      );

      if (!payment) {
        throw new NotFoundError('Payment');
      }

      // Only allow the sender or receiver to update the payment
      if (payment.from_user_id !== userId && payment.to_user_id !== userId) {
        throw new AuthorizationError('Only payment sender or receiver can update payment');
      }

      // Update payment
      const updatedPayment = await this.updateById(paymentId, updates, `
        *,
        from_user:users!payments_from_user_id_fkey(id, full_name, avatar_url),
        to_user:users!payments_to_user_id_fkey(id, full_name, avatar_url)
      `);

      // If payment status changed to completed, update participant balances
      if (updates.status === 'completed' && payment.status !== 'completed') {
        await this.updateParticipantBalance(updatedPayment.bill_id, updatedPayment.from_user_id, updatedPayment.amount);
      }

      return updatedPayment;
    }, 'update payment');
  }

  /**
   * Get payments for a bill
   * @param {string} billId - Bill ID
   * @param {string} userId - User requesting the payments (must be participant)
   * @returns {Promise<Array>} Bill payments
   */
  async getBillPayments(billId, userId) {
    return handleAsyncOperation(async () => {
      // Verify user has access to this bill
      const bill = await executeQuery(
        this.supabase
          .from('bills')
          .select(`
            id,
            hangout:hangouts!bills_hangout_id_fkey(
              participants:hangout_participants!inner(user_id)
            )
          `)
          .eq('id', billId)
          .eq('hangout.participants.user_id', userId)
          .single(),
        'get bill for payments'
      );

      if (!bill) {
        throw new NotFoundError('Bill');
      }

      return executeQuery(
        this.supabase
          .from('payments')
          .select(`
            *,
            from_user:users!payments_from_user_id_fkey(id, full_name, avatar_url),
            to_user:users!payments_to_user_id_fkey(id, full_name, avatar_url)
          `)
          .eq('bill_id', billId)
          .order('created_at', { ascending: false }),
        'get bill payments'
      );
    }, 'get bill payments');
  }

  /**
   * Get user's payments (sent and received)
   * @param {string} userId - User ID
   * @param {Object} filters - Filters (status, type, limit, offset)
   * @returns {Promise<Object>} Paginated payments
   */
  async getUserPayments(userId, filters = {}) {
    const { status, type, limit = 20, offset = 0 } = filters;

    return handleAsyncOperation(async () => {
      let query = this.supabase
        .from('payments')
        .select(`
          *,
          from_user:users!payments_from_user_id_fkey(id, full_name, avatar_url),
          to_user:users!payments_to_user_id_fkey(id, full_name, avatar_url),
          bill:bills(
            id,
            title,
            hangout:hangouts(id, title, location_name)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by user involvement
      if (type === 'sent') {
        query = query.eq('from_user_id', userId);
      } else if (type === 'received') {
        query = query.eq('to_user_id', userId);
      } else {
        query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
      }

      // Filter by status
      if (status) {
        query = query.eq('status', status);
      }

      const { data: payments, count } = await query;

      return {
        data: payments,
        pagination: {
          total: count,
          limit,
          offset,
          has_more: offset + limit < count
        }
      };
    }, 'get user payments');
  }

  /**
   * Get payment summary for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Payment summary statistics
   */
  async getPaymentSummary(userId) {
    return handleAsyncOperation(async () => {
      const [sentPayments, receivedPayments, pendingPayments] = await Promise.all([
        // Sent payments
        executeQuery(
          this.supabase
            .from('payments')
            .select('amount, status')
            .eq('from_user_id', userId),
          'get sent payments'
        ),
        // Received payments
        executeQuery(
          this.supabase
            .from('payments')
            .select('amount, status')
            .eq('to_user_id', userId),
          'get received payments'
        ),
        // Pending balances
        executeQuery(
          this.supabase
            .from('participant_balances')
            .select('balance_remaining')
            .eq('user_id', userId)
            .gt('balance_remaining', 0),
          'get pending balances'
        )
      ]);

      const totalSent = sentPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalReceived = receivedPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const pendingSent = sentPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const pendingReceived = receivedPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalOwed = pendingPayments
        .reduce((sum, b) => sum + parseFloat(b.balance_remaining), 0);

      return {
        total_sent: totalSent,
        total_received: totalReceived,
        pending_sent: pendingSent,
        pending_received: pendingReceived,
        total_owed: totalOwed,
        net_balance: totalReceived - totalSent,
        completed_payments: sentPayments.filter(p => p.status === 'completed').length + 
                           receivedPayments.filter(p => p.status === 'completed').length
      };
    }, 'get payment summary');
  }

  /**
   * Cancel a payment (only if pending)
   * @param {string} paymentId - Payment ID
   * @param {string} userId - User canceling the payment
   * @returns {Promise<Object>} Cancelled payment
   */
  async cancelPayment(paymentId, userId) {
    return handleAsyncOperation(async () => {
      // Get payment and verify user can cancel it
      const payment = await executeQuery(
        this.supabase
          .from('payments')
          .select(`
            id,
            from_user_id,
            to_user_id,
            status,
            bill:bills!payments_bill_id_fkey(
              hangout_id,
              hangout:hangouts!bills_hangout_id_fkey(
                participants:hangout_participants!inner(user_id)
              )
            )
          `)
          .eq('id', paymentId)
          .eq('bill.hangout.participants.user_id', userId)
          .single(),
        'get payment for cancellation'
      );

      if (!payment) {
        throw new NotFoundError('Payment');
      }

      // Only sender can cancel their own payment
      if (payment.from_user_id !== userId) {
        throw new AuthorizationError('Only the payment sender can cancel a payment');
      }

      // Can only cancel pending payments
      if (payment.status !== 'pending') {
        throw new BusinessLogicError('Can only cancel pending payments');
      }

      return this.updateById(paymentId, { 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      }, `
        *,
        from_user:users!payments_from_user_id_fkey(id, full_name, avatar_url),
        to_user:users!payments_to_user_id_fkey(id, full_name, avatar_url)
      `);
    }, 'cancel payment');
  }

  /**
   * Update participant balance after a completed payment
   * @private
   * @param {string} billId - Bill ID
   * @param {string} userId - User who made the payment
   * @param {number} amount - Payment amount
   */
  async updateParticipantBalance(billId, userId, amount) {
    return handleAsyncOperation(async () => {
      // Get current balance
      const balance = await this.supabase
        .from('participant_balances')
        .select('*')
        .eq('bill_id', billId)
        .eq('user_id', userId)
        .single();

      if (balance.data) {
        const newAmountPaid = parseFloat(balance.data.amount_paid) + parseFloat(amount);
        const newBalanceRemaining = parseFloat(balance.data.total_owed) - newAmountPaid;
        
        let newStatus = 'pending';
        if (newBalanceRemaining <= 0.01) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0) {
          newStatus = 'partial';
        }

        await executeQuery(
          this.supabase
            .from('participant_balances')
            .update({
              amount_paid: newAmountPaid,
              balance_remaining: Math.max(0, newBalanceRemaining),
              payment_status: newStatus,
              last_payment_date: new Date().toISOString()
            })
            .eq('id', balance.data.id),
          'update participant balance'
        );
      }
    }, 'update participant balance');
  }

  /**
   * Get payment methods used by a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Payment methods with usage count
   */
  async getPaymentMethods(userId) {
    return handleAsyncOperation(async () => {
      const payments = await executeQuery(
        this.supabase
          .from('payments')
          .select('payment_method')
          .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
          .eq('status', 'completed')
          .not('payment_method', 'is', null),
        'get payment methods'
      );

      // Count usage of each payment method
      const methodCounts = payments.reduce((acc, payment) => {
        const method = payment.payment_method;
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(methodCounts)
        .map(([method, count]) => ({ method, count }))
        .sort((a, b) => b.count - a.count);
    }, 'get payment methods');
  }
}

export default PaymentModel;
