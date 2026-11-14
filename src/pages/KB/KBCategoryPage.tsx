import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { 
  FolderOpen, 
  Search, 
  LayoutGrid, 
  Kanban, 
  Table as TableIcon, 
  Database, 
  Share2, 
  Eye, 
  Plus, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useKB } from './KBContext';
import { cn } from '../../lib/utils';
import { stripHtmlAndMarkdown } from './kbUtils';
import { useAuth } from '../../context/AuthContext';

export const KBCategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { checkPermission } = useAuth();
  const { 
    kbArticles, 
    categories, 
    departments, 
    globalStatuses, 
    uniqueTags, 
    setActiveModule, 
    showToast 
  } = useKB();

  const currentCategory = useMemo(() => {
    return categories.find(c => c.id === parseInt(categoryId || '0'));
  }, [categories, categoryId]);

  const department = useMemo(() => {
    return departments.find(d => d.id === currentCategory?.department_id);
  }, [departments, currentCategory]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterTag, setFilterTag] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'table'>('grid');

  // Table pagination state (10 to 50)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const categoryArticles = useMemo(() => {
    const catIdNum = parseInt(categoryId || '0');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userDeptId = currentUser.department_id;
    const isUserAdmin = currentUser.role_id === 1 || 
                        currentUser.is_super_admin || 
                        currentUser.role === 'Admin' ||
                        currentUser.email === 'admin@gmail.com' ||
                        currentUser.email === 'esraaessoo19@gmail.com';

    return kbArticles.filter(article => {
      if (article.category_id !== catIdNum) return false;

      const term = (searchTerm || '').toLowerCase();
      const matchesSearch = 
        (article.title?.toLowerCase() || '').includes(term) ||
        (article.content?.toLowerCase() || '').includes(term) ||
        (article.tags?.toLowerCase() || '').includes(term);

      const matchesStatus = filterStatus === 'All' || article.status === filterStatus;
      const matchesTag = filterTag === 'All' || (article.tags && article.tags.split(',').map(t => t.trim()).includes(filterTag));

      // Visibility check
      const isAuthor = article.author_id === currentUser.id;
      let hasDeptAccess = true;
      if (!isUserAdmin && !isAuthor && article.visible_departments) {
        try {
          const visDepts: number[] = JSON.parse(article.visible_departments);
          if (Array.isArray(visDepts) && visDepts.length > 0) {
            hasDeptAccess = userDeptId ? visDepts.includes(userDeptId) : true;
          }
        } catch {
          hasDeptAccess = true;
        }
      }

      return matchesSearch && matchesStatus && matchesTag && hasDeptAccess;
    });
  }, [kbArticles, categoryId, searchTerm, filterStatus, filterTag]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTag, pageSize]);

  const totalArticles = categoryArticles.length;
  const totalPages = Math.ceil(totalArticles / pageSize) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return categoryArticles.slice(start, start + pageSize);
  }, [categoryArticles, currentPage, pageSize]);

  const handleShare = (e: React.MouseEvent, article: any) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/kb/article/${article.id}`;
    const text = `KB #${article.id}: ${article.title} - ${shareUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Knowledge Base link copied to clipboard! You can paste it into Chat.', 'success');
    }
    if (setActiveModule) {
      setActiveModule('comm');
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Hero / Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <NavLink 
            to="/kb/articles"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all shrink-0 cursor-pointer"
            title="Back to All Articles"
          >
            <ArrowLeft className="w-5 h-5" />
          </NavLink>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-md uppercase tracking-wider">
                {department?.name || 'General Department'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {totalArticles} {totalArticles === 1 ? 'article' : 'articles'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FolderOpen className="w-6 h-6 text-indigo-600" />
              <span>{currentCategory?.name || `Category #${categoryId}`}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing all documented knowledge, SOPs, and guidelines in this category.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {checkPermission('kb', 'create') && (
            <button
              onClick={() => navigate(`/kb/create?category_id=${categoryId}`)}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Article in this Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder={`Search within ${currentCategory?.name || 'this category'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Tags</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Statuses</option>
              {globalStatuses.filter(s => s.module_id === 'kb').map(s => (
                <option key={s.id} value={s.label}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                viewMode === 'kanban' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                viewMode === 'table' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
              title="Table List"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryArticles.map(article => (
            <div 
              key={article.id}
              onClick={() => navigate(`/kb/article/${article.id}`)}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col group relative"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded font-mono">
                  #KB-{article.id}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleShare(e, article)}
                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    title="Share / Copy Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Eye className="w-3 h-3" /> {article.view_count}
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {article.title}
              </h4>
              <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1 leading-relaxed">
                {stripHtmlAndMarkdown(article.content).substring(0, 150)}...
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {article.author_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs text-slate-500">{article.author_name}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {['Draft', 'Pending Approval', 'Published'].map(statusName => {
            const articlesForStatus = categoryArticles.filter(a => a.status === statusName);
            let colBg = 'border-slate-200 bg-slate-50';
            let labelBg = 'bg-slate-200 text-slate-700';

            if (statusName === 'Pending Approval') {
              colBg = 'border-amber-200 bg-amber-50/20';
              labelBg = 'bg-amber-100 text-amber-800';
            } else if (statusName === 'Published') {
              colBg = 'border-emerald-200 bg-emerald-50/20';
              labelBg = 'bg-emerald-100 text-emerald-800';
            }

            return (
              <div key={statusName} className={cn("rounded-2xl border p-4 flex flex-col min-h-[350px]", colBg)}>
                <div className="flex items-center justify-between mb-4">
                  <span className={cn("px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider", labelBg)}>
                    {statusName}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md shadow-sm">
                    {articlesForStatus.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[60vh]">
                  {articlesForStatus.map(article => (
                    <div 
                      key={article.id}
                      onClick={() => navigate(`/kb/article/${article.id}`)}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-indigo-600 font-bold">
                          #KB-{article.id}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Eye className="w-3 h-3" />
                          <span>{article.view_count}</span>
                        </div>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900 mt-2 mb-1 group-hover:text-indigo-600 line-clamp-2 transition-colors">
                        {article.title}
                      </h5>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                        <span className="truncate max-w-[120px]">{article.author_name}</span>
                        <span className="text-[10px] text-slate-400">
                          {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                  {articlesForStatus.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                      No articles in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View with Pagination Limit (10 to 50) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6 w-24">Ref</th>
                  <th className="p-4">Article</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Views</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedArticles.map(article => (
                  <tr 
                    key={article.id} 
                    onClick={() => navigate(`/kb/article/${article.id}`)}
                    className="hover:bg-indigo-50/20 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-mono font-bold rounded">
                        #KB-{article.id}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {article.title}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5 max-w-lg truncate">
                          {stripHtmlAndMarkdown(article.content).substring(0, 100)}...
                        </span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                          {article.author_name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs text-slate-600">{article.author_name}</span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        article.status === 'Published' ? "bg-emerald-100 text-emerald-700" :
                        article.status === 'Draft' ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                      )}>
                        {article.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-500 text-xs font-semibold">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {article.view_count}
                      </div>
                    </td>
                    <td className="p-4 pr-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/kb/article/${article.id}`)}
                          className="text-xs font-bold text-indigo-600 hover:underline px-2.5 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/kb/edit/${article.id}`)}
                          className="text-xs font-bold text-slate-600 hover:underline px-2.5 py-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-400 ml-2">
                Showing {totalArticles === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalArticles)} of {totalArticles} articles
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages)
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    return (
                      <React.Fragment key={page}>
                        {prevPage && page - prevPage > 1 && (
                          <span className="px-1 text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            currentPage === page
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryArticles.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <Database className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No articles in this category</h3>
          <p className="text-slate-500">Create the first article or try a different search.</p>
        </div>
      )}
    </div>
  );
};

export default KBCategoryPage;
