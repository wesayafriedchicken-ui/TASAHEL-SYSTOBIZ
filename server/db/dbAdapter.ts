import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const { Pool: PgPool } = pg;

export type DbDialect = 'postgres' | 'mysql';

export function detectDbDialect(): DbDialect {
  const explicit = (process.env.DB_TYPE || process.env.DB_DIALECT || '').toLowerCase().trim();
  if (explicit === 'mysql' || explicit === 'mariadb') return 'mysql';
  if (explicit === 'postgres' || explicit === 'postgresql' || explicit === 'supabase') return 'postgres';

  const dbUrl = (process.env.DATABASE_URL || '').toLowerCase().trim();
  if (dbUrl.startsWith('mysql://') || dbUrl.startsWith('mysql2://') || dbUrl.startsWith('mariadb://')) {
    return 'mysql';
  }

  // Prioritize explicit MySQL / DB host vars over a fallback/stale postgres DATABASE_URL
  if (
    process.env.MYSQL_HOST ||
    process.env.MYSQL_DATABASE ||
    (process.env.DB_HOST && (process.env.DB_DATABASE || process.env.DB_NAME))
  ) {
    return 'mysql';
  }

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    return 'postgres';
  }

  return 'postgres';
}

export const dbType: DbDialect = detectDbDialect();
export const isMysql = dbType === 'mysql';
export const isPostgres = dbType === 'postgres';

export function getDbType(): DbDialect {
  return dbType;
}

export interface UnifiedQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: any[];
  command?: string;
  oid?: number;
  insertId?: number;
}

export interface UnifiedDbClient {
  query: (text: string | pg.QueryConfig, params?: any[]) => Promise<UnifiedQueryResult>;
  release: (err?: Error | boolean) => void;
}

export interface UnifiedDbPool {
  query: (text: string | pg.QueryConfig, params?: any[]) => Promise<UnifiedQueryResult>;
  connect: () => Promise<UnifiedDbClient>;
  on: (event: string, listener: (...args: any[]) => void) => any;
  end: () => Promise<void>;
}

// Track live database availability
export let isDatabaseAvailable = Boolean(
  process.env.DATABASE_URL ||
  (isMysql && (
    process.env.MYSQL_HOST ||
    process.env.MYSQL_DATABASE ||
    process.env.DB_HOST ||
    process.env.DB_DATABASE ||
    process.env.DB_NAME
  ))
);

export let lastDbError: string | null = null;

export function setDatabaseAvailable(val: boolean) {
  isDatabaseAvailable = val;
}

export function getDatabaseAvailable(): boolean {
  return isDatabaseAvailable;
}

export function setLastDbError(err: string | null) {
  lastDbError = err;
}

export function getLastDbError(): string | null {
  return lastDbError;
}

// ============================================================================
// POSTGRESQL / SUPABASE URL SANITIZER & POOL
// ============================================================================
function getSanitizedPgUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || rawUrl.includes('mtzbvvotrffnylwsujra')) {
    rawUrl =
      process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('mtzbvvotrffnylwsujra')
        ? process.env.DATABASE_URL
        : 'postgresql://postgres.dpqpwqcmhcczwfvrkpot:Esraa%40131096@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  }
  try {
    let processedUrl = rawUrl;
    const protocolMatch = processedUrl.match(/^(postgres(?:ql)?:\/\/)(.*)$/);
    if (protocolMatch) {
      const rest = protocolMatch[2];
      const lastAtIndex = rest.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const authPart = rest.substring(0, lastAtIndex);
        const hostPart = rest.substring(lastAtIndex + 1);
        const firstColonIndex = authPart.indexOf(':');
        if (firstColonIndex !== -1) {
          const user = authPart.substring(0, firstColonIndex);
          const rawPassword = authPart.substring(firstColonIndex + 1);
          processedUrl = `${protocolMatch[1]}${encodeURIComponent(user)}:${encodeURIComponent(decodeURIComponent(rawPassword))}@${hostPart}`;
        }
      }
    }

    const parsed = new URL(processedUrl);
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('ssl');
    return parsed.toString();
  } catch (_e) {
    return rawUrl.replace(/[?&]sslmode=[^&]+/g, '').replace(/[?&]ssl=[^&]+/g, '');
  }
}

