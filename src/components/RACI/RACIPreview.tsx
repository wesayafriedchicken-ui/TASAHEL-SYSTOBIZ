import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, HelpCircle, Info } from 'lucide-react';

interface RACIPreviewProps {
  sopId?: number;
  sopStepId?: number;
}

const RACIPreview: React.FC<RACIPreviewProps> = ({ sopId, sopStepId }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!sopId && !sopStepId) return;
      setLoading(true);
      try {
        const query = sopId ? `sop_id=${sopId}` : `sop_step_id=${sopStepId}`;
        const res = await fetch(`/api/raci?${query}`);
        const data = await res.json();
        setAssignments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch RACI preview", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sopId, sopStepId]);

  if (loading || assignments.length === 0) return null;

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'R': return 'bg-blue-500';
      case 'A': return 'bg-emerald-500';
      case 'C': return 'bg-amber-500';
      case 'I': return 'bg-slate-500';
      default: return 'bg-slate-200';
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {assignments.map(a => (
        <div key={a.id} className="flex items-center gap-1.5 bg-white border border-slate-100 pr-2 py-0.5 rounded-full shadow-sm" title={`${a.role_type}: ${a.user_name || a.role_name}`}>
          <div className={`${getRoleColor(a.role_type)} text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold`}>
            {a.role_type}
          </div>
          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">
            {a.user_name || a.role_name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RACIPreview;
