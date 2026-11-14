import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface MigrationStatus {
  module: string;
  count: number;
  status: 'idle' | 'migrating' | 'completed' | 'error';
  message?: string;
}

export const DataMigration: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [statuses, setStatuses] = useState<MigrationStatus[]>([
    { module: 'Departments', count: 0, status: 'idle' },
    { module: 'Users', count: 0, status: 'idle' },
    { module: 'SOPs', count: 0, status: 'idle' },
    { module: 'Categories', count: 0, status: 'idle' },
    { module: 'Knowledge Base', count: 0, status: 'idle' },
    { module: 'CRM Deals', count: 0, status: 'idle' },
    { module: 'CRM Customers', count: 0, status: 'idle' },
    { module: 'Tasks', count: 0, status: 'idle' },
    { module: 'Risks', count: 0, status: 'idle' },
    { module: 'Continuous Improvement', count: 0, status: 'idle' },
    { module: 'KPIs', count: 0, status: 'idle' },
    { module: 'Automation Rules', count: 0, status: 'idle' },
    { module: 'RACI Assignments', count: 0, status: 'idle' },
    { module: 'QA Evaluations', count: 0, status: 'idle' }
  ]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Check if there is anything to migrate
    const hasData = [
      'business_core_sops',
      'business_core_kb_categories',
      'business_core_kb',
      'business_core_crm_deals',
      'business_core_crm_customers',
      'business_core_departments',
      'business_core_users',
      'business_core_tasks',
      'business_core_risks',
      'business_core_kaizen',
      'business_core_kpis',
      'business_core_automation_rules',
      'business_core_raci',
      'business_core_qa'
    ].some(key => {
      const data = localStorage.getItem(key);
      if (!data) return false;
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch (e) {
        return false;
      }
    });

    // Check if migration was already done
    const isMigrated = localStorage.getItem('business_core_migrated') === 'true';

    if (hasData && !isMigrated) {
      setIsOpen(true);
    }
  }, []);

  const migrateItem = async (module: string, endpoint: string, storageKey: string, checkField?: string) => {
    const localData = localStorage.getItem(storageKey);
    if (!localData) return;

    let items = [];
    try {
      items = JSON.parse(localData);
    } catch (e) {
      console.error(`Failed to parse ${module} data`, e);
      return;
    }
    
    if (!Array.isArray(items) || items.length === 0) return;

    setStatuses(prev => prev.map(s => s.module === module ? { ...s, status: 'migrating', count: items.length } : s));

    // Get existing data to skip duplicates
    let existingItems: any[] = [];
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        existingItems = await res.json();
      }
    } catch (err) {
      console.warn(`Failed to fetch existing ${module} to check for duplicates`, err);
    }

    let successCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      try {
        // Skip if already exists by title or email
        if (checkField && existingItems.some(existing => 
          String(existing[checkField]).toLowerCase() === String(item[checkField]).toLowerCase()
        )) {
          skippedCount++;
          continue;
        }

        const { id, ...payload } = item;
        
        // Special case: Deals need a valid customer_id. 
        // If we don't have a map, this might fail. 
        // But we try to push anyway as requested.
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) successCount++;
      } catch (err) {
        console.error(`Migration error for ${module}:`, err);
      }
    }

    setStatuses(prev => prev.map(s => s.module === module ? { 
      ...s, 
      status: (successCount + skippedCount) >= items.length ? 'completed' : 'error',
      message: `Migrated: ${successCount}, Skipped: ${skippedCount}, Total: ${items.length}`
    } : s));
  };

  const startMigration = async () => {
    // 1. Core structural data first
    await migrateItem('Departments', '/api/admin/departments', 'business_core_departments', 'name');
    await migrateItem('Users', '/api/admin/users', 'business_core_users', 'email');
    
    // 2. Categories second
    await migrateItem('Categories', '/api/kb/categories', 'business_core_kb_categories', 'name');
    
    // 3. CRM Customers (needed for Deals)
    await migrateItem('CRM Customers', '/api/crm/customers', 'business_core_crm_customers', 'email');

    // 4. Everything else in parallel/sequence
    await Promise.all([
      migrateItem('SOPs', '/api/sops', 'business_core_sops', 'title'),
      migrateItem('Knowledge Base', '/api/kb', 'business_core_kb', 'title'),
      migrateItem('CRM Deals', '/api/crm/deals', 'business_core_crm_deals', 'title'),
      migrateItem('Tasks', '/api/tasks', 'business_core_tasks', 'title'),
      migrateItem('Risks', '/api/risks', 'business_core_risks', 'name'),
      migrateItem('Continuous Improvement', '/api/kaizen', 'business_core_kaizen', 'title'),
      migrateItem('KPIs', '/api/kpis', 'business_core_kpis', 'name'),
      migrateItem('Automation Rules', '/api/automation/rules', 'business_core_automation_rules', 'name'),
      migrateItem('RACI Assignments', '/api/raci', 'business_core_raci', 'sop_id'),
      migrateItem('QA Evaluations', '/api/qa', 'business_core_qa', 'comments')
    ]);

    setIsFinished(true);
    localStorage.setItem('business_core_migrated', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Database Migration</h3>
            <p className="text-sm text-slate-500">Move your offline data to the cloud</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-600">
            We've detected data in your local browser storage. To ensure better collaboration and performance, we'll migrate it to our new cloud database.
          </p>

          <div className="space-y-2">
            {statuses.map(status => (
              <div key={status.module} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    status.status === 'completed' ? "bg-emerald-500" :
                    status.status === 'migrating' ? "bg-amber-500 animate-pulse" :
                    status.status === 'error' ? "bg-rose-500" : "bg-slate-300"
                  )} />
                  <span className="font-medium text-slate-700">{status.module}</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.status === 'migrating' && <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />}
                  {status.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {status.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span className="text-xs text-slate-500">
                    {status.status === 'idle' ? 'Pending' : status.message || (status.status === 'migrating' ? 'Syncing...' : 'Done')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          {!isFinished ? (
            <>
              <button 
                onClick={() => {
                  localStorage.setItem('business_core_migrated', 'true');
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Skip & Use Cloud Only
              </button>
              <button 
                onClick={startMigration}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                Start Migration
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all"
            >
              Finish & Refresh
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
