import { createAuthenticatedClient, executeQuery } from '../utils/supabase.js';
import { 
  AuthenticationError, 
  NotFoundError, 
  handleAsyncOperation,
  validateUUID 
} from '../utils/errors.js';

/**
 * Base model class with common database operations
 * All model classes extend this base class
 */
export class BaseModel {
  constructor(tableName, accessToken = null, supabaseConfig = null) {
    this.tableName = tableName;
    this.accessToken = accessToken;
    this.supabaseConfig = supabaseConfig;
    this._supabase = null;
  }

  /**
   * Get Supabase client instance
   * @returns {Object} Supabase client
   * @throws {AuthenticationError} If no access token provided
   */
  get supabase() {
    if (!this._supabase) {
      if (!this.accessToken) {
        throw new AuthenticationError('Access token required for database operations');
      }
      this._supabase = createAuthenticatedClient(this.accessToken, this.supabaseConfig);
    }
    return this._supabase;
  }

  /**
   * Create a new record
   * @param {Object} data - Data to insert
   * @param {string} selectClause - Fields to select in response (default: '*')
   * @returns {Promise<Object>} Created record
   */
  async create(data, selectClause = '*') {
    return handleAsyncOperation(async () => {
      return executeQuery(
        this.supabase
          .from(this.tableName)
          .insert(data)
          .select(selectClause)
          .single(),
        `create ${this.tableName} record`
      );
    }, `create ${this.tableName}`);
  }

  /**
   * Find record by ID
   * @param {string} id - Record ID
   * @param {string} selectClause - Fields to select (default: '*')
   * @returns {Promise<Object>} Found record
   * @throws {NotFoundError} If record not found
   */
  async findById(id, selectClause = '*') {
    validateUUID(id, `${this.tableName} ID`);
    
    return handleAsyncOperation(async () => {
      const data = await executeQuery(
        this.supabase
          .from(this.tableName)
          .select(selectClause)
          .eq('id', id)
          .single(),
        `find ${this.tableName} by ID`
      );
      
      if (!data) {
        throw new NotFoundError(`${this.tableName} record`);
      }
      
      return data;
    }, `find ${this.tableName} by ID`);
  }

  /**
   * Find records matching criteria
   * @param {Object} criteria - Search criteria
   * @param {string} selectClause - Fields to select (default: '*')
   * @param {Object} options - Query options (orderBy, limit, offset)
   * @returns {Promise<Array>} Array of matching records
   */
  async findWhere(criteria, selectClause = '*', options = {}) {
    return handleAsyncOperation(async () => {
      let query = this.supabase
        .from(this.tableName)
        .select(selectClause);

      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply options
      if (options.orderBy) {
        const { column, ascending = true } = options.orderBy;
        query = query.order(column, { ascending });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
      }

      return executeQuery(query, `find ${this.tableName} records`);
    }, `find ${this.tableName} records`);
  }

  /**
   * Find first record matching criteria
   * @param {Object} criteria - Search criteria
   * @param {string} selectClause - Fields to select (default: '*')
   * @returns {Promise<Object|null>} First matching record or null
   */
  async findFirst(criteria, selectClause = '*') {
    const results = await this.findWhere(criteria, selectClause, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update record by ID
   * @param {string} id - Record ID
   * @param {Object} updates - Data to update
   * @param {string} selectClause - Fields to select in response (default: '*')
   * @returns {Promise<Object>} Updated record
   * @throws {NotFoundError} If record not found
   */
  async updateById(id, updates, selectClause = '*') {
    validateUUID(id, `${this.tableName} ID`);
    
    return handleAsyncOperation(async () => {
      const data = await executeQuery(
        this.supabase
          .from(this.tableName)
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select(selectClause)
          .single(),
        `update ${this.tableName} by ID`
      );
      
      if (!data) {
        throw new NotFoundError(`${this.tableName} record`);
      }
      
      return data;
    }, `update ${this.tableName}`);
  }

  /**
   * Update records matching criteria
   * @param {Object} criteria - Update criteria
   * @param {Object} updates - Data to update
   * @param {string} selectClause - Fields to select in response (default: '*')
   * @returns {Promise<Array>} Updated records
   */
  async updateWhere(criteria, updates, selectClause = '*') {
    return handleAsyncOperation(async () => {
      let query = this.supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        });

      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      return executeQuery(
        query.select(selectClause),
        `update ${this.tableName} records`
      );
    }, `update ${this.tableName} records`);
  }

  /**
   * Delete record by ID
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If record not found
   */
  async deleteById(id) {
    validateUUID(id, `${this.tableName} ID`);
    
    return handleAsyncOperation(async () => {
      const { count } = await this.supabase
        .from(this.tableName)
        .delete({ count: 'exact' })
        .eq('id', id);
      
      if (count === 0) {
        throw new NotFoundError(`${this.tableName} record`);
      }
    }, `delete ${this.tableName}`);
  }

  /**
   * Delete records matching criteria
   * @param {Object} criteria - Delete criteria
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteWhere(criteria) {
    return handleAsyncOperation(async () => {
      let query = this.supabase
        .from(this.tableName)
        .delete({ count: 'exact' });

      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count } = await query;
      return count || 0;
    }, `delete ${this.tableName} records`);
  }

  /**
   * Count records matching criteria
   * @param {Object} criteria - Count criteria
   * @returns {Promise<number>} Number of matching records
   */
  async count(criteria = {}) {
    return handleAsyncOperation(async () => {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count } = await query;
      return count || 0;
    }, `count ${this.tableName} records`);
  }

  /**
   * Check if record exists by ID
   * @param {string} id - Record ID
   * @returns {Promise<boolean>} True if record exists
   */
  async exists(id) {
    try {
      await this.findById(id, 'id');
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Execute a custom query with the model's supabase client
   * @param {Function} queryBuilder - Function that builds the query
   * @param {string} operation - Description of the operation
   * @returns {Promise<any>} Query result
   */
  async executeCustomQuery(queryBuilder, operation) {
    return handleAsyncOperation(async () => {
      const query = queryBuilder(this.supabase);
      return executeQuery(query, operation);
    }, operation);
  }

  /**
   * Get paginated results
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Pagination and query options
   * @returns {Promise<Object>} Paginated results with metadata
   */
  async paginate(criteria = {}, options = {}) {
    const { 
      limit = 20, 
      offset = 0, 
      selectClause = '*',
      orderBy = { column: 'created_at', ascending: false }
    } = options;

    return handleAsyncOperation(async () => {
      // Get total count
      const totalCount = await this.count(criteria);

      // Get paginated data
      const data = await this.findWhere(criteria, selectClause, {
        orderBy,
        limit,
        offset
      });

      return {
        data,
        pagination: {
          total: totalCount,
          limit,
          offset,
          has_more: offset + limit < totalCount,
          page: Math.floor(offset / limit) + 1,
          total_pages: Math.ceil(totalCount / limit)
        }
      };
    }, `paginate ${this.tableName} records`);
  }
}

export default BaseModel;
