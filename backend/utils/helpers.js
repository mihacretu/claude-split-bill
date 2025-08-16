/**
 * Common helper functions for the Claude Split Bill backend services
 */

/**
 * Calculate bill totals and validate amounts
 * @param {Object} billData - Bill data with subtotal, tax_amount, tip_amount
 * @returns {Object} Calculated totals and validation result
 */
export const calculateBillTotals = (billData) => {
  const subtotal = parseFloat(billData.subtotal || 0);
  const taxAmount = parseFloat(billData.tax_amount || 0);
  const tipAmount = parseFloat(billData.tip_amount || 0);
  const providedTotal = parseFloat(billData.total_amount || 0);
  
  const calculatedTotal = subtotal + taxAmount + tipAmount;
  const difference = Math.abs(calculatedTotal - providedTotal);
  const tolerance = 0.01; // Allow 1 cent difference due to rounding
  
  return {
    subtotal,
    tax_amount: taxAmount,
    tip_amount: tipAmount,
    calculated_total: calculatedTotal,
    provided_total: providedTotal,
    is_valid: difference <= tolerance,
    difference
  };
};

/**
 * Calculate item assignment amounts and validate quantities
 * @param {Object} item - Bill item with price and total quantity
 * @param {Array} assignments - Array of assignments with quantities
 * @returns {Object} Assignment calculations and validation
 */
export const calculateItemAssignments = (item, assignments = []) => {
  const itemPrice = parseFloat(item.item_price);
  const totalQuantity = parseInt(item.total_quantity);
  
  let totalAssignedQuantity = 0;
  let totalAssignedAmount = 0;
  
  const calculatedAssignments = assignments.map(assignment => {
    const quantity = parseInt(assignment.quantity);
    const pricePerUnit = itemPrice;
    const calculatedAmount = quantity * pricePerUnit;
    const providedAmount = parseFloat(assignment.assigned_amount || 0);
    
    totalAssignedQuantity += quantity;
    totalAssignedAmount += calculatedAmount;
    
    return {
      ...assignment,
      quantity,
      calculated_amount: calculatedAmount,
      provided_amount: providedAmount,
      price_per_unit: pricePerUnit,
      is_amount_valid: Math.abs(calculatedAmount - providedAmount) <= 0.01
    };
  });
  
  return {
    item_price: itemPrice,
    total_quantity: totalQuantity,
    total_assigned_quantity: totalAssignedQuantity,
    remaining_quantity: totalQuantity - totalAssignedQuantity,
    total_assigned_amount: totalAssignedAmount,
    assignments: calculatedAssignments,
    is_fully_assigned: totalAssignedQuantity === totalQuantity,
    is_over_assigned: totalAssignedQuantity > totalQuantity,
    is_valid: totalAssignedQuantity <= totalQuantity
  };
};

/**
 * Calculate participant balances for a bill
 * @param {Array} assignments - All item assignments for the bill
 * @param {Array} payments - All payments made for the bill
 * @returns {Object} Balance calculations by user
 */
export const calculateParticipantBalances = (assignments = [], payments = []) => {
  const balances = {};
  
  // Calculate total owed from assignments
  assignments.forEach(assignment => {
    const userId = assignment.user_id;
    const amount = parseFloat(assignment.assigned_amount || 0);
    
    if (!balances[userId]) {
      balances[userId] = {
        user_id: userId,
        total_owed: 0,
        amount_paid: 0,
        balance_remaining: 0,
        payment_status: 'pending'
      };
    }
    
    balances[userId].total_owed += amount;
  });
  
  // Subtract payments made
  payments.forEach(payment => {
    if (payment.status === 'completed') {
      const userId = payment.from_user_id;
      const amount = parseFloat(payment.amount || 0);
      
      if (balances[userId]) {
        balances[userId].amount_paid += amount;
      }
    }
  });
  
  // Calculate remaining balances and payment status
  Object.values(balances).forEach(balance => {
    balance.balance_remaining = balance.total_owed - balance.amount_paid;
    
    if (balance.balance_remaining <= 0.01) {
      balance.payment_status = 'paid';
      balance.balance_remaining = 0;
    } else if (balance.amount_paid > 0) {
      balance.payment_status = 'partial';
    } else {
      balance.payment_status = 'pending';
    }
    
    // Round to 2 decimal places
    balance.total_owed = Math.round(balance.total_owed * 100) / 100;
    balance.amount_paid = Math.round(balance.amount_paid * 100) / 100;
    balance.balance_remaining = Math.round(balance.balance_remaining * 100) / 100;
  });
  
  return balances;
};

/**
 * Format currency amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Generate a unique identifier for activities or references
 * @returns {string} Unique identifier
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitize user input to prevent XSS and other issues
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000); // Limit length
};

/**
 * Deep clone an object (simple implementation for our use case)
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * Check if a date is within a reasonable range for hangouts
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is valid for hangouts
 */
export const isValidHangoutDate = (date) => {
  const hangoutDate = new Date(date);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  return hangoutDate >= oneYearAgo && hangoutDate <= oneYearFromNow;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Paginate array results
 * @param {Array} items - Items to paginate
 * @param {number} limit - Items per page
 * @param {number} offset - Items to skip
 * @returns {Object} Paginated result with metadata
 */
export const paginateResults = (items, limit = 20, offset = 0) => {
  const total = items.length;
  const paginatedItems = items.slice(offset, offset + limit);
  
  return {
    data: paginatedItems,
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + limit < total,
      page: Math.floor(offset / limit) + 1,
      total_pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - Async operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Result of the operation
 */
export const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export default {
  calculateBillTotals,
  calculateItemAssignments,
  calculateParticipantBalances,
  formatCurrency,
  generateId,
  sanitizeInput,
  deepClone,
  isValidHangoutDate,
  calculateDistance,
  paginateResults,
  retryOperation
};
