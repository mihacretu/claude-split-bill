const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { bills, historicalBills, billActivities } = require('../data/bills');
const { users } = require('../data/users');
const router = express.Router();

// Get all bills for the authenticated user
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    // Filter bills where user is a participant
    let userBills = [...bills, ...historicalBills].filter(bill => 
      bill.participants && bill.participants.some(p => p.id === userId)
    );

    // Filter by status if provided
    if (status) {
      userBills = userBills.filter(bill => bill.status === status);
    }

    // Sort by creation date (newest first)
    userBills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const paginatedBills = userBills.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Transform for timeline format
    const timelineBills = paginatedBills.map(bill => {
      const userParticipant = bill.participants?.find(p => p.id === userId);
      const createdDate = new Date(bill.createdAt);
      
      let description = 'Bill settled';
      if (userParticipant?.netBalance > 0) {
        description = `Left to receive $${Math.abs(userParticipant.netBalance).toFixed(2)}`;
      } else if (userParticipant?.netBalance < 0) {
        const owedTo = bill.participants?.find(p => p.netBalance > 0)?.name || 'others';
        description = `You owe $${Math.abs(userParticipant.netBalance).toFixed(2)} to ${owedTo}`;
      } else if (userParticipant?.netBalance === 0) {
        description = 'Bill settled';
      }

      return {
        id: bill.id,
        time: `${String(createdDate.getMonth() + 1).padStart(2, '0')}/${String(createdDate.getDate()).padStart(2, '0')}`,
        title: bill.title,
        description,
        status: bill.status,
        totalAmount: bill.finalAmount,
        participants: bill.participants?.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar
        })) || [],
        bill: bill // Include full bill data for detail view
      };
    });

    res.json({
      success: true,
      data: {
        bills: timelineBills,
        pagination: {
          total: userBills.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < userBills.length
        }
      }
    });

  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get a specific bill by ID
router.get('/:billId', authenticateToken, (req, res) => {
  try {
    const { billId } = req.params;
    const userId = req.user.id;

    const bill = [...bills, ...historicalBills].find(b => b.id === billId);

    if (!bill) {
      return res.status(404).json({
        error: 'Bill not found',
        code: 'BILL_NOT_FOUND'
      });
    }

    // Check if user is a participant
    const userParticipant = bill.participants?.find(p => p.id === userId);
    if (!userParticipant) {
      return res.status(403).json({
        error: 'You are not authorized to view this bill',
        code: 'FORBIDDEN'
      });
    }

    res.json({
      success: true,
      data: {
        bill
      }
    });

  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Create a new bill
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      restaurantId,
      totalAmount,
      tax,
      tip,
      participants = [],
      items = [],
      splitMethod = 'itemized',
      location
    } = req.body;

    // Validation
    if (!title || !totalAmount) {
      return res.status(400).json({
        error: 'Title and total amount are required',
        code: 'MISSING_FIELDS'
      });
    }

    const finalAmount = totalAmount + (tax || 0) + (tip || 0);

    const newBill = {
      id: `bill-${uuidv4()}`,
      title,
      restaurantId: restaurantId || null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      totalAmount,
      tax: tax || 0,
      tip: tip || 0,
      finalAmount,
      currency: 'USD',
      participants: participants.map(p => ({
        ...p,
        paymentStatus: p.paymentStatus || 'pending',
        netBalance: p.netBalance || 0
      })),
      payments: [],
      splitMethod,
      location: location || null,
      receiptImage: null
    };

    // Add to bills array (in real app, save to database)
    bills.unshift(newBill);

    // Create activity log
    const activity = {
      id: `activity-${uuidv4()}`,
      billId: newBill.id,
      userId,
      type: 'bill_created',
      description: `${req.user.username} created the bill`,
      timestamp: new Date().toISOString()
    };
    billActivities.push(activity);

    res.status(201).json({
      success: true,
      data: {
        bill: newBill
      }
    });

  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update a bill
router.put('/:billId', authenticateToken, (req, res) => {
  try {
    const { billId } = req.params;
    const userId = req.user.id;

    const billIndex = bills.findIndex(b => b.id === billId);

    if (billIndex === -1) {
      return res.status(404).json({
        error: 'Bill not found',
        code: 'BILL_NOT_FOUND'
      });
    }

    const bill = bills[billIndex];

    // Check if user is authorized to update (creator or participant)
    const isAuthorized = bill.createdBy === userId || 
                        bill.participants?.some(p => p.id === userId);

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'You are not authorized to update this bill',
        code: 'FORBIDDEN'
      });
    }

    const {
      title,
      totalAmount,
      tax,
      tip,
      participants,
      status
    } = req.body;

    // Update allowed fields
    if (title) bill.title = title;
    if (totalAmount !== undefined) {
      bill.totalAmount = totalAmount;
      bill.finalAmount = totalAmount + (bill.tax || 0) + (bill.tip || 0);
    }
    if (tax !== undefined) {
      bill.tax = tax;
      bill.finalAmount = bill.totalAmount + tax + (bill.tip || 0);
    }
    if (tip !== undefined) {
      bill.tip = tip;
      bill.finalAmount = bill.totalAmount + (bill.tax || 0) + tip;
    }
    if (participants) bill.participants = participants;
    if (status) bill.status = status;

    bill.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: {
        bill
      }
    });

  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Add payment to a bill
