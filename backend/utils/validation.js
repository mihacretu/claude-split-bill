import Joi from 'joi';
import { ValidationError } from './errors.js';

/**
 * Validation schemas and utilities for the Claude Split Bill backend
 */

// Common validation patterns
const patterns = {
  uuid: Joi.string().uuid().required(),
  optionalUuid: Joi.string().uuid().optional(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  url: Joi.string().uri().optional().allow(''),
  decimal: Joi.number().precision(2).min(0),
  positiveDecimal: Joi.number().precision(2).min(0.01),
  positiveInteger: Joi.number().integer().min(1),
  nonNegativeInteger: Joi.number().integer().min(0),
  status: (validStatuses) => Joi.string().valid(...validStatuses),
  coordinates: Joi.number().min(-180).max(180),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180)
};

// User schemas
export const userSchemas = {
  create: Joi.object({
    id: patterns.uuid,
    email: patterns.email,
    username: Joi.string().alphanum().min(3).max(30).optional(),
    full_name: Joi.string().min(1).max(100).required(),
    phone: patterns.phone,
    avatar_url: patterns.url
  }),

  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    full_name: Joi.string().min(1).max(100).optional(),
    phone: patterns.phone,
    avatar_url: patterns.url
  }).min(1), // At least one field must be provided

  search: Joi.object({
    query: Joi.string().min(2).max(50).required(),
    limit: Joi.number().integer().min(1).max(50).default(10)
  })
};

// Friendship schemas
export const friendshipSchemas = {
  create: Joi.object({
    addressee_id: patterns.uuid
  }),

  update: Joi.object({
    status: patterns.status(['accepted', 'declined', 'blocked'])
  })
};

// Hangout schemas
export const hangoutSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    location_name: Joi.string().min(1).max(200).optional(),
    location_address: Joi.string().min(1).max(500).optional(),
    latitude: patterns.latitude.optional(),
    longitude: patterns.longitude.optional(),
    hangout_date: Joi.date().iso().required(),
    status: patterns.status(['active', 'completed', 'cancelled']).default('active')
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    location_name: Joi.string().min(1).max(200).optional(),
    location_address: Joi.string().min(1).max(500).optional(),
    latitude: patterns.latitude.optional(),
    longitude: patterns.longitude.optional(),
    hangout_date: Joi.date().iso().optional(),
    status: patterns.status(['active', 'completed', 'cancelled']).optional()
  }).min(1),

  addParticipant: Joi.object({
    user_id: patterns.uuid
  }),

  query: Joi.object({
    status: patterns.status(['active', 'completed', 'cancelled']).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  })
};

// Bill schemas
export const billSchemas = {
  create: Joi.object({
    paid_by: patterns.uuid,
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional().allow(''),
    subtotal: patterns.decimal.default(0),
    tax_amount: patterns.decimal.default(0),
    tip_amount: patterns.decimal.default(0),
    total_amount: patterns.positiveDecimal,
    bill_date: Joi.date().iso().required(),
    status: patterns.status(['active', 'settled', 'cancelled']).default('active')
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    subtotal: patterns.decimal.optional(),
    tax_amount: patterns.decimal.optional(),
    tip_amount: patterns.decimal.optional(),
    total_amount: patterns.positiveDecimal.optional(),
    status: patterns.status(['active', 'settled', 'cancelled']).optional()
  }).min(1)
};

// Bill item schemas
export const billItemSchemas = {
  create: Joi.object({
    item_name: Joi.string().min(1).max(200).required(),
    item_price: patterns.positiveDecimal,
    total_quantity: patterns.positiveInteger.default(1),
    image_url: patterns.url
  }),

  update: Joi.object({
    item_name: Joi.string().min(1).max(200).optional(),
    item_price: patterns.positiveDecimal.optional(),
    total_quantity: patterns.positiveInteger.optional(),
    image_url: patterns.url
  }).min(1)
};

// Item assignment schemas
export const assignmentSchemas = {
  create: Joi.object({
    user_id: patterns.uuid,
    quantity: patterns.positiveInteger.default(1),
    assigned_amount: patterns.positiveDecimal
  }),

  update: Joi.object({
    quantity: patterns.positiveInteger.optional(),
    assigned_amount: patterns.positiveDecimal.optional()
  }).min(1)
};

// Payment schemas
export const paymentSchemas = {
  create: Joi.object({
    from_user_id: patterns.uuid,
    to_user_id: patterns.uuid,
    amount: patterns.positiveDecimal,
    payment_method: Joi.string().valid('cash', 'venmo', 'paypal', 'zelle', 'bank_transfer', 'other').optional(),
    transaction_id: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional().allow(''),
    payment_date: Joi.date().iso().optional()
  }),

  update: Joi.object({
    status: patterns.status(['pending', 'completed', 'failed', 'cancelled']),
    transaction_id: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional().allow(''),
    payment_date: Joi.date().iso().optional()
  }).min(1)
};

// Activity query schema
export const activitySchemas = {
  query: Joi.object({
    activity_type: Joi.string().valid(
      'hangout_created',
      'participant_added',
      'participant_removed',
      'bill_scanned',
      'item_added',
      'item_removed',
      'item_assigned',
      'item_unassigned',
      'payment_made',
      'bill_settled',
      'hangout_completed'
    ).optional(),
    limit: Joi.number().integer().min(1).max(100).default(50)
  })
};

/**
 * Validate data against a Joi schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema to validate against
 * @param {string} context - Context for error messages
 * @returns {Object} Validated and sanitized data
 * @throws {ValidationError} If validation fails
 */
export const validate = (data, schema, context = 'data') => {
  const { error, value } = schema.validate(data, {
    abortEarly: false, // Return all errors
    stripUnknown: true, // Remove unknown fields
    convert: true // Convert types when possible
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    throw new ValidationError(
      `Invalid ${context}: ${error.details.map(d => d.message).join(', ')}`,
      { validationDetails: details }
    );
  }

  return value;
};

/**
 * Validate UUID format
 * @param {string} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {string} Validated UUID
 * @throws {ValidationError} If validation fails
 */
export const validateUUID = (value, fieldName = 'ID') => {
  return validate({ [fieldName]: value }, Joi.object({ [fieldName]: patterns.uuid }), fieldName)[fieldName];
};

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validated pagination parameters
 */
export const validatePagination = (params = {}) => {
  const schema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  });

  return validate(params, schema, 'pagination parameters');
};

/**
 * Validate coordinates
 * @param {Object} coords - Coordinates object with latitude and longitude
 * @returns {Object} Validated coordinates
 */
export const validateCoordinates = (coords) => {
  const schema = Joi.object({
    latitude: patterns.latitude.required(),
    longitude: patterns.longitude.required()
  });

  return validate(coords, schema, 'coordinates');
};

/**
 * Create a custom validation function for specific use cases
 * @param {Object} schema - Joi schema
 * @param {string} context - Context for error messages
 * @returns {Function} Validation function
 */
export const createValidator = (schema, context) => {
  return (data) => validate(data, schema, context);
};

export default {
  userSchemas,
  friendshipSchemas,
  hangoutSchemas,
  billSchemas,
  billItemSchemas,
  assignmentSchemas,
  paymentSchemas,
  activitySchemas,
  validate,
  validateUUID,
  validatePagination,
  validateCoordinates,
  createValidator,
  patterns
};
