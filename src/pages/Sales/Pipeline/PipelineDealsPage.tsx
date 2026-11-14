import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Kanban, 
  List, 
  Plus, 
  Sliders, 
  Search, 
  Filter, 
  ChevronRight, 
  User as UserIcon, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  MoreVertical
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const PipelineDealsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    deals, 
    stages, 
    customers, 
    users, 
    formatCurrency, 
    updateDealStage 
  } = useSalesContext();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = !searchQuery || 
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deal.service_type && deal.service_type.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRep = selectedRep === 'all' || String(deal.assigned_to) === selectedRep;
      const matchesStage = selectedStage === 'all' || String(deal.stage_id) === selectedStage;

      return matchesSearch && matchesRep && matchesStage;
    });
  }, [deals, searchQuery, selectedRep, selectedStage]);

  // Stage sorted by order_index
  const sortedStages = useMemo(() => {
    return [...stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }, [stages]);

  const totalValue = filteredDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deals by title or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Rep filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Sales Reps</option>
              {users.map(u => (
                <option key={u.id} value={String(u.id)}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'kanban' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'table' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
              title="Table List"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => navigate('/sales/pipeline/deals/Configure')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configure Stages</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/pipeline/deals/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Deal</span>
          </button>
        </div>
      </div>

      {/* Summary Tag */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing <strong className="text-slate-900">{filteredDeals.length}</strong> deals</span>
        <span>Filtered Pipeline: <strong className="text-slate-900 font-black">{formatCurrency(totalValue)}</strong></span>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[600px] scrollbar-thin">
          {sortedStages.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage_id === stage.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

            return (
              <div 
                key={stage.id} 
                className="w-72 sm:w-80 shrink-0 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-col max-h-[750px] shadow-2xs"
              >
                {/* Stage Column Header */}
                <div className="p-3.5 border-b border-slate-200/80 bg-white/70 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color || '#6366f1' }}
                    />
                    <h3 className="text-xs font-black text-slate-900 truncate">
                      {stage.name}
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-slate-700">
                    {formatCurrency(stageTotal)}
                  </span>
                </div>

                {/* Stage Deals List */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl">
                      No deals in this stage
                    </div>
                  ) : (
                    stageDeals.map(deal => {
                      const customer = customers.find(c => c.id === deal.customer_id);
                      const rep = users.find(u => u.id === deal.assigned_to);

                      return (
                        <div
                          key={deal.id}
                          onClick={() => navigate(`/sales/pipeline/deals/${deal.id}`)}
                          className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group space-y-2.5"
                        >
                          {/* Deal Header */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {deal.title}
                            </h4>
                            <span className="text-xs font-black text-slate-900 shrink-0">
                              {formatCurrency(deal.value)}
                            </span>
                          </div>

                          {/* Customer info */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">
                              {customer?.name || 'No Customer Assigned'}
                            </span>
                          </div>

                          {/* Footer: Rep & Stage changer */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[9px]">
                                {rep?.name?.charAt(0) || '?'}
                              </div>
                              <span className="text-slate-600 truncate max-w-[90px] text-[10px] font-medium">
                                {rep?.name || 'Unassigned'}
                              </span>
                            </div>

                            {/* Move stage quick select */}
                            <select
                              value={deal.stage_id}
                              onClick={(e) => e.stopPropagation()}
                              onChange={async (e) => {
                                e.stopPropagation();
                                await updateDealStage(deal.id, Number(e.target.value));
                              }}
                              className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 text-slate-700 cursor-pointer outline-none"
                            >
                              {sortedStages.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE LIST VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Deal Title</th>
                  <th className="py-3 px-4">Client / Account</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Sales Owner</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No deals matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map(deal => {
                    const customer = customers.find(c => c.id === deal.customer_id);
                    const stage = stages.find(s => s.id === deal.stage_id);
                    const rep = users.find(u => u.id === deal.assigned_to);

                    return (
                      <tr 
                        key={deal.id}
                        onClick={() => navigate(`/sales/pipeline/deals/${deal.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {deal.title}
                          </div>
                          <div className="text-[11px] text-slate-400">{deal.service_type || 'General'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {customer?.name || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block"
                            style={{ 
                              backgroundColor: `${stage?.color || '#4f46e5'}15`,
                              color: stage?.color || '#4f46e5',
                              borderColor: `${stage?.color || '#4f46e5'}30`
                            }}
                          >
                            {stage?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {rep?.name || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/sales/pipeline/deals/${deal.id}`);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
