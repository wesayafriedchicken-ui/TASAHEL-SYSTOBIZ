import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  User,
  BookOpen,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Trash2,
  Edit3,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../../lib/utils';

import KaizenModule from '../Kaizen/KaizenModule';
import DeleteConfirmation from '../Common/DeleteConfirmation';

interface Risk {
  id: number;
  name: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  risk_score: number;
  mitigation_plan: string;
  contingency_plan: string;
  owner_id: number;
  owner_name?: string;
  sop_id?: number;
  sop_title?: string;
  department_id?: number;
  department_name?: string;
  kpi_id?: number;
  kpi_name?: string;
  status: 'Open' | 'Mitigated' | 'Closed';
  created_at: string;
}

export default function RiskManagement({ globalStatuses = [] }: { globalStatuses?: any[] }) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [sops, setSops] = useState<{ id: number; title: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [kpis, setKpis] = useState<{ id: number; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const riskStatuses = globalStatuses.filter(s => s.module_id === 'risk');
  const defaultStatus = riskStatuses.find(s => s.is_default)?.status_key || 'Open';

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchRisks = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId || '1'
      };
      
      const res = await fetch('/api/risks', { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRisks(data);
        localStorage.setItem('business_core_risks', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to fetch risks');
    }
  }, []);

  const fetchSOPs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId || '1'
      };
      const res = await fetch('/api/sops', { headers });
      if (res.ok) {
        const data = await res.json();
        setSops(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch SOPs');
    }
  }, []);

  const fetchKPIs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId || '1'
      };
      const res = await fetch('/api/kpis', { headers });
      if (res.ok) {
        const data = await res.json();
        setKpis(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch KPIs');
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId || '1'
      };
      const res = await fetch('/api/departments', { headers });
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  }, []);

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`/api/risks/${showDeleteConfirm}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId || '1'
        }
      });
      if (res.ok) {
        setShowDeleteConfirm(null);
        fetchRisks();
        if (selectedRisk?.id === showDeleteConfirm) setSelectedRisk(null);
      }
    } catch (err) {
      console.error('Failed to delete risk');
    }
  };

  useEffect(() => {
    fetchRisks();
    fetchSOPs();
    fetchKPIs();
    fetchDepartments();
  }, [fetchRisks, fetchSOPs, fetchKPIs, fetchDepartments]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('The Business Core - Risk Register', 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = risks.map(r => [
      r.name,
      r.category,
      r.probability,
      r.impact,
      r.risk_score,
      r.status,
      r.owner_name || 'N/A'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Risk Name', 'Category', 'Prob', 'Impact', 'Score', 'Status', 'Owner']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    // Detailed sections for each risk
    let currentY = (doc as any).lastAutoTable.finalY + 20;
    
    risks.forEach((risk, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${risk.name}`, 14, currentY);
      currentY += 7;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Category: ${risk.category} | Score: ${risk.risk_score}`, 14, currentY);
      currentY += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Mitigation Plan:', 14, currentY);
      currentY += 5;
      doc.setFont('helvetica', 'normal');
      const mitLines = doc.splitTextToSize(risk.mitigation_plan || 'No plan defined', 180);
      doc.text(mitLines, 14, currentY);
      currentY += (mitLines.length * 5) + 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Contingency Plan:', 14, currentY);
      currentY += 5;
      doc.setFont('helvetica', 'normal');
      const conLines = doc.splitTextToSize(risk.contingency_plan || 'No plan defined', 180);
      doc.text(conLines, 14, currentY);
      currentY += (conLines.length * 5) + 15;
    });

    doc.save('Business_Core_Risk_Register.pdf');
  };

  const getRiskColor = (score: number) => {
    if (score >= 15) return 'text-red-600 bg-red-50 border-red-100';
    if (score >= 8) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  const getHeatmapColor = (p: number, i: number) => {
    const score = p * i;
    if (score >= 15) return 'bg-red-500';
    if (score >= 8) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const filteredRisks = risks.filter(r => 
    (filterCategory === 'All' || r.category === filterCategory) &&
    ((r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Risk Management</h2>
          <p className="text-slate-500 font-medium">Identify, assess, and mitigate operational threats.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Identify Risk
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Matrix (Heatmap) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Risk Matrix (5x5)</h3>
            <div className="aspect-square grid grid-cols-5 grid-rows-5 gap-1">
              {[5, 4, 3, 2, 1].map(impact => (
                [1, 2, 3, 4, 5].map(prob => {
                  const risksInCell = risks.filter(r => r.probability === prob && r.impact === impact);
                  return (
                    <div 
                      key={`${prob}-${impact}`}
                      className={cn(
                        "relative flex items-center justify-center rounded-sm transition-all hover:scale-105 cursor-help",
                        getHeatmapColor(prob, impact),
                        "opacity-80 hover:opacity-100"
                      )}
                      title={`Prob: ${prob}, Impact: ${impact}`}
                    >
                      {risksInCell.length > 0 && (
                        <span className="text-[10px] font-bold text-white bg-black/20 w-5 h-5 flex items-center justify-center rounded-full">
                          {risksInCell.length}
                        </span>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
            <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <span>Low Probability</span>
              <span>High Probability</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Critical Risks</p>
              <p className="text-2xl font-bold text-red-700">{risks.filter(r => r.risk_score >= 15).length}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Mitigated</p>
              <p className="text-2xl font-bold text-emerald-700">{risks.filter(r => r.status === 'Mitigated').length}</p>
            </div>
          </div>
        </div>

        {/* Risk Register List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search risk register..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Operational">Operational</option>
                  <option value="Legal">Legal</option>
                  <option value="Financial">Financial</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRisks.map(risk => (
                    <tr 
                      key={risk.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedRisk(risk)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", risk.risk_score >= 15 ? "bg-red-500" : risk.risk_score >= 8 ? "bg-amber-500" : "bg-emerald-500")} />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{risk.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{risk.owner_name || 'Unassigned'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg uppercase tracking-wider">
                          {risk.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold", getRiskColor(risk.risk_score))}>
                          {risk.risk_score}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                          risk.status === 'Mitigated' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {risk.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedRisk(risk); }}
                            className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(risk.id); }}
                            className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-rose-400"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Detail Modal */}
      <AnimatePresence>
        {selectedRisk && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", selectedRisk.risk_score >= 15 ? "bg-red-500" : "bg-amber-500")}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedRisk.name}</h3>
                    <p className="text-slate-500 font-medium">Risk Score: {selectedRisk.risk_score} ({selectedRisk.category})</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRisk(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <Plus className="w-6 h-6 text-slate-400 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Description</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedRisk.description}</p>
                </section>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Probability</p>
                    <p className="text-lg font-bold text-slate-900">{selectedRisk.probability} / 5</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Impact</p>
                    <p className="text-lg font-bold text-slate-900">{selectedRisk.impact} / 5</p>
                  </div>
                </div>

                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Mitigation Plan</h4>
                  <div className="prose prose-slate prose-sm max-w-none bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
                    <Markdown>{selectedRisk.mitigation_plan || '*No plan defined*'}</Markdown>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-amber-600 uppercase tracking-widest border-b border-amber-100 pb-2">Contingency Plan</h4>
                  <div className="prose prose-slate prose-sm max-w-none bg-amber-50/30 p-4 rounded-2xl border border-amber-100">
                    <Markdown>{selectedRisk.contingency_plan || '*No plan defined*'}</Markdown>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Mitigation Tasks</h4>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 uppercase"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Risk
                      </button>
                      <button 
                        onClick={async () => {
                          const title = prompt('Enter task title:');
                          if (!title) return;
                          const token = localStorage.getItem('token');
                          const res = await fetch('/api/tasks', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json', 
                              'Authorization': `Bearer ${token}`,
                              'x-user-id': currentUser.id?.toString() || '1' 
                            },
                            body: JSON.stringify({
                              title,
                              description: `Mitigation task for risk: ${selectedRisk.name}`,
                              status: 'pending',
                              priority: 'high',
                              module_id: 'risk',
                              related_id: selectedRisk.id,
                              assigned_to: selectedRisk.owner_id
                            })
                          });
                          if (res.ok) alert('Task created in Tasks module!');
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase"
                      >
                        <Plus className="w-3 h-3" /> Add Task
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">View and manage all mitigation actions in the Tasks module.</p>
                </section>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <LayoutGrid className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Department</p>
                      <p className="text-sm font-bold text-indigo-900">{(selectedRisk as any).department_name || 'Global'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Owner</p>
                      <p className="text-sm font-bold text-slate-900">{selectedRisk.owner_name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <BookOpen className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Related SOP</p>
                      <p className="text-sm font-bold text-slate-900">{selectedRisk.sop_title || 'None'}</p>
                    </div>
                  </div>
                  {(selectedRisk as any).kpi_name && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100 col-span-2">
                      <TrendingUp className="w-5 h-5 text-rose-400" />
                      <div>
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Monitored KPI</p>
                        <p className="text-sm font-bold text-rose-900">{(selectedRisk as any).kpi_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={async () => {
                    if (!selectedRisk) return;
                    const token = localStorage.getItem('token');
                    await fetch('/api/kaizen/suggestions', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        title: `Improvement: ${selectedRisk.name}`,
                        problem_description: `Risk identified: ${selectedRisk.description}`,
                        proposed_solution: selectedRisk.mitigation_plan,
                        expected_benefit: "Permanent risk mitigation and process improvement",
                        submitted_by: currentUser.id,
                        sop_id: selectedRisk.sop_id
                      })
                    });
                    alert('Risk converted to Kaizen suggestion!');
                  }}
                  className="px-6 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  Convert to Kaizen
                </button>
                <button className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900">Archive Risk</button>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg transition-all">
                  Mark as Mitigated
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Risk Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Risk' : 'Identify New Risk'}</h3>
              <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Plus className="w-6 h-6 text-slate-400 rotate-45" />
              </button>
            </div>
            <form className="flex-1 overflow-y-auto p-8 space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('user_id');
                const url = isEditing ? `/api/risks/${selectedRisk?.id}` : '/api/risks';
                const method = isEditing ? 'PUT' : 'POST';

                const res = await fetch(url, {
                  method,
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId || '1'
                  },
                  body: JSON.stringify({
                    ...data,
                    probability: Number(data.probability),
                    impact: Number(data.impact),
                    sop_id: data.sop_id ? Number(data.sop_id) : null,
                    department_id: data.department_id ? Number(data.department_id) : null,
                    kpi_id: data.kpi_id ? Number(data.kpi_id) : null,
                    owner_id: currentUser?.id || 1
                  })
                });

                if (!res.ok) {
                  throw new Error(`Server error: ${res.status}`);
                }

                setIsCreating(false);
                setIsEditing(false);
                fetchRisks();
                if (isEditing) {
                  const updated = await res.json();
                  setSelectedRisk(updated);
                }
              } catch (err) {
                console.error("Risk Sync Error:", err);
                alert(err instanceof Error ? err.message : "Failed to sync risk");
              }
            }}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Risk Name</label>
                <input name="name" required type="text" defaultValue={isEditing ? selectedRisk?.name : ''} placeholder="e.g. Visa Processing Delay" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Department</label>
                  <select name="department_id" defaultValue={isEditing ? selectedRisk?.department_id : ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select name="category" defaultValue={isEditing ? selectedRisk?.category : 'Operational'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option>Operational</option>
                    <option>Legal</option>
                    <option>Financial</option>
                    <option>Technical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Related SOP (Optional)</label>
                  <select name="sop_id" defaultValue={isEditing ? selectedRisk?.sop_id : ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">None</option>
                    {sops.map(sop => (
                      <option key={sop.id} value={sop.id}>{sop.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Linked KPI (Performance Tracking)</label>
                  <select name="kpi_id" defaultValue={isEditing ? (selectedRisk as any)?.kpi_id : ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">No Active Link</option>
                    {kpis.map(kpi => (
                      <option key={kpi.id} value={kpi.id}>{kpi.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Status</label>
                <select name="status" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" defaultValue={isEditing ? selectedRisk?.status : defaultStatus}>
                  <option value="Open">Open</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea name="description" rows={3} defaultValue={isEditing ? selectedRisk?.description : ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Probability (1-5)</label>
                  <input name="probability" type="number" min="1" max="5" defaultValue={isEditing ? selectedRisk?.probability : "1"} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Impact (1-5)</label>
                  <input name="impact" type="number" min="1" max="5" defaultValue={isEditing ? selectedRisk?.impact : "1"} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Mitigation Plan (Markdown)</label>
                <textarea name="mitigation_plan" rows={4} defaultValue={isEditing ? selectedRisk?.mitigation_plan : ''} placeholder="Steps to reduce probability..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-mono text-xs" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contingency Plan (Markdown)</label>
                <textarea name="contingency_plan" rows={4} defaultValue={isEditing ? selectedRisk?.contingency_plan : ''} placeholder="Action plan if risk occurs..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-mono text-xs" />
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); }} className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg transition-all">{isEditing ? 'Save Changes' : 'Register Risk'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Risk"
        message="Are you sure you want to delete this risk? This will remove it from the risk register and all associated heatmaps."
      />
    </div>
  );
}
