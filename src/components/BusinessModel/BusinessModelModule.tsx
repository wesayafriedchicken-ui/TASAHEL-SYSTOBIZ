import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link as LinkIcon, 
  CheckCircle, 
  Briefcase, 
  Gift, 
  Heart, 
  Truck, 
  Users, 
  Tag, 
  DollarSign,
  Download,
  Save,
  Plus,
  Trash2,
  FileText,
  Calendar,
  User,
  History,
  Layout,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  Target,
  TrendingUp,
  Activity,
  Compass,
  Zap,
  Award,
  Shield,
  ShieldAlert,
  BarChart2,
  Layers,
  Sparkles,
  Milestone,
  X,
  MessageSquare,
  CheckSquare,
  Paperclip
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from '../../lib/supabase';
import DeleteConfirmation from '../Common/DeleteConfirmation';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface CanvasItem {
  id: string;
  text: string;
}

interface BusinessModelCanvas {
  id?: number;
  title: string;
  designed_for: string;
  designed_by: string;
  date: string;
  version: string;
  key_partners: CanvasItem[];
  key_activities: CanvasItem[];
  key_resources: CanvasItem[];
  value_propositions: CanvasItem[];
  customer_relationships: CanvasItem[];
  channels: CanvasItem[];
  customer_segments: CanvasItem[];
  cost_structure: CanvasItem[];
  revenue_streams: CanvasItem[];
  created_at?: string;
}

// Sub-Feature data contracts
interface OKRKeyResult {
  id: string;
  text: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  assignedTo?: number;
  assignedToName?: string;
  taskId?: number;
  kpiId?: number;
}

interface OKRObjective {
  id: string;
  title: string;
  progress: number; // percentage
  owner: string;
  targetDate: string;
  keyResults: OKRKeyResult[];
}

interface SWOTItem {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  text: string;
}

interface CompetitorProfile {
  id: string;
  name: string;
  marketShare: number; // percentage
  strength: string;
  weakness: string;
  strategy: string;
}

interface StrategicMilestone {
  id: string;
  quarter: string; // "Q1", "Q2", "Q3", "Q4"
  title: string;
  targetDate: string;
  progress: number; // 0..100
  status: 'Complete' | 'Active' | 'In Progress' | 'Planned';
  owner: string;
}

interface TaskReviewModalProps {
  taskId: number;
  onClose: () => void;
  users: any[];
}

