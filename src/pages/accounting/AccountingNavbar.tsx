import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calculator, Search, X, ChevronDown, 
  Bookmark, Check
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DropdownItem {
  label: string;
  path: string;
}

export interface DropdownGroup {
  groupTitle?: string;
  items: DropdownItem[];
}

export interface NavTabConfig {
  key: string;
  label: string;
  path?: string; // if direct route
  isDirect?: boolean;
  groups?: DropdownGroup[];
}

export const NAV_TABS: NavTabConfig[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/accounting/dashboard',
    isDirect: true
  },
  {
    key: 'customers',
    label: 'Customers',
    groups: [
      {
        groupTitle: 'Invoicing & Receivables',
        items: [
          { label: 'Invoices', path: '/accounting/customers/invoices' },
          { label: 'Credit Notes', path: '/accounting/customers/credit-notes' },
          { label: 'Payments', path: '/accounting/customers/payments' },
          { label: 'Products', path: '/accounting/customers/products' },
          { label: 'Customers', path: '/accounting/customers/list' }
        ]
      }
    ]
  },
  {
    key: 'vendors',
    label: 'Vendors',
    groups: [
      {
        groupTitle: 'Bills & Payables',
        items: [
          { label: 'Bills', path: '/accounting/vendors/bills' },
          { label: 'Refunds', path: '/accounting/vendors/refunds' },
          { label: 'Payments', path: '/accounting/vendors/payments' },
          { label: 'Products', path: '/accounting/vendors/products' },
          { label: 'Vendors', path: '/accounting/vendors/list' }
        ]
      }
    ]
  },
  {
    key: 'accounting',
    label: 'Accounting',
    groups: [
      {
        groupTitle: 'Transactions',
        items: [
          { label: 'Journal Entries', path: '/accounting/operations/journal-entries' }
        ]
      },
      {
        groupTitle: 'Assets & Liabilities',
        items: [
          { label: 'Assets', path: '/accounting/operations/assets' },
          { label: 'Loans', path: '/accounting/operations/loans' }
        ]
      },
      {
        groupTitle: 'Closing',
        items: [
          { label: 'Reconcile', path: '/accounting/operations/reconcile' },
          { label: 'Tax Returns', path: '/accounting/operations/tax-returns' },
          { label: 'Lock Dates...', path: '/accounting/operations/lock-dates' }
        ]
      }
    ]
  },
  {
    key: 'review',
    label: 'Review',
    groups: [
      {
        groupTitle: 'Control',
        items: [
          { label: 'Journal Items', path: '/accounting/review/journal-items' },
          { label: 'Audit Trail', path: '/accounting/review/audit-trail' },
          { label: 'Journal Audit', path: '/accounting/review/journal-audit' }
        ]
      },
      {
        groupTitle: 'Audit',
        items: [
          { label: 'Working Files', path: '/accounting/review/working-files' },
          { label: 'Annual Report', path: '/accounting/review/annual-report' }
        ]
      },
      {
        groupTitle: 'Inventory',
        items: [
          { label: 'Inventory Valuation', path: '/accounting/review/inventory-valuation' }
        ]
      },
      {
        groupTitle: 'Regularization Entries',
        items: [
          { label: 'Deferred Revenues', path: '/accounting/review/deferred-revenues' },
          { label: 'Deferred Expenses', path: '/accounting/review/deferred-expenses' }
        ]
      }
    ]
  },
  {
    key: 'reporting',
    label: 'Reporting',
    path: '/accounting/reporting',
    isDirect: true
  },
  {
    key: 'configuration',
    label: 'Configuration',
    groups: [
      {
        groupTitle: 'General',
        items: [
          { label: 'Settings', path: '/accounting/configuration/settings' },
          { label: 'Online Payments', path: '/accounting/configuration/online-payments' }
        ]
      },
      {
        groupTitle: 'Accounting',
        items: [
          { label: 'Chart of Accounts', path: '/accounting/configuration/chart-of-accounts' },
          { label: 'Taxes', path: '/accounting/configuration/taxes' },
          { label: 'Journals', path: '/accounting/configuration/journals' },
          { label: 'Currencies', path: '/accounting/configuration/currencies' },
          { label: 'Fiscal Positions', path: '/accounting/configuration/fiscal-positions' },
          { label: 'Multi-Ledger', path: '/accounting/configuration/multi-ledger' },
          { label: 'Checks', path: '/accounting/configuration/checks' },
          { label: 'Depreciation Models', path: '/accounting/configuration/depreciation-models' },
          { label: 'Return Types', path: '/accounting/configuration/return-types' },
          { label: 'Invoice Reminders', path: '/accounting/configuration/invoice-reminders' }
        ]
      },
      {
        groupTitle: 'Invoicing',
        items: [
          { label: 'Payment Terms', path: '/accounting/configuration/payment-terms' },
          { label: 'Product Categories', path: '/accounting/configuration/product-categories' }
        ]
      }
    ]
  }
];

