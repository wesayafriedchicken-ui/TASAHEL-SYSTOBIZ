import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, Trash2 } from 'lucide-react';
import { useKB } from './KBContext';
import { KBArticleForm } from './KBArticleForm';
import { KnowledgeArticle } from '../../types';

export const KBEditArticlePage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { fetchArticles, showToast, handleDeleteArticle, categories } = useKB();

  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!articleId) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id') || '1';
        const res = await fetch(`/api/kb/${articleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': userId
          }
        });
        if (!res.ok) throw new Error('Article not found');
        const data = await res.json();
        setArticle(data);
      } catch (err: any) {
        console.error('Failed to load article for edit:', err);
        showToast('Failed to load article for editing', 'error');
        navigate('/kb/articles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [articleId, navigate, showToast]);

  const handleUpdate = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const currentUser = JSON.parse(localStorage.getItem('user') || '{"id": 1, "name": "Admin User"}');

      const activeCat = categories.find(c => c.id === formData.category_id);
      const activeCName = activeCat?.name?.toLowerCase() || '';
      const isProdOrServ = activeCName.includes('product') || 
                           activeCName.includes('service');
      const finalProductId = isProdOrServ ? formData.product_id : null;

      const payload = {
        ...formData,
        product_id: finalProductId,
        updated_by: currentUser.id,
        status: formData.status || 'Draft',
        content_type: formData.content_type || 'Article'
      };

      const res = await fetch(`/api/kb/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error: ${res.status}`);
      }

      showToast('Article updated successfully!', 'success');
      await fetchArticles();
      navigate(`/kb/article/${articleId}`);
    } catch (err: any) {
      console.error('Update article error:', err);
      showToast(`Failed to update article: ${err.message || String(err)}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!articleId) return;
    const success = await handleDeleteArticle(parseInt(articleId));
    if (success) {
      setShowDeleteModal(false);
      navigate('/kb/articles');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading article editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/kb/article/${articleId}`)}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Back to Article View"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-600" />
                <span>Edit Article</span>
              </h1>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-mono font-bold rounded-lg">
                #KB-{articleId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Update content, change attachments, manage department permissions and track revision notes.
            </p>
          </div>
        </div>
      </div>

      {article && (
        <KBArticleForm
          initialData={article}
          isEditing={true}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
          onCancel={() => navigate(`/kb/article/${articleId}`)}
          onDelete={() => setShowDeleteModal(true)}
        />
      )}

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
                Are you sure you want to delete article <strong className="text-slate-800">#KB-{articleId}</strong>? This action cannot be undone.
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
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KBEditArticlePage;