router.post('/:billId/payments', authenticateToken, (req, res) => {
  try {
    const { billId } = req.params;
    const userId = req.user.id;
    const { amount, method, toUserId } = req.body;

    const billIndex = bills.findIndex(b => b.id === billId);

    if (billIndex === -1) {
      return res.status(404).json({
        error: 'Bill not found',
        code: 'BILL_NOT_FOUND'
      });
    }

    if (!amount || !method) {
      return res.status(400).json({
        error: 'Amount and payment method are required',
        code: 'MISSING_FIELDS'
      });
    }

    const payment = {
      id: `pay-${uuidv4()}`,
      fromUserId: userId,
      toUserId: toUserId || null,
      amount: parseFloat(amount),
      status: 'completed',
      method,
      transactionId: `txn_${uuidv4()}`,
      createdAt: new Date().toISOString()
    };

    bills[billIndex].payments.push(payment);
    bills[billIndex].updatedAt = new Date().toISOString();

    // Create activity log
    const activity = {
      id: `activity-${uuidv4()}`,
      billId,
      userId,
      type: 'payment_made',
      description: `${req.user.username} made a payment`,
      metadata: { amount, method },
      timestamp: new Date().toISOString()
    };
    billActivities.push(activity);

    res.status(201).json({
      success: true,
      data: {
        payment
      }
    });

  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get bill activities/history
router.get('/:billId/activities', authenticateToken, (req, res) => {
  try {
    const { billId } = req.params;
    const userId = req.user.id;

    // Check if user has access to this bill
    const bill = [...bills, ...historicalBills].find(b => b.id === billId);
    if (!bill || !bill.participants?.some(p => p.id === userId)) {
      return res.status(404).json({
        error: 'Bill not found or access denied',
        code: 'BILL_NOT_FOUND'
      });
    }

    const activities = billActivities
      .filter(a => a.billId === billId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: {
        activities
      }
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Delete a bill (only creator can delete)
router.delete('/:billId', authenticateToken, (req, res) => {
  try {
    const { billId } = req.params;
    const userId = req.user.id;

    const billIndex = bills.findIndex(b => b.id === billId);

    if (billIndex === -1) {
      return res.status(404).json({
        error: 'Bill not found',
        code: 'BILL_NOT_FOUND'
      });
    }

    const bill = bills[billIndex];

    // Only creator can delete
    if (bill.createdBy !== userId) {
      return res.status(403).json({
        error: 'Only the bill creator can delete this bill',
        code: 'FORBIDDEN'
      });
    }

    // Remove bill
    bills.splice(billIndex, 1);

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });

  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
