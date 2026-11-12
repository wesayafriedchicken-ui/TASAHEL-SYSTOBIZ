import { Request, Response } from "express";
import { Pool, PoolClient } from "pg";

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Extracts pagination parameters from query string with safe defaults and ceilings.
 */
export function getPaginationParams(req: Request, options: PaginationOptions = {}) {
  const defaultLimit = options.defaultLimit || 50;
  const maxLimit = options.maxLimit || 100;

  let page = parseInt(req.query.page as string, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(req.query.limit as string, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const offset = (page - 1) * limit;
  // If client explicitly sent ?paginate=true or ?page=X or ?limit=X
  const isExplicitPaginated = req.query.page !== undefined || req.query.limit !== undefined || req.query.paginate === 'true';

  return { page, limit, offset, isExplicitPaginated };
}

/**
 * Executes a paginated SQL query using COUNT(*) and LIMIT/OFFSET
 */
export async function executePaginatedQuery<T = any>(
  db: Pool | PoolClient,
  countQuery: { sql: string; params: any[] },
  dataQuery: { sql: string; params: any[] },
  pagination: { page: number; limit: number; offset: number }
): Promise<PaginationResult<T>> {
  const { page, limit, offset } = pagination;

  // Execute Count & Data queries in parallel
  const [countResult, dataResult] = await Promise.all([
    db.query(countQuery.sql, countQuery.params),
    db.query(
      `${dataQuery.sql} LIMIT $${dataQuery.params.length + 1} OFFSET $${dataQuery.params.length + 2}`,
      [...dataQuery.params, limit, offset]
    )
  ]);

  const total = parseInt(countResult.rows[0]?.count || countResult.rows[0]?.total || '0', 10);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

/**
 * Formats response: attaches standard headers and sends either array or { data, pagination }
 */
export function sendPaginatedResponse<T>(
  req: Request,
  res: Response,
  result: PaginationResult<T>
) {
  res.setHeader('X-Total-Count', result.pagination.total.toString());
  res.setHeader('X-Page', result.pagination.page.toString());
  res.setHeader('X-Per-Page', result.pagination.limit.toString());
  res.setHeader('X-Total-Pages', result.pagination.totalPages.toString());

  // If explicit pagination requested via ?page= or ?limit= or ?paginate=true or Accept: application/json+paginated
  const isExplicit = req.query.page !== undefined || req.query.limit !== undefined || req.query.paginate === 'true';
  
  if (isExplicit) {
    return res.json(result);
  }

  // To preserve full backward compatibility with components expecting raw array, return array while headers provide pagination metadata
  return res.json(result.data);
}
