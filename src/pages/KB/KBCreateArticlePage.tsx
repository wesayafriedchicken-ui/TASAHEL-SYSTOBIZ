import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { useKB } from './KBContext';
import { KBArticleForm } from './KBArticleForm';

export const KBCreateArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryIdParam = searchParams.get('category_id');
  const { fetchArticles, showToast, categories } = useKB();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialCategoryId = categoryIdParam 
    ? parseInt(categoryIdParam) 
    : (categories.length > 0 ? categories[0]?.id : 0);

  const handleCreate = async (formData: any) => {
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
        author_id: currentUser.id,
        updated_by: currentUser.id,
        status: formData.status || 'Draft',
        content_type: formData.content_type || 'Article'
      };

      const res = await fetch('/api/kb', {
        method: 'POST',
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

      const created = await res.json();
      showToast('Article created and published successfully!', 'success');
      await fetchArticles();

      if (created && created.id) {
        navigate(`/kb/article/${created.id}`);
      } else {
        navigate('/kb/articles');
      }
    } catch (err: any) {
      console.error('Create article error:', err);
      showToast(`Failed to create article: ${err.message || String(err)}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/kb/articles')}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Back to Articles"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span>Create New Article</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft comprehensive documentation with rich formatting, attached files, and AI assistance.
            </p>
          </div>
        </div>
      </div>

      <KBArticleForm
        initialData={{ category_id: initialCategoryId }}
        isEditing={false}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        onCancel={() => navigate('/kb/articles')}
      />
    </div>
  );
};

export default KBCreateArticlePage;