const TaskReviewModal: React.FC<TaskReviewModalProps> = ({ taskId, onClose, users }) => {
  const { user } = useAuth();
  const [task, setTask] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const currentUserId = localStorage.getItem('user_id') || '1';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-user-id': currentUserId,
    'Content-Type': 'application/json'
  };

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', { headers });
      if (res.ok) {
        const allTasks = await res.json();
        const matched = allTasks.find((t: any) => t.id === taskId);
        if (matched) {
          setTask(matched);
        }
      }

      const commentsRes = await fetch(`/api/tasks/${taskId}/comments`, { headers });
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }
    } catch (err) {
      console.error("Error fetching task details inside modal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const handleUpdateField = async (fields: Record<string, any>) => {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        const updated = await res.json();
        setTask((prev: any) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      console.error("Error updating task field:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: newChecklistItem.trim() })
      });
      if (res.ok) {
        const newItem = await res.json();
        setTask((prev: any) => ({
          ...prev,
          checklist: [...(prev.checklist || []), newItem]
        }));
        setNewChecklistItem("");
      }
    } catch (err) {
      console.error("Error adding checklist item:", err);
    }
  };

  const handleToggleChecklist = async (itemId: number, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/tasks/checklist/${itemId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_completed: isCompleted })
      });
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          checklist: (prev.checklist || []).map((item: any) => 
            item.id === itemId ? { ...item, is_completed: isCompleted } : item
          )
        }));
      }
    } catch (err) {
      console.error("Error toggling checklist item:", err);
    }
  };

  const handleDeleteChecklist = async (itemId: number) => {
    try {
      const res = await fetch(`/api/tasks/checklist/${itemId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          checklist: (prev.checklist || []).filter((item: any) => item.id !== itemId)
        }));
      }
    } catch (err) {
      console.error("Error deleting checklist item:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          comment: newComment.trim(),
          user_name: user?.name || localStorage.getItem('user_name') || 'Evaluator'
        })
      });
      if (res.ok) {
        const added = await res.json();
        setComments(prev => [...prev, added]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 border border-slate-100">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-black text-slate-700 tracking-wide uppercase font-mono">Loading Task Details &amp; Evaluation panel...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 max-w-md text-center border border-slate-100">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h3 className="text-lg font-black text-slate-800 uppercase">Task Not Found</h3>
          <p className="text-sm text-slate-500">The task associated with this Key Result may have been deleted or is not yet registered on the server database.</p>
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer">
            Close Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-mono font-extrabold">
              TASK #{task.id}
            </span>
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              Task Details &amp; Evaluation
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Details & Checklist */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Task Info */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Task Title</span>
                {saving && (
                  <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-slate-850 leading-snug">
                {task.title}
              </h3>
              
              <div className="pt-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-1">Description</span>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {task.description || "No description provided for this task."}
                </p>
              </div>
            </div>

            {/* Checklist section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Evaluation Checklist</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold">
                  {(task.checklist || []).filter((c: any) => c.is_completed).length} / {(task.checklist || []).length} Done
                </span>
              </div>

              {/* Checklist items list */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white divide-y divide-slate-50">
                {(task.checklist || []).length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 italic text-center">No checklist items registered. Add actionable evaluation steps below.</p>
                ) : (
                  (task.checklist || []).map((item: any) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 transition-colors">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input 
                          type="checkbox"
                          checked={item.is_completed || false}
                          onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className={`text-xs font-semibold text-slate-700 ${item.is_completed ? 'line-through text-slate-400 italic' : ''}`}>
                          {item.title}
                        </span>
                      </label>
                      <button 
                        onClick={() => handleDeleteChecklist(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add checklist item form */}
              <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Add evaluation checkpoint or key task sub-step..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600"
                />
                <button 
                  type="submit"
                  className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Status/Assignee Evaluation & Comments */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Direct Evaluation Controls */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <Activity className="w-4 h-4 text-indigo-600" /> Task Assessment &amp; Status
              </h4>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Status</label>
                <select
                  value={task.status || 'pending'}
                  onChange={(e) => handleUpdateField({ status: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-750 outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="pending">⏳ Pending (معلق)</option>
                  <option value="in_progress">⚙️ In Progress (قيد التنفيذ)</option>
                  <option value="completed">✅ Completed (مكتمل)</option>
                  <option value="stuck">⚠️ Stuck (متعثر)</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Priority</label>
                <select
                  value={task.priority || 'medium'}
                  onChange={(e) => handleUpdateField({ priority: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-750 outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="low">🟢 Low (منخفضة)</option>
                  <option value="medium">🟡 Medium (متوسطة)</option>
                  <option value="high">🔴 High (عالية)</option>
                  <option value="critical">🔥 Critical (حرجة)</option>
                </select>
              </div>

              {/* Reassign Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Assigned Owner</label>
                <select
                  value={task.assigned_to || ''}
                  onChange={(e) => {
                    const matchedUser = users.find(u => u.id.toString() === e.target.value);
                    handleUpdateField({ 
                      assigned_to: e.target.value ? parseInt(e.target.value) : null,
                      assigned_to_name: matchedUser ? matchedUser.name : null
                    });
                  }}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-750 outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">Unassigned</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comments & Evaluation Ledger */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Evaluation &amp; Comments Ledger</span>
              </div>

              {/* Comments list */}
              <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-4 max-h-[220px] overflow-y-auto space-y-3.5 scrollbar-thin">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No assessment comments yet. Post feedback or evaluation below.</p>
                ) : (
                  comments.map((com: any) => (
                    <div key={com.id} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800">{com.user_name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(com.created_at).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-white px-3 py-2 border border-slate-100/60 rounded-xl text-xs text-slate-600 font-medium leading-relaxed shadow-sm">
                        {com.comment}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea 
                  placeholder="Post evaluation feedback, progress update or evaluation review notes..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600 resize-none"
                />
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Post Evaluation Review
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface StrategicMilestone {
  id: string;
  quarter: string; // "Q1", "Q2", "Q3", "Q4"
  title: string;
  targetDate: string;
  progress: number; // 0..100
  status: 'Complete' | 'Active' | 'In Progress' | 'Planned';
  owner: string;
}

const BusinessModelModule: React.FC<{ setActiveModule?: (id: string) => void }> = ({ setActiveModule }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'canvas' | 'okrs' | 'swot_competitors'>('dashboard');

  const [canvases, setCanvases] = useState<BusinessModelCanvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialCanvas: BusinessModelCanvas = {
    title: 'Enterprise Core Model',
    designed_for: 'Premium Corporate Segments',
    designed_by: 'Strategic Management Unit',
    date: new Date().toISOString().split('T')[0],
    version: '1.2',
    key_partners: [
      { id: '1', text: 'Regional Fleet Aggregators' },
      { id: '2', text: 'Cloud Ingress Data Services' }
    ],
    key_activities: [
      { id: '1', text: 'Automated Dispatch Optimization Router' },
      { id: '2', text: 'Quality SLA Policy Compliance Check' }
    ],
    key_resources: [
      { id: '1', text: 'Proprietary Real-Time Geo Tracking Model' },
      { id: '2', text: 'Experienced ISO Quality Compliance Auditors' }
    ],
    value_propositions: [
      { id: '1', text: 'Lower overhead expenses via dispatch automation' },
      { id: '2', text: 'Full transparency via continuous telemetry updates' }
    ],
    customer_relationships: [
      { id: '1', text: 'Dedicated Operations Success Partner' },
      { id: '2', text: 'Self-serve Developer API Provisioning Key' }
    ],
    channels: [
      { id: '1', text: 'Corporate SaaS Administration Portal' },
      { id: '2', text: 'B2B Sales Outreach Pipeline' }
    ],
    customer_segments: [
      { id: '1', text: 'High-Volume Enterprise Logistics Clients' },
      { id: '2', text: 'SMEs looking to reduce delivery overhead metrics' }
    ],
    cost_structure: [
      { id: '1', text: 'Platform maintenance & Cloud Server compute resource' },
      { id: '2', text: 'Marketing, customer onboarding, and account managers' }
    ],
    revenue_streams: [
      { id: '1', text: 'Enterprise SaaS Monthly Recurring Subscription (80%)' },
      { id: '2', text: 'Professional Setup & API Integration Consulting (20%)' }
    ]
  };

  const [formData, setFormData] = useState<BusinessModelCanvas>(initialCanvas);

  // --- SUB-FEATURES LOCAL STORAGE STATES ---
  const { users, setSelectedTaskId } = useApp();
  const [okrs, setOkrs] = useState<OKRObjective[]>([]);
  const [krAssignedTo, setKrAssignedTo] = useState<Record<string, string>>({});
  const [reviewTaskId, setReviewTaskId] = useState<number | null>(null);
  const [okrToDelete, setOkrToDelete] = useState<string | null>(null);
  const [krToDelete, setKrToDelete] = useState<{ objId: string; krId: string } | null>(null);
  const [swotItems, setSwotItems] = useState<SWOTItem[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [milestones, setMilestones] = useState<StrategicMilestone[]>([]);

  // Score Calibrator for Value Delivery Score
  const [valueDeliveryScore, setValueDeliveryScore] = useState<number>(86);
  // Revenue Streams Health
  const [revenueHealthTier, setRevenueHealthTier] = useState<'Excellent' | 'Stable' | 'Critical'>('Stable');

  // Input States for OKR Builder
  const [newObjTitle, setNewObjTitle] = useState('');
  const [newObjOwner, setNewObjOwner] = useState('');
  const [newObjDate, setNewObjDate] = useState('');
  
  const [krText, setKrText] = useState<Record<string, string>>({});
  const [krTarget, setKrTarget] = useState<Record<string, number>>({});
  const [krUnit, setKrUnit] = useState<Record<string, string>>({});

  // Input States for Milestones
  const [newMilestoneQuarter, setNewMilestoneQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newMilestoneOwner, setNewMilestoneOwner] = useState('');

  // Input States for Competitors
  const [newCompName, setNewCompName] = useState('');
  const [newCompShare, setNewCompShare] = useState<number>(10);
  const [newCompStrength, setNewCompStrength] = useState('');
  const [newCompWeakness, setNewCompWeakness] = useState('');
  const [newCompStrategy, setNewCompStrategy] = useState('');

  // Input States for SWOT
  const [newSwotType, setNewSwotType] = useState<'strength' | 'weakness' | 'opportunity' | 'threat'>('strength');
  const [newSwotText, setNewSwotText] = useState('');

  // Initialize and Seed mock data
  useEffect(() => {
    fetchCanvases();

    // Check Local Storage
    const savedOkrs = localStorage.getItem('core_strategic_okrs');
    const savedSwot = localStorage.getItem('core_strategic_swot');
    const savedComps = localStorage.getItem('core_strategic_competitors');
    const savedMilestones = localStorage.getItem('core_strategic_milestones');
    const savedValueScore = localStorage.getItem('core_value_delivery_score');
    const savedRevHealth = localStorage.getItem('core_revenue_streams_health');

    const initialOkrs: OKRObjective[] = [
      {
        id: '1',
        title: 'Expand corporate syaf travel segment in GCC countries',
        progress: 53,
        owner: 'Sarah Jenkins',
        targetDate: '2026-09-30',
        keyResults: [
          { id: '11', text: 'Close 15 high-value corporate deals via Sales CRM', currentValue: 8, targetValue: 15, unit: 'Clients' },
          { id: '12', text: 'Establish direct travel API interfaces with regional aggregators', currentValue: 1, targetValue: 2, unit: 'Gateways' }
        ]
      },
      {
        id: '2',
        title: 'Optimize operational logistics workflow overhead',
        progress: 80,
        owner: 'Michael Chen (Operations)',
        targetDate: '2026-06-30',
        keyResults: [
          { id: '21', text: 'Improve automatic dispatch routing hit-rate to 95%', currentValue: 91, targetValue: 95, unit: '%' },
          { id: '22', text: 'Reduce process sequence latency down to 15 seconds', currentValue: 18, targetValue: 15, unit: 'Seconds' }
        ]
      }
    ];

    const initialSwot: SWOTItem[] = [
      { id: '1', type: 'strength', text: 'Proprietary real-time geo-tracking and routing engine model.' },
      { id: '2', type: 'strength', text: 'Agile system allowing zero code manual changes seamlessly.' },
      { id: '3', type: 'weakness', text: 'Relatively high cloud server compute overheads during load simulation.' },
      { id: '4', type: 'opportunity', text: 'Integrate dynamic AI compliance auditing via server-side Gemini SDK.' },
      { id: '5', type: 'opportunity', text: 'Expand fleet tracking algorithms directly into airport taxi hubs.' },
      { id: '6', type: 'threat', text: 'Aggressive pricing competition in European regional divisions.' }
    ];

    const initialComps: CompetitorProfile[] = [
      { id: '1', name: 'Apex Logistics Group', marketShare: 35, strength: 'Extensive physical heavy vehicle fleet', weakness: 'Legacy system stack and poor CRM integrations', strategy: 'Outpace with agile multi-tenant SaaS integration.' },
      { id: '2', name: 'Zenith Fleet Management', marketShare: 20, strength: 'Global brand presence offline support', weakness: 'Extremely high licensing rates for SMEs', strategy: 'Undercut standard base pricing, emphasize dynamic workflows.' },
      { id: '3', name: 'Swift Delivery Systems', marketShare: 15, strength: 'Aggressive marketing and short term contracts', weakness: 'Misses safety audits, low customer satisfaction', strategy: 'Position as premium zero-risk client with high compliance score.' }
    ];

    const initialMilestones: StrategicMilestone[] = [
      { id: 'm1', quarter: 'Q1', title: 'Publish Enterprise CRM Integration Module Workspace', targetDate: '2026-03-31', progress: 100, status: 'Complete', owner: 'Esraa Essam' },
      { id: 'm2', quarter: 'Q2', title: 'Roll out automated SOP Compliance Audit checks', targetDate: '2026-06-30', progress: 85, status: 'Active', owner: 'Michael Chen' },
      { id: 'm3', quarter: 'Q3', title: 'Initiate regional taxi routing pilot model deployment', targetDate: '2026-09-30', progress: 40, status: 'In Progress', owner: 'Sarah Jenkins' },
      { id: 'm4', quarter: 'Q4', title: 'Complete global multi-regional latency benchmarks', targetDate: '2026-12-31', progress: 10, status: 'Planned', owner: 'System Architect' }
    ];

    // Safe parsing helper with array check
    const safelyParseArray = (itemKey: string, fallback: any[]) => {
      try {
        const item = localStorage.getItem(itemKey);
        if (!item) return fallback;
        const parsed = JSON.parse(item);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch (err) {
        console.error(`Error parsing ${itemKey} from storage:`, err);
        return fallback;
      }
    };

    const nextOkrs = safelyParseArray('core_strategic_okrs', initialOkrs);
    setOkrs(nextOkrs);
    localStorage.setItem('core_strategic_okrs', JSON.stringify(nextOkrs));

    const nextSwot = safelyParseArray('core_strategic_swot', initialSwot);
    setSwotItems(nextSwot);
    localStorage.setItem('core_strategic_swot', JSON.stringify(nextSwot));

    const nextComps = safelyParseArray('core_strategic_competitors', initialComps);
    setCompetitors(nextComps);
    localStorage.setItem('core_strategic_competitors', JSON.stringify(nextComps));

    const nextMilestones = safelyParseArray('core_strategic_milestones', initialMilestones);
    setMilestones(nextMilestones);
    localStorage.setItem('core_strategic_milestones', JSON.stringify(nextMilestones));

    if (savedValueScore) {
      setValueDeliveryScore(Number(savedValueScore));
    }
    if (savedRevHealth) {
      setRevenueHealthTier(savedRevHealth as any);
    }
  }, []);

  const saveOKRsToStorage = (updated: OKRObjective[]) => {
    setOkrs(updated);
    localStorage.setItem('core_strategic_okrs', JSON.stringify(updated));
  };

  const saveSWOTToStorage = (updated: SWOTItem[]) => {
    setSwotItems(updated);
    localStorage.setItem('core_strategic_swot', JSON.stringify(updated));
  };

  const saveCompsToStorage = (updated: CompetitorProfile[]) => {
    setCompetitors(updated);
    localStorage.setItem('core_strategic_competitors', JSON.stringify(updated));
  };

  const saveMilestonesToStorage = (updated: StrategicMilestone[]) => {
    setMilestones(updated);
    localStorage.setItem('core_strategic_milestones', JSON.stringify(updated));
  };

  const fetchCanvases = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCanvases(data || []);
      if (data && data.length > 0) {
        setFormData(data[0]);
      }
    } catch (err) {
      console.error('Error fetching canvases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCanvas = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from('business_models')
        .upsert({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setFormData(data);
      setMessage({ type: 'success', text: 'Business model saved successfully' });
      
      try {
        await fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trigger_type: 'business_model:updated',
            data: { 
              title: data.title, 
              designed_by: data.designed_by, 
              designed_for: data.designed_for,
              version: data.version,
              date: data.date
            }
          })
        });
      } catch (triggerErr) {
        console.error('Failed to trigger business_model:updated automation:', triggerErr);
      }

      fetchCanvases();
    } catch (err) {
      console.error('Error saving canvas:', err);
      setMessage({ type: 'error', text: 'An error occurred while saving. Fallback data remains cached.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('business_models')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (formData.id === id) {
        setFormData(initialCanvas);
      }
      setShowDeleteConfirm(null);
      fetchCanvases();
    } catch (err) {
      console.error('Error deleting canvas:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const addNew = () => {
    setFormData(initialCanvas);
    setMessage(null);
  };

  const selectCanvas = (canvas: BusinessModelCanvas) => {
    setFormData(canvas);
    setMessage(null);
  };

  const addItem = (section: keyof BusinessModelCanvas) => {
    const newItem: CanvasItem = { id: Date.now().toString(), text: '' };
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section] as CanvasItem[] || []), newItem]
    }));
  };

  const updateItem = (section: keyof BusinessModelCanvas, id: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section] as CanvasItem[]).map(item => item.id === id ? { ...item, text } : item)
    }));
  };

  const removeItem = (section: keyof BusinessModelCanvas, id: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section] as CanvasItem[]).filter(item => item.id !== id)
    }));
  };

  const CanvasBox = ({ 
    title, 
    icon: Icon, 
    questions, 
    items, 
    section,
    className = "" 
  }: { 
    title: string; 
    icon: any; 
    questions: string[]; 
    items: CanvasItem[]; 
    section: keyof BusinessModelCanvas;
    className?: string;
  }) => (
    <div className={`p-4 border border-slate-200 bg-white flex flex-col group min-h-[220px] ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 leading-none">{title}</h3>
          <div className="mt-2 space-y-1">
            {questions.map((q, i) => (
              <p key={i} className="text-[10px] leading-tight text-slate-400 font-semibold">{q}</p>
            ))}
          </div>
        </div>
        <Icon className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
      </div>

      <div className="flex-1 space-y-2 mt-4">
        <AnimatePresence initial={false}>
          {(items || []).map((item, idx) => (
            <motion.div 
              key={item.id || idx} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-2 group/item"
            >
              <textarea
                value={item.text}
                onChange={(e) => updateItem(section, item.id, e.target.value)}
                placeholder="Declare details..."
                className="w-full text-xs p-2 h-14 bg-slate-50 border border-slate-200 focus:border-slate-800 outline-none resize-none rounded-lg shadow-inner hover:border-slate-300 transition-all font-sans text-slate-700"
              />
              <button 
                onClick={() => removeItem(section, item.id)}
                className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity self-start mt-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => addItem(section)}
        className="mt-4 flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-wider py-1 border-t border-dashed border-slate-100 cursor-pointer"
      >
        <Plus className="w-3 h-3" /> Add Element
      </button>
    </div>
  );

  const filteredCanvases = canvases.filter(c => 
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.designed_for || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- BUSINESS LOGIC HELPER FORMULAS ---
  const overallOKRProg = okrs.length > 0 
    ? Math.round(okrs.reduce((acc, obj) => acc + obj.progress, 0) / okrs.length)
    : 68;

  // Handles adding SWOT item
  const handleAddSwot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSwotText.trim()) return;
    const newItem: SWOTItem = {
      id: Date.now().toString(),
      type: newSwotType,
      text: newSwotText.trim()
    };
    const updated = [...swotItems, newItem];
    saveSWOTToStorage(updated);
    setNewSwotText('');
  };

  // Delete SWOT Item
  const handleRemoveSwot = (id: string) => {
    const updated = swotItems.filter(s => s.id !== id);
    saveSWOTToStorage(updated);
  };

  // Handles adding Objective
  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjTitle.trim()) return;
    const newObj: OKRObjective = {
      id: Date.now().toString(),
      title: newObjTitle.trim(),
      progress: 0,
      owner: newObjOwner.trim() || 'Unassigned Partner',
      targetDate: newObjDate || '2026-12-31',
      keyResults: []
    };
    const updated = [...okrs, newObj];
    saveOKRsToStorage(updated);
    setNewObjTitle('');
    setNewObjOwner('');
    setNewObjDate('');
  };

  // Handles adding Key Result to Objective
  const handleAddKeyResult = async (objId: string) => {
    const text = krText[objId];
    const target = krTarget[objId] || 100;
    const unit = krUnit[objId] || '%';
    const assignedUserIdStr = krAssignedTo[objId];
    if (!text || !text.trim()) return;

    let assignedTo: number | undefined;
    let assignedToName: string | undefined;
    let taskId: number | undefined;
    let kpiId: number | undefined;

    const assignedUser = users.find(u => u.id.toString() === assignedUserIdStr);
    if (assignedUser) {
      assignedTo = assignedUser.id;
      assignedToName = assignedUser.name;

      // 1. Create task in Tasks module
      try {
        const token = localStorage.getItem('token');
        const currentUserId = localStorage.getItem('user_id') || '1';
        const taskPayload = {
          title: `[KR] ${text.trim()}`,
          description: `Key Result under Objective: "${okrs.find(o => o.id === objId)?.title}". Target is ${target} ${unit}.`,
          status: 'pending',
          priority: 'medium',
          assigned_to: assignedUser.id,
          assigned_to_name: assignedUser.name,
          module_id: 'okrs',
          time_spent_seconds: 0
        };

        const taskRes = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': currentUserId
          },
          body: JSON.stringify(taskPayload)
        });

        if (taskRes.ok) {
          const taskData = await taskRes.json();
          taskId = taskData.id;
          console.log('✅ Task created automatically for Key Result:', taskData);
        }
      } catch (err) {
        console.error('❌ Error automatically creating task for Key Result:', err);
      }

      // 2. Create KPI in KPI & Performance module
      try {
        const token = localStorage.getItem('token');
        const currentUserId = localStorage.getItem('user_id') || '1';
        const kpiPayload = {
          name: `[KR] ${text.trim()}`,
          target_value: target,
          actual_value: 0,
          source: 'Objectives & Key Results (OKRs)',
          frequency: 'Continuous',
          owner_id: assignedUser.id,
          department_id: assignedUser.department_id || 1
        };

        const kpiRes = await fetch('/api/kpis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': currentUserId
          },
          body: JSON.stringify(kpiPayload)
        });

        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          kpiId = kpiData.id;
          console.log('✅ KPI created automatically for Key Result:', kpiData);
        }
      } catch (err) {
        console.error('❌ Error automatically creating KPI for Key Result:', err);
      }
    }

    const newKrOnFly: OKRKeyResult = {
      id: Date.now().toString(),
      text: text.trim(),
      currentValue: 0,
      targetValue: target,
      unit: unit,
      assignedTo,
      assignedToName,
      taskId,
      kpiId
    };

    const updated = okrs.map(obj => {
      if (obj.id === objId) {
        const nextKrs = [...(obj.keyResults || []), newKrOnFly];
        // recalculate progress
        const avgProg = nextKrs.length > 0
          ? Math.round(nextKrs.reduce((acc, kr) => acc + (kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0), 0) / nextKrs.length)
          : 0;
        return {
          ...obj,
          keyResults: nextKrs,
          progress: Math.min(avgProg, 100)
        };
      }
      return obj;
    });

    saveOKRsToStorage(updated);
    // clear input
    setKrText(prev => ({ ...prev, [objId]: '' }));
    setKrTarget(prev => ({ ...prev, [objId]: 100 }));
    setKrUnit(prev => ({ ...prev, [objId]: '%' }));
    setKrAssignedTo(prev => ({ ...prev, [objId]: '' }));
  };

  // Update Key Result progress values and sync with task & KPI
  const handleUpdateKrValue = async (objId: string, krId: string, val: number) => {
    let matchedKr: OKRKeyResult | undefined;
    const updated = okrs.map(obj => {
      if (obj.id === objId) {
        const nextKrs = (obj.keyResults || []).map(kr => {
          if (kr.id === krId) {
            matchedKr = { ...kr, currentValue: Math.min(val, kr.targetValue) };
            return matchedKr;
          }
          return kr;
        });
        const avgProg = nextKrs.length > 0
          ? Math.round(nextKrs.reduce((acc, kr) => acc + (kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0), 0) / nextKrs.length)
          : 0;
        return {
          ...obj,
          keyResults: nextKrs,
          progress: Math.min(avgProg, 100)
        };
      }
      return obj;
    });

    saveOKRsToStorage(updated);

    // Sync with KPI & Performance module
    if (matchedKr && matchedKr.kpiId) {
      try {
        const token = localStorage.getItem('token');
        const currentUserId = localStorage.getItem('user_id') || '1';
        const getKpiRes = await fetch('/api/kpis', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': currentUserId
          }
        });
        if (getKpiRes.ok) {
          const allKpis = await getKpiRes.json();
          const currentKpi = allKpis.find((k: any) => k.id === matchedKr?.kpiId);
          if (currentKpi) {
            const updatePayload = {
              name: currentKpi.name,
              target_value: currentKpi.target_value,
              actual_value: Math.min(val, currentKpi.target_value),
              source: currentKpi.source,
              frequency: currentKpi.frequency,
              owner_id: currentKpi.owner_id,
              department_id: currentKpi.department_id
            };
            await fetch(`/api/kpis/${matchedKr.kpiId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-user-id': currentUserId
              },
              body: JSON.stringify(updatePayload)
            });
            console.log('✅ KPI updated automatically to value:', val);
          }
        }
      } catch (err) {
        console.error('❌ Error automatically updating KPI:', err);
      }
    }

    // Sync task status if fully completed or active
    if (matchedKr && matchedKr.taskId) {
      try {
        const token = localStorage.getItem('token');
        const currentUserId = localStorage.getItem('user_id') || '1';
        const isCompleted = matchedKr.currentValue >= matchedKr.targetValue;
        const taskStatus = isCompleted ? 'completed' : 'in_progress';
        
        await fetch(`/api/tasks/${matchedKr.taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': currentUserId
          },
          body: JSON.stringify({
            status: taskStatus
          })
        });
        console.log(`✅ Task ${matchedKr.taskId} status updated automatically to ${taskStatus}`);
      } catch (err) {
        console.error('❌ Error automatically updating Task status:', err);
      }
    }
  };

  // Delete Objective
  const handleRemoveObjective = (objId: string) => {
    const updated = okrs.filter(o => o.id !== objId);
    saveOKRsToStorage(updated);
  };

  // Delete Key Result
  const handleRemoveKeyResult = (objId: string, krId: string) => {
    const updated = okrs.map(obj => {
      if (obj.id === objId) {
        const nextKrs = (obj.keyResults || []).filter(kr => kr.id !== krId);
        // recalculate progress
        const avgProg = nextKrs.length > 0
          ? Math.round(nextKrs.reduce((acc, kr) => acc + (kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0), 0) / nextKrs.length)
          : 0;
        return {
          ...obj,
          keyResults: nextKrs,
          progress: Math.min(avgProg, 100)
        };
      }
      return obj;
    });
    saveOKRsToStorage(updated);
  };

  // Add Competitor
  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;
    const newComp: CompetitorProfile = {
      id: Date.now().toString(),
      name: newCompName.trim(),
      marketShare: newCompShare,
      strength: newCompStrength || 'General Fleet Presence',
      weakness: newCompWeakness || 'Slow Custom Integration',
      strategy: newCompStrategy || 'Leverage dynamic cloud dashboards'
    };
    const updated = [...competitors, newComp];
    saveCompsToStorage(updated);
    setNewCompName('');
    setNewCompShare(10);
    setNewCompStrength('');
    setNewCompWeakness('');
    setNewCompStrategy('');
  };

  // Remove Competitor
  const handleRemoveCompetitor = (id: string) => {
    const updated = competitors.filter(c => c.id !== id);
    saveCompsToStorage(updated);
  };

  // Add Milestone
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    const newMile: StrategicMilestone = {
      id: Date.now().toString(),
      quarter: newMilestoneQuarter,
      title: newMilestoneTitle.trim(),
      targetDate: newMilestoneDate || '2026-12-31',
      progress: 0,
      status: 'Planned',
      owner: newMilestoneOwner.trim() || 'Strategic Admin'
    };
    const updated = [...milestones, newMile];
    saveMilestonesToStorage(updated);
    setNewMilestoneTitle('');
    setNewMilestoneOwner('');
    setNewMilestoneDate('');
  };

  // Update Milestone status / progress
  const updateMilestone = (id: string, progress: number) => {
    let statusId: 'Complete' | 'Active' | 'In Progress' | 'Planned' = 'Planned';
    if (progress === 100) statusId = 'Complete';
    else if (progress >= 70) statusId = 'Active';
    else if (progress > 0) statusId = 'In Progress';

    const updated = milestones.map(m => {
      if (m.id === id) {
        return { ...m, progress: progress, status: statusId };
      }
      return m;
    });
    saveMilestonesToStorage(updated);
  };

  // Remove Milestone
  const handleRemoveMilestone = (id: string) => {
    const updated = milestones.filter(m => m.id !== id);
    saveMilestonesToStorage(updated);
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500 font-sans">
      
      {/* Header and Branded Description section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Compass className="w-6 h-6 animate-pulse" />
            </span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Corporate Business Model &amp; OKR Suite</h2>
          </div>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Configure dynamic multi-tenant canvas, outline strategic enterprise OKRs, build robust SWOT plans, and benchmark competitor performance metrics.
          </p>
        </div>

        {/* Global Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          {message && (
            <div className={`p-2 rounded-xl text-xs font-bold leading-none ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.text}
            </div>
          )}
          <button
            onClick={() => {
              const exportState = {
                objectives: okrs,
                swot: swotItems,
                competitors: competitors,
                quarterlyMilestones: milestones,
                activeCanvas: formData
              };
              const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `corporate-strategy-blueprint-${formData.title.toLowerCase().replace(/\s+/g, '-')}.json`;
              a.click();
              setMessage({ type: 'success', text: 'Strategy blueprint exported safely!' });
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Specs
          </button>
          
          <button 
            onClick={saveCanvas}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 transition-all font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Architecture
          </button>
        </div>
      </div>

      {/* Main Tabbed Sub-navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Strategic Dashboard', icon: BarChart2 },
          { id: 'canvas', label: 'Business Model Canvas', icon: Layout },
          { id: 'okrs', label: 'Objectives & Key Results (OKRs)', icon: Target },
          { id: 'swot_competitors', label: 'SWOT & Competitor Benchmarks', icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 font-extrabold text-xs uppercase tracking-wider transition-all border-b-2 leading-none cursor-pointer whitespace-nowrap ${active ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STRATEGIC DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Row: Strategic KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* KPI 1: OKR Progress */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OKR Achievement Index</span>
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-800 mb-2">
                {overallOKRProg}% <span className="text-xs text-slate-400 font-semibold">Overall</span>
              </div>
              {/* Progress bar model */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${overallOKRProg}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Aggregate across {okrs.length} major objectives</p>
            </div>

            {/* KPI 2: Value Delivery Score */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition-all shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Value Delivery Score</span>
                <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-600 font-mono">{valueDeliveryScore}</span>
                <span className="text-xs text-slate-400 font-bold uppercase font-sans">/ 100 pt</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mb-3">Custom target index versus 3 default competitors</p>
              
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Calibrate:</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={valueDeliveryScore}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value);
                    setValueDeliveryScore(nextVal);
                    localStorage.setItem('core_value_delivery_score', String(nextVal));
                  }}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            {/* KPI 3: Revenue Streams Health */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Streams Health</span>
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${revenueHealthTier === 'Excellent' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : revenueHealthTier === 'Stable' ? 'bg-sky-500' : 'bg-rose-500'}`} />
                  <span className="text-xl font-black text-slate-800">{revenueHealthTier} Balance</span>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold leading-tight">Diversified income channels stable margin baseline</p>
              </div>

              <div className="flex gap-1 mt-3">
                {(['Excellent', 'Stable', 'Critical'] as const).map(tier => (
                  <button
                    key={tier}
                    onClick={() => {
                      setRevenueHealthTier(tier);
                      localStorage.setItem('core_revenue_streams_health', tier);
                    }}
                    className={`flex-1 text-[9px] py-1 font-bold uppercase rounded border transition-all ${revenueHealthTier === tier ? 'bg-slate-900 border-slate-900 text-white font-black' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-800'}`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI 4: Global Competitors Count */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-rose-300 transition-all shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Market Rivals</span>
                <Users className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-3xl font-black text-slate-800 mb-1">
                {competitors.length} Monitored
              </div>
              <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1 pt-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> High competitive tension index
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-medium">Tracking rival tactics in SWOT Workspace</p>
            </div>
          </div>

          {/* Central Section: Recharts Quarterly Objectives Timeline (Milestones Tracking) & Streams Ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box: Milestones Tracking Graph representing achievement thresholds */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Milestone className="w-4 h-4 text-indigo-600" /> Strategic Q1-Q4 Milestone Scheduling (Milestones Tracking)
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    A visual projection of target accomplishments scheduled for each quarterly sprint cycle.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-[9px] text-indigo-600 font-black uppercase tracking-widest rounded-lg">Target Roadmap</span>
              </div>

              {/* Responsive chart representing active milestones completion tiers */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={milestones.map(m => ({
                      name: `${m.quarter}: ${m.title.length > 25 ? m.title.substring(0, 22) + '...' : m.title}`,
                      progress: m.progress,
                      target: 100,
                      rawQuarter: m.quarter
                    }))}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px', background: '#ffffff', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Area type="monotone" name="Milestone Progress Rate" dataKey="progress" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProgress)" />
                    <Line type="linear" name="Optimal Delivery Baseline" dataKey="target" stroke="#cbd5e1" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Box: Dynamic Channel Performance & Competitor Share */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" /> Revenue Stream Composition Ratio
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  SaaS products deliver consistent high margins while custom enterprise setups handle client acquisition cycles.
                </p>

                <div className="space-y-4">
                  {[
                    { label: 'SaaS Platform Subscriptions', value: '80%', color: 'bg-indigo-600', sub: 'High Stability' },
                    { label: 'Integration & Setup Auditing API', value: '20%', color: 'bg-emerald-500', sub: 'Dynamic Acquisition' },
                    { label: 'Consulting Custom Flow Engineering', value: '0%', color: 'bg-slate-200', sub: 'Unused Channel' }
                  ].map((stream, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-800">{stream.label}</span>
                        <div className="text-right">
                          <span className="font-black text-slate-900">{stream.value}</span>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">{stream.sub}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${stream.color}`} style={{ width: stream.value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('okrs')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-center block"
                >
                  Configure Strategic OKRs Tracker
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Quarterly Milestone Planner Board */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Strategic Roadmap (Milestones Customizer)</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">Modify project completion thresholds directly below to automatically update the target area graph.</p>
              </div>
              
              {/* Form to add Milestones */}
              <form onSubmit={handleAddMilestone} className="flex flex-wrap gap-2 items-center">
                <select
                  value={newMilestoneQuarter}
                  onChange={e => setNewMilestoneQuarter(e.target.value as any)}
                  className="p-2 border border-slate-200 bg-white rounded-xl font-bold text-[10px] uppercase outline-none"
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
                <input
                  type="text"
                  placeholder="e.g. Expand fleet database coverage"
                  value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                  className="p-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-600 w-44"
                />
                <input
                  type="text"
                  placeholder="Owner"
                  value={newMilestoneOwner}
                  onChange={e => setNewMilestoneOwner(e.target.value)}
                  className="p-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold outline-none w-24"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-xl tracking-wider cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Add
                </button>
              </form>
            </div>

            {/* Grid of milestones */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {milestones.map((m, idx) => (
                <div key={m.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative group">
                  <button
                    onClick={() => handleRemoveMilestone(m.id)}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded-md tracking-wider">{m.quarter} Cycle</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${m.status === 'Complete' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{m.status}</span>
                    </div>

                    <h4 className="text-xs font-black text-slate-800 mb-1 leading-tight">{m.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Lead Partner: {m.owner}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>Completion Score</span>
                      <span className="font-mono font-bold text-slate-800">{m.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={m.progress}
                      onChange={(e) => updateMilestone(m.id, Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESS MODEL CANVAS */}
      {activeTab === 'canvas' && (
        <div className="space-y-6">
          {/* Saved models side ledger dropdown (for quick lookup) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Deploy Canvas Template:</label>
              <select
                value={formData.id || ''}
                onChange={e => {
                  const pick = canvases.find(c => c.id === Number(e.target.value));
                  if (pick) selectCanvas(pick);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
              >
                <option value="">-- Choose saved system model --</option>
                {canvases.map((c, idx) => (
                  <option key={c.id || idx} value={c.id}>[v{c.version}] {c.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={addNew}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Initialize New Sandbox Draft
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* The Main editable Canvas Grid layout */}
            <div className="flex-1 overflow-x-auto">
              <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl min-w-[1000px]">
                
                {/* Visual Canvas Metadata inputs */}
                <div className="grid grid-cols-4 gap-[2px] mb-[2px] bg-slate-800 p-1 rounded-t-xl text-slate-200">
                  <div className="bg-slate-900 p-3 rounded-l-lg">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Canvas Header / Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full text-xs font-extrabold outline-none bg-transparent text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="bg-slate-900 p-3">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Designed for segment:</label>
                    <input 
                      type="text" 
                      value={formData.designed_for}
                      onChange={e => setFormData({...formData, designed_for: e.target.value})}
                      className="w-full text-xs font-extrabold outline-none bg-transparent text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="bg-slate-900 p-3">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Compiled by:</label>
                    <input 
                      type="text" 
                      value={formData.designed_by}
                      onChange={e => setFormData({...formData, designed_by: e.target.value})}
                      className="w-full text-xs font-extrabold outline-none bg-transparent text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="bg-slate-900 p-3 rounded-r-lg">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Version Number &amp; Date</label>
                    <div className="flex gap-1">
                      <input 
                        type="text" 
                        value={formData.version}
                        onChange={e => setFormData({...formData, version: e.target.value})}
                        className="w-12 text-xs font-extrabold outline-none bg-transparent text-white"
                      />
                      <span className="text-slate-600">|</span>
                      <input 
                        type="text" 
                        value={formData.date}
                        className="text-xs font-extrabold outline-none bg-transparent text-slate-400 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* 5-Column Core Grid */}
                <div className="grid grid-cols-5 gap-[1px] bg-slate-200">
                  <CanvasBox
                    title="Key Partners"
                    icon={LinkIcon}
                    section="key_partners"
                    questions={[
                      "Who are our Key Partners?",
                      "Which Key Resources are we acquiring?"
                    ]}
                    items={formData.key_partners}
                    className="row-span-2"
                  />

                  <div className="flex flex-col gap-[1px]">
                    <CanvasBox
                      title="Key Activities"
                      icon={CheckCircle}
                      section="key_activities"
                      questions={[
                        "What Activities do our Value Propositions require?"
                      ]}
                      items={formData.key_activities}
                      className="flex-1"
                    />
                    <CanvasBox
                      title="Key Resources"
                      icon={Briefcase}
                      section="key_resources"
                      questions={[
                        "What core assets are necessary to execute?"
                      ]}
                      items={formData.key_resources}
                      className="flex-1"
                    />
                  </div>

                  <CanvasBox
                    title="Value Propositions"
                    icon={Gift}
                    section="value_propositions"
                    questions={[
                      "What real value do we deliver to the customer?",
                      "Which segments problems are we solving?"
                    ]}
                    items={formData.value_propositions}
                    className="row-span-2"
                  />

                  <div className="flex flex-col gap-[1px]">
                    <CanvasBox
                      title="Customer Relationships"
                      icon={Heart}
                      section="customer_relationships"
                      questions={[
                        "What relationship layout does each user segment expect?"
                      ]}
                      items={formData.customer_relationships}
                      className="flex-1"
                    />
                    <CanvasBox
                      title="Channels"
                      icon={Truck}
                      section="channels"
                      questions={[
                        "Via what pathways do customer segments buy?"
                      ]}
                      items={formData.channels}
                      className="flex-1"
                    />
                  </div>

                  <CanvasBox
                    title="Customer Segments"
                    icon={Users}
                    section="customer_segments"
                    questions={[
                      "For whom are we creating active value?"
                    ]}
                    items={formData.customer_segments}
                    className="row-span-2"
                  />
                </div>

                {/* Bottom Row Costs & Streams */}
                <div className="grid grid-cols-2 gap-[1px] bg-slate-200 mt-[1px]">
                  <CanvasBox
                    title="Cost Structure"
                    icon={Tag}
                    section="cost_structure"
                    questions={[
                      "What are the most critical business expenses?"
                    ]}
                    items={formData.cost_structure}
                  />
                  <CanvasBox
                    title="Revenue Streams"
                    icon={DollarSign}
                    section="revenue_streams"
                    questions={[
                      "Where does secure long term margin come from?"
                    ]}
                    items={formData.revenue_streams}
                  />
                </div>

              </div>
            </div>

            {/* Sidebar Guidelines */}
            <div className="lg:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Canvas Best Practice
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aim for high visual precision: ensure each section focuses strictly on realistic B2B or B2C solutions.
              </p>
              <div className="text-[10px] space-y-3 pt-2 text-slate-500">
                <div className="p-3 bg-white border border-slate-100 rounded-xl">
                  <span className="font-extrabold text-slate-800 block">Value-to-Channel Pairings</span>
                  Match every identified Customer Segment with a corresponding Channel or Pricing Stream to ensure balanced structure.
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl">
                  <span className="font-extrabold text-slate-800 block">Automation Integration</span>
                  Define clear indicators for software modules (CRM, SOPs, QA checks) inside Key Activities.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: OBJECTIVES & KEY RESULTS (OKRs) TRACKER */}
      {activeTab === 'okrs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Left Column: Register New Strategic Objective Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Plus className="w-4 h-4 text-indigo-500" /> New Objective Builder
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Objectives declare the qualitative destination of the enterprise pipeline. Add key results below after initial compilation.
              </p>
            </div>

            <form onSubmit={handleAddObjective} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Objective Title / Destination</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Scaling corporate dispatch platform efficiency"
                  value={newObjTitle}
                  onChange={e => setNewObjTitle(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Owner Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={newObjOwner}
                    onChange={e => setNewObjOwner(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Target Date</label>
                  <input
                    type="date"
                    value={newObjDate}
                    onChange={e => setNewObjDate(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Create Objective Blueprint
              </button>
            </form>
          </div>

          {/* Right Column: Key Results Ledger (Multi-stage updates) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Objectives &amp; Key Results (OKRs) Dashboard</h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Continuous numerical tracker matching key result progressions to overall objective thresholds.</p>
                </div>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono text-[9px] font-bold rounded-lg uppercase">Active OKRs</span>
              </div>

              {okrs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                  <Target className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm font-bold">No active Objectives configured yet</p>
                  <p className="text-xs text-slate-400">Initialize a draft objective using the sidebar builder</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {okrs.map((obj, idx) => (
                    <div key={obj.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all relative group">
                      
                      {/* Delete button */}
                      <button
                        onClick={() => setOkrToDelete(obj.id)}
                        className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete Objective"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Header info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <div className="max-w-md">
                          <h4 className="text-xs font-black text-slate-800 leading-tight flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-indigo-500 shrink-0" /> {obj.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                            <span className="font-semibold">Lead: {obj.owner}</span>
                            <span>•</span>
                            <span className="font-mono font-medium">Target: {obj.targetDate}</span>
                          </div>
                        </div>

                        {/* Visual Circle progress or percentage badge */}
                        <div className="text-right">
                          <span className="text-lg font-black text-indigo-600 block">{obj.progress}%</span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Completion Index</span>
                        </div>
                      </div>

                      {/* Objective Progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-4">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${obj.progress}%` }} />
                      </div>

                      {/* Nested Key Results list */}
                      <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Measurable Key Results (KRs)</span>
                        
                        {(obj.keyResults || []).length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No Key Results registered under this Objective yet.</p>
                        ) : (
                          <div className="space-y-3.5 divide-y divide-slate-100">
                            {(obj.keyResults || []).map((kr, idx) => {
                              const percent = kr.targetValue > 0 ? Math.round((kr.currentValue / kr.targetValue) * 100) : 0;
                              return (
                                <div key={kr.id || idx} className="pt-2 first:pt-0 space-y-1">
                                  <div className="flex justify-between items-start text-xs gap-3">
                                    <div className="flex-1">
                                      <span className="text-slate-600 font-semibold">{kr.text}</span>
                                      {kr.assignedToName && (
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          <span>Assigned: <strong className="text-slate-700 font-black">{kr.assignedToName}</strong></span>
                                          {kr.taskId && (
                                            <button
                                              onClick={() => {
                                                if (kr.taskId) {
                                                  setReviewTaskId(kr.taskId);
                                                }
                                              }}
                                              title="Click to open task details and evaluate"
                                              className="bg-indigo-55 hover:bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all border border-indigo-100 cursor-pointer flex items-center gap-0.5"
                                            >
                                              <span>Task #{kr.taskId}</span>
                                              <span className="text-[7px]">↗</span>
                                            </button>
                                          )}
                                          {kr.kpiId && <span className="bg-rose-50 text-rose-600 px-1 py-0.2 rounded text-[8px] font-mono">KPI #{kr.kpiId}</span>}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0 flex items-start gap-1">
                                      <div>
                                        <span className="font-black text-slate-800">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                                        <span className="block text-[9px] text-indigo-600 font-mono text-right">({percent}%)</span>
                                      </div>
                                      <button
                                        onClick={() => setKrToDelete({ objId: obj.id, krId: kr.id })}
                                        className="p-1 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Delete Key Result"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Slider to interactively adjust and save values */}
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="0"
                                      max={kr.targetValue}
                                      value={kr.currentValue}
                                      onChange={(e) => handleUpdateKrValue(obj.id, kr.id, Number(e.target.value))}
                                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Form to attach a new Key Result inside this card */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Add measurable task description..."
                            value={krText[obj.id] || ''}
                            onChange={e => setKrText({ ...krText, [obj.id]: e.target.value })}
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600 min-w-[200px]"
                          />
                          <input
                            type="number"
                            placeholder="Tgt"
                            value={krTarget[obj.id] || ''}
                            onChange={e => setKrTarget({ ...krTarget, [obj.id]: Number(e.target.value) })}
                            className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none text-center"
                          />
                          <input
                            type="text"
                            placeholder="Unit"
                            value={krUnit[obj.id] || ''}
                            onChange={e => setKrUnit({ ...krUnit, [obj.id]: e.target.value })}
                            className="w-14 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none text-center"
                          />
                          
                          <select
                            value={krAssignedTo[obj.id] || ''}
                            onChange={e => setKrAssignedTo({ ...krAssignedTo, [obj.id]: e.target.value })}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600"
                          >
                            <option value="">Unassigned</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleAddKeyResult(obj.id)}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Add KR
                          </button>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: SWOT & COMPETITOR BENCHMARKS */}
      {activeTab === 'swot_competitors' && (
        <div className="space-y-6">
          
          {/* Section A: SWOT ANALYSIS Workspace */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3 flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-5 h-5 text-indigo-600 animate-pulse" /> SWOT Strategic Analysis Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-semibold">Address internal Strengths and Weaknesses, outline external Opportunities and Threats.</p>
              </div>

              {/* Form to append new SWOT elements */}
              <form onSubmit={handleAddSwot} className="flex items-center gap-2 flex-wrap">
                <select
                  value={newSwotType}
                  onChange={e => setNewSwotType(e.target.value as any)}
                  className="p-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold uppercase outline-none"
                >
                  <option value="strength">💪 Strength</option>
                  <option value="weakness">⚠️ Weakness</option>
                  <option value="opportunity">🌟 Opportunity</option>
                  <option value="threat">⚡ Threat</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scalable microservice latency checks..."
                  value={newSwotText}
                  onChange={e => setNewSwotText(e.target.value)}
                  className="p-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600 w-64 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-xl tracking-wider cursor-pointerAll"
                >
                  Insert Factor
                </button>
              </form>
            </div>

            {/* 4 Quadrants Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* SWOT Quadrant: Strengths */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex flex-col justify-between min-h-[160px]">
                <div>
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                    💪 Strengths <span className="text-[10px] text-slate-400 font-sans tracking-normal font-bold">({swotItems.filter(s => s.type === 'strength').length})</span>
                  </h4>
                  <ul className="space-y-2">
                    {swotItems.filter(s => s.type === 'strength').map((s, idx) => (
                      <li key={s.id || idx} className="text-xs text-slate-700 bg-white p-2 border border-emerald-50 rounded-lg flex justify-between items-start group">
                        <span className="leading-tight font-medium">{s.text}</span>
                        <button onClick={() => handleRemoveSwot(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-350 hover:text-rose-500 cursor-pointer self-start ml-2">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* SWOT Quadrant: Weaknesses */}
              <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-2xl flex flex-col justify-between min-h-[160px]">
                <div>
                  <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                    ⚠️ Weaknesses <span className="text-[10px] text-slate-400 font-sans tracking-normal font-bold">({swotItems.filter(s => s.type === 'weakness').length})</span>
                  </h4>
                  <ul className="space-y-2">
                    {swotItems.filter(s => s.type === 'weakness').map((s, idx) => (
                      <li key={s.id || idx} className="text-xs text-slate-700 bg-white p-2 border border-rose-50 rounded-lg flex justify-between items-start group">
                        <span className="leading-tight font-medium">{s.text}</span>
                        <button onClick={() => handleRemoveSwot(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-350 hover:text-rose-500 cursor-pointer self-start ml-2">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* SWOT Quadrant: Opportunities */}
              <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-2xl flex flex-col justify-between min-h-[160px]">
                <div>
                  <h4 className="text-xs font-black text-sky-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                    🌟 Opportunities <span className="text-[10px] text-slate-400 font-sans tracking-normal font-bold">({swotItems.filter(s => s.type === 'opportunity').length})</span>
                  </h4>
                  <ul className="space-y-2">
                    {swotItems.filter(s => s.type === 'opportunity').map((s, idx) => (
                      <li key={s.id || idx} className="text-xs text-slate-700 bg-white p-2 border border-sky-50 rounded-lg flex justify-between items-start group">
                        <span className="leading-tight font-medium">{s.text}</span>
                        <button onClick={() => handleRemoveSwot(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-350 hover:text-rose-500 cursor-pointer self-start ml-2">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* SWOT Quadrant: Threats */}
              <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl flex flex-col justify-between min-h-[160px]">
                <div>
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                    ⚡ Threats <span className="text-[10px] text-slate-400 font-sans tracking-normal font-bold">({swotItems.filter(s => s.type === 'threat').length})</span>
                  </h4>
                  <ul className="space-y-2">
                    {swotItems.filter(s => s.type === 'threat').map((s, idx) => (
                      <li key={s.id || idx} className="text-xs text-slate-700 bg-white p-2 border border-amber-50 rounded-lg flex justify-between items-start group">
                        <span className="leading-tight font-medium">{s.text}</span>
                        <button onClick={() => handleRemoveSwot(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-350 hover:text-rose-500 cursor-pointer self-start ml-2">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>

          {/* Section B: COMPETITOR ANALYSIS Table Profiles */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-5 h-5 text-indigo-500" /> Active Competitors Profile Tracking
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">Analyze rival market positions, identify logical gaps, and define defensive responses.</p>
              </div>

              {/* Form trigger */}
              <form onSubmit={handleAddCompetitor} className="flex gap-2 items-center flex-wrap">
                <input
                  type="text"
                  required
                  placeholder="Competitor Name"
                  value={newCompName}
                  onChange={e => setNewCompName(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl text-xs font-semibold w-40"
                />
                <input
                  type="number"
                  placeholder="Share %"
                  value={newCompShare || ''}
                  onChange={e => setNewCompShare(Number(e.target.value))}
                  className="p-2 border border-slate-200 rounded-xl text-xs font-mono w-16 text-center"
                />
                <input
                  type="text"
                  placeholder="Core Weakness"
                  value={newCompWeakness}
                  onChange={e => setNewCompWeakness(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl text-xs w-44"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-xl tracking-wider cursor-pointer"
                >
                  Record Competitor
                </button>
              </form>
            </div>

            {/* Table layout of Rivals */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Rival Company</th>
                    <th className="px-4 py-3 font-extrabold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Est. Market Share</th>
                    <th className="px-4 py-3 font-extrabold text-slate-300 uppercase tracking-widest whitespace-nowrap">Key Strength</th>
                    <th className="px-4 py-3 font-extrabold text-rose-400 uppercase tracking-widest whitespace-nowrap">Critical Weakness</th>
                    <th className="px-4 py-3 font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Tactical Strategy</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-105">
                  {competitors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 italic">No competitors tracked inside the sandbox.</td>
                    </tr>
                  ) : (
                    competitors.map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-black text-slate-800">{c.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold rounded-md">
                            {c.marketShare}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{c.strength}</td>
                        <td className="px-4 py-3 text-rose-600 font-semibold">{c.weakness}</td>
                        <td className="px-4 py-3 text-slate-700 font-semibold italic">"{c.strategy}"</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveCompetitor(c.id)}
                            className="p-1 text-slate-350 hover:text-rose-500 cursor-pointer"
                            title="Remove Rival"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* Database sync popup layout */}
      <DeleteConfirmation 
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        loading={isDeleting}
        title="Delete Business Model Draft"
        message="Are you sure you want to delete this business model template? This action is irreversible."
      />

      {reviewTaskId && (
        <TaskReviewModal 
          taskId={reviewTaskId}
          onClose={() => setReviewTaskId(null)}
          users={users}
        />
      )}

      {/* Delete Objective Confirmation */}
      {okrToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full text-center space-y-4"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">حذف الهدف الاستراتيجي؟</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 font-sans">
                هل أنت متأكد من رغبتك في حذف هذا الهدف الاستراتيجي بجميع مؤشراته الرئيسية؟ هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOkrToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  handleRemoveObjective(okrToDelete);
                  setOkrToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                تأكيد الحذف
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Key Result Confirmation */}
      {krToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full text-center space-y-4"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">حذف المؤشر الرئيسي (Key Result)؟</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 font-sans">
                هل أنت متأكد من رغبتك في حذف هذا المؤشر وقياساته؟ سيتم تحديث نسبة تقدم الهدف تلقائياً.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setKrToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  handleRemoveKeyResult(krToDelete.objId, krToDelete.krId);
                  setKrToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                تأكيد الحذف
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default BusinessModelModule;
