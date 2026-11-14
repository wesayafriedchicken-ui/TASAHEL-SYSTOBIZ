import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  Save
} from 'lucide-react';

const QAEvaluation = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedInteraction, setSelectedInteraction] = useState<any>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [formsRes, usersRes, samplesRes] = await Promise.all([
        fetch('/api/qa/forms'),
        fetch('/api/users'),
        fetch('/api/qa/sampling?limit=5')
      ]);
      setForms(await formsRes.json());
      setEmployees(await usersRes.json());
      setSamples(await samplesRes.json());
    } catch (err) {
      console.error("Failed to fetch evaluation data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSelect = (formId: string) => {
    const form = forms.find(f => f.id === parseInt(formId));
    setSelectedForm(form);
    // Initialize scores
    const initialScores: Record<number, number> = {};
    form?.items?.forEach((item: any) => {
      initialScores[item.id] = 0;
    });
    setScores(initialScores);
  };

  const handleScoreChange = (itemId: number, score: number) => {
    setScores({ ...scores, [itemId]: score });
  };

  const calculateTotal = () => {
    if (!selectedForm || !selectedForm.items) return 0;
    const totalEarned = Object.values(scores).reduce((a, b) => a + b, 0);
    const totalPossible = selectedForm.items.reduce((a: number, b: any) => a + (b.max_score || 10), 0);
    return Math.round((totalEarned / totalPossible) * 100);
  };

  const handleSubmit = async () => {
    if (!selectedForm || !selectedEmployee) {
      alert("Please select a form and an employee");
      return;
    }

    setIsSubmitting(true);
    const totalScore = calculateTotal();

    try {
      const res = await fetch('/api/qa/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: selectedForm.id,
          reviewer_id: 1, // Mocked current user
          employee_id: parseInt(selectedEmployee),
          process_name: selectedForm.title,
          department_id: selectedForm.department_id,
          interaction_id: selectedInteraction?.id || null,
          scores,
          total_score: totalScore,
          comments
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Status: ${res.status}`);
      }

      alert("Evaluation submitted successfully!");
      // Reset
      setSelectedForm(null);
      setSelectedEmployee('');
      setSelectedInteraction(null);
      setScores({});
      setComments('');
    } catch (err) {
      console.error("Failed to submit evaluation", err);
      alert(err instanceof Error ? err.message : "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshSamples = async () => {
    const res = await fetch('/api/qa/sampling?limit=5');
    setSamples(await res.json());
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading evaluation tools...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Selection & Samples */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-500" />
            Audit Setup
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Form</label>
              <select 
                onChange={(e) => handleFormSelect(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Choose a checklist...</option>
                {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employee to Audit</label>
              <select 
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Select employee...</option>
                {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Random Samples
            </h3>
            <button 
              onClick={refreshSamples}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {samples.map(sample => (
              <button
                key={sample.id}
                onClick={() => setSelectedInteraction(sample)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedInteraction?.id === sample.id 
                    ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{sample.type}</span>
                  <div className="flex items-center gap-2">
                    {sample.sentiment && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        sample.sentiment === 'Angry' ? 'bg-red-100 text-red-600' :
                        sample.sentiment === 'Negative' ? 'bg-orange-100 text-orange-600' :
                        sample.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {sample.sentiment}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{new Date(sample.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-900 truncate">{sample.customer_name}</div>
                <div className="text-xs text-slate-500 truncate">{sample.content || 'No content preview'}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: The Form */}
      <div className="lg:col-span-2">
        {selectedForm ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedForm.title}</h2>
                <p className="text-sm text-slate-500">Audit in progress for {employees.find(e => e.id === parseInt(selectedEmployee))?.name || '...'}</p>
                {selectedInteraction && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interaction:</span>
                    <span className="text-xs text-slate-600">{selectedInteraction.type} with {selectedInteraction.customer_name}</span>
                    {selectedInteraction.sentiment && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        selectedInteraction.sentiment === 'Angry' ? 'bg-red-100 text-red-600' :
                        selectedInteraction.sentiment === 'Negative' ? 'bg-orange-100 text-orange-600' :
                        selectedInteraction.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedInteraction.sentiment}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">{calculateTotal()}%</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Score</div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {selectedForm.items?.map((item: any, index: number) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {index + 1}
                      </span>
                      <p className="font-medium text-slate-800 leading-relaxed">{item.text}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Max: {item.max_score || 10}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {[...Array((item.max_score || 10) + 1)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleScoreChange(item.id, i)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          scores[item.id] === i 
                            ? 'bg-indigo-600 text-white shadow-md scale-110' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-8 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Reviewer Notes & Feedback</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide detailed feedback for the employee..."
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedForm(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Submit Evaluation
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-[600px] flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-6">
              <ClipboardCheck className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Form Selected</h3>
            <p className="text-slate-500 max-w-xs">
              Select an evaluation checklist and an employee from the left panel to begin the quality audit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QAEvaluation;
