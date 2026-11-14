import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Check, X, Pencil, Trash2 } from 'lucide-react';

interface CustomAddableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  allowAdd?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  disabled?: boolean;
}

export const CustomAddableSelect: React.FC<CustomAddableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-Select-',
  className = '',
  allowAdd = true,
  allowEdit = true,
  allowDelete = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localOptions, setLocalOptions] = useState<string[]>(options);
  const [isAdding, setIsAdding] = useState(false);
  const [newOptionVal, setNewOptionVal] = useState('');
  
  // State for editing an option
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editOptionVal, setEditOptionVal] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Sync options with props while preserving any custom-added choices
  useEffect(() => {
    setLocalOptions(prev => {
      const combined = [...options];
      prev.forEach(opt => {
        if (!combined.includes(opt)) {
          combined.push(opt);
        }
      });
      return combined;
    });
  }, [options]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setEditingOption(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when entering add mode
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingOption !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingOption]);

  const handleSelect = (val: string) => {
    if (editingOption !== null) return;
    onChange(val);
    setIsOpen(false);
    setIsAdding(false);
  };

  const handleAddNewOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newOptionVal.trim();
    if (!trimmed) return;

    if (!localOptions.includes(trimmed)) {
      setLocalOptions(prev => [...prev, trimmed]);
    }
    onChange(trimmed);
    setNewOptionVal('');
    setIsAdding(false);
    setIsOpen(false);
  };

  const handleStartEdit = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    setEditingOption(opt);
    setEditOptionVal(opt);
  };

  const handleSaveEdit = (e: React.FormEvent, oldOpt: string) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = editOptionVal.trim();
    if (!trimmed) return;

    setLocalOptions(prev => prev.map(o => o === oldOpt ? trimmed : o));
    if (value === oldOpt) {
      onChange(trimmed);
    }
    setEditingOption(null);
    setEditOptionVal('');
  };

  const handleDeleteOption = (e: React.MouseEvent, optToDelete: string) => {
    e.stopPropagation();
    setLocalOptions(prev => prev.filter(o => o !== optToDelete));
    if (value === optToDelete) {
      onChange('');
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-xs font-bold text-slate-800 bg-white border rounded-xl px-3 py-2.5 text-left outline-none transition-all ${
          disabled
            ? 'bg-slate-50 opacity-70 cursor-not-allowed border-slate-200'
            : isOpen 
              ? 'border-emerald-600 ring-1 ring-emerald-600/20 cursor-pointer' 
              : 'border-slate-200 hover:border-slate-300 cursor-pointer'
        }`}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <div className="flex items-center">
          <div className={`h-4 border-l mx-2 transition-colors ${isOpen ? 'border-emerald-600' : 'border-slate-200'}`} />
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-fadeIn">
          {/* Scrollable list of options */}
          <div className="overflow-y-auto flex-1 py-1">
            {localOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 italic">No options available</div>
            ) : (
              localOptions.map((opt) => {
                const isSelected = value === opt;
                const isEditingThis = editingOption === opt;

                if (isEditingThis) {
                  return (
                    <form
                      key={opt}
                      onSubmit={(e) => handleSaveEdit(e, opt)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-b border-slate-100"
                    >
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editOptionVal}
                        onChange={(e) => setEditOptionVal(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-[#1b5e20] text-white rounded-lg hover:bg-[#123e15] transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                        title="Save option"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingOption(null);
                        }}
                        className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </form>
                  );
                }

                return (
                  <div
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b5e20]/5 text-[#1b5e20]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex-1 truncate">{opt}</span>
                    <div className="flex items-center gap-1">
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1b5e20] shrink-0 mr-1" />}
                      
                      {allowEdit && (
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(e, opt)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition-all cursor-pointer"
                          title="Edit option / تعديل الخيار"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}

                      {allowDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOption(e, opt)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                          title="Delete option / حذف الخيار"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Option Footer */}
          {allowAdd && (
            <div className="border-t border-slate-100 p-1.5 bg-slate-50/50 rounded-b-2xl">
              {!isAdding ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAdding(true);
                  }}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full border border-blue-600/30 text-blue-600 font-sans text-[10px] font-black">
                    +
                  </span>
                  Add... / إضافة...
                </button>
              ) : (
                <form
                  onSubmit={handleAddNewOption}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 p-1"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter custom option..."
                    value={newOptionVal}
                    onChange={(e) => setNewOptionVal(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewOptionVal('');
                    }}
                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
