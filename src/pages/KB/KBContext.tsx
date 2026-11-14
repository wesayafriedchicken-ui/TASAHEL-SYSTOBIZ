import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Department, GlobalStatus, User, SOP, Product, KnowledgeArticle, ArticleCategory } from '../../types';
import { useAuth } from '../../context/AuthContext';

export interface KBContextType {
  kbArticles: KnowledgeArticle[];
  setKbArticles: React.Dispatch<React.SetStateAction<KnowledgeArticle[]>>;
  categories: ArticleCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ArticleCategory[]>>;
  sops: SOP[];
  products: Product[];
  departments: Department[];
  globalStatuses: GlobalStatus[];
  users: User[];
  uniqueTags: string[];
  isLoading: boolean;
  toast: { message: string; type: 'success' | 'error' } | null;
  setToast: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' } | null>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  fetchArticles: (customParams?: { search?: string; category_id?: string; department_id?: string; author_id?: string; status?: string }) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSops: () => void;
  fetchKBProducts: () => void;
  fetchKbStatuses: () => Promise<void>;
  fetchSystemRoles: () => Promise<void>;
  kbStatuses: any[];
  statusFormData: { label: string; color: string; is_default: boolean };
  setStatusFormData: React.Dispatch<React.SetStateAction<{ label: string; color: string; is_default: boolean }>>;
  editingStatus: any | null;
  setEditingStatus: React.Dispatch<React.SetStateAction<any | null>>;
  systemRoles: any[];
  handleSaveStatus: (e: React.FormEvent) => Promise<void>;
  handleDeleteStatus: (id: number) => Promise<void>;
  handleTogglePermission: (role: any, action: string) => Promise<void>;
  categoryFormData: { name: string; department_id: number };
  setCategoryFormData: React.Dispatch<React.SetStateAction<{ name: string; department_id: number }>>;
  editingCategory: ArticleCategory | null;
  setEditingCategory: React.Dispatch<React.SetStateAction<ArticleCategory | null>>;
  handleSaveCategory: (e: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (id: number) => Promise<boolean>;
  handleDeleteArticle: (id: number) => Promise<boolean>;
  handleFeedback: (id: number, helpful: boolean) => Promise<void>;
  canAccessSops: boolean;
  canAccessProducts: boolean;
  onSelectSop?: (id: number) => void;
  setActiveModule?: (mod: string) => void;
}

const KBContext = createContext<KBContextType | null>(null);

export const useKB = () => {
  const context = useContext(KBContext);
  if (!context) {
    throw new Error('useKB must be used within a KBProvider');
  }
  return context;
};

export const KBProvider: React.FC<{
  children: React.ReactNode;
  departments: Department[];
  globalStatuses: GlobalStatus[];
  users: User[];
  onSelectSop?: (id: number) => void;
  setActiveModule?: (mod: string) => void;
}> = ({
  children,
  departments,
  globalStatuses,
  users,
  onSelectSop,
  setActiveModule
}) => {
  const { user, canRead, getPermLevel, checkPermission, refreshUser } = useAuth();
  const [kbArticles, setKbArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Status & Role Management States
  const [kbStatuses, setKbStatuses] = useState<any[]>([]);
  const [statusFormData, setStatusFormData] = useState({ label: '', color: '#64748b', is_default: false });
  const [editingStatus, setEditingStatus] = useState<any | null>(null);
  const [systemRoles, setSystemRoles] = useState<any[]>([]);

  // Category Management States
  const [categoryFormData, setCategoryFormData] = useState({ name: '', department_id: 1 });
  const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null);

  const isSuperAdmin = useMemo(() => {
    return (
      user?.role === 'Admin' ||
      user?.role === 'Super Admin' ||
      (user as any)?.is_super_admin === true ||
      user?.id === 1 ||
      user?.id === 337 ||
      user?.email === 'admin@gmail.com' ||
      user?.email === 'admin@opex.com' ||
      user?.email === 'esraaessoo19@gmail.com'
    );
  }, [user]);

  const canAccessSops = useMemo(() => {
    if (isSuperAdmin) return true;
    return canRead('SOPs') && getPermLevel('SOPs') !== 3 && checkPermission('SOPs', 'view');
  }, [isSuperAdmin, canRead, getPermLevel, checkPermission]);

  const canAccessProducts = useMemo(() => {
    if (isSuperAdmin) return true;
    return canRead('Products/Services') && getPermLevel('Products/Services') !== 3 && checkPermission('Products/Services', 'view');
  }, [isSuperAdmin, canRead, getPermLevel, checkPermission]);

  const canAccessAdmin = useMemo(() => {
    if (isSuperAdmin) return true;
    return canRead('Admin') && getPermLevel('Admin') !== 3;
  }, [isSuperAdmin, canRead, getPermLevel]);

  const getAuthHeaders = useCallback((contentTypeJson = false): Record<string, string> => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const storedUserId = user?.id ? String(user.id) : (localStorage.getItem('user_id') || '1');
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    if (contentTypeJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (storedUserId && storedUserId !== 'null' && storedUserId !== 'undefined') {
      headers['x-user-id'] = storedUserId;
    }
    return headers;
  }, [user?.id]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    kbArticles.forEach(a => {
      if (a.tags) {
        a.tags.split(',').forEach(t => {
          const trimmed = t.trim();
          if (trimmed) tagsSet.add(trimmed);
        });
      }
    });
    return Array.from(tagsSet).sort();
  }, [kbArticles]);

