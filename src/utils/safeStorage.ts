/**
 * safeStorage - Browser localStorage manager with automated quota eviction.
 * Prevents QuotaExceededError crashes when caching heavy datasets (e.g., admin logs, cache trees).
 */

const NON_CRITICAL_CACHE_KEYS = [
  'cached_admin_data',
  'business_core_audit_logs',
  'business_core_users',
  'systo_biz_tour_completed_steps',
  'core_strategic_okrs',
  'core_strategic_swot',
  'core_strategic_competitors',
  'core_strategic_milestones',
  'acct_bank_movements',
  'acct_journal',
  'acct_invoices',
  'acct_bills'
];

export function purgeNonEssentialStorage(): void {
  try {
    for (const key of NON_CRITICAL_CACHE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    }
  } catch (_) {}
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    const isQuotaError = 
      error?.name === 'QuotaExceededError' || 
      error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
      error?.code === 22 || 
      error?.code === 1014;

    if (isQuotaError) {
      console.warn(`[SafeStorage] LocalStorage quota reached while writing '${key}'. Cleaning up caches...`);
      purgeNonEssentialStorage();

      // Retry after purging non-critical keys
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        // If still failing and key is 'user', compress the permissions payload
        if (key === 'user') {
          try {
            const parsed = JSON.parse(value);
            // Keep essential auth fields, trim redundant alias duplicates
            if (parsed && parsed.permissions) {
              const slimPerms: Record<string, any> = {};
              for (const [modKey, modVal] of Object.entries(parsed.permissions)) {
                // Skip lowercase duplicates and raw URL encoded duplicates
                if (modKey === modKey.toLowerCase() && modKey !== 'hr' && modKey !== 'qa') continue;
                if (modKey.includes('%20') || modKey.includes('%2F')) continue;
                slimPerms[modKey] = modVal;
              }
              parsed.permissions = slimPerms;
              localStorage.setItem(key, JSON.stringify(parsed));
              return true;
            }
          } catch (_) {}
        }

        // If key is 'cached_admin_data', strip heavy fields (large base64 avatars, long text)
        if (key === 'cached_admin_data') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed.users)) {
              parsed.users = parsed.users.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role_id: u.role_id,
                company_id: u.company_id,
                status: u.status,
                department_id: u.department_id,
              }));
            }
            delete parsed.auditLogs;
            delete parsed.audit_logs;
            delete parsed.history;
            const slimmed = JSON.stringify(parsed);
            localStorage.setItem(key, slimmed);
            return true;
          } catch (_) {
            // Also try sessionStorage as a fallback
            try {
              sessionStorage.setItem(key, value);
              return true;
            } catch (_) {}
          }
        }

        console.warn(`[SafeStorage] Notice: Skipped non-critical cache '${key}' due to browser quota limits.`);
      }
    }
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
    return sessionStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}
