import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Share2, 
  Eye, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  Table as TableIcon,
  Tag
} from 'lucide-react';
import { PermissionGate } from '../../components/Admin/PermissionGate';
import { useSOP } from './SOPContext';

export const SOPLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    sopList, 
    departments, 
    globalStatuses, 
    searchQuery, 
    setSearchQuery, 
    departmentFilter, 
    setDepartmentFilter, 
    statusFilter, 
    setStatusFilter, 
    setShowDeleteConfirm, 
    showToast 
  } = useSOP();

  // Additional filters matching the original design
  const [versionFilter, setVersionFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination state (عدد محدود Per page)
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Extract unique versions and tags from sopList
  const uniqueVersions = useMemo(() => {
    const set = new Set<string>();
    sopList.forEach(s => {
      if (s.version_number) set.add(s.version_number);
    });
    return Array.from(set).sort();
  }, [sopList]);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    sopList.forEach(s => {
      if (s.tags) {
        s.tags.split(',').forEach(t => {
          const trimmed = t.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [sopList]);

  // Filtered SOPs
  const filteredSops = useMemo(() => {
    return sopList.filter(s => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.title?.toLowerCase().includes(q) ||
        s.objective?.toLowerCase().includes(q) ||
        s.scope?.toLowerCase().includes(q) ||
        s.kpis?.toLowerCase().includes(q) ||
        s.tags?.toLowerCase().includes(q);

      // Status
      const matchesStatus = statusFilter === 'All' || 
        (s.status || '').toLowerCase() === statusFilter.toLowerCase();

      // Department
      const matchesDept = departmentFilter === 'All' || 
        s.department_name === departmentFilter || 
        String(s.department_id) === departmentFilter;

      // Version
      const matchesVersion = versionFilter === 'All' || 
        s.version_number === versionFilter;

      // Tag
      const matchesTag = tagFilter === 'All' || 
        (s.tags && s.tags.toLowerCase().includes(tagFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesDept && matchesVersion && matchesTag;
    });
  }, [sopList, searchQuery, statusFilter, departmentFilter, versionFilter, tagFilter]);

  // Reset to page 1 when any filter or itemsPerPage changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, departmentFilter, versionFilter, tagFilter, itemsPerPage]);

  // Pagination calculations
  const totalItems = filteredSops.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSops = filteredSops.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* FILTER BAR EXACTLY MATCHING PREVIOUS DESIGN */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search input with placeholder */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name, objective, scope, or KPIs..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
        </div>

        {/* Dropdowns: All Status, All Departments, All Versions, All Tags + View Mode */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-start md:justify-end">
          {/* Status Dropdown */}
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Under Review">Under Review</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Published">Published</option>
            {globalStatuses.filter(s => s.module_id === 'sops').map(s => (
              <option key={s.id} value={s.label}>{s.label}</option>
            ))}
          </select>

          {/* Department Dropdown */}
          <select 
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Version Dropdown */}
          <select 
            value={versionFilter}
            onChange={e => setVersionFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Versions</option>
            {uniqueVersions.map(v => (
              <option key={v} value={v}>v{v}</option>
            ))}
          </select>

          {/* Tags Dropdown */}
          <select 
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Tags</option>
            {uniqueTags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* View mode toggle (Table / Grid) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PROCEDURES TABLE VIEW (EXACTLY AS IN SCREENSHOT) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40">
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    SOP NAME
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    DEPARTMENT
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    STATUS
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono text-right">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSops.map(sop => (
                  <tr key={sop.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* SOP NAME */}
                    <td className="py-4 px-6">
                      <div>
                        <span 
                          onClick={() => navigate(`/sops/${sop.id}`)}
                          className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors cursor-pointer block"
                        >
                          {sop.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5 uppercase">
                          v{sop.version_number || '1.0'} • 
                        </span>
                      </div>
                    </td>

                    {/* DEPARTMENT */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider font-mono inline-block">
                        {sop.department_name || 'GENERAL'}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider font-mono inline-block">
                        {(sop.status || 'DRAFT').toUpperCase()}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-5">
                        {/* SHARE */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + `/sops/${sop.id}`);
                            showToast('Link copied to clipboard!', 'success');
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>SHARE</span>
                        </button>

                        {/* VIEW */}
                        <button
                          onClick={() => navigate(`/sops/${sop.id}`)}
                          className="text-emerald-600 hover:text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>VIEW</span>
                        </button>

                        {/* EDIT */}
                        <PermissionGate module="sop" action="edit">
                          <button
                            onClick={() => navigate(`/sops/edit/${sop.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>EDIT</span>
                          </button>
                        </PermissionGate>

                        {/* DELETE */}
                        <PermissionGate module="sop" action="delete">
                          <button
                            onClick={() => setShowDeleteConfirm(sop.id)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>DELETE</span>
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedSops.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No procedures match your search or filter criteria.</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting the filters or create a new procedure.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER (PER PAGE & PAGE NAVIGATION) */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Showing items info + Per page selector */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
              <span>
                Showing <strong className="font-bold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</strong> to <strong className="font-bold text-slate-800">{endIndex}</strong> of <strong className="font-bold text-slate-800">{totalItems}</strong> procedures
              </span>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-slate-500 text-xs font-semibold">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => setItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Right: Page navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      safeCurrentPage === page
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCEDURES GRID VIEW (ALTERNATIVE WITH PAGINATION) */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSops.map(sop => (
              <div key={sop.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider font-mono">
                        v{sop.version_number || '1.0'}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider font-mono">
                        {sop.status || 'DRAFT'}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + `/sops/${sop.id}`);
                        showToast('Link copied to clipboard!', 'success');
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                      title="Share Blueprint Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 
                      onClick={() => navigate(`/sops/${sop.id}`)}
                      className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {sop.title}
                    </h4>
                    <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {sop.objective || 'No objective provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-50 text-[11px] text-slate-500 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider font-mono">Department</span>
                      <span className="text-slate-700 font-semibold">{sop.department_name || 'GENERAL'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider font-mono">Review Cycle</span>
                      <span className="text-slate-700 font-semibold">{sop.review_date ? new Date(sop.review_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  {sop.tags && (
                    <div className="flex flex-wrap gap-1">
                      {sop.tags.split(',').map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded flex items-center gap-1 font-mono">
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{sop.steps?.length || 0} Steps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/sops/${sop.id}`)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <PermissionGate module="sop" action="edit">
                      <button 
                        onClick={() => navigate(`/sops/edit/${sop.id}`)}
                        className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Edit SOP"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGate>
                    <PermissionGate module="sop" action="delete">
                      <button 
                        onClick={() => setShowDeleteConfirm(sop.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Delete SOP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* GRID PAGINATION FOOTER */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span>
                Showing <strong className="font-bold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</strong> to <strong className="font-bold text-slate-800">{endIndex}</strong> of <strong className="font-bold text-slate-800">{totalItems}</strong> procedures
              </span>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-slate-500 text-xs font-semibold">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => setItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      safeCurrentPage === page
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPLibraryPage;
