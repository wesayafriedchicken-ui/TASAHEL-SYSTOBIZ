import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const StartNode = ({ data }: NodeProps) => (
  <div className="px-6 py-3 shadow-md rounded-full bg-emerald-50 border-2 border-emerald-500 min-w-[140px] text-center group hover:bg-emerald-100 transition-colors">
    <div className="font-bold text-emerald-700 text-xs uppercase tracking-widest">{data.label || 'Start'}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
  </div>
);

export const EndNode = ({ data }: NodeProps) => (
  <div className="px-6 py-3 shadow-md rounded-full bg-rose-50 border-2 border-rose-500 min-w-[140px] text-center group hover:bg-rose-100 transition-colors">
    <div className="font-bold text-rose-700 text-xs uppercase tracking-widest">{data.label || 'End'}</div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-rose-500 border-2 border-white" />
  </div>
);

export const TaskNode = ({ data }: NodeProps) => (
  <div className="px-5 py-4 shadow-xl rounded-xl bg-white border-2 border-slate-200 min-w-[220px] max-w-[320px] hover:border-indigo-400 transition-all">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-300 border-2 border-white" />
    <div className="flex flex-col gap-1.5">
      {data.step_number && (
        <div className="flex items-center gap-2">
           <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Step {data.step_number}</span>
        </div>
      )}
      <div className="text-[11px] font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
        {data.label}
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-300 border-2 border-white" />
  </div>
);

export const DecisionNode = ({ data }: NodeProps) => (
  <div className="relative w-40 h-40 flex items-center justify-center group">
    {/* Diamond Shape using CSS transform */}
    <div className="absolute inset-4 bg-amber-50 border-2 border-amber-400 rotate-45 rounded-sm shadow-lg group-hover:bg-amber-100 transition-colors"></div>
    <div className="relative z-10 px-6 text-center text-[10px] font-extrabold text-amber-800 tracking-tight leading-tight uppercase">
      {data.label || 'Decision?'}
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500 border-2 border-white !-top-1" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3 bg-amber-500 border-2 border-white !-bottom-1" />
    <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 bg-amber-500 border-2 border-white !-left-1" />
    <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 bg-amber-500 border-2 border-white !-right-1" />
  </div>
);

export const InputOutputNode = ({ data }: NodeProps) => (
  <div className="relative px-8 py-4 min-w-[200px] text-center group">
    <div className="absolute inset-0 bg-blue-50 border-2 border-blue-400 -skew-x-12 shadow-md group-hover:bg-blue-100 transition-colors"></div>
    <div className="relative z-10 font-bold text-blue-700 text-[10px] uppercase tracking-wider">
      {data.label || 'Data Input/Output'}
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white" />
  </div>
);
