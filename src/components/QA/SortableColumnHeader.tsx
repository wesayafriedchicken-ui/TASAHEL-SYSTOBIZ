import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortableColumnHeaderProps {
  label: string;
  field: string;
  currentSortField: string;
  currentSortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = ({
  label,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  align = 'left',
  className = ''
}) => {
  const isActive = currentSortField === field;

  return (
    <th
      className={`p-3.5 select-none transition-colors group cursor-pointer hover:bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${isActive ? 'text-indigo-700 font-black' : 'text-slate-500'} ${className}`}
      onClick={() => onSort(field)}
    >
      <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span>{label}</span>
        <span className={`inline-flex items-center justify-center p-0.5 rounded transition-all ${
          isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 group-hover:text-slate-600'
        }`}>
          {isActive ? (
            currentSortDirection === 'asc' ? (
              <ArrowUp className="w-3 h-3 stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-3 h-3 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
          )}
        </span>
      </div>
    </th>
  );
};
