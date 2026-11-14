import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Settings, 
  Plus, 
  ChevronRight, 
  Home, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { KBProvider, useKB } from './KBContext';
import { Department, GlobalStatus, User } from '../../types';

const KBLayoutInner: React.FC = () => {
  const { checkPermission, canRead, canCreate, getPermLevel } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { categories, kbArticles, toast } = useKB();

  const hasModuleAccess = checkPermission('kb', 'view') && getPermLevel('kb') !== 3;

  if (!hasModuleAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto text-center my-12">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h3>
        <p className="text-sm text-slate-500 mb-6">
          You don't have permission to view the Knowledge Base module. Please contact your system administrator.
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

  // Determine current article or category for breadcrumbs
  const currentCategory = params.categoryId 
    ? categories.find(c => c.id === parseInt(params.categoryId!))
    : null;

  const currentArticle = params.articleId
    ? kbArticles.find(a => a.id === parseInt(params.articleId!))
    : null;

  const isArticlesTabActive = location.pathname === '/kb/articles' || location.pathname === '/kb' || location.pathname.startsWith('/kb/categories');
  const isManageTabActive = location.pathname === '/kb/manage';
  const isCreateTabActive = location.pathname === '/kb/create';
  const isReaderView = location.pathname.startsWith('/kb/article/');
  const isEditView = location.pathname.startsWith('/kb/edit/');

  const canViewArticles = canRead('kb', 'Articles Explorer') && getPermLevel('kb', 'Articles Explorer') !== 3;
  const canViewManage = (checkPermission('kb', 'settings') || checkPermission('kb', 'edit') || canRead('kb', 'Knowledge Base Management & Taxonomies') || canRead('kb', 'manage')) && getPermLevel('kb', 'Knowledge Base Management & Taxonomies') !== 3 && getPermLevel('kb', 'manage') !== 3;
  const canCreateArticle = (checkPermission('kb', 'create') || canCreate('kb') || canRead('kb', 'Article Authoring & Markdown Studio')) && canCreate('kb') && getPermLevel('kb', 'Article Authoring & Markdown Studio') !== 3;

  const isCurrentSectionAllowed = 
    (isArticlesTabActive ? canViewArticles : true) &&
    (isManageTabActive ? canViewManage : true) &&
    (isCreateTabActive ? canCreateArticle : true);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
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
          to="/kb/articles" 
          className={cn(
            "flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer",
            location.pathname === '/kb/articles' ? "text-indigo-600 font-bold" : ""
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Knowledge Base</span>
        </NavLink>

        {params.categoryId && currentCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="flex items-center gap-1 text-slate-700 font-bold">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentCategory.name}</span>
            </span>
          </>
        )}

        {isReaderView && (
          <>
            {currentArticle?.category_id && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <NavLink 
                  to={`/kb/categories/${currentArticle.category_id}`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {currentArticle.category_name || 'Category'}
                </NavLink>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-bold flex items-center gap-1 truncate max-w-xs">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">{currentArticle?.title || `Article #${params.articleId}`}</span>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded font-mono shrink-0">
                #KB-{params.articleId}
              </span>
            </span>
          </>
        )}

        {isCreateTabActive && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Article</span>
            </span>
          </>
        )}

        {isEditView && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Article</span>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded font-mono shrink-0">
                #KB-{params.articleId}
              </span>
            </span>
          </>
        )}

        {isManageTabActive && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              <span>Management & Settings</span>
            </span>
          </>
        )}
      </nav>

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 no-print">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Knowledge Base
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centralized library for procedures, services, products, and organizational policies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Module Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/50">
            {canViewArticles && (
              <NavLink
                to="/kb/articles"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all no-underline whitespace-nowrap cursor-pointer",
                  isArticlesTabActive
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Articles Explorer</span>
              </NavLink>
            )}

            {canViewManage && (
              <NavLink
                to="/kb/manage"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all no-underline whitespace-nowrap cursor-pointer",
                  isManageTabActive
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage</span>
              </NavLink>
            )}
          </div>

          {/* Create Button */}
          {canCreateArticle && (
            <button
              onClick={() => navigate('/kb/create')}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer",
                isCreateTabActive
                  ? "bg-indigo-600 text-white shadow-indigo-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              <Plus className="w-4 h-4" />
              <span>Create Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Outlet for Subroutes or Section Restriction */}
      {!isCurrentSectionAllowed ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto text-center my-12 animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Section Restricted</h3>
          <p className="text-sm text-slate-500 mb-6">
            Your role does not have permission to access this section of the Knowledge Base module.
          </p>
          <button
            onClick={() => {
              if (canViewArticles) navigate('/kb/articles');
              else navigate('/home');
            }}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Global KB Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={cn(
              "fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3",
              toast.type === 'success' ? "bg-slate-900 text-white" : "bg-rose-600 text-white"
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
            )}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const KBLayout: React.FC<{
  departments: Department[];
  globalStatuses: GlobalStatus[];
  users: User[];
  onSelectSop?: (id: number) => void;
  setActiveModule?: (mod: string) => void;
}> = ({
  departments,
  globalStatuses,
  users,
  onSelectSop,
  setActiveModule
}) => {
  return (
    <KBProvider
      departments={departments}
      globalStatuses={globalStatuses}
      users={users}
      onSelectSop={onSelectSop}
      setActiveModule={setActiveModule}
    >
      <KBLayoutInner />
    </KBProvider>
  );
};

export default KBLayout;
