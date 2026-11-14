import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { 
  ChevronRight, 
  Settings, 
  Printer, 
  Share2, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Clock, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Paperclip, 
  ExternalLink, 
  ArrowUpRight, 
  CheckCircle2, 
  Trash2, 
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  List
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useKB } from './KBContext';
import { KnowledgeArticle } from '../../types';
import { cn } from '../../lib/utils';
import { markdownToHtml, getMergedAttachmentsAndLinks, extractTableOfContents, TocHeading } from './kbUtils';

export const KBArticleReaderPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { checkPermission } = useAuth();
  const { 
    handleFeedback, 
    handleDeleteArticle, 
    onSelectSop, 
    setActiveModule, 
    showToast,
    products,
    canAccessSops
  } = useKB();

  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch article details & revisions
  useEffect(() => {
    if (!articleId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';

      try {
        const res = await fetch(`/api/kb/${articleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': userId
          }
        });

        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Article not found' : 'Failed to load article');
        }

        const data = await res.json();
        setArticle(data);

        // Fetch revisions
        fetch(`/api/kb/${articleId}/revisions`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': userId
          }
        })
          .then(r => (r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : []))
          .then(revs => setRevisions(Array.isArray(revs) ? revs : []))
          .catch(() => setRevisions([]));

      } catch (err: any) {
        console.error('Failed to fetch article detail:', err);
        setError(err.message || 'Failed to fetch article details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [articleId]);

  // Generate Table of Contents from both HTML and Markdown headings
  const toc: TocHeading[] = useMemo(() => {
    if (!article?.content) return [];
    return extractTableOfContents(article.content);
  }, [article?.content]);

  // Product or service linked
  const linkedProduct = useMemo(() => {
    if (!article?.product_id) return null;
    return products.find(p => Number(p.id) === Number(article.product_id)) || null;
  }, [article?.product_id, products]);

  // Copy reference ID / share link
  const handleCopyReference = () => {
    const text = `${window.location.origin}/kb/article/${articleId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRef(true);
      showToast(`Link copied: #KB-${articleId}`, 'success');
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  // Share to Chat
  const handleShareToChat = () => {
    if (!article) return;
    const text = `KB #${article.id}: ${article.title} - ${window.location.origin}/kb/article/${article.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Article reference copied! Switch to Communication to paste.', 'success');
    }
    if (setActiveModule) {
      setActiveModule('comm');
    }
  };

  // On Confirm Delete
  const confirmDelete = async () => {
    if (!article) return;
    setIsDeleting(true);
    const success = await handleDeleteArticle(article.id);
    setIsDeleting(false);
    if (success) {
      setShowDeleteModal(false);
      navigate('/kb/articles');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading article content...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Article Not Found</h3>
        <p className="text-xs text-slate-500 mb-6">{error || "The requested article could not be located or you don't have permission to read it."}</p>
        <button
          onClick={() => navigate('/kb/articles')}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles Explorer</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reader Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/kb/articles')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Back to Library</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* Reference Badge with Copy */}
          <button
            onClick={handleCopyReference}
            title="Click to copy article URL"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>#KB-{article.id}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleShareToChat}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Share Reference to Communication Module"
          >
            <Share2 className="w-4 h-4 text-indigo-600" />
          </button>

          <button 
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          {checkPermission('kb', 'edit') && (
            <button 
              onClick={() => navigate(`/kb/edit/${article.id}`)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Edit Article</span>
            </button>
          )}

          {checkPermission('kb', 'delete') && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Reader Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          <article className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Header Metadata */}
            <div className="mb-8 pb-6 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <NavLink 
                  to={`/kb/categories/${article.category_id}`}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold uppercase rounded-md tracking-wider transition-colors cursor-pointer"
                >
                  {article.category_name || 'Category'}
                </NavLink>

                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-md">
                  #KB-{article.id}
                </span>

                <span className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  article.status === 'Published' ? "bg-emerald-100 text-emerald-800" :
                  article.status === 'Draft' ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"
                )}>
                  {article.status}
                </span>
              </div>

              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-snug mb-4">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 text-xs uppercase">
                    {article.author_name?.charAt(0) || 'U'}
                  </div>
                  <span className="font-semibold text-slate-700">{article.author_name || 'Author'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{article.view_count} views</span>
                </div>
              </div>
            </div>

            {/* Video Content Embed if applicable */}
            {article.content_type === 'Video' && article.external_url && (
              <div className="mb-8 rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-md flex items-center justify-center">
                {article.external_url.includes('youtube.com') || article.external_url.includes('youtu.be') ? (
                  <iframe 
                    src={article.external_url.replace('watch?v=', 'embed/')} 
                    title="Video Player"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={article.external_url} 
                    controls 
                    className="w-full h-full"
                  />
                )}
              </div>
            )}

            {/* PDF Banner if applicable */}
            {article.content_type === 'PDF' && article.external_url && (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-rose-900">PDF Document Attached</h5>
                    <p className="text-xs text-rose-700">Open or download the associated PDF document.</p>
                  </div>
                </div>
                <a 
                  href={article.external_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <span>Open PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Rendered HTML / Markdown Content */}
            <div 
              className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-img:rounded-2xl prose-img:shadow-sm"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content) }}
            />

            {/* Helpful Feedback Widget */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 no-print bg-slate-50/50 p-6 rounded-2xl">
              <div>
                <h5 className="text-sm font-bold text-slate-900">Was this article helpful?</h5>
                <p className="text-xs text-slate-500">Help us improve the Knowledge Base with your feedback.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleFeedback(article.id, true)}
                  className="px-4 py-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Yes ({article.helpful_count})</span>
                </button>
                <button 
                  onClick={() => handleFeedback(article.id, false)}
                  className="px-4 py-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>No ({article.not_helpful_count})</span>
                </button>
              </div>
            </div>

            {/* Revisions History */}
            {revisions.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-100 no-print">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Revision History ({revisions.length})
                </h5>
                <div className="space-y-3">
                  {revisions.map((rev, index) => (
                    <div key={rev.id || index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">Version {revisions.length - index}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{rev.created_by_name || 'Admin'}</span>
                        </div>
                        {rev.change_summary && (
                          <p className="text-slate-500 mt-1 italic font-medium">
                            "{rev.change_summary}"
                          </p>
                        )}
                      </div>
                      <span className="text-slate-400 shrink-0 text-[10px]">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {article.related_articles && article.related_articles.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-100 no-print">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Related Articles
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {article.related_articles.map((rel: any) => (
                    <NavLink
                      key={rel.id}
                      to={`/kb/article/${rel.id}`}
                      className="p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200/60 hover:border-indigo-200 transition-all text-left block group"
                    >
                      <span className="text-[9px] font-mono text-indigo-600 font-bold">#KB-{rel.id}</span>
                      <h6 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mt-1">
                        {rel.title}
                      </h6>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {rel.content}
                      </p>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        {/* Right Sidebar: Meta, SOPs, Attachments, Table of Contents */}
        <div className="lg:col-span-4 space-y-6 no-print">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Article Details
            </h5>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Reference No.</span>
                <span className="font-mono font-bold text-indigo-600">#KB-{article.id}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-bold text-slate-800">{article.category_name}</span>
              </div>
              {(linkedProduct || article.product_id) && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Linked Service/Product</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/catalog/items/${linkedProduct?.id || article.product_id}`)}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[140px] flex items-center gap-1 cursor-pointer transition-colors text-right"
                    title={`View ${linkedProduct?.name || 'Item'} in Catalog`}
                  >
                    <span className="truncate">{linkedProduct?.name || `Item #${article.product_id}`}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Content Type</span>
                <span className="font-bold text-slate-800">{article.content_type}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  article.status === 'Published' ? "bg-emerald-100 text-emerald-700" :
                  article.status === 'Draft' ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                )}>
                  {article.status}
                </span>
              </div>
              {article.approver_name && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Approved By</span>
                  <span className="font-bold text-slate-800">{article.approver_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Views</span>
                <span className="font-bold text-slate-800">{article.view_count}</span>
              </div>
            </div>
          </div>

          {/* Linked SOP Card */}
          {canAccessSops !== false && article.related_sop_id && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-500" />
                <span>Related Procedure</span>
              </h5>
              <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                <p className="text-sm font-bold text-slate-900 mb-1">{article.related_sop_title}</p>
                <p className="text-xs text-slate-500 mb-3">Linked Standard Operating Procedure</p>
                <button 
                  onClick={() => onSelectSop && onSelectSop(article.related_sop_id!)}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View SOP</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Attachments & Links Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-500" />
              <span>Attachments & Links</span>
            </h5>
            <div className="space-y-2">
              {(() => {
                const items = getMergedAttachmentsAndLinks(article);
                if (items.length === 0) {
                  return <p className="text-xs text-slate-400 italic">No attachments or links for this article.</p>;
                }
                return items.map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.url} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all group text-left"
                  >
                    {item.is_link ? (
                      <ExternalLink className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">
                        {item.url}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 ml-auto shrink-0" />
                  </a>
                ));
              })()}
            </div>
          </div>

          {/* Table of Contents Card (Under Attachments & Links) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <List className="w-4 h-4 text-indigo-500" />
                <span>Table of Contents</span>
              </h5>
              {toc.length > 0 && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {toc.length} {toc.length === 1 ? 'heading' : 'headings'}
                </span>
              )}
            </div>
            <nav className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {toc.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No headings found for this article.</p>
              ) : (
                toc.map((item, i) => (
                  <a 
                    key={`toc-${item.id}-${i}`} 
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const targetEl = document.getElementById(item.id);
                      if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        window.history.pushState(null, '', `#${item.id}`);
                      }
                    }}
                    className={cn(
                      "block text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors truncate py-1.5 px-2 cursor-pointer",
                      item.level === 1 ? "font-bold text-slate-800" : item.level === 2 ? "pl-3.5 font-medium text-slate-700" : "pl-6 text-slate-500"
                    )}
                    title={item.text}
                  >
                    {item.text}
                  </a>
                ))
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-bold text-slate-900">Delete Article?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete article <strong className="text-slate-800">#KB-{article.id}</strong> ("{article.title}")? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KBArticleReaderPage;
