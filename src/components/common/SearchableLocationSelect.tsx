import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check, X, Globe, MapPin, Building2 } from 'lucide-react';
import { LocationItem } from '../../lib/locationHelpers';

interface SearchableLocationSelectProps {
  items: (LocationItem | string)[];
  value: string;
  onChange: (value: string, item?: LocationItem) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  iconType?: 'country' | 'county' | 'city';
  disabled?: boolean;
  allowCustom?: boolean;
  className?: string;
  id?: string;
}

export const SearchableLocationSelect: React.FC<SearchableLocationSelectProps> = ({
  items,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search or type...',
  iconType = 'city',
  disabled = false,
  allowCustom = true,
  className = '',
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize items to LocationItem[]
  const normalizedItems: LocationItem[] = useMemo(() => {
    return items.map(item => {
      if (typeof item === 'string') {
        return { name: item };
      }
      return item;
    });
  }, [items]);

  // Current selected item
  const selectedItem = useMemo(() => {
    if (!value) return null;
    return normalizedItems.find(
      it => it.name.toLowerCase() === value.toLowerCase() || (it.code && it.code.toLowerCase() === value.toLowerCase())
    ) || { name: value };
  }, [normalizedItems, value]);

  // Filtered items based on search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedItems;

    return normalizedItems.filter(item => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.code ? item.code.toLowerCase().includes(q) : false;
      const matchSub = item.subtext ? item.subtext.toLowerCase().includes(q) : false;
      return matchName || matchCode || matchSub;
    });
  }, [normalizedItems, searchQuery]);

  // Reset highlight index when filtered items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredItems]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input on opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (item: LocationItem) => {
    onChange(item.name, item);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectCustom = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    onChange(trimmed, { name: trimmed });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
      scrollToHighlighted(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
      scrollToHighlighted(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        handleSelect(filteredItems[highlightedIndex]);
      } else if (allowCustom && searchQuery.trim()) {
        handleSelectCustom();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const scrollToHighlighted = (index: number) => {
    if (!listRef.current) return;
    const elements = listRef.current.querySelectorAll('[data-list-item]');
    if (elements[index]) {
      (elements[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  // Determine icon to render
  const renderIcon = () => {
    if (selectedItem?.flag) {
      return <span className="text-base leading-none select-none mr-1.5">{selectedItem.flag}</span>;
    }
    if (iconType === 'country') {
      return <Globe className="w-3.5 h-3.5 text-emerald-700/70 mr-1.5 shrink-0" />;
    }
    if (iconType === 'county') {
      return <MapPin className="w-3.5 h-3.5 text-indigo-600/70 mr-1.5 shrink-0" />;
    }
    return <Building2 className="w-3.5 h-3.5 text-slate-500/70 mr-1.5 shrink-0" />;
  };

  const isCustomMatchPossible = allowCustom && searchQuery.trim().length > 0 && 
    !filteredItems.some(it => it.name.toLowerCase() === searchQuery.trim().toLowerCase());

  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full group flex items-center justify-between text-xs font-bold text-slate-800 bg-white border rounded-xl px-3 py-2.5 text-left outline-none transition-all ${
          disabled
            ? 'bg-slate-50 opacity-70 cursor-not-allowed border-slate-200 text-slate-400'
            : isOpen
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm cursor-pointer'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40 cursor-pointer'
        }`}
      >
        <div className="flex items-center min-w-0 flex-1 mr-2">
          {renderIcon()}
          <span className={`truncate text-xs ${value ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}`}>
            {value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 hover:text-rose-600 text-slate-400 rounded-md transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
        </div>
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div 
          className="absolute left-0 z-50 w-full min-w-[240px] mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ maxHeight: '320px' }}
        >
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 placeholder:text-slate-400 placeholder:font-normal transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-400 font-medium">
              <span>{filteredItems.length} available</span>
              {allowCustom && <span>Type to filter or add</span>}
            </div>
          </div>

          {/* List of Options */}
          <div ref={listRef} className="overflow-y-auto flex-1 p-1 divide-y divide-slate-50/50 max-h-56">
            {filteredItems.length === 0 && !isCustomMatchPossible ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
                No matching locations found
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = value.toLowerCase() === item.name.toLowerCase() || (item.code && value.toLowerCase() === item.code.toLowerCase());
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={`${item.name}-${idx}`}
                    data-list-item
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-2.5 py-2 text-xs rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-black'
                        : isHighlighted
                          ? 'bg-slate-100/80 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1 mr-2">
                      {item.flag ? (
                        <span className="text-base leading-none select-none mr-2">{item.flag}</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2 shrink-0" />
                      )}
                      
                      <div className="truncate">
                        <span className="block truncate">{item.name}</span>
                        {item.subtext && (
                          <span className="block text-[10px] font-normal text-slate-400 leading-tight truncate">
                            {item.subtext}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.code && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {item.code}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 ml-1" />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Custom Entry Action */}
            {isCustomMatchPossible && (
              <div
                data-list-item
                onClick={handleSelectCustom}
                className="mt-1 p-2 bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200/60 rounded-xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                    +
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    Use custom: <span className="underline decoration-emerald-500">"{searchQuery.trim()}"</span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                  Enter ↵
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
