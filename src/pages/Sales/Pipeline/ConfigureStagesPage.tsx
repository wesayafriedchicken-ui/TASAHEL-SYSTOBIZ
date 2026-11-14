import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Sliders, 
  Save, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const ConfigureStagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { stages, saveStage, deleteStage, isSaving, showToast } = useSalesContext();

  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#4f46e5');
  const [newStageIsWon, setNewStageIsWon] = useState(false);

  const [editingStage, setEditingStage] = useState<any | null>(null);

  // Sorted stages
  const sortedStages = [...stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    const nextOrder = sortedStages.length > 0 
      ? Math.max(...sortedStages.map(s => s.order_index || 0)) + 1 
      : 0;

    const created = await saveStage({
      name: newStageName.trim(),
      color: newStageColor,
      order_index: nextOrder,
      is_won: newStageIsWon
    });

    if (created) {
      setNewStageName('');
      setNewStageColor('#4f46e5');
      setNewStageIsWon(false);
    }
  };

  const handleMoveOrder = async (stage: any, direction: 'up' | 'down') => {
    const currentIndex = sortedStages.findIndex(s => s.id === stage.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sortedStages.length) return;

    const targetStage = sortedStages[targetIndex];

    const currentOrder = stage.order_index || 0;
    const targetOrder = targetStage.order_index || 0;

    await Promise.all([
      saveStage({ ...stage, order_index: targetOrder }),
      saveStage({ ...targetStage, order_index: currentOrder })
    ]);
  };

  const handleDelete = async (stageId: number) => {
    if (stages.length <= 1) {
      showToast('Cannot delete the last remaining stage.', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to delete this stage? Deals in this stage should be re-assigned first.')) {
      await deleteStage(stageId);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;
    await saveStage(editingStage);
    setEditingStage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/sales/pipeline/deals')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deals Pipeline</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Pipeline Architecture
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Configure Pipeline Stages
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Customize sales stages, progression order, visual colors, and designation of won contracts.
          </p>
        </div>

        {/* Add New Stage Card */}
        <form onSubmit={handleAddStage} className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            <span>Create New Stage</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-6 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 block">Stage Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Executive Presentation, Legal Review..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 block">Accent Color</label>
              <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl">
                <input
                  type="color"
                  value={newStageColor}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                />
                <span className="text-xs font-mono font-bold text-slate-600 uppercase">{newStageColor}</span>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2.5 bg-white border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  checked={newStageIsWon}
                  onChange={(e) => setNewStageIsWon(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Is Closed Won Stage</span>
              </label>
            </div>
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-xs"
            >
              Add Stage
            </button>
          </div>
        </form>

        {/* Existing Stages List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide">
            Active Stages Workflow ({sortedStages.length})
          </h3>

          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
            {sortedStages.map((stage, idx) => (
              <div key={stage.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400 w-5 text-center">
                    #{idx + 1}
                  </span>
                  <span 
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color || '#6366f1' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{stage.name}</h4>
                      {stage.is_won && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Won Final Stage
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveOrder(stage, 'up')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg"
                    title="Move Up"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === sortedStages.length - 1}
                    onClick={() => handleMoveOrder(stage, 'down')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg"
                    title="Move Down"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingStage({ ...stage })}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(stage.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete Stage"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Stage Modal */}
      {editingStage && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Edit Pipeline Stage</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Stage Name</label>
                <input
                  type="text"
                  required
                  value={editingStage.name}
                  onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingStage.color || '#4f46e5'}
                    onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value })}
                    className="w-9 h-9 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingStage.color || '#4f46e5'}
                    onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={editingStage.is_won || false}
                    onChange={(e) => setEditingStage({ ...editingStage, is_won: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Mark as Closed Won stage</span>
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Save Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
