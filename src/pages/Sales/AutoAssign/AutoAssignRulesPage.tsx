import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  RefreshCw, 
  History, 
  Sliders, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Briefcase,
  AlertCircle,
  Sparkles,
  Layers,
  Cpu
} from 'lucide-react';
import { useSalesContext, AutoAssignRule } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const AutoAssignRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    autoAssignRules, 
    setAutoAssignRules, 
    saveAutoAssignRule, 
    deleteAutoAssignRule, 
    runAutoAssignmentEngine, 
    users, 
    deals, 
    stages, 
    routingLogs, 
    showToast 
  } = useSalesContext();

  // Active subtab derived from pathname
  const isRulesView = location.pathname.includes('/rules');
  const isRoundRobinView = location.pathname.includes('/round-robin');

  // Form State for "Add / Edit Assignment Rule"
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(() => {
    return users.length > 0 ? [users[0].id] : [1];
  });
  const [triggerType, setTriggerType] = useState<'always' | 'on_create'>('always');
  const [stageId, setStageId] = useState<string>('any');
  const [serviceFilters, setServiceFilters] = useState<string[]>(['All Services and Products']);
  const [customServiceInput, setCustomServiceInput] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState<number>(5);

  // Engine execution state
  const [isExecuting, setIsExecuting] = useState(false);

  // Workload map per rep (active won/open deals assigned)
  const repWorkloads = useMemo(() => {
    const map: Record<number, number> = {};
    deals.forEach(d => {
      if (d.assigned_to) {
        map[d.assigned_to] = (map[d.assigned_to] || 0) + 1;
      }
    });
    return map;
  }, [deals]);

  // Handle Multi-select Reps in Form
  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        if (prev.length === 1) {
          showToast('At least one sales representative must be selected.', 'info');
          return prev;
        }
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle Services / Products Filter
  const handleToggleAllServices = () => {
    if (serviceFilters.includes('All Services and Products')) {
      setServiceFilters([]);
    } else {
      setServiceFilters(['All Services and Products']);
    }
  };

  const handleAddCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (!trimmed) return;
    if (serviceFilters.includes(trimmed)) {
      setCustomServiceInput('');
      return;
    }
    // Remove "All Services and Products" default if adding a specific keyword
    const updated = serviceFilters.filter(s => s !== 'All Services and Products');
    setServiceFilters([...updated, trimmed]);
    setCustomServiceInput('');
  };

  const handleRemoveServiceTag = (tag: string) => {
    const updated = serviceFilters.filter(s => s !== tag);
    if (updated.length === 0) {
      setServiceFilters(['All Services and Products']);
    } else {
      setServiceFilters(updated);
    }
  };

  // Start Editing Rule
  const handleStartEdit = (rule: AutoAssignRule) => {
    setEditingRuleId(rule.id);
    setSelectedUserIds(rule.userIds && rule.userIds.length > 0 ? rule.userIds : [users[0]?.id || 1]);
    setTriggerType(rule.triggerType || 'always');
    setStageId(rule.stageId || 'any');
    setServiceFilters(rule.serviceFilters && rule.serviceFilters.length > 0 ? rule.serviceFilters : ['All Services and Products']);
    setMaxCapacity(rule.maxCapacity || 5);

    // Smooth scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setSelectedUserIds(users.length > 0 ? [users[0].id] : [1]);
    setTriggerType('always');
    setStageId('any');
    setServiceFilters(['All Services and Products']);
    setMaxCapacity(5);
  };

  // Save / Add Rule
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      showToast('Please select at least one sales representative.', 'error');
      return;
    }

    const newRule: AutoAssignRule = {
      id: editingRuleId || `rule-${Date.now()}`,
      userIds: selectedUserIds,
      triggerType,
      stageId,
      serviceFilters: serviceFilters.length > 0 ? serviceFilters : ['All Services and Products'],
      maxCapacity: Math.max(1, Number(maxCapacity) || 5),
      isActive: true
    };

    saveAutoAssignRule(newRule);
    showToast(editingRuleId ? 'Assignment rule updated successfully.' : 'New assignment rule created.', 'success');
    handleCancelEdit();
  };

  // Toggle Rule Active State
  const handleToggleRuleActive = (rule: AutoAssignRule) => {
    const updated: AutoAssignRule = {
      ...rule,
      isActive: !rule.isActive
    };
    saveAutoAssignRule(updated);
  };

  // Run Engine Now
  const handleRunEngine = async () => {
    setIsExecuting(true);
    try {
      const assignedCount = await runAutoAssignmentEngine();
      if (assignedCount > 0) {
        showToast(`Successfully routed and distributed ${assignedCount} opportunities!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error occurred while executing distribution engine.', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales/auto-assign/round-robin')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              isRoundRobinView
                ? "bg-indigo-600 text-white shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Round-Robin & Strategy Hub</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/auto-assign/rules')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              isRulesView || (!isRoundRobinView && !location.pathname.includes('/logs'))
                ? "bg-indigo-600 text-white shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Assignment Rules Matrix ({autoAssignRules.length})</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/auto-assign/logs')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Routing Logs ({routingLogs.length})</span>
          </button>
        </div>

        <button
          type="button"
          disabled={isExecuting}
          onClick={handleRunEngine}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
        >
          {isExecuting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Running Engine...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Engine Now</span>
            </>
          )}
        </button>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: RULES TABLE & ENGINE LOGS (7 of 12 cols) ================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Current Auto-Assign Rules */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Current Auto-Assign Rules
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-100">
                Rules Control Panel
              </span>
            </div>

            {/* Rules Table */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3.5">Assigned Reps</th>
                      <th className="py-3 px-3">Trigger Type</th>
                      <th className="py-3 px-3">Stage & Match</th>
                      <th className="py-3 px-3">Targeted Services</th>
                      <th className="py-3 px-3">Workload / Capacity</th>
                      <th className="py-3 px-3 text-center">Active?</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {autoAssignRules.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                          No assignment rules created yet. Use the form on the right to configure your first rule.
                        </td>
                      </tr>
                    ) : (
                      autoAssignRules.map((rule) => {
                        const assignedUsers = users.filter(u => rule.userIds?.includes(u.id));
                        const stageMatch = rule.stageId === 'any' || !rule.stageId
                          ? 'All Stages' 
                          : stages.find(s => String(s.id) === String(rule.stageId))?.name || `Stage #${rule.stageId}`;
                        
                        const primaryRep = assignedUsers[0] || { id: 1, name: 'System Admin' };
                        const repLoad = repWorkloads[primaryRep.id] || 0;

                        return (
                          <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Assigned Reps */}
                            <td className="py-3.5 px-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {assignedUsers.length > 0 ? (
                                  assignedUsers.map(u => (
                                    <span 
                                      key={u.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                      {u.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-800 font-bold text-xs">System Admin</span>
                                )}
                              </div>
                            </td>

                            {/* Trigger Type */}
                            <td className="py-3.5 px-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                {rule.triggerType === 'on_create' ? 'On Create' : 'Always'}
                              </span>
                            </td>

                            {/* Stage & Match */}
                            <td className="py-3.5 px-3 text-slate-600 font-semibold">
                              {stageMatch}
                            </td>

                            {/* Targeted Services */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                {rule.serviceFilters?.map((serv, idx) => (
                                  <span 
                                    key={idx} 
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700"
                                  >
                                    {serv === 'any' ? 'All Services' : serv}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Workload / Capacity */}
                            <td className="py-3.5 px-3">
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-700 text-[11px] font-bold">
                                <span className="text-slate-500 truncate max-w-[90px]">{primaryRep.name}</span>
                                <span className="font-mono font-black text-slate-900">{repLoad} / {rule.maxCapacity}</span>
                              </div>
                            </td>

                            {/* Active? Toggle Switch */}
                            <td className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleRuleActive(rule)}
                                className={cn(
                                  "w-10 h-5 rounded-full transition-colors relative inline-flex items-center px-0.5 cursor-pointer",
                                  rule.isActive ? "bg-emerald-500" : "bg-slate-300"
                                )}
                              >
                                <span 
                                  className={cn(
                                    "w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs",
                                    rule.isActive ? "translate-x-5" : "translate-x-0"
                                  )} 
                                />
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  title="Edit Rule"
                                  onClick={() => handleStartEdit(rule)}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete Rule"
                                  onClick={() => deleteAutoAssignRule(rule.id)}
                                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Card 2: Recent Auto-Assign Engine Logs */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900">
                Recent Auto-Assign Engine Logs
              </h2>

              <button
                type="button"
                onClick={() => navigate('/sales/auto-assign/logs')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                Engine Logs
              </button>
            </div>

            {/* Empty State / Live Logs */}
            {routingLogs.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <p className="text-xs italic text-slate-400 font-medium">
                  Click &ldquo;Run Engine Now&rdquo; to view the live distribution log here.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Opportunity Title</th>
                      <th className="py-2.5 px-3">Assigned Rep</th>
                      <th className="py-2.5 px-3">Rule Used</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routingLogs.slice(0, 5).map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{log.dealTitle}</td>
                        <td className="py-2.5 px-3 font-semibold text-indigo-600">{log.assignedUserName}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium">{log.ruleId}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black border",
                            log.status === 'success' 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {log.status === 'success' ? 'Success' : 'Skipped'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: ADD / EDIT RULE FORM (5 of 12 cols) ================= */}
        <div className="lg:col-span-5">
          <form 
            onSubmit={handleSaveRule} 
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5"
          >
            {/* Form Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingRuleId ? 'Edit Assignment Rule' : 'Add New Assignment Rule'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                    Set conditions under which this sales rep receives their deals
                  </p>
                </div>
              </div>

              {editingRuleId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Field 1: Assigned Sales Reps (Multi-select list) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Assigned Sales Representatives (Multi-select)
              </label>
              <div className="border border-slate-200 rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-50">
                {users.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-medium">
                    Loading sales team representatives...
                  </div>
                ) : (
                  users.map((u, idx) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUserSelection(u.id)}
                        className={cn(
                          "px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors pt-2",
                          isSelected 
                            ? "bg-indigo-50/70 border border-indigo-200/60 text-slate-900 font-bold" 
                            : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                            isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                          )}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-semibold">{u.name}</span>
                        </div>

                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Sales #{idx + 1}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Field 2: Distribution Trigger / Timing */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                When to distribute? (Execution timing)
              </label>
              <div className="relative">
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none appearance-none cursor-pointer pr-9"
                >
                  <option value="always">When Engine Runs & Always</option>
                  <option value="on_create">On Opportunity Creation</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Field 3: Deal Stage */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Which sales stage?
              </label>
              <div className="relative">
                <select
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none appearance-none cursor-pointer pr-9"
                >
                  <option value="any">Any Stage (Any Stage)</option>
                  {stages.map(s => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Field 4: Targeted Services / Products Filter (Multi-select) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Targeted Services / Products (Multi-select)
              </label>

              {/* Default button */}
              <button
                type="button"
                onClick={handleToggleAllServices}
                className={cn(
                  "w-full py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer",
                  serviceFilters.includes('All Services and Products')
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                <span>All Services and Products</span>
                <span className="text-[10px] font-bold text-emerald-600">
                  {serviceFilters.includes('All Services and Products') ? '✓ Default Active' : 'Select Default'}
                </span>
              </button>

              {/* Custom Keyword Input */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Or type custom service keywords and press Add:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g., Software, Cloud, Consulting..."
                    value={customServiceInput}
                    onChange={(e) => setCustomServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomService();
                      }
                    }}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomService}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Active Tags Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {serviceFilters.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceTag(tag)}
                      className="hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Field 5: Maximum Active Capacity */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Maximum Active Capacity (Active deals limit per rep)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none"
              />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed pt-0.5">
                Prevents routing additional deals to the rep once their active deal count reaches or exceeds this limit.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{editingRuleId ? 'Update Rule' : 'Add Rule'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