// ============================================================================
// MYSQL CONFIGURATION & SQL DIALECT TRANSLATOR
// ============================================================================
function buildMysqlPoolConfig(): mysql.PoolOptions {
  const parsedPoolMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10;
  const connectionLimit = isNaN(parsedPoolMax) || parsedPoolMax < 1 ? 10 : parsedPoolMax;

  const baseOpts: mysql.PoolOptions = {
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    connectTimeout: 30000,
    decimalNumbers: true,
    charset: 'utf8mb4',
    multipleStatements: false,
    typeCast: (field, next) => {
      // Convert TINYINT(1) (MySQL BOOLEAN) into native JS true/false to match PostgreSQL pg behavior
      if (field.type === 'TINY' && field.length === 1) {
        const val = field.string();
        if (val === null) return null;
        return val === '1' || val.toLowerCase() === 'true';
      }
      return next();
    },
  };

  const dbUrl = (process.env.DATABASE_URL || '').trim();
  if (dbUrl && (dbUrl.startsWith('mysql://') || dbUrl.startsWith('mysql2://') || dbUrl.startsWith('mariadb://'))) {
    try {
      const normalized = dbUrl.replace(/^mysql2:\/\//i, 'mysql://').replace(/^mariadb:\/\//i, 'mysql://');
      const parsed = new URL(normalized);
      baseOpts.host = parsed.hostname || 'localhost';
      baseOpts.port = parsed.port ? parseInt(parsed.port, 10) : 3306;
      baseOpts.user = decodeURIComponent(parsed.username || 'root');
      baseOpts.password = decodeURIComponent(parsed.password || '');
      baseOpts.database = parsed.pathname.replace(/^\//, '') || process.env.MYSQL_DATABASE || 'systo_biz';
      const sslParam = parsed.searchParams.get('ssl') || parsed.searchParams.get('sslmode');
      if (sslParam === 'true' || sslParam === 'require' || process.env.MYSQL_SSL === 'true') {
        baseOpts.ssl = { rejectUnauthorized: false };
      }
      return baseOpts;
    } catch (_e) {
      // Fall through to individual env vars
    }
  }

  baseOpts.host = process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
  baseOpts.port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10) || 3306;
  baseOpts.user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  baseOpts.password = process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? '';
  baseOpts.database = process.env.MYSQL_DATABASE || process.env.DB_DATABASE || process.env.DB_NAME || 'systo_biz';
  if (process.env.MYSQL_SSL === 'true') {
    baseOpts.ssl = { rejectUnauthorized: false };
  }
  return baseOpts;
}

/**
 * Splits a SQL query into tokens, separating single-quoted string literals from SQL code
 * so dialect transformations never corrupt string data.
 */
function transformSqlOutsideStrings(sql: string, transformFn: (codeChunk: string) => string): string {
  const parts: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];
    if (inSingleQuote) {
      current += ch;
      if (ch === '\\' && i + 1 < sql.length) {
        current += sql[i + 1];
        i += 2;
        continue;
      }
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          current += "'";
          i += 2;
          continue;
        }
        inSingleQuote = false;
        parts.push(current);
        current = '';
      }
      i++;
    } else {
      if (ch === "'") {
        if (current) {
          parts.push(transformFn(current));
          current = '';
        }
        inSingleQuote = true;
        current = "'";
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }

  if (current) {
    parts.push(inSingleQuote ? current : transformFn(current));
  }

  return parts.join('');
}

/**
 * Extracts a trailing RETURNING clause outside string literals.
 */
function extractReturningClause(sql: string): { sqlWithoutReturning: string; returningCols: string | null } {
  let inSingleQuote = false;
  let parenDepth = 0;
  let lastReturningIdx = -1;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (inSingleQuote) {
      if (ch === '\\' && i + 1 < sql.length) {
        i++;
        continue;
      }
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          i++;
          continue;
        }
        inSingleQuote = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }
    if (ch === '(') parenDepth++;
    else if (ch === ')' && parenDepth > 0) parenDepth--;
    else if (parenDepth === 0) {
      const slice = sql.slice(i);
      if (/^RETURNING\b/i.test(slice) && (i === 0 || /\s/.test(sql[i - 1]))) {
        lastReturningIdx = i;
      }
    }
  }

  if (lastReturningIdx === -1) {
    return { sqlWithoutReturning: sql, returningCols: null };
  }

  const before = sql.slice(0, lastReturningIdx).trim().replace(/;+$/, '');
  const after = sql.slice(lastReturningIdx + 'RETURNING'.length).trim().replace(/;+$/, '');
  return {
    sqlWithoutReturning: before,
    returningCols: after || '*',
  };
}

/**
 * Translates a PostgreSQL query + $1,$2... positional params into a MySQL query + ? params array.
 */
