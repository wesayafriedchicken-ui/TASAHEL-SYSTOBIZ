import React, { useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  LayoutDashboard, 
  List, 
  Tag, 
  BarChart3, 
  Share2, 
  Plus, 
  ChevronRight, 
  Home, 
  Upload, 
  Download, 
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  SlidersHorizontal,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CatalogProvider, useCatalog } from './CatalogContext';
import { useAuth } from '../../context/AuthContext';

const CatalogLayoutInner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    checkPermission, 
    canRead, 
    canCreate, 
    canImport, 
    canExport, 
    getPermLevel 
  } = useAuth();

  const { 
    products, 
    baseCurrency, 
    seedSampleData, 
    exportProductsCSV, 
    importProductsCSV, 
    isSaving, 
    toast 
  } = useCatalog();

  // Module-level permission check
  const hasModuleAccess = checkPermission('products', 'view') && getPermLevel('products') !== 3;

  if (!hasModuleAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto text-center my-12 animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h3>
        <p className="text-sm text-slate-500 mb-6">
          You don't have permission to view the Products & Services module. Please contact your system administrator.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const currentProduct = params.id 
    ? products.find(p => p.id.toString() === params.id)
    : null;

  const isDashboardActive = location.pathname === '/catalog/dashboard' || location.pathname === '/catalog';
  const isItemsActive = location.pathname.startsWith('/catalog/items');
  const isPricingActive = location.pathname.startsWith('/catalog/pricing');
  const isAnalyticsActive = location.pathname === '/catalog/analytics';
  const isIntegrationsActive = location.pathname === '/catalog/integrations';
  const isSettingsActive = location.pathname.startsWith('/catalog/setting') || location.pathname.startsWith('/catalog/settings');
  const isNewItem = location.pathname === '/catalog/items/new';
  const isItemProfile = params.id && location.pathname.includes(`/catalog/items/${params.id}`);

  // Granular tab permissions
  const canViewDashboard = canRead('products', 'Dashboard') && getPermLevel('products', 'Dashboard') !== 3;
  const canViewItems = canRead('products', 'Items Directory') && getPermLevel('products', 'Items Directory') !== 3;
  const canViewPricing = canRead('products', 'Prices & Promo Codes') && getPermLevel('products', 'Prices & Promo Codes') !== 3;
  const canViewAnalytics = canRead('products', 'Profitability Analytics') && getPermLevel('products', 'Profitability Analytics') !== 3;
  const canViewIntegrations = (canRead('products', 'Cross-Module Integrations') || canRead('products', 'Integrations')) && getPermLevel('products', 'Cross-Module Integrations') !== 3 && getPermLevel('products', 'Integrations') !== 3;
  const canViewSettings = (checkPermission('products', 'settings') || canRead('products', 'Manage Fields') || canRead('products', 'Catalog Settings')) && getPermLevel('products', 'Manage Fields') !== 3 && getPermLevel('products', 'Catalog Settings') !== 3;

  // Granular action button permissions
  const canImportCSV = canImport('products') && checkPermission('products', 'custom:catalog_import_items_csv') !== false && checkPermission('products', 'custom:catalog_csv_bulk_tools') !== false;
  const canExportCSV = canExport('products') && checkPermission('products', 'custom:catalog_export_items_csv') !== false && checkPermission('products', 'custom:catalog_csv_bulk_tools') !== false;
  const canSeedData = checkPermission('products', 'create') && checkPermission('products', 'custom:catalog_seed_mock_items') !== false;
  const canAddItem = canCreate('products') && checkPermission('products', 'custom:catalog_create_new_item') !== false;

  // Active section access check
  const isCurrentSectionAllowed = 
    (isDashboardActive ? canViewDashboard : true) &&
    (isItemsActive ? canViewItems : true) &&
    (isPricingActive ? canViewPricing : true) &&
    (isAnalyticsActive ? canViewAnalytics : true) &&
    (isIntegrationsActive ? canViewIntegrations : true) &&
    (isSettingsActive ? canViewSettings : true) &&
    (isNewItem ? canAddItem : true);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-6 right-8 z-[200] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-sm",
              toast.type === 'success' && "bg-emerald-50 text-emerald-800 border-emerald-200",
              toast.type === 'error' && "bg-red-50 text-red-800 border-red-200",
              toast.type === 'info' && "bg-indigo-50 text-indigo-800 border-indigo-200"
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-600 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-400 no-print flex-wrap">
        <NavLink 
          to="/home" 
          className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </NavLink>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

        <NavLink 
          to="/catalog/dashboard" 
          className={cn(
            "flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer",
            isDashboardActive ? "text-indigo-600 font-bold" : ""
          )}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Catalog</span>
        </NavLink>

        {isItemsActive && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <NavLink 
              to="/catalog/items" 
              className={cn(
                "hover:text-indigo-600 transition-colors cursor-pointer",
                location.pathname === '/catalog/items' ? "text-indigo-600 font-bold" : ""
              )}
            >
              Items Directory
            </NavLink>
          </>
        )}

        {isNewItem && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product/Service</span>
            </span>
          </>
        )}

        {isItemProfile && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-bold truncate max-w-xs flex items-center gap-1.5">
              <span className="truncate">{currentProduct?.name || `Item #${params.id}`}</span>
              {currentProduct?.sku && (
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-mono shrink-0">
                  {currentProduct.sku}
                </span>
              )}
            </span>
          </>
        )}

        {isPricingActive && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <NavLink 
              to="/catalog/pricing" 
              className="text-indigo-600 font-bold"
            >
              Pricing & Promo Codes
            </NavLink>
            {location.pathname.includes('/price-lists') && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-700 font-bold">Price Lists</span>
              </>
            )}
            {location.pathname.includes('/promo-codes') && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-700 font-bold">Promo Codes</span>
              </>
            )}
          </>
        )}

        {isAnalyticsActive && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-indigo-600 font-bold">Profitability Analytics</span>
          </>
        )}

        {isIntegrationsActive && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-indigo-600 font-bold">Cross-Module Integrations</span>
          </>
        )}

        {isSettingsActive && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <NavLink 
              to="/catalog/setting/Manage-Fields" 
              className="text-indigo-600 font-bold no-underline hover:underline"
            >
              Catalog Settings
            </NavLink>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-700 font-bold">Manage Fields</span>
          </>
        )}
      </nav>

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 no-print">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Products & Services
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  Base Currency: {baseCurrency}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centralized catalog specifications, multi-tier pricing sheets, margin audits, and CRM quote generator.
              </p>
            </div>
          </div>
        </div>

        {/* Global Catalog Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canImportCSV && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={importProductsCSV} 
                accept=".csv" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Import catalog items from CSV"
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>
            </>
          )}

          {canExportCSV && (
            <button
              onClick={exportProductsCSV}
              title="Export catalog items to CSV"
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {canSeedData && (
            <button
              onClick={seedSampleData}
              disabled={isSaving}
              title="Preload sample products, custom price lists, and promo coupons"
              className="px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Sample Data</span>
            </button>
          )}

          {canAddItem && (
            <button
              onClick={() => navigate('/catalog/items/new')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl shadow-inner border border-slate-200/60 overflow-x-auto no-scrollbar gap-1">
        {canViewDashboard && (
          <NavLink
            to="/catalog/dashboard"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all no-underline whitespace-nowrap cursor-pointer",
              isDashboardActive
                ? "bg-white text-slate-900 shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-500" />
            <span>Dashboard</span>
          </NavLink>
        )}

        {canViewItems && (
          <NavLink
            to="/catalog/items"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all no-underline whitespace-nowrap cursor-pointer",
              isItemsActive && !isNewItem && !isItemProfile
                ? "bg-white text-slate-900 shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <List className="w-4 h-4 text-indigo-500" />
            <span>Items Directory</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600">
              {products.length}
            </span>
          </NavLink>
        )}

        {canViewPricing && (
          <NavLink
            to="/catalog/pricing"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all no-underline whitespace-nowrap cursor-pointer",
              isPricingActive
                ? "bg-white text-slate-900 shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Tag className="w-4 h-4 text-emerald-500" />
            <span>Prices & Promo Codes</span>
          </NavLink>
        )}

        {canViewAnalytics && (
          <NavLink
            to="/catalog/analytics"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all no-underline whitespace-nowrap cursor-pointer",
              isAnalyticsActive
                ? "bg-white text-slate-900 shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <BarChart3 className="w-4 h-4 text-rose-500" />
            <span>Profitability Analytics</span>
          </NavLink>
        )}

        {canViewIntegrations && (
          <NavLink
            to="/catalog/integrations"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all no-underline whitespace-nowrap cursor-pointer",
              isIntegrationsActive
                ? "bg-white text-slate-900 shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Share2 className="w-4 h-4 text-blue-500" />
            <span>Integrations</span>
          </NavLink>
        )}

        {canViewSettings && (
          <NavLink
            to="/catalog/setting/Manage-Fields"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all no-underline whitespace-nowrap cursor-pointer",
              isSettingsActive
                ? "bg-white text-slate-900 shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <span>Manage Fields</span>
          </NavLink>
        )}
      </div>

      {/* Main Subpage Render Area */}
      {!isCurrentSectionAllowed ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto text-center my-12 animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Section Restricted</h3>
          <p className="text-sm text-slate-500 mb-6">
            Your role does not have permission to access this section of the Products & Services module.
          </p>
          <button
            onClick={() => {
              if (canViewDashboard) navigate('/catalog/dashboard');
              else if (canViewItems) navigate('/catalog/items');
              else navigate('/home');
            }}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export const CatalogLayout: React.FC = () => {
  return (
    <CatalogProvider>
      <CatalogLayoutInner />
    </CatalogProvider>
  );
};

export default CatalogLayout;
