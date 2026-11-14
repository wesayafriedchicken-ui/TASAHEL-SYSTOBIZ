import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  ArrowRight 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { useSOP } from './SOPContext';

export const SOPDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { sopList, departments, setLifecycleSopId } = useSOP();

  const totalSops = sopList.length;
  const publishedSops = sopList.filter(s => s.status === 'Published').length;
  const draftSops = sopList.filter(s => s.status === 'Draft' || s.status === 'Under Review' || s.status === 'Pending Approval').length;
  const signoffRate = totalSops > 0 ? Math.round((publishedSops / totalSops) * 100) : 0;
  const deptDistribution = departments.map(d => ({
    name: d.name,
    count: sopList.filter(s => s.department_id === d.id).length
  }));

  return (
    <div className="space-y-6">
      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block font-mono">Total Process Catalog</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">{totalSops}</div>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3" /> +4 vs last mo
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block font-mono">In-Draft Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">{draftSops}</div>
          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-2">
            Action required
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block font-mono">Active Sign-Off Rate</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">{signoffRate}%</div>
          <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 mt-2 font-mono">
            ISO 9001 Alignment
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block font-mono">Cross-Functional Teams</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">{departments.length}</div>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-2">
            High coverage
          </span>
        </div>
      </div>

      {/* Analytics & Process Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">SOP Distribution by Department</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]}>
                  {deptDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">ISO Readiness & Audit Governance</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Compliance Readiness</span>
                  <span className="text-emerald-600">88%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '88%' }} />
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">Target: 95%</span>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Process Automation</span>
                  <span className="text-indigo-600">62%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '62%' }} />
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">Target: 75%</span>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Document Freshness Index</span>
                  <span className="text-amber-600">94%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '94%' }} />
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">Target: 90%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl mt-6 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block font-semibold mb-0.5">Automated Process Audits</strong>
              All high-risk pathways mapped under ISO 9001-2026 digital compliance gates. Continuous validation cycle active.
            </div>
          </div>
        </div>
      </div>

      {/* Active Pipeline Tracker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Active Review Pipeline</h4>
            <p className="text-xs text-slate-400">Procedures currently traveling through verification gates</p>
          </div>
          <button 
            onClick={() => navigate('/sops/library')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            Open Library <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-100">
                <th className="py-2.5 px-3">Procedure Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Operational Gate</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(sopList.filter(s => s.status !== 'Published').length > 0 ? sopList.filter(s => s.status !== 'Published') : sopList).map(sop => (
                <tr key={sop.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-800">
                    <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate(`/sops/${sop.id}`)}>
                      {sop.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">v{sop.version_number}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-semibold">{sop.department_name || 'General'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      sop.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                      sop.status === 'Under Review' ? 'bg-indigo-100 text-indigo-700' :
                      sop.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sop.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{sop.status === 'Draft' ? 'Gate 1: Author Drafting' : sop.status === 'Under Review' ? 'Gate 2: QC Review' : sop.status === 'Pending Approval' ? 'Gate 3: Exec Sign-off' : 'Gate 4: Released'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setLifecycleSopId(sop.id);
                          navigate(`/sops/lifecycle/${sop.id}`);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 cursor-pointer"
                      >
                        Sign-Off Console
                      </button>
                      <button
                        onClick={() => navigate(`/sops/${sop.id}`)}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Path Operational Standards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Critical Path Operational Standards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sopList.filter(s => s.status === 'Published').map(sop => (
            <div key={sop.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 hover:border-emerald-200 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded font-black uppercase">{sop.process_type}</span>
                <span className="text-[10px] font-mono text-slate-400">v{sop.version_number}</span>
              </div>
              <h5 className="font-extrabold text-sm text-slate-800 line-clamp-1">{sop.title}</h5>
              <p className="text-xs text-slate-500 line-clamp-2">{sop.objective}</p>
              <div className="pt-2 flex justify-between items-center text-[11px] border-t border-slate-200/60 text-slate-400 font-medium">
                <span>{sop.steps?.length || 0} Steps Cataloged</span>
                <button 
                  onClick={() => navigate(`/sops/${sop.id}`)}
                  className="font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Inspect Blueprint
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SOPDashboardPage;