export function translatePgToMysql(
  rawSql: string,
  rawParams: any[] = []
): { sql: string; params: any[]; returningCols: string | null; skip?: boolean } {
  let sql = rawSql.trim();

  // Check if PG-only DDL / admin statement that should be skipped gracefully on MySQL
  const upperStart = sql.toUpperCase();
  if (
    upperStart.startsWith('CREATE EXTENSION') ||
    upperStart.startsWith('GRANT ') ||
    upperStart.startsWith('REVOKE ') ||
    upperStart.startsWith('CREATE POLICY') ||
    upperStart.startsWith('DROP POLICY') ||
    upperStart.startsWith('DO $$') ||
    upperStart.startsWith('SELECT SETVAL(') ||
    /ALTER\s+TABLE\s+.*\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sql)
  ) {
    return { sql: 'SELECT 1', params: [], returningCols: null, skip: true };
  }

  // Handle to_regclass('public.users')
  if (/SELECT\s+to_regclass\s*\(\s*'([^']+)'\s*\)/i.test(sql)) {
    const match = sql.match(/SELECT\s+to_regclass\s*\(\s*'([^']+)'\s*\)(?:\s+as\s+([a-zA-Z0-9_]+))?/i);
    if (match) {
      const tbl = match[1].replace(/^public\./i, '');
      const alias = match[2] || 'tbl_exists';
      return {
        sql: `SELECT TABLE_NAME AS ${alias} FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
        params: [tbl],
        returningCols: null,
      };
    }
  }

  // Extract RETURNING clause if present
  const { sqlWithoutReturning, returningCols } = extractReturningClause(sql);
  sql = sqlWithoutReturning;

  // Handle JSON operators outside/with string literals before splitting
  // Convert: col->0->>'key' => JSON_UNQUOTE(JSON_EXTRACT(col, '$[0].key'))
  sql = sql.replace(
    /([a-zA-Z0-9_.]+)->(\d+)->>'([a-zA-Z0-9_]+)'/g,
    "JSON_UNQUOTE(JSON_EXTRACT($1, '$[$2].$3'))"
  );
  // Convert: col->>'key' => JSON_UNQUOTE(JSON_EXTRACT(col, '$.key'))
  sql = sql.replace(
    /([a-zA-Z0-9_.]+)->>'([a-zA-Z0-9_]+)'/g,
    "JSON_UNQUOTE(JSON_EXTRACT($1, '$.$2'))"
  );
  // Convert: col->'key' => JSON_EXTRACT(col, '$.key')
  sql = sql.replace(
    /([a-zA-Z0-9_.]+)->'([a-zA-Z0-9_]+)'/g,
    "JSON_EXTRACT($1, '$.$2')"
  );
  // Convert: details->>$1 => JSON_UNQUOTE(JSON_EXTRACT(details, CONCAT('$.', $1)))
  sql = sql.replace(
    /([a-zA-Z0-9_.]+)->>(\$\d+)/g,
    "JSON_UNQUOTE(JSON_EXTRACT($1, CONCAT('$.', $2)))"
  );

  // Convert INTERVAL 'N unit(s)' => INTERVAL N UNIT
  sql = sql.replace(
    /\bINTERVAL\s+'(\d+)\s+(second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)'/gi,
    (_m, num, unit) => {
      const singular = unit.toUpperCase().replace(/S$/, '');
      return `INTERVAL ${num} ${singular}`;
    }
  );

  // Convert ORDER BY ... NULLS LAST / NULLS FIRST
  sql = sql.replace(
    /([a-zA-Z0-9_.]+)\s+(ASC|DESC)\s+NULLS\s+LAST/gi,
    '($1 IS NULL) ASC, $1 $2'
  );
  sql = sql.replace(
    /([a-zA-Z0-9_.]+)\s+NULLS\s+LAST/gi,
    '($1 IS NULL) ASC, $1 ASC'
  );
  sql = sql.replace(
    /([a-zA-Z0-9_.]+)\s+(ASC|DESC)\s+NULLS\s+FIRST/gi,
    '($1 IS NULL) DESC, $1 $2'
  );
  sql = sql.replace(
    /([a-zA-Z0-9_.]+)\s+NULLS\s+FIRST/gi,
    '($1 IS NULL) DESC, $1 ASC'
  );

  // Transform code chunks safely without modifying quoted strings
  sql = transformSqlOutsideStrings(sql, (chunk) => {
    let out = chunk;

    // Strip public. schema prefix
    out = out.replace(/\bpublic\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g, '$1');

    // ILIKE -> LIKE (MySQL utf8mb4_unicode_ci is case-insensitive)
    out = out.replace(/\bILIKE\b/gi, 'LIKE');

    // EXTRACT(DOW FROM expr) -> (DAYOFWEEK(expr) - 1)
    out = out.replace(/\bEXTRACT\s*\(\s*DOW\s+FROM\s+([^)]+)\)/gi, (_m, expr) => {
      const cleanExpr = expr.replace(/::[a-zA-Z0-9_\s\[\]]+/g, '').trim();
      return `(DAYOFWEEK(${cleanExpr}) - 1)`;
    });

    // SUBSTRING(expr FROM a FOR b) -> SUBSTRING(expr, a, b)
    out = out.replace(
      /\bSUBSTRING\s*\(([^()]+?)\s+FROM\s+(\d+)\s+FOR\s+(\d+)\)/gi,
      (_m, expr, start, len) => {
        const cleanExpr = expr.replace(/::[a-zA-Z0-9_\s\[\]]+/g, '').trim();
        return `SUBSTRING(${cleanExpr}, ${start}, ${len})`;
      }
    );

    // Strip PostgreSQL ::type casts (handle ::date specifically when helpful, or strip casts)
    out = out.replace(/::date\b/gi, '');
    out = out.replace(/::timestamp(?:\s+with(?:out)?\s+time\s+zone)?\b/gi, '');
    out = out.replace(/::timestamptz\b/gi, '');
    out = out.replace(/::(?:jsonb|json|text|varchar|integer|int|bigint|smallint|numeric|real|double\s+precision|float|boolean|bool)(?:\[\])?/gi, '');

    // STRING_AGG(col, sep) -> GROUP_CONCAT(col SEPARATOR sep)
    out = out.replace(/\bSTRING_AGG\s*\(/gi, 'GROUP_CONCAT(');

    // CAST(... AS TEXT) -> CAST(... AS CHAR)
    out = out.replace(/\bAS\s+TEXT\b/gi, 'AS CHAR');

    // information_schema.columns: ensure table_schema = DATABASE() so we only read current MySQL schema
    if (
      /information_schema\.columns/i.test(out) &&
      !/table_schema/i.test(out) &&
      /WHERE\s+/i.test(out)
    ) {
      out = out.replace(/WHERE\s+/i, 'WHERE table_schema = DATABASE() AND ');
    }

    // Wrap reserved MySQL identifier names when used standalone in specific tables
    // (e.g. key in _systo_schema_meta / qa_integration_settings)
    out = out.replace(/\b(SELECT|WHERE|AND|ORDER BY|SET)\s+key\b/gi, '$1 `key`');
    out = out.replace(/\(\s*key\s*,/gi, '(`key`,');

    return out;
  });

  // Handle ON CONFLICT (...) DO NOTHING -> INSERT IGNORE INTO ...
  if (/\bON\s+CONFLICT\b[^;]*\bDO\s+NOTHING\b/i.test(sql)) {
    sql = sql.replace(/\bINSERT\s+INTO\b/i, 'INSERT IGNORE INTO');
    sql = sql.replace(/\s*\bON\s+CONFLICT\b(?:\s*\([^)]*\))?\s*\bDO\s+NOTHING\b/gi, '');
  }

  // Handle ON CONFLICT (...) DO UPDATE SET ... -> ON DUPLICATE KEY UPDATE ...
  if (/\bON\s+CONFLICT\b[^;]*\bDO\s+UPDATE\s+SET\b/i.test(sql)) {
    sql = sql.replace(
      /\bON\s+CONFLICT\s*\([^)]*\)\s*DO\s+UPDATE\s+SET\b/gi,
      'ON DUPLICATE KEY UPDATE'
    );
    sql = sql.replace(/\bEXCLUDED\.([a-zA-Z0-9_]+)\b/gi, 'VALUES($1)');
  }

  // Quote MySQL 8.0 reserved column identifiers (`lines`, `lead`) when used standalone
  sql = transformSqlOutsideStrings(sql, (chunk) =>
    chunk
      .replace(/(^|[,\s(=])lines(?=$|[,\s)=])/gi, '$1`lines`')
      .replace(/(^|[,\s(=])lead(?=$|[,\s)=])/gi, '$1`lead`')
  );

  // Handle col = ANY($N) or ANY($N::int[]) and replace all $1, $2, ... with ?
  const finalParams: any[] = [];
  const normalizeParam = (val: any): any => {
    if (val === undefined) return null;
    if (val !== null && typeof val === 'object' && !(val instanceof Date) && !Buffer.isBuffer(val)) {
      return JSON.stringify(val);
    }
    return val;
  };

  sql = transformSqlOutsideStrings(sql, (chunk) => {
    return chunk.replace(
      /([a-zA-Z0-9_.`]+)\s*=\s*ANY\s*\(\s*\$(\d+)\s*\)|\$(\d+)\b/gi,
      (match, colExpr, anyIdxStr, scalarIdxStr) => {
        if (anyIdxStr !== undefined) {
          const idx = parseInt(anyIdxStr, 10) - 1;
          const arrVal = rawParams[idx];
          if (Array.isArray(arrVal)) {
            if (arrVal.length === 0) {
              return '1 = 0';
            }
            const placeholders = arrVal.map((item) => {
              finalParams.push(normalizeParam(item));
              return '?';
            });
            return `${colExpr} IN (${placeholders.join(', ')})`;
          }
          finalParams.push(normalizeParam(arrVal));
          return `${colExpr} = ?`;
        }
        const idx = parseInt(scalarIdxStr, 10) - 1;
        finalParams.push(normalizeParam(rawParams[idx]));
        return '?';
      }
    );
  });

  // Also translate returningCols casts/prefixes if any
  let cleanReturning = returningCols;
  if (cleanReturning) {
    cleanReturning = cleanReturning
      .replace(/::[a-zA-Z0-9_\s\[\]]+/g, '')
      .replace(/\bpublic\./gi, '');
  }

  return { sql, params: finalParams, returningCols: cleanReturning };
}

