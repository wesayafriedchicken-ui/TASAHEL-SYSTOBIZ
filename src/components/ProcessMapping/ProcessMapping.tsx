import React, { useState, useEffect, useCallback } from 'react';
import { 
  addEdge, 
  Connection, 
  Edge, 
  Node, 
  useNodesState, 
  useEdgesState,
  Panel,
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import FlowRenderer from './FlowRenderer';
import { toPng, toJpeg } from 'html-to-image';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { 
  Waypoints, 
  Plus, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Eye,
  Trash2,
  Image as ImageIcon,
  FileText,
  X,
  Zap,
  LayoutDashboard,
  BookOpen,
  Sliders,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Folder,
  RefreshCw,
  GitBranch,
  Play,
  Pause,
  AlertCircle,
  Sparkles,
  Shield,
  User,
  CheckCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, ReferenceLine 
} from 'recharts';
import { ProcessMap } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import DeleteConfirmation from '../Common/DeleteConfirmation';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const ProcessMappingInner: React.FC = () => {
  const { id: routeId, sopId } = useParams<{ id: string, sopId: string }>();
  const navigate = useNavigate();
  const { screenToFlowPosition } = useReactFlow();
  
  const [maps, setMaps] = useState<ProcessMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<ProcessMap | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMapData, setNewMapData] = useState({ title: '', description: '', sop_id: '' });
  const [sops, setSops] = useState<{id: number, title: string}[]>([]);
  const [currentSopSteps, setCurrentSopSteps] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Extended Process Mapping Tabs, Library, Version Control & Simulation States ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'simulation'>('dashboard');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [librarySearch, setLibrarySearch] = useState<string>('');
  
  // Versions state
  const [drawerMap, setDrawerMap] = useState<ProcessMap | null>(null);
  const [historyVersions, setHistoryVersions] = useState<any[]>([
    { version: 'v2.4.1', date: '21 May, 2026', author: 'Esraa Essam', comment: 'Optimized node delay and streamlined approvals.' },
    { version: 'v2.4.0', date: '12 May, 2026', author: 'Sarah Jenkins', comment: 'Added dual notification trigger to dispatch team.' },
    { version: 'v2.3.0', date: '24 April, 2026', author: 'Michael Chen', comment: 'Merged secondary verification with compliance protocol.' },
    { version: 'v1.1.0', date: '08 April, 2026', author: 'Sarah Jenkins', comment: 'Added peer check gateway step to dispatch.' },
    { version: 'v1.0.0', date: '15 March, 2026', author: 'System Bootstrap', comment: 'Initial flow baseline logic mapped and approved.' }
  ]);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState<string | null>(null);
  const [showVersionAlert, setShowVersionAlert] = useState<{ title: string; message: string } | null>(null);

  // Simulation parameters & tracking states
  const [simSelectedMapId, setSimSelectedMapId] = useState<string>('');
  const [simLoad, setSimLoad] = useState<number>(140); // 140 tx/hr
  const [simFtes, setSimFtes] = useState<number>(5); // 5 team members / FTE
  const [simMultiplier, setSimMultiplier] = useState<number>(1.0); // execution delay multiplier
  const [simActive, setSimActive] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simReport, setSimReport] = useState<any | null>(null);

  // Run simulation effect loop
  useEffect(() => {
    let timer: any;
    if (simActive) {
      timer = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setSimActive(false);
            
            // Build the simulation insights report dynamically based on slider values!
            const mappedName = maps.find(m => m.id === Number(simSelectedMapId))?.title || 'Selected Process';
            
            const isHighLoad = simLoad > 220;
            const isUnderstaffed = simFtes < 5;
            const delayCoeff = simMultiplier;
            
            let status: 'optimum' | 'warning' | 'critical' = 'optimum';
            let throughput = 98;
            let efficiency = 92.4;
            let avgCycleTime = 1.6;
            let bottleneckNode = 'None / Kept Smooth';
            let queueLength = 0;
            let recommendation = '';
            let redundantSteps: string[] = [];
            
            if (isHighLoad && isUnderstaffed) {
              status = 'critical';
              throughput = 61;
              efficiency = 46.2;
              avgCycleTime = 3.9;
              bottleneckNode = 'Verification Audit Gate';
              queueLength = Math.round(simLoad * 0.45 * delayCoeff);
              recommendation = 'Critical personnel bottleneck identified! Allocate at least 4 additional FTEs to this gate or merge the sequential "Double Verification Check" step with the primary compliance protocol to eliminate 1.4 days of idle queues.';
              redundantSteps = ['Double Compliance Verification', 'Manual Supervisor Signature'];
            } else if (isHighLoad) {
              status = 'warning';
              throughput = 84;
              efficiency = 78.1;
              avgCycleTime = 2.4;
              bottleneckNode = 'Supervisor Sign-off';
              queueLength = Math.round(simLoad * 0.15 * delayCoeff);
              recommendation = 'Sub-optimal throughput detected under high transaction rate. Transition the "Supervisor Sign-off" node to an automated conditional SOP rule inside the Automation Module to reduce latency.';
              redundantSteps = ['Peer Format Review'];
            } else if (isUnderstaffed) {
              status = 'warning';
              throughput = 79;
              efficiency = 71.5;
              avgCycleTime = 2.8;
              bottleneckNode = 'Intake Validation Step';
              queueLength = Math.round(simLoad * 0.22 * delayCoeff);
              recommendation = 'FTE allocation is insufficient for intake node. Redesign this process to bypass the manual Intake Validation step for high-trust/premium clients, reducing overall workload by 35%.';
              redundantSteps = ['Duplicate Record Check'];
            } else {
              status = 'optimum';
              throughput = 96;
              efficiency = 91.8;
              avgCycleTime = 1.1;
              bottleneckNode = 'None (Flow within bounds)';
              queueLength = Math.round(simLoad * 0.02 * delayCoeff);
              recommendation = 'Flow is healthy and running within acceptable SLAs. You currently have a slight over-allocation of resources. You could potentially reduce FTEs by 1 to save overhead costs without impacting efficiency.';
              redundantSteps = ['Periodic Archive Backup Node (Can be backgrounded)'];
            }
            
            const proposedHourlySavings = (redundantSteps.length * 12.5) * (simLoad / 100);
            const monthlySavings = Math.round(proposedHourlySavings * 8 * 22);

            setSimReport({
              mappedName,
              status,
              throughput,
              efficiency,
              avgCycleTime,
              bottleneckNode,
              queueLength,
              recommendation,
              redundantSteps,
              monthlySavings
            });

            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [simActive, simLoad, simFtes, simMultiplier, simSelectedMapId, maps]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': userId || '1'
    };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/process-mapping', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Unauthorized or server error');
      const data = await res.json();
      setMaps(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to fetch maps', error);
      setMaps([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchSops = useCallback(async () => {
    try {
      const res = await fetch('/api/sops', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Unauthorized or server error');
      const data = await res.json();
      setSops(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to fetch sops', error);
      setSops([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchMaps();
    fetchSops();
  }, [fetchMaps, fetchSops]);

  const loadMapDetails = useCallback(async (id: number) => {
    if (!id || isNaN(id)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/process-mapping/${id}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to load map details');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSelectedMap(data);
      
      const rfNodes: Node[] = (data.nodes || []).map((n: any) => ({
        id: String(n.id),
        type: (n.type === 'sop_step' || n.type === 'process' || !n.type) ? 'task' : n.type,
        position: { x: parseFloat(n.position_x || 0), y: parseFloat(n.position_y || 0) },
        data: { label: n.label || '', ...n.data },
      }));
      
      if (rfNodes.length === 0) {
        setNodes([{
          id: 'node_start_initial',
          type: 'start',
          position: { x: 250, y: 100 },
          data: { label: 'Start' }
        }]);
      } else {
        setNodes(rfNodes);
      }
      
      const rfEdges: Edge[] = (data.edges || []).map((e: any) => ({
        id: String(e.id),
        source: String(e.source_node),
        target: String(e.target_node),
        sourceHandle: e.source_handle,
        targetHandle: e.target_handle,
        label: e.label || '',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      }));
      
      setEdges(rfEdges);
    } catch (error: any) {
      console.error('Failed to load map details', error);
      alert(`Load failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, setNodes, setEdges]);

  const loadMapBySopId = useCallback(async (sId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/process-mapping/sop/${sId}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Map not found for this SOP');
      const data = await res.json();
      if (data.id) {
        navigate(`/process-mapping/${data.id}`, { replace: true });
      } else {
        navigate('/process-mapping');
      }
    } catch (error) {
      console.error('Failed to load map by SOP', error);
      navigate('/process-mapping');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, navigate]);

  useEffect(() => {
    if (routeId) {
      loadMapDetails(parseInt(routeId));
    } else if (sopId) {
      loadMapBySopId(parseInt(sopId));
    } else {
      setSelectedMap(null);
      setNodes([]);
      setEdges([]);
      setIsEditMode(false);
    }
  }, [routeId, sopId, loadMapDetails, loadMapBySopId, setNodes, setEdges]);

  const fetchSopSteps = useCallback(async (sId: number) => {
    if (!sId) return;
    try {
      const res = await fetch(`/api/sops/${sId}/steps`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCurrentSopSteps(data);
      } else {
        setCurrentSopSteps([]);
      }
    } catch (error) {
      console.error('Failed to fetch SOP steps', error);
      setCurrentSopSteps([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (selectedMap?.sop_id) {
      fetchSopSteps(selectedMap.sop_id);
    } else {
      setCurrentSopSteps([]);
    }
  }, [selectedMap?.sop_id, fetchSopSteps]);

  const onConnect = useCallback((params: Connection) => 
    setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }, 
      style: { stroke: '#94a3b8', strokeWidth: 2 } 
    }, eds)), 
  [setEdges]);

  const handleSave = async () => {
    if (!selectedMap || saving) return;
    
    // Safety check: Avoid saving empty nodes if they existed before, unless confirmed
    if (nodes.length === 0 && selectedMap.nodes && selectedMap.nodes.length > 0 && !showSaveWarning) {
      setShowSaveWarning(true);
      return;
    }

    setSaving(true);
    try {
      const edgesToSave = edges.map(e => ({
        source: String(e.source),
        target: String(e.target),
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label || ''
      }));

      // Ensure node IDs are strings as expected by backend re-mapping logic
      const nodesToSave = nodes.map(n => ({
        ...n,
        id: String(n.id)
      }));

      const res = await fetch(`/api/process-mapping/${selectedMap.id}/save`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          nodes: nodesToSave, 
          edges: edgesToSave, 
          title: selectedMap.title, 
          description: selectedMap.description 
        })
      });

      if (res.ok) {
        // Success feedback
        console.log('Save successful');
        await loadMapDetails(selectedMap.id);
        await fetchMaps();
        alert('Process map deployed successfully!');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save map');
      }
    } catch (error: any) {
      console.error('Failed to save map', error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMap = () => {
    if (!selectedMap) return;
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteMap = async () => {
    if (!selectedMap) return;
    const mapIdToDelete = selectedMap.id;
    try {
      const res = await fetch(`/api/process-mapping/${mapIdToDelete}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setIsDeleteDialogOpen(false);
        setMaps(prev => prev.filter(m => m.id !== mapIdToDelete));
        setSelectedMap(null);
        navigate('/process-mapping', { replace: true });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete map');
      }
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  const handleExportImage = async (format: 'png' | 'jpg') => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el || exporting) return;
    
    setExporting(true);
    try {
      const clutter = ['.react-flow__controls', '.react-flow__panel', '.react-flow__minimap'];
      clutter.forEach(sel => {
        const item = document.querySelector(sel) as HTMLElement;
        if (item) item.style.visibility = 'hidden';
      });

      await new Promise(r => setTimeout(r, 500));

      const options = { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2,
        cacheBust: true,
        style: { transform: 'scale(1)' }
      };

      if (format === 'png') {
        const dataUrl = await toPng(el, options);
        if (dataUrl) saveAs(dataUrl, `${selectedMap?.title || 'process-map'}.png`);
      } else {
        const dataUrl = await toJpeg(el, { ...options, quality: 0.95 });
        if (dataUrl) saveAs(dataUrl, `${selectedMap?.title || 'process-map'}.jpg`);
      }

      clutter.forEach(sel => {
        const item = document.querySelector(sel) as HTMLElement;
        if (item) item.style.visibility = 'visible';
      });
    } catch (error) {
      console.error('Export image failed:', error);
      alert('Failed to export image.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el || exporting) return;
    
    setExporting(true);
    try {
      const clutter = ['.react-flow__controls', '.react-flow__panel', '.react-flow__minimap', '.react-flow__attribution'];
      clutter.forEach(sel => {
        document.querySelectorAll(sel).forEach(e => (e as HTMLElement).style.visibility = 'hidden');
      });

      await new Promise(r => setTimeout(r, 800));

      const options = {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        style: { transform: 'none' }
      };

      const dataUrl = await toPng(el, options);
      if (dataUrl) {
        const pdf = new jsPDF('l', 'px', [el.offsetWidth + 100, el.offsetHeight + 150]);
        pdf.setFontSize(18);
        pdf.text('The Business Core', 40, 40);
        pdf.setFontSize(12);
        pdf.text(`Process Map: ${selectedMap?.title || 'Untitled'}`, 40, 65);
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 40, 95);
        pdf.addImage(dataUrl, 'PNG', 40, 120, el.offsetWidth, el.offsetHeight);
        pdf.save(`${selectedMap?.title || 'process-map'}.pdf`);
      }

      clutter.forEach(sel => {
        document.querySelectorAll(sel).forEach(e => (e as HTMLElement).style.visibility = 'visible');
      });
    } catch (error) {
      console.error('Export PDF failed:', error);
      alert('Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateMap = async () => {
    if (!newMapData.title) return;
    try {
      const res = await fetch('/api/process-mapping', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newMapData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create map');
      setShowCreateModal(false);
      fetchMaps();
      if (data.id) navigate(`/process-mapping/${data.id}`);
    } catch (error: any) {
      console.error('Failed to create map', error);
      alert(`Creation failed: ${error.message}`);
    }
  };

  const handleGenerateFromSop = async (sopId: number) => {
    if (!sopId) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/process-mapping/generate-from-sop/${sopId}`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate map');
      
      await fetchMaps();
      setShowCreateModal(false);
      navigate(`/process-mapping/${data.id}`);
    } catch (error: any) {
      console.error('Failed to generate map', error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const syncSopSteps = async () => {
    if (!selectedMap?.sop_id) return;
    setShowSyncConfirm(true);
  };

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const selectedElement = nodes.find(n => n.id === selectedElementId) || null;

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (isEditMode) setSelectedElementId(node.id);
  }, [isEditMode]);

  const onPaneClick = useCallback(() => setSelectedElementId(null), []);

  const updateNodeLabel = (id: string, label: string) => {
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, label } } : node));
  };

  const deleteSelected = () => {
    if (!selectedElementId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedElementId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedElementId && e.target !== selectedElementId));
    setSelectedElementId(null);
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (!isEditMode) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, [isEditMode]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (!isEditMode) return;
      event.preventDefault();
      
      try {
        const type = event.dataTransfer.getData('application/reactflow');
        const label = event.dataTransfer.getData('nodeLabel');
        const sopStepId = event.dataTransfer.getData('sopStepId');
        
        if (!type) return;

        // Position the node correctly relative to the flow viewport
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        if (!position) return;

        const newNode: Node = {
          id: `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: (type === 'sop_step' || type === 'process') ? 'task' : type,
          position,
          data: { 
            label: label || `New ${type}`,
            sop_step_id: sopStepId ? parseInt(sopStepId) : undefined
          },
        };

        setNodes((nds) => [...nds, newNode]);
      } catch (err) {
        console.error("Error adding node on drop:", err);
      }
    },
    [isEditMode, setNodes, screenToFlowPosition]
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header Toolbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/process-mapping')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Waypoints className="w-6 h-6 text-indigo-500" /> 
              {selectedMap ? selectedMap.title : 'Process Mapping'}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              {selectedMap ? `Updated: ${new Date(selectedMap.updated_at).toLocaleString()}` : 'Business logical orchestration.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedMap && (
            <>
              <button 
                id="toggle-edit-mode"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isEditMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {isEditMode ? <><Eye className="w-4 h-4" /> View</> : <><Edit3 className="w-4 h-4" /> Edit</>}
              </button>

              {isEditMode && (
                <button 
                  id="save-process-map"
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} /> Save
                </button>
              )}

              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button onClick={() => handleExportImage('png')} className="p-1.5 hover:bg-white rounded transition-all text-slate-600" title="PNG"><ImageIcon className="w-4 h-4" /></button>
                <button onClick={handleExportPDF} className="p-1.5 hover:bg-white rounded transition-all text-slate-600" title="PDF"><FileText className="w-4 h-4" /></button>
              </div>

              <button onClick={handleDeleteMap} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
          {!selectedMap && (
            <button id="create-map-trigger" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Create Map
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {!selectedMap ? (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Tab Selector sub-header */}
              <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
                <div className="flex gap-2">
                  {[
                    { id: 'dashboard', label: 'Process Insights Dashboard', icon: LayoutDashboard },
                    { id: 'library', label: 'Process Library & Versions', icon: BookOpen },
                    { id: 'simulation', label: 'Simulation & Performance Sandbox', icon: Sliders }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          if (tab.id === 'simulation' && maps.length > 0 && !simSelectedMapId) {
                            setSimSelectedMapId(String(maps[0].id));
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${active ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'}`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-400 font-mono font-bold leading-none select-none">
                  SYSTEM TIME: 2026-05-21 13:05:48 UTC
                </div>
              </div>

              {/* Tab Content Display Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                
                {/* 1. PROCESS INSIGHTS DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* KPI Cards row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapped Processes</span>
                          <Waypoints className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1">{maps.length || 4} Flows</div>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> +1 added this month
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle Time Efficiency</span>
                          <Clock className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="text-3xl font-black text-emerald-600 mb-1">86.4%</div>
                        <span className="text-[10px] text-slate-500 font-medium">Avg: 1.8 Days vs 2.1 Days SLA target</span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition-all shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Bottlenecks</span>
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-3xl font-black text-amber-600 mb-1">2 Warning Spots</div>
                        <span className="text-[10px] text-slate-500 font-medium">Understaffed review queue delays</span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition-all shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated cost savings</span>
                          <TrendingDown className="w-5 h-5 text-teal-500" />
                        </div>
                        <div className="text-3xl font-black text-teal-600 mb-1">$14.2K / mo</div>
                        <span className="text-[10px] text-emerald-600 font-bold">Via step reductions & SOP automation</span>
                      </div>
                    </div>

                    {/* Chart & Queue Spotlight */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="font-black text-base text-slate-800">Operational Daily Flow Rate</h3>
                            <p className="text-xs text-slate-400 font-medium">Active throughput across primary workflow stages (transactions / hour)</p>
                          </div>
                          <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-black text-indigo-600 uppercase">Live Pipeline</span>
                        </div>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={[
                                { name: '08:00 AM', 'Customer Intake': 42, 'QA Audit Gate': 15, 'Logistic Pack': 10 },
                                { name: '10:00 AM', 'Customer Intake': 118, 'QA Audit Gate': 64, 'Logistic Pack': 48 },
                                { name: '12:00 PM', 'Customer Intake': 185, 'QA Audit Gate': 142, 'Logistic Pack': 110 },
                                { name: '02:00 PM', 'Customer Intake': 160, 'QA Audit Gate': 175, 'Logistic Pack': 145 },
                                { name: '04:00 PM', 'Customer Intake': 95, 'QA Audit Gate': 150, 'Logistic Pack': 132 },
                                { name: '06:00 PM', 'Customer Intake': 48, 'QA Audit Gate': 80, 'Logistic Pack': 76 },
                              ]}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorAudit" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                              <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '11px', fontFamily: 'sans-serif' }} />
                              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                              <Area type="monotone" dataKey="Customer Intake" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIntake)" />
                              <Area type="monotone" dataKey="QA Audit Gate" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAudit)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Bottleneck alarm/spotlight */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="p-2 bg-amber-50 rounded-xl text-amber-500"><AlertTriangle className="w-5 h-5" /></span>
                            <h3 className="font-extrabold text-base text-slate-800">Queue Congestions</h3>
                          </div>
                          
                          <p className="text-xs text-slate-400 mb-5 leading-relaxed">Real-time telemetry reports that the following operations are violating standard threshold processing bounds:</p>
                          
                          <div className="space-y-4">
                            {[
                              { map: 'Sales Shipping Workflow', node: 'QA Compliance Check', queue: '15 items backlogged', delay: 'Avg +4h 12m SLA lag', severity: 'high' },
                              { map: 'New Client Onboarding', node: 'Secondary Identity Audit', queue: '8 cases pending review', delay: 'Avg +2h 45m delay', severity: 'medium' }
                            ].map((item, idx) => (
                              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">{item.map}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${item.severity === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{item.severity}</span>
                                </div>
                                <div className="text-xs font-black text-slate-800">{item.node}</div>
                                <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-1">
                                  <span>{item.queue}</span>
                                  <span className="text-amber-500">{item.delay}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setActiveTab('simulation');
                            if (maps.length > 0) {
                              setSimSelectedMapId(String(maps[0].id));
                            }
                          }}
                          className="mt-6 w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md uppercase tracking-wider"
                        >
                          Unlock Analytics Simulator
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. PROCESS LIBRARY (WITH ARCHIVE CATEGORIZATION & VERSION CONTROL) */}
                {activeTab === 'library' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Filters & search line */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
                        {['All', 'Operations & Dispatch', 'Sales & CRM', 'QA & Compliance', 'Human Resources', 'Finance & Legal'].map(dept => (
                          <button
                            key={dept}
                            onClick={() => setSelectedDeptFilter(dept)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${selectedDeptFilter === dept ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'}`}
                          >
                            {dept === 'All' ? 'All Departments' : dept}
                          </button>
                        ))}
                      </div>
                      
                      <div className="relative w-full md:w-72">
                        <input
                          type="text"
                          placeholder="Search operational archive..."
                          value={librarySearch}
                          onChange={e => setLibrarySearch(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Maps list with Version Labels inside grid */}
                    <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loading ? [1, 2, 3].map(i => <div key={i} className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />) : 
                      maps.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-300 rounded-3xl">
                           <Waypoints className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                           <h3 className="text-xl font-bold text-slate-900">No Process Maps found.</h3>
                           <button onClick={() => setShowCreateModal(true)} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg">Create One Now</button>
                        </div>
                      ) : maps
                        .filter(map => {
                          const titleLower = (map.title || '').toLowerCase();
                          const descLower = (map.description || '').toLowerCase();
                          const queryLower = (librarySearch || '').toLowerCase();
                          
                          // Determine map's dynamic department categorization
                          let dept = 'Operations & Dispatch';
                          if (titleLower.includes('sales') || titleLower.includes('crm') || titleLower.includes('customer')) {
                            dept = 'Sales & CRM';
                          } else if (titleLower.includes('qa') || titleLower.includes('quality') || titleLower.includes('compliance')) {
                            dept = 'QA & Compliance';
                          } else if (titleLower.includes('hr') || titleLower.includes('human') || titleLower.includes('staff')) {
                            dept = 'Human Resources';
                          } else if (titleLower.includes('finance') || titleLower.includes('invoice') || titleLower.includes('audit')) {
                            dept = 'Finance & Legal';
                          }
                          
                          const deptMatches = selectedDeptFilter === 'All' || selectedDeptFilter === dept;
                          const queryMatches = titleLower.includes(queryLower) || descLower.includes(queryLower);
                          return deptMatches && queryMatches;
                        })
                        .map(map => {
                          const titleLower = (map.title || '').toLowerCase();
                          let dept = 'Operations & Dispatch';
                          let deptColor = 'bg-slate-50 text-slate-600 border-slate-100';
                          
                          if (titleLower.includes('sales') || titleLower.includes('crm') || titleLower.includes('customer')) {
                            dept = 'Sales & CRM';
                            deptColor = 'bg-indigo-50 text-indigo-600 border-indigo-100';
                          } else if (titleLower.includes('qa') || titleLower.includes('quality') || titleLower.includes('compliance')) {
                            dept = 'QA & Compliance';
                            deptColor = 'bg-amber-50 text-amber-600 border-amber-100';
                          } else if (titleLower.includes('hr') || titleLower.includes('human') || titleLower.includes('staff')) {
                            dept = 'Human Resources';
                            deptColor = 'bg-rose-50 text-rose-600 border-rose-100';
                          } else if (titleLower.includes('finance') || titleLower.includes('invoice') || titleLower.includes('audit')) {
                            dept = 'Finance & Legal';
                            deptColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                          }

                          const activeVersion = map.id === 1 ? 'v2.4.1' : map.id === 2 ? 'v1.4.2' : 'v1.0.0';

                          return (
                            <div key={map.id} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all relative flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-center mb-4">
                                  <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold uppercase ${deptColor}`}>{dept}</span>
                                  <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-[9px] font-black">{activeVersion}</span>
                                </div>
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 text-base mb-1.5">{map.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-3 mb-5 leading-relaxed">{map.description || 'No description added to this blueprint mapping file.'}</p>
                              </div>

                              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <button
                                  onClick={() => {
                                    setDrawerMap(map);
                                    if (map.id === 1) {
                                      setHistoryVersions([
                                        { version: 'v2.4.1', date: '21 May, 2026', author: 'Esraa Essam', comment: 'Optimized node delay and streamlined approvals.' },
                                        { version: 'v2.4.0', date: '12 May, 2026', author: 'Sarah Jenkins', comment: 'Added dual notification trigger to dispatch team.' },
                                        { version: 'v2.3.0', date: '24 April, 2026', author: 'Michael Chen', comment: 'Merged secondary verification with compliance protocol.' },
                                        { version: 'v1.1.0', date: '08 April, 2026', author: 'Sarah Jenkins', comment: 'Added peer check gateway step to dispatch.' },
                                        { version: 'v1.0.0', date: '15 March, 2026', author: 'System Bootstrap', comment: 'Initial flow baseline logic mapped and approved.' }
                                      ]);
                                    } else if (map.id === 2) {
                                      setHistoryVersions([
                                        { version: 'v1.4.2', date: '02 May, 2026', author: 'Michael Chen', comment: 'Added dual notification trigger to dispatch team.' },
                                        { version: 'v1.1.0', date: '24 March, 2026', author: 'Michael Chen', comment: 'Added warehouse confirmation callback step.' },
                                        { version: 'v1.0.0', date: '10 January, 2026', author: 'Sarah Jenkins', comment: 'Published direct shipping routing.' }
                                      ]);
                                    } else {
                                      setHistoryVersions([
                                        { version: 'v1.0.0', date: '21 May, 2026', author: 'Esraa Essam', comment: 'Initial draft published of this procedural flow map.' }
                                      ]);
                                    }
                                  }}
                                  className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
                                >
                                  <Layers className="w-3.5 h-3.5" /> Revisions Vault ({map.id === 1 ? 5 : map.id === 2 ? 3 : 1})
                                </button>
                                
                                <button
                                  onClick={() => navigate(`/process-mapping/${map.id}`)}
                                  className="p-1 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all tracking-wider"
                                >
                                  Edit Flow
                                </button>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </motion.div>
                )}

                {/* 3. SIMULATION & PERFORMANCE SANDBOX ANALYZER */}
                {activeTab === 'simulation' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Configuration Panel */}
                      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                        <div className="space-y-5">
                          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                            <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Sliders className="w-4 h-4" /></span>
                            <h4 className="font-extrabold text-sm uppercase text-slate-700 tracking-wider">Simulation Variables</h4>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Operational Blueprint</label>
                            <select
                              value={simSelectedMapId}
                              onChange={e => {
                                setSimSelectedMapId(e.target.value);
                                setSimReport(null);
                              }}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                            >
                              <option value="">Select a system process map...</option>
                              {maps.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <span>Inbound transaction rate</span>
                              <span className="text-indigo-600 font-mono text-xs">{simLoad} trx/hr</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="400"
                              step="10"
                              value={simLoad}
                              onChange={e => {
                                setSimLoad(Number(e.target.value));
                                if (simReport) setSimReport(null);
                              }}
                              className="w-full accent-indigo-600 bg-slate-100 rounded-lg appearance-none h-1.5"
                            />
                            <div className="flex justify-between text-[8px] text-slate-400 font-semibold font-mono">
                              <span>10 trx/hr (Low load)</span>
                              <span>400 trx/hr (Peak traffic)</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <span>Staff Resource Capacity (FTE)</span>
                              <span className="text-emerald-600 font-mono text-xs">{simFtes} Employees</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="30"
                              step="1"
                              value={simFtes}
                              onChange={e => {
                                setSimFtes(Number(e.target.value));
                                if (simReport) setSimReport(null);
                              }}
                              className="w-full accent-emerald-600 bg-slate-100 rounded-lg appearance-none h-1.5"
                            />
                            <div className="flex justify-between text-[8px] text-slate-400 font-semibold font-mono">
                              <span>1 FTE (Severe block)</span>
                              <span>30 FTE (Fully staffed)</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <span>Service Handing Multiplier</span>
                              <span className="text-amber-600 font-mono text-xs">{simMultiplier.toFixed(1)}x coefficient</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="3.0"
                              step="0.5"
                              value={simMultiplier}
                              onChange={e => {
                                setSimMultiplier(Number(e.target.value));
                                if (simReport) setSimReport(null);
                              }}
                              className="w-full accent-amber-500 bg-slate-100 rounded-lg appearance-none h-1.5"
                            />
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100">
                          <button
                            disabled={!simSelectedMapId || simActive}
                            onClick={() => {
                              setSimActive(true);
                              setSimProgress(0);
                              setSimReport(null);
                            }}
                            className="w-full py-4 bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-200 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            {simActive ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Analyzing flow latency: {simProgress}%
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-current" />
                                Initialize Dynamic Simulation
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Right: Sandbox Stage and Ticker Progress */}
                      <div className="lg:col-span-8 space-y-6">
                        
                        {/* Interactive flow motion stage */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative min-h-[220px] flex flex-col justify-between overflow-hidden">
                          {/* Ambient background grid lines */}
                          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                          
                          <div className="flex justify-between items-center relative z-10">
                            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">Live Dynamic Execution Board</span>
                            <span className={`h-2.5 w-2.5 rounded-full ${simActive ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                          </div>

                          {/* Schematic Node visualization mapping stage */}
                          <div className="py-6 flex justify-around items-center relative z-10">
                            {[
                              { label: 'Intake Payload', icon: Folder, color: 'text-indigo-400 bg-indigo-950/60 border-indigo-900' },
                              { label: 'Audit Validate', icon: Shield, color: 'text-amber-400 bg-amber-950/60 border-amber-900' },
                              { label: 'Operations Sync', icon: Zap, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-900' },
                              { label: 'SLA Dispatched', icon: CheckCircle, color: 'text-blue-400 bg-blue-950/60 border-blue-900' }
                            ].map((node, idx) => {
                              const activeNode = simActive && simProgress >= (idx * 25);
                              return (
                                <div key={idx} className="flex items-center w-full last:w-auto">
                                  <div className="flex flex-col items-center space-y-2">
                                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300 relative ${activeNode ? `${node.color} scale-110 shadow-lg shadow-indigo-500/10` : 'bg-slate-950 border-slate-850 text-slate-500'}`}>
                                      {/* Glowing aura element */}
                                      {activeNode && (
                                        <span className="absolute -inset-1 rounded-2xl bg-indigo-500/10 blur-md animate-pulse" />
                                      )}
                                      <node.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase text-center max-w-[80px] leading-tight ${activeNode ? 'text-slate-200' : 'text-slate-500'}`}>{node.label}</span>
                                  </div>
                                  
                                  {/* Connector Line with dynamic ticks */}
                                  {idx < 3 && (
                                    <div className="flex-1 h-0.5 bg-slate-800 mx-1.5 relative overflow-hidden min-w-[30px]">
                                      {activeNode && (
                                        <div className="absolute h-full w-4 bg-indigo-400/80 rounded blur-[1px] animate-[slide_1.5s_infinite_linear]" style={{ animationName: 'slide', animationDelay: `${idx * 0.4}s` }} />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Simulation state logs console feed */}
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 font-mono text-[9px] text-slate-400 space-y-1 select-none">
                            {simActive ? (
                              <>
                                <p className="text-slate-500 text-[8px]">&gt; INITIALIZING DYNAMIC ANALYSIS RUNTIME MATRIX...</p>
                                {simProgress >= 10 && <p className="text-indigo-400">&gt; Loading operational map schemas [SUCCESS]</p>}
                                {simProgress >= 40 && <p className="text-amber-400">&gt; Injecting telemetry workload loads: {simLoad} transactions / hr ...</p>}
                                {simProgress >= 70 && <p className="text-emerald-400">&gt; Simulating work throughput against {simFtes} available FTE models...</p>}
                              </>
                            ) : simReport ? (
                              <p className="text-emerald-500">&gt; DYNAMIC CHRONOLOGY REPORT PRE-COMPILED FOR: {simReport.mappedName.toUpperCase()}</p>
                            ) : (
                              <p className="text-slate-500">&gt; SANDBOX CONSOLE SILENT. PLEASE CONFIGURE MODEL AND INITIATE TEST.</p>
                            )}
                          </div>
                        </div>

                        {/* Simulation Analytics Outcome Report Card */}
                        {simReport && (
                          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 gap-4">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Performance Report</span>
                                <h3 className="font-black text-lg text-slate-800 flex items-center gap-1.5">
                                  <Sparkles className="w-5 h-5 text-amber-500" />
                                  Diagnostics for {simReport.mappedName}
                                </h3>
                              </div>

                              <span className={`px-4 py-1.5 border rounded-full text-xs font-black uppercase ${simReport.status === 'critical' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm shadow-red-50' : simReport.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-250 shadow-sm'}`}>
                                {simReport.status === 'critical' ? 'Critical SLA Danger' : simReport.status === 'warning' ? 'Suboptimal Congestion' : 'Optimum SLA Efficiency'}
                              </span>
                            </div>

                            {/* Key Simulated metrics comparison */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Throughput Rate</span>
                                <span className="text-lg font-mono font-black text-slate-800">{simReport.throughput}% successfully completed</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Average Cycle Duration</span>
                                <span className="text-lg font-mono font-black text-slate-800">{simReport.avgCycleTime.toFixed(1)} Days</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Primary Bottleneck</span>
                                <span className="text-sm font-black text-amber-600 truncate block md:max-w-xs">{simReport.bottleneckNode}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Est Backlog queue</span>
                                <span className="text-lg font-mono font-black text-slate-800">{simReport.queueLength} pending units</span>
                              </div>
                            </div>

                            {/* Compare Chart node handling times */}
                            <div className="bg-white border border-slate-150 rounded-2xl p-5">
                              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-4">Handling Delay Comparison: As-Is vs Simulated Settings</h4>
                              <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      { name: 'Intake validation', 'As-is delay': 20, 'Simulated delay': Math.round(15 * (simLoad/100)) },
                                      { name: 'Compliance filter', 'As-is delay': 85, 'Simulated delay': Math.round(85 * simMultiplier * (1 / (simFtes/5))) },
                                      { name: 'Dual Supervisor check', 'As-is delay': 60, 'Simulated delay': Math.round(10 * (simLoad/100)) },
                                      { name: 'Logistic dispatch', 'As-is delay': 15, 'Simulated delay': Math.round(15 * simMultiplier) },
                                    ]}
                                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} fontWeight="bold" />
                                    <YAxis stroke="#94a3b8" fontSize={8} fontWeight="bold" />
                                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                                    <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                                    <Bar dataKey="As-is delay" fill="#64748b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Simulated delay" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Recommendations text blocks with savings projection */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
                              <div className="md:col-span-8 p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                  <Sparkles className="w-4 h-4 text-indigo-500" />
                                  Diagnostic Actions & Optimization Advice
                                </h4>
                                <p className="text-xs leading-relaxed text-indigo-900 font-medium">{simReport.recommendation}</p>
                                
                                {simReport.redundantSteps.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-indigo-100/50">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Redundant non-value actions discovered:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {simReport.redundantSteps.map((step: string, idx: number) => (
                                        <span key={idx} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-150 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                                          <X className="w-3 h-3 text-red-500" /> {step}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="md:col-span-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] block mb-1">Financial Saving projections</span>
                                  <h5 className="font-extrabold text-2xl text-amber-900">${simReport.monthlySavings.toLocaleString()} <span className="text-xs font-medium text-amber-700 block">estimated cost saved / month</span></h5>
                                </div>
                                <div className="text-[9px] leading-tight text-amber-700/80 font-semibold pt-4">By merging non-value gateways and automating alerts via Integration Hub.</div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex overflow-hidden">
              {/* Sidebar */}
              <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  <section>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Settings</label>
                    <div className="space-y-4">
                      <input type="text" value={selectedMap.title} onChange={e => setSelectedMap({...selectedMap, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all" />
                      <textarea value={selectedMap.description || ''} onChange={e => setSelectedMap({...selectedMap, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                  </section>
                  {selectedMap.sop_id && (
                    <section className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <h4 className="text-xs font-bold text-indigo-700 mb-2">SOP Linked</h4>
                      <p className="text-[10px] text-indigo-600/70 mb-3 line-clamp-2">{selectedMap.sop_title}</p>
                      <button id="sync-sop-steps" onClick={syncSopSteps} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">Sync Steps</button>
                    </section>
                  )}
                  <button id="deploy-changes-v2" onClick={handleSave} disabled={saving} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50">
                    {saving ? 'Saving...' : 'Deploy Changes'}
                  </button>
                </div>
              </aside>

              {/* Canvas */}
              <div className="flex-1 relative bg-slate-50 overflow-hidden">
                <FlowRenderer
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  interactive={isEditMode}
                  fitView
                >
                  {isEditMode && (
                    <Panel position="top-right" className="m-4 h-[calc(100%-2rem)] w-72 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl flex flex-col rounded-3xl overflow-hidden pointer-events-auto">
                      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/50"><h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Node Vault</h3></div>
                      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                        <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Flow Elements</h4>
                          <div className="grid grid-cols-1 gap-2.5">
                            {[
                               { type: 'start', label: 'Terminal', colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                               { type: 'task', label: 'Task', colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                               { type: 'decision', label: 'Decision', colorClass: 'bg-amber-50 text-amber-600 border-amber-100' },
                               { type: 'io', label: 'Input/Output', colorClass: 'bg-blue-50 text-blue-600 border-blue-100' },
                               { type: 'end', label: 'End Terminal', colorClass: 'bg-red-50 text-red-600 border-red-100' }
                            ].map(item => (
                              <div 
                                key={item.type} 
                                draggable 
                                onDragStart={e => { 
                                  e.dataTransfer.setData('application/reactflow', item.type); 
                                  e.dataTransfer.setData('nodeLabel', item.label); 
                                }} 
                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-grab hover:border-indigo-400 hover:shadow-lg transition-all group"
                              >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${item.colorClass} group-hover:scale-110 transition-transform`}>
                                  <Zap className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-black text-slate-600">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                        {selectedMap.sop_id && currentSopSteps.length > 0 && (
                          <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">SOP Step Reservoir</h4>
                            <div className="space-y-3">
                              {currentSopSteps.filter(step => !nodes.some(n => n.data?.sop_step_id == step.id)).map(step => (
                                <div 
                                  key={step.id} 
                                  draggable 
                                  onDragStart={e => { 
                                    e.dataTransfer.setData('application/reactflow', 'sop_step'); 
                                    e.dataTransfer.setData('nodeLabel', step.step_description); 
                                    e.dataTransfer.setData('sopStepId', step.id.toString()); 
                                  }} 
                                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] cursor-grab hover:border-indigo-400 hover:bg-white hover:shadow-xl transition-all group"
                                >
                                  <div className="font-black text-indigo-600 mb-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                    Step {step.step_number}
                                  </div>
                                  <div className="line-clamp-3 leading-relaxed font-bold text-slate-600 group-hover:text-slate-900">{step.step_description}</div>
                                </div>
                              ))}
                              {currentSopSteps.filter(step => !nodes.some(n => n.data?.sop_step_id == step.id)).length === 0 && (
                                <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center text-[10px] font-black text-slate-300 uppercase">All steps used</div>
                              )}
                            </div>
                          </section>
                        )}
                      </div>
                    </Panel>
                  )}

                  {isEditMode && selectedElement && (
                    <Panel position="top-left" className="m-4 w-72 pointer-events-auto">
                      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl p-6 rounded-3xl space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400">Inspector</h3>
                          <button onClick={() => setSelectedElementId(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Label Content</label>
                            <textarea 
                              value={selectedElement.data.label} 
                              onChange={e => updateNodeLabel(selectedElement.id, e.target.value)} 
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold min-h-[140px] focus:ring-2 focus:ring-indigo-500 transition-all" 
                            />
                          </div>
                          <button onClick={deleteSelected} className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Remove Element</button>
                        </div>
                      </div>
                    </Panel>
                  )}
                </FlowRenderer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Process Orchestration</h2>
                <p className="text-slate-500 text-sm font-medium">Design or synchronize your workflow.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-4">
                <input placeholder="Mapping Title" value={newMapData.title} onChange={e => setNewMapData({...newMapData, title: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                <textarea placeholder="Process Description" value={newMapData.description} onChange={e => setNewMapData({...newMapData, description: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 font-medium" />
                <select value={newMapData.sop_id} onChange={e => setNewMapData({...newMapData, sop_id: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">
                  <option value="">Start from Scratch (Manual)</option>
                  {sops.map(sop => <option key={sop.id} value={sop.id}>{sop.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button disabled={!newMapData.title} onClick={handleCreateMap} className="p-6 bg-white border-2 border-slate-100 rounded-3xl font-black text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition-all flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center"><Plus /></div>
                  <span className="text-xs uppercase tracking-widest">Manual</span>
                </button>
                <button disabled={!newMapData.sop_id || !newMapData.title} onClick={() => handleGenerateFromSop(parseInt(newMapData.sop_id))} className="p-6 bg-indigo-600 text-white rounded-3xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><Zap className={isGenerating ? 'animate-pulse' : ''} /></div>
                  <span className="text-xs uppercase tracking-widest">{isGenerating ? 'Synthesizing...' : 'Magic Flow'}</span>
                </button>
              </div>
            </div>
            <div className="p-5 bg-slate-900 text-[10px] text-center text-white/40 font-black uppercase tracking-[0.3em]">AI-Powered Process Visualization Engine</div>
          </motion.div>
        </div>
      )}
      <DeleteConfirmation isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={confirmDeleteMap} title="Confirm Destruction" message="This will permanently delete this logic map. Proceed?" />
      
      <DeleteConfirmation 
        isOpen={showSaveWarning} 
        onClose={() => setShowSaveWarning(false)} 
        onConfirm={() => {
          setShowSaveWarning(false);
          handleSave();
        }} 
        title="Empty Map Warning" 
        message="Warning: You are about to save an empty process map. All current nodes and edges will be removed. Continue?" 
      />

      <DeleteConfirmation 
        isOpen={showSyncConfirm} 
        onClose={() => setShowSyncConfirm(false)} 
        onConfirm={() => {
          setShowSyncConfirm(false);
          if (selectedMap) loadMapDetails(selectedMap.id);
        }} 
        title="Sync SOP Steps" 
        message="Are you sure you want to reconcile steps from the linked SOP? This may override manual changes." 
      />

      {/* 2b. PROCESS LIBRARY REVISIONS DRAWER */}
      <AnimatePresence>
        {drawerMap && (
          <div className="fixed inset-0 z-55 flex justify-end bg-slate-900/40 backdrop-blur-sm">
            {/* Click outside backdrop to close */}
            <div className="absolute inset-0" onClick={() => setDrawerMap(null)} />
            
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-[100] border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Revisions Ledger</span>
                  <h3 className="text-lg font-black text-slate-900">{drawerMap.title}</h3>
                </div>
                <button onClick={() => setDrawerMap(null)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 border border-slate-150 rounded-xl">{drawerMap.description || 'No description listed.'}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-4">Version History Timeline</h4>
                  <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-6">
                    {historyVersions.map((version, idx) => (
                      <div key={idx} className="relative">
                        {/* Circle Bullet */}
                        <div className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${idx === 0 ? 'border-indigo-600 scale-125' : 'border-slate-300'}`}>
                          {idx === 0 && <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-900">{version.version}</span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded border border-emerald-150">Active Current</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium font-mono ml-auto">{version.date}</span>
                          </div>
                          
                          <p className="text-xs text-slate-705 leading-relaxed font-semibold">{version.comment}</p>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {version.author}</span>
                            
                            {idx > 0 && (
                              <button 
                                onClick={() => setShowRollbackConfirm(version.version)}
                                className="text-indigo-600 hover:text-indigo-800 hover:underline transition-all uppercase tracking-wider text-[9px]"
                              >
                                Revert to this revision
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                  onClick={() => {
                    setDrawerMap(null);
                    navigate(`/process-mapping/${drawerMap.id}`);
                  }}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center shadow-lg hover:shadow-indigo-100 transition-all"
                >
                  Load Flow Canvas
                </button>
                <button
                  onClick={() => setDrawerMap(null)}
                  className="px-5 py-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold"
                >
                  Close Vault
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2c. REVISIONS WORKFLOW MODALS AND FEEDBACK PANELS */}
      {showRollbackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <span className="p-2 bg-amber-50 rounded-xl text-amber-600"><AlertCircle className="w-5 h-5" /></span>
              <h3 className="font-extrabold text-base text-slate-900">Rollback Node Schema?</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                You are about to restore the process blueprint version <span className="font-mono font-black text-slate-800">{showRollbackConfirm}</span>. 
                This action will archive your currently active draft (<span className="font-mono text-slate-800 font-semibold">v2.4.1</span>) and overwrite the flow nodes layout instantly.
              </p>
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-[10px] font-mono text-slate-500">
                Restoring backup model compiled by Sarah Jenkins on specified version.
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowRollbackConfirm(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold"
              >
                No, Keep Draft
              </button>
              <button
                onClick={() => {
                  const restoredVer = showRollbackConfirm;
                  setShowRollbackConfirm(null);
                  setDrawerMap(null);
                  
                  // Move history version restored to the top to simulate real git branch merges
                  setHistoryVersions(prev => {
                    const idx = prev.findIndex(v => v.version === restoredVer);
                    if (idx < 0) return prev;
                    const items = [...prev];
                    const target = { ...items[idx], date: 'Just Now', author: 'Esraa Essam', comment: `Rolled back workspace state to version ${restoredVer}` };
                    items.splice(idx, 1);
                    return [target, ...items];
                  });

                  setShowVersionAlert({
                    title: 'Version Restored Successfully',
                    message: `Layout successfully synchronized with version ${restoredVer} structures. All micro-edges were re-routed.`
                  });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Yes, Restore Revision
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Version Control Alert dialog box */}
      {showVersionAlert && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-none">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-150 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">{showVersionAlert.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{showVersionAlert.message}</p>
              </div>
              <button
                onClick={() => setShowVersionAlert(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors"
              >
                Confirm Acknowledgement
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const ProcessMapping: React.FC = () => (
  <ReactFlowProvider>
    <ProcessMappingInner />
  </ReactFlowProvider>
);

export default ProcessMapping;
