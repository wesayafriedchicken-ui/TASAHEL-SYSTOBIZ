import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ClipboardList, GripVertical } from 'lucide-react';

const QAFormBuilder = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    department_id: '',
    items: [{ id: Date.now(), text: '', max_score: 10 }]
  });

  useEffect(() => {
    fetchForms();
    fetchDepartments();
  }, []);

  const fetchForms = async () => {
    const res = await fetch('/api/qa/forms');
    setForms(await res.json());
  };

  const fetchDepartments = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const res = await fetch('/api/departments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId || '1'
      }
    });
    if (res.ok) setDepartments(await res.json());
  };

  const addItem = () => {
    setNewForm({
      ...newForm,
      items: [...newForm.items, { id: Date.now(), text: '', max_score: 10 }]
    });
  };

  const removeItem = (id: number) => {
    setNewForm({
      ...newForm,
      items: newForm.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (id: number, field: string, value: any) => {
    setNewForm({
      ...newForm,
      items: newForm.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const handleSave = async () => {
    if (!newForm.title || !newForm.department_id) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch('/api/qa/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Status: ${res.status}`);
      }

      setIsCreating(false);
      setNewForm({
        title: '',
        department_id: '',
        items: [{ id: Date.now(), text: '', max_score: 10 }]
      });
      fetchForms();
    } catch (err) {
      console.error("Failed to save form", err);
      alert(err instanceof Error ? err.message : "Failed to save form");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-indigo-500" />
          Evaluation Checklists
        </h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Create New Form
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Form Title</label>
              <input
                type="text"
                value={newForm.title}
                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                placeholder="e.g., Sales Call Audit"
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Department</label>
              <select
                value={newForm.department_id}
                onChange={(e) => setNewForm({ ...newForm, department_id: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Checklist Items</h3>
              <button
                onClick={addItem}
                className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {newForm.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl group transition-all hover:bg-slate-100">
                  <div className="text-slate-400 cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateItem(item.id, 'text', e.target.value)}
                      placeholder={`Item ${index + 1}: e.g., Did the agent introduce themselves?`}
                      className="w-full bg-transparent border-none focus:ring-0 font-medium text-slate-700"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      value={item.max_score}
                      onChange={(e) => updateItem(item.id, 'max_score', parseInt(e.target.value))}
                      className="w-full bg-white border-none rounded-lg px-3 py-1 text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              onClick={() => setIsCreating(false)}
              className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Checklist
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {departments.find(d => d.id === form.department_id)?.name || 'General'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{form.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{form.items?.length || 0} evaluation points</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button className="text-indigo-600 text-sm font-bold hover:text-indigo-700">Edit Form</button>
                <span className="text-xs text-slate-400">Created {new Date(form.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QAFormBuilder;