export const AccountingNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [favoritesActive, setFavoritesActive] = useState(true);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Determine active tab key based on location.pathname
  const currentTab = (() => {
    const path = location.pathname;
    if (path === '/accounting' || path.startsWith('/accounting/dashboard')) return 'dashboard';
    if (path.startsWith('/accounting/customers')) return 'customers';
    if (path.startsWith('/accounting/vendors')) return 'vendors';
    if (path.startsWith('/accounting/operations')) return 'accounting';
    if (path.startsWith('/accounting/review')) return 'review';
    if (path.startsWith('/accounting/reporting')) return 'reporting';
    if (path.startsWith('/accounting/configuration')) return 'configuration';
    return 'dashboard';
  })();

  const handleTabClick = (e: React.MouseEvent, tab: NavTabConfig) => {
    e.preventDefault();
    e.stopPropagation();
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (tab.isDirect && tab.path) {
      setOpenDropdown(null);
      navigate(tab.path);
    } else {
      setOpenDropdown(prev => prev === tab.key ? null : tab.key);
    }
  };

  const handleMouseEnter = (key: string, isDirect?: boolean) => {
    if (isDirect) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(key);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    // 250ms buffer ensures moving cursor to dropdown never closes it
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 250);
  };

  const handleDropdownMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleItemClick = (path: string) => {
    setOpenDropdown(null);
    navigate(path);
  };

  return (
    <header 
      ref={navRef}
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[100] select-none shadow-xs transition-colors"
    >
      <div className="px-4 sm:px-6 flex items-center justify-between h-12 gap-4">
        
        {/* Left Side: Brand + Odoo Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 py-1">
          {/* Main Module Brand / Link */}
          <NavLink 
            to="/accounting/dashboard" 
            className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0 pr-1 mr-1"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="tracking-tight text-base font-extrabold hidden md:inline">
              Accounting
            </span>
          </NavLink>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          {/* Navigation Tabs with Multi-Level Dropdowns & Click/Hover Support */}
          <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {NAV_TABS.map((tab) => {
              const isActive = currentTab === tab.key;
              const isOpen = openDropdown === tab.key;
              const hasMultipleGroups = (tab.groups?.length || 0) > 1;

              return (
                <div 
                  key={tab.key} 
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(tab.key, tab.isDirect)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={(e) => handleTabClick(e, tab)}
                    aria-expanded={isOpen}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative",
                      isActive
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/60 font-bold shadow-2xs border border-emerald-200/80 dark:border-emerald-800/60"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent",
                      isOpen && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                    )}
                  >
                    <span>{tab.label}</span>
                    {!tab.isDirect && (
                      <ChevronDown className={cn(
                        "w-3 h-3 text-slate-400 transition-transform duration-200",
                        isOpen && "rotate-180 text-emerald-600 dark:text-emerald-400 font-bold"
                      )} />
                    )}
                  </button>

                  {/* Dropdown Menu (Card-style matching Odoo with Categorized Groups) */}
                  {!tab.isDirect && tab.groups && isOpen && (
                    <div 
                      onMouseEnter={handleDropdownMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      className={cn(
                        "absolute top-full pt-1.5 z-[110]",
                        tab.key === 'configuration' 
                          ? "left-0 sm:left-auto sm:right-0" 
                          : "left-0"
                      )}
                    >
                      <div className={cn(
                        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[calc(100vh-70px)] overflow-y-auto custom-scrollbar",
                        hasMultipleGroups 
                          ? "p-4 min-w-[320px] sm:min-w-[540px] md:min-w-[680px]" 
                          : "p-2 min-w-[220px]"
                      )}>
                        {hasMultipleGroups ? (
                          /* Multi-column grid for multi-group tabs (Accounting, Review, Configuration) */
                          <div className={cn(
                            "grid gap-6",
                            tab.groups.length === 2 && "grid-cols-1 md:grid-cols-2",
                            tab.groups.length === 3 && "grid-cols-1 md:grid-cols-3",
                            tab.groups.length >= 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
                          )}>
                            {tab.groups.map((group, gIdx) => (
                              <div key={gIdx} className="space-y-1">
                                {group.groupTitle && (
                                  <div className="px-2.5 pb-2 pt-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider select-none flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                                    <span>{group.groupTitle}</span>
                                  </div>
                                )}
                                <div className="space-y-0.5">
                                  {group.items.map((item) => {
                                    const isItemActive = location.pathname === item.path;
                                    return (
                                      <button
                                        key={item.path}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleItemClick(item.path);
                                        }}
                                        className={cn(
                                          "w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer",
                                          isItemActive
                                            ? "text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60"
                                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                                        )}
                                      >
                                        <span>{item.label}</span>
                                        {isItemActive && (
                                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Single-column menu for single-group tabs (Customers, Vendors) */
                          <div className="space-y-1">
                            {tab.groups[0]?.groupTitle && (
                              <div className="px-3 pt-1 pb-1.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider select-none flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                                <span>{tab.groups[0].groupTitle}</span>
                              </div>
                            )}
                            <div className="space-y-0.5">
                              {tab.groups[0]?.items.map((item) => {
                                const isItemActive = location.pathname === item.path;
                                return (
                                  <button
                                    key={item.path}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleItemClick(item.path);
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer",
                                      isItemActive
                                        ? "text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60"
                                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                                    )}
                                  >
                                    <span>{item.label}</span>
                                    {isItemActive && (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Odoo Iconic Search & Favorites Filter Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs shadow-2xs transition-all focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-500/20">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
            
            {/* Odoo Style "Favorites x" Pill Button inside Search input */}
            {favoritesActive ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold mr-1.5 shrink-0 select-none">
                <Bookmark className="w-2.5 h-2.5 fill-current" />
                <span>Favorites</span>
                <button
                  type="button"
                  onClick={() => setFavoritesActive(false)}
                  className="hover:text-indigo-900 dark:hover:text-white p-0.5 rounded cursor-pointer"
                  title="Remove favorites filter"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setFavoritesActive(true)}
                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mr-1.5 shrink-0 cursor-pointer"
                title="Add favorites filter"
              >
                + Fav
              </button>
            )}

            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs w-20 sm:w-28 md:w-36 font-medium"
            />

            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default AccountingNavbar;