/**
 * Normalizes JS values inside MySQL query result rows so column access matches PostgreSQL behavior.
 */
function normalizeMysqlRows(rows: any[]): any[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const normalized: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[k] = v;
    }
    if ('COLUMN_NAME' in normalized && !('column_name' in normalized)) {
      normalized.column_name = normalized.COLUMN_NAME;
    }
    if ('TABLE_NAME' in normalized && !('table_name' in normalized)) {
      normalized.table_name = normalized.TABLE_NAME;
    }
    if ('DATA_TYPE' in normalized && !('data_type' in normalized)) {
      normalized.data_type = normalized.DATA_TYPE;
    }
    return normalized;
  });
}

/**
 * Executes a PostgreSQL-compatible query against a MySQL pool or connection,
 * automatically supporting RETURNING *, ON CONFLICT, $N placeholders, and transactions.
 */
async function executeMysqlQuery(
  executor: mysql.Pool | mysql.PoolConnection,
  rawText: string | pg.QueryConfig,
  rawParams: any[] = []
): Promise<UnifiedQueryResult> {
  const sqlText = typeof rawText === 'string' ? rawText : rawText.text;
  const inputParams = typeof rawText === 'string' ? rawParams : rawText.values || [];

  const trimmed = sqlText.trim();
  const upper = trimmed.toUpperCase();

  // Transaction control mapping for PoolConnection
  if (upper === 'BEGIN' || upper === 'BEGIN TRANSACTION' || upper === 'START TRANSACTION') {
    if ('beginTransaction' in executor && typeof executor.beginTransaction === 'function') {
      await executor.beginTransaction();
    } else {
      await executor.query('START TRANSACTION');
    }
    return { rows: [], rowCount: 0, command: 'BEGIN' };
  }
  if (upper === 'COMMIT') {
    if ('commit' in executor && typeof executor.commit === 'function') {
      await executor.commit();
    } else {
      await executor.query('COMMIT');
    }
    return { rows: [], rowCount: 0, command: 'COMMIT' };
  }
  if (upper === 'ROLLBACK') {
    if ('rollback' in executor && typeof executor.rollback === 'function') {
      await executor.rollback();
    } else {
      await executor.query('ROLLBACK');
    }
    return { rows: [], rowCount: 0, command: 'ROLLBACK' };
  }

  const { sql, params, returningCols, skip } = translatePgToMysql(sqlText, inputParams);
  if (skip) {
    return { rows: [], rowCount: 0, command: 'SELECT' };
  }

  // Auto-generate UUID for legacy UUID-keyed tables when inserted without explicit id on MySQL
  let workingSql = sql;
  let workingParams = [...params];
  let injectedUuid: string | null = null;

  const insertMatch = workingSql.match(/^\s*INSERT\s+(?:IGNORE\s+)?INTO\s+([a-zA-Z0-9_.`]+)\s*\(([^)]+)\)/i);
  if (insertMatch) {
    const tblClean = insertMatch[1].replace(/[`]/g, '').toLowerCase();
    const colsRaw = insertMatch[2];
    const hasIdCol = colsRaw.split(',').some((c) => c.trim().replace(/[`]/g, '').toLowerCase() === 'id');
    if ((tblClean === 'ai_business_sessions' || tblClean === 'ai_boardroom_meetings') && !hasIdCol) {
      injectedUuid = crypto.randomUUID();
      workingSql = workingSql.replace(
        /^\s*(INSERT\s+(?:IGNORE\s+)?INTO\s+[a-zA-Z0-9_.`]+\s*\()([^)]+)(\)\s*VALUES\s*\()/i,
        `$1id, $2$3?, `
      );
      workingParams.unshift(injectedUuid);
    }
  }

  // Handle UPDATE ... RETURNING or DELETE ... RETURNING
  if (returningCols) {
    const updateMatch = workingSql.match(/^\s*UPDATE\s+([a-zA-Z0-9_.`]+)\s+SET\s+[\s\S]+?\s+WHERE\s+([\s\S]+)$/i);
    const deleteMatch = workingSql.match(/^\s*DELETE\s+FROM\s+([a-zA-Z0-9_.`]+)\s+WHERE\s+([\s\S]+)$/i);

    if (deleteMatch) {
      const targetTable = deleteMatch[1];
      const whereClause = deleteMatch[2];
      // Count how many `?` are in whereClause (which are all the params)
      const [preRows] = await executor.query<mysql.RowDataPacket[]>(
        `SELECT ${returningCols} FROM ${targetTable} WHERE ${whereClause}`,
        workingParams
      );
      const [delResult] = await executor.query<mysql.ResultSetHeader>(workingSql, workingParams);
      return {
        rows: normalizeMysqlRows(preRows),
        rowCount: delResult.affectedRows ?? preRows.length,
        command: 'DELETE',
      };
    }

    if (updateMatch) {
      const targetTable = updateMatch[1];
      const whereClause = updateMatch[2];
      // Extract params belonging to WHERE clause (last N `?` in WHERE clause)
      const whereParamCount = (whereClause.match(/\?/g) || []).length;
      const whereParams = whereParamCount > 0 ? workingParams.slice(-whereParamCount) : [];

      let targetIds: any[] = [];
      let capturedById = false;
      try {
        const [idRows] = await executor.query<mysql.RowDataPacket[]>(
          `SELECT id FROM ${targetTable} WHERE ${whereClause}`,
          whereParams
        );
        targetIds = idRows.map((r) => r.id).filter((id) => id !== undefined && id !== null);
        capturedById = targetIds.length > 0;
      } catch (_noIdCol) {
        capturedById = false;
      }

      const [updResult] = await executor.query<mysql.ResultSetHeader>(workingSql, workingParams);

      let postRows: mysql.RowDataPacket[] = [];
      if (capturedById) {
        const idPlaceholders = targetIds.map(() => '?').join(', ');
        const [fetched] = await executor.query<mysql.RowDataPacket[]>(
          `SELECT ${returningCols} FROM ${targetTable} WHERE id IN (${idPlaceholders})`,
          targetIds
        );
        postRows = fetched;
      } else if (updResult.affectedRows > 0) {
        try {
          const [fetched] = await executor.query<mysql.RowDataPacket[]>(
            `SELECT ${returningCols} FROM ${targetTable} WHERE ${whereClause}`,
            whereParams
          );
          postRows = fetched;
        } catch (_err) {
          postRows = [];
        }
      }

      return {
        rows: normalizeMysqlRows(postRows),
        rowCount: updResult.affectedRows ?? postRows.length,
        command: 'UPDATE',
      };
    }
  }

  // Standard SELECT or INSERT / UPDATE / DELETE
  const [result] = await executor.query<any>(workingSql, workingParams);

  // Case 1: SELECT / SHOW / DESCRIBE returns an array of RowDataPacket
  if (Array.isArray(result)) {
    return {
      rows: normalizeMysqlRows(result),
      rowCount: result.length,
      command: 'SELECT',
    };
  }

  // Case 2: OkPacket / ResultSetHeader from INSERT / UPDATE / DELETE
  const header = result as mysql.ResultSetHeader;
  const affectedRows = header?.affectedRows ?? 0;
  const insertId = header?.insertId ?? 0;

  if (returningCols && insertMatch) {
    const targetTable = insertMatch[1];
    let fetchedRows: mysql.RowDataPacket[] = [];

    if (injectedUuid) {
      const [rows] = await executor.query<mysql.RowDataPacket[]>(
        `SELECT ${returningCols} FROM ${targetTable} WHERE id = ? LIMIT 1`,
        [injectedUuid]
      );
      fetchedRows = rows;
    } else if (insertId > 0) {
      const [rows] = await executor.query<mysql.RowDataPacket[]>(
        `SELECT ${returningCols} FROM ${targetTable} WHERE id = ? LIMIT 1`,
        [insertId]
      );
      fetchedRows = rows;
    } else {
      // Check if explicit `id` or `key` or `email` was in INSERT column list
      const colsList = insertMatch[2].split(',').map((c) => c.trim().replace(/[`]/g, '').toLowerCase());
      const lookupCol = colsList.find((c) => c === 'id' || c === 'key' || c === 'email' || c === 'module_id');
      if (lookupCol) {
        const colIdx = colsList.indexOf(lookupCol);
        const lookupVal = workingParams[colIdx];
        if (lookupVal !== undefined && lookupVal !== null) {
          const colIdent = lookupCol === 'key' ? '`key`' : lookupCol;
          const [rows] = await executor.query<mysql.RowDataPacket[]>(
            `SELECT ${returningCols} FROM ${targetTable} WHERE ${colIdent} = ? ORDER BY created_at DESC LIMIT 1`,
            [lookupVal]
          ).catch(async () => {
            const [r2] = await executor.query<mysql.RowDataPacket[]>(
              `SELECT ${returningCols} FROM ${targetTable} WHERE ${colIdent} = ? LIMIT 1`,
              [lookupVal]
            );
            return [r2] as any;
          });
          fetchedRows = rows;
        }
      }
    }

    return {
      rows: normalizeMysqlRows(fetchedRows),
      rowCount: affectedRows || fetchedRows.length,
      insertId,
      command: 'INSERT',
    };
  }

  return {
    rows: [],
    rowCount: affectedRows,
    insertId,
    command: upper.startsWith('INSERT') ? 'INSERT' : upper.startsWith('UPDATE') ? 'UPDATE' : 'DELETE',
  };
}

// ============================================================================
// BUILD UNIFIED POOL (POSTGRESQL OR MYSQL)
// ============================================================================
function createUnifiedPool(): UnifiedDbPool {
  if (dbType === 'mysql') {
    const mysqlConfig = buildMysqlPoolConfig();
    console.log(`🐬 Active DB Dialect: MySQL (${mysqlConfig.user}@${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database})`);
    const mysqlPool = mysql.createPool(mysqlConfig);

    // Ensure session sql_mode supports PIPES_AS_CONCAT gently without producing leading commas
    mysqlPool.on('connection', (conn) => {
      conn.query(
        "SET SESSION sql_mode = IF(FIND_IN_SET('PIPES_AS_CONCAT', @@sql_mode) > 0, @@sql_mode, CONCAT_WS(',', NULLIF(@@sql_mode, ''), 'PIPES_AS_CONCAT'))",
        () => {}
      );
    });

    const wrappedPool: UnifiedDbPool = {
      query: async (text: string | pg.QueryConfig, params?: any[]): Promise<UnifiedQueryResult> => {
        if (!isMysqlConfigured()) {
          lastDbError = 'MySQL environment variables are not configured';
          return { rows: [], rowCount: 0, command: 'SELECT' };
        }
        try {
          const res = await executeMysqlQuery(mysqlPool, text, params || []);
          isDatabaseAvailable = true;
          lastDbError = null;
          return res;
        } catch (err: any) {
          const errCode = err?.code;
          const errMsg = err?.message || '';
          if (
            errCode === 'ECONNREFUSED' ||
            errCode === 'ENOTFOUND' ||
            errCode === 'ETIMEDOUT' ||
            errCode === 'PROTOCOL_CONNECTION_LOST' ||
            errCode === 'ER_ACCESS_DENIED_ERROR' ||
            errCode === 'ER_BAD_DB_ERROR'
          ) {
            isDatabaseAvailable = false;
            lastDbError = `${errCode}: ${errMsg}`;
            console.warn(`⚠️ MySQL connection issue (${errCode || errMsg}) — returning empty fallback.`);
            return { rows: [], rowCount: 0, command: 'SELECT' };
          }
          const qPreview = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim().substring(0, 150) : 'config-object';
          console.error(`❌ MySQL Query Error: [${errCode || 'ERR'}] ${errMsg} (Query: ${qPreview})`);
          throw err;
        }
      },
      connect: async (): Promise<UnifiedDbClient> => {
        const conn = await mysqlPool.getConnection();
        return {
          query: async (text: string | pg.QueryConfig, params?: any[]) => {
            return executeMysqlQuery(conn, text, params || []);
          },
          release: () => {
            try {
              conn.release();
            } catch (_e) {}
          },
        };
      },
      on: (event: string, listener: (...args: any[]) => void) => {
        return (mysqlPool as any).on(event, listener);
      },
      end: async () => {
        await mysqlPool.end();
      },
    };

    // Heartbeat keep-alive
    setInterval(async () => {
      try {
        if (isDatabaseAvailable) {
          await mysqlPool.query('SELECT 1');
        }
      } catch (_e) {}
    }, 4 * 60 * 1000).unref();

    return wrappedPool;
  }

  // Default: PostgreSQL / Supabase Pool
  const connectionString = getSanitizedPgUrl(process.env.DATABASE_URL);
  const parsedPoolMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10;
  const maxPoolConnections = isNaN(parsedPoolMax) || parsedPoolMax < 1 ? 10 : parsedPoolMax;

  const pgPool = new PgPool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 30000,
    max: maxPoolConnections,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: false,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  const originalQuery = pgPool.query.bind(pgPool);
  (pgPool as any).query = async (text: string | pg.QueryConfig, params?: any[]) => {
    if (!process.env.DATABASE_URL) {
      return { rows: [], rowCount: 0, fields: [], command: 'SELECT', oid: 0 };
    }

    let attempt = 0;
    const maxRetries = 4;

    while (true) {
      try {
        const res = await originalQuery(text as any, params as any);
        isDatabaseAvailable = true;
        return res;
      } catch (err: any) {
        attempt++;
        const errMsg = err?.message || '';
        const errCode = err?.code;

        const isTransientError =
          errMsg.includes('timeout exceeded') ||
          errMsg.includes('Query read timeout') ||
          errMsg.includes('ECHECKOUTTIMEOUT') ||
          errMsg.includes('unable to check out connection') ||
          errMsg.includes('authentication did not complete') ||
          errMsg.includes('Failed to connect to database') ||
          errMsg.includes('Connection terminated') ||
          errMsg.includes('Connection closed') ||
          errMsg.includes('client has already been released') ||
          errMsg.includes('remaining connection slots are reserved') ||
          errMsg.includes('too many clients') ||
          errMsg.includes('econnrefused') ||
          errCode === 'ECONNRESET' ||
          errCode === 'ECONNREFUSED' ||
          errCode === 'ETIMEDOUT' ||
          errCode === '57P01' ||
          errCode === 'XX000' ||
          errCode === '08006' ||
          errCode === '08001' ||
          errCode === '08004' ||
          errCode === '53300';

        if (isTransientError && attempt <= maxRetries) {
          const delay = Math.floor(500 * Math.pow(1.9, attempt - 1) + Math.random() * 300);
          console.warn(`⚠️ Transient DB issue (${errMsg || errCode}). Retrying (${attempt}/${maxRetries}) in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (
          errCode === 'ENOTFOUND' ||
          errCode === 'ECONNREFUSED' ||
          errCode === '57P01' ||
          errCode === '28P01' ||
          errCode === '08006' ||
          errCode === '08001' ||
          errCode === '08004' ||
          errMsg.includes('timeout') ||
          errMsg.includes('ECHECKOUTTIMEOUT') ||
          errMsg.includes('Failed to connect to database') ||
          errMsg.includes('authentication did not complete') ||
          errMsg.includes('econnrefused')
        ) {
          isDatabaseAvailable = false;
          console.warn(`⚠️ Database connection lost or unreachable (${errCode || errMsg}) — returning empty fallback.`);
          return { rows: [], rowCount: 0, fields: [], command: 'SELECT', oid: 0 };
        } else if (errCode === '23505') {
          console.warn(`⚠️ Unique constraint violation (${err.detail || errMsg})`);
        } else {
          const qPreview = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim().substring(0, 150) : 'config-object';
          console.error(`❌ Database Query Error: [${errCode || 'ERR'}] ${errMsg} (Query: ${qPreview})`);
        }
        throw err;
      }
    }
  };

  // Heartbeat keep-alive for Supabase cold sleep prevention
  setInterval(async () => {
    try {
      if (isDatabaseAvailable) {
        await originalQuery('SELECT 1');
      }
    } catch (_pingErr) {}
  }, 4 * 60 * 1000).unref();

  pgPool.on('error', (err: any) => {
    console.error('Unexpected error on idle database client', err);
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === '28P01') {
      isDatabaseAvailable = false;
    }
  });

  return pgPool as unknown as UnifiedDbPool;
}

export function isMysqlConfigured(): boolean {
  const dbUrl = (process.env.DATABASE_URL || '').trim().toLowerCase();
  return Boolean(
    dbUrl.startsWith('mysql://') ||
    dbUrl.startsWith('mysql2://') ||
    dbUrl.startsWith('mariadb://') ||
    process.env.MYSQL_HOST ||
    process.env.MYSQL_DATABASE ||
    process.env.DB_HOST ||
    process.env.DB_DATABASE ||
    process.env.DB_NAME
  );
}

export const pool: UnifiedDbPool = createUnifiedPool();