  const fetchArticles = useCallback(async (customParams?: { search?: string; category_id?: string; department_id?: string; author_id?: string; status?: string }) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (customParams) {
        if (customParams.search) params.append('search', customParams.search);
        if (customParams.category_id && customParams.category_id !== 'All') params.append('category_id', customParams.category_id);
        if (customParams.department_id && customParams.department_id !== 'All') params.append('department_id', customParams.department_id);
        if (customParams.author_id && customParams.author_id !== 'All') params.append('author_id', customParams.author_id);
        if (customParams.status && customParams.status !== 'All') params.append('status', customParams.status);
      }
      const headers = getAuthHeaders();
      const res = await fetch(`/api/kb?${params.toString()}`, { headers });
      if (!res.ok) {
        setKbArticles([]);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setKbArticles([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setKbArticles(data);
      } else {
        setKbArticles([]);
      }
    } catch (err) {
      console.warn("Failed to fetch articles:", err);
      setKbArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchCategories = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/kb/categories', { headers });
      if (!res.ok) {
        setCategories([]);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setCategories([]);
        return;
      }
      const cats = await res.json();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.warn("fetchCategories Error:", err);
      setCategories([]);
    }
  }, [getAuthHeaders]);

  const fetchSops = useCallback(async () => {
    if (!canAccessSops) {
      setSops([]);
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/sops', { headers });
      if (!res.ok) {
        setSops([]);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setSops([]);
        return;
      }
      const data = await res.json();
      setSops(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not fetch SOPs in KB:", err);
      setSops([]);
    }
  }, [canAccessSops, getAuthHeaders]);

  const fetchKBProducts = useCallback(async () => {
    if (!canAccessProducts) {
      setProducts([]);
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/products', { headers });
      if (!res.ok) {
        setProducts([]);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setProducts([]);
        return;
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not fetch products in KB:", err);
      setProducts([]);
    }
  }, [canAccessProducts, getAuthHeaders]);

  const fetchKbStatuses = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/admin/statuses', { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setKbStatuses(data.filter((s: any) => s.module_id === 'kb'));
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch KB statuses:", err);
    }
  }, [getAuthHeaders]);

  const fetchSystemRoles = useCallback(async () => {
    if (!canAccessAdmin) {
      setSystemRoles([]);
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/admin/roles', { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSystemRoles(data);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch system roles:", err);
    }
  }, [canAccessAdmin, getAuthHeaders]);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
    fetchSops();
    fetchKBProducts();
    fetchKbStatuses();
    fetchSystemRoles();
  }, [fetchArticles, fetchCategories, fetchSops, fetchKBProducts, fetchKbStatuses, fetchSystemRoles]);

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusFormData.label.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const key = (statusFormData.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const payload = {
        module_id: 'kb',
        status_key: key,
        value: key,
        label: statusFormData.label,
        color: statusFormData.color,
        is_default: statusFormData.is_default
      };

      const url = editingStatus ? `/api/admin/statuses/${editingStatus.id}` : '/api/admin/statuses';
      const method = editingStatus ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingStatus ? "Status updated successfully!" : "Status created successfully!", 'success');
        setStatusFormData({ label: '', color: '#64748b', is_default: false });
        setEditingStatus(null);
        await fetchKbStatuses();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save status", 'error');
      }
    } catch (err) {
      console.error("Failed to save status:", err);
      showToast("Network error saving status", 'error');
    }
  };

  const handleDeleteStatus = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch(`/api/admin/statuses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });
      if (res.ok) {
        showToast("Status deleted successfully!", 'success');
        await fetchKbStatuses();
      }
    } catch (err) {
      console.error("Failed to delete status:", err);
      showToast("Failed to delete status.", 'error');
    }
  };

  const handleTogglePermission = async (role: any, action: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';

      const newPermissions = JSON.parse(JSON.stringify(role.permissions || {}));

      // Migrate legacy 'kb' permissions to 'Knowledge Base'
      if (newPermissions['kb']) {
        newPermissions['Knowledge Base'] = newPermissions['kb'];
        delete newPermissions['kb'];
      }

      if (!newPermissions['Knowledge Base']) {
        newPermissions['Knowledge Base'] = { view: false, create: false, edit: false, delete: false, export: false };
      }

      newPermissions['Knowledge Base'][action] = !newPermissions['Knowledge Base'][action];

      const res = await fetch(`/api/admin/roles/${role.id}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({ permissions: newPermissions })
      });

      if (res.ok) {
        showToast(`Permissions updated for role ${role.name}`, 'success');
        await fetchSystemRoles();
        await refreshUser();
      } else {
        throw new Error("Failed to update permissions");
      }
    } catch (err) {
      console.error("Failed to update role permissions:", err);
      showToast("Failed to update permissions.", 'error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id') || '1';
    const method = editingCategory ? 'PATCH' : 'POST';
    const url = editingCategory ? `/api/kb/categories/${editingCategory.id}` : '/api/kb/categories';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(categoryFormData)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Sync failed with status ${res.status}`);
      }
      showToast("Category saved successfully!", 'success');
      setCategoryFormData({ name: '', department_id: 1 });
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      console.error("Failed to save category:", err);
      showToast("Failed to save category.", 'error');
    }
  };

  const handleDeleteCategory = async (id: number): Promise<boolean> => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id') || '1';
    try {
      const res = await fetch(`/api/kb/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to delete category', 'error');
        return false;
      }
      showToast('Category deleted successfully', 'success');
      await fetchCategories();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error deleting category', 'error');
      return false;
    }
  };

  const handleDeleteArticle = async (id: number): Promise<boolean> => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id') || '1';
    try {
      const res = await fetch(`/api/kb/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });
      if (res.ok) {
        showToast('Article deleted successfully', 'success');
        await fetchArticles();
        return true;
      } else {
        showToast('Failed to delete article', 'error');
        return false;
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Network error while deleting', 'error');
      return false;
    }
  };

  const handleFeedback = async (id: number, helpful: boolean) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id') || '1';
    try {
      await fetch(`/api/kb/${id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({ helpful })
      });
      await fetchArticles();
    } catch (e) {
      console.error("Feedback error:", e);
    }
  };

  return (
    <KBContext.Provider
      value={{
        kbArticles,
        setKbArticles,
        categories,
        setCategories,
        sops,
        products,
        departments,
        globalStatuses,
        users,
        uniqueTags,
        isLoading,
        toast,
        setToast,
        showToast,
        fetchArticles,
        fetchCategories,
        fetchSops,
        fetchKBProducts,
        fetchKbStatuses,
        fetchSystemRoles,
        kbStatuses,
        statusFormData,
        setStatusFormData,
        editingStatus,
        setEditingStatus,
        systemRoles,
        handleSaveStatus,
        handleDeleteStatus,
        handleTogglePermission,
        categoryFormData,
        setCategoryFormData,
        editingCategory,
        setEditingCategory,
        handleSaveCategory,
        handleDeleteCategory,
        handleDeleteArticle,
        handleFeedback,
        canAccessSops,
        canAccessProducts,
        onSelectSop,
        setActiveModule
      }}
    >
      {children}
    </KBContext.Provider>
  );
};
