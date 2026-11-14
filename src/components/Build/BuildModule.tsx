import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Check, X, ChevronRight, ChevronDown, 
  Settings, Database, Link2, Calendar, Sparkles, SlidersHorizontal, 
  HelpCircle, FileText, CheckSquare, List, RefreshCw, ArrowRight,
  GripVertical, LayoutGrid, FileSpreadsheet, Kanban, Play, AlertCircle,
  Eye, EyeOff, Lock, Trash, Save, Layout, Layers, Grid, FileCode, CheckCircle,
  Workflow, ArrowUpRight, MessageSquare, Tag, AlignLeft, UserPlus, Info,
  Printer, ShieldCheck, MoreVertical, Settings2, PlusCircle, MinusCircle, Link
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DeleteConfirmation from '../Common/DeleteConfirmation';
import FormPreview from './FormPreview';

interface CustomField {
  id: number;
  company_id: number;
  entity_type: string;
  field_name: string;
  field_label_ar: string;
  field_label_en: string;
  field_type: string;
  is_required: boolean;
  options: string | null;
  relation_target_table: string | null;
  relation_display_column: string | null;
  order_index: number;
  allow_search: boolean;
  add_to_filter: boolean;
}

interface SystemModule {
  id: string;
  name: string;
  is_active: boolean;
  order_index: number;
  metadata?: any;
}

interface FilterRow {
  field: 'id' | 'name' | 'is_active' | 'order_index';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with';
  value: string;
}

interface FormLayoutItem {
  id: string;
  type: 'section' | 'column' | 'field';
  label?: string;
  fieldId?: number;
  fieldRef?: CustomField;
  width?: string; // e.g. "50%", "100%"
}

interface BuildModuleProps {
  onModuleChange?: () => void;
}

export default function BuildModule({ onModuleChange }: BuildModuleProps) {
  // Navigation states
  const [activeModule, setActiveModule] = useState<SystemModule | null>(null);
  const [designerTab, setDesignerTab] = useState<'details' | 'form' | 'preview' | 'connections'>('details');

  // DB States
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Main list filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'order_index'>('order_index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Advanced Filter Popup State
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [filterRows, setFilterRows] = useState<FilterRow[]>([
    { field: 'name', operator: 'contains', value: '' }
  ]);
  const [appliedFilters, setAppliedFilters] = useState<FilterRow[]>([]);

  // Module Details form state
  const [modName, setModName] = useState('');
  const [modIsActive, setModIsActive] = useState(true);
  const [modOrderIndex, setModOrderIndex] = useState(1);
  const [modTabs, setModTabs] = useState<string[]>(['General Form']);
  const [screenTabs, setScreenTabs] = useState<string[]>(['Main View / الشاشة الرئيسية']);
  const [hiddenTabs, setHiddenTabs] = useState<string[]>([]);
  const [hiddenScreenTabs, setHiddenScreenTabs] = useState<string[]>([]);
  const [hiddenFieldIds, setHiddenFieldIds] = useState<number[]>([]);
  const [newTabName, setNewTabName] = useState('');

  // Form tab sub-state
  const [selectedFormTab, setSelectedFormTab] = useState<string>('General Form');
  const [isAddingField, setIsAddingField] = useState(false);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);

  // Connection config state
  const [connections, setConnections] = useState<any[]>([]);
  const [connTargetModule, setConnTargetModule] = useState('');
  const [connType, setConnType] = useState('field_link');
  const [connSourceField, setConnSourceField] = useState('');
  const [connTargetField, setConnTargetField] = useState('');

  // New Field Form States
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabelEn, setNewFieldLabelEn] = useState('');
  const [newFieldLabelAr, setNewFieldLabelAr] = useState('');
  const [newFieldType, setNewFieldType] = useState('Data');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldTarget, setNewFieldTarget] = useState('');
  const [newFieldDisplay, setNewFieldDisplay] = useState('name');

  // Drag and Drop State for Form Canvas Field Reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Delete confirmation modal states
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'module' | 'tab' | 'field' | 'connection';
    id: string | number;
    title: string;
    message: string;
  } | null>(null);

  // Custom prompt modal states (safer than window.prompt inside iframe)
  const [promptConfig, setPromptConfig] = useState<{
    title: string;
    description?: string;
    defaultValue: string;
    placeholder?: string;
    onConfirm: (value: string) => void | Promise<void>;
  } | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');

  // Add New Module form modal state variables
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [newModuleId, setNewModuleId] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleIcon, setNewModuleIcon] = useState('Database');
  const [newModuleVisible, setNewModuleVisible] = useState(true);
  const [newModuleOrderIndex, setNewModuleOrderIndex] = useState(10);

  // 42 Custom Form fields exact listing as requested by user
  const ALL_FIELD_TYPES = [
    'Autocomplete', 'Attach', 'Attach Image', 'Barcode', 'Button', 'Check', 'Code', 'Color',
    'Column Break', 'Currency', 'Data', 'Date', 'Datetime', 'Duration', 'Dynamic Link',
    'Float', 'Fold', 'Geolocation', 'Heading', 'HTML', 'HTML Editor', 'Icon', 'Image',
    'Int', 'JSON', 'Link', 'Long Text', 'Markdown Editor', 'Password', 'Percent', 'Phone',
    'Read Only', 'Rating', 'Section Break', 'Select', 'Signature', 'Small Text', 'Tab Break',
    'Table', 'Table MultiSelect', 'Text', 'Text Editor', 'Time'
  ];

  // Fetch all system modules and fields
  const loadWorkspaceData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [modulesRes, fieldsRes] = await Promise.all([
        fetch('/api/admin/modules', { headers }),
        fetch('/api/hr/custom-fields', { headers })
      ]);

      if (modulesRes.ok) {
        const mods = await modulesRes.json();
        setModules(mods);
      } else {
        setError('Failed to fetch system modules');
      }

      if (fieldsRes.ok) {
        const flds = await fieldsRes.json();
        setFields(flds);
      }
    } catch (e) {
      setError('Connection failure updating workspace configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // Update detail form when active module changes
  useEffect(() => {
    if (activeModule) {
      setModName(activeModule.name);
      setModIsActive(activeModule.is_active);
      setModOrderIndex(activeModule.order_index);
      
      let parsedTabs = ['General Form'];
      let parsedConnections = [];
      let parsedScreenTabs = ['Main View / الشاشة الرئيسية'];
      let parsedHiddenTabs: string[] = [];
      let parsedHiddenScreenTabs: string[] = [];
      let parsedHiddenFieldIds: number[] = [];
      if (activeModule.metadata) {
        try {
          const meta = typeof activeModule.metadata === 'string' ? JSON.parse(activeModule.metadata) : activeModule.metadata;
          if (meta.tabs && Array.isArray(meta.tabs)) {
            parsedTabs = meta.tabs;
          }
          if (meta.connections && Array.isArray(meta.connections)) {
            parsedConnections = meta.connections;
          }
          if (meta.screenTabs && Array.isArray(meta.screenTabs)) {
            parsedScreenTabs = meta.screenTabs;
          }
          if (meta.hiddenTabs && Array.isArray(meta.hiddenTabs)) {
            parsedHiddenTabs = meta.hiddenTabs;
          }
          if (meta.hiddenScreenTabs && Array.isArray(meta.hiddenScreenTabs)) {
            parsedHiddenScreenTabs = meta.hiddenScreenTabs;
          }
          if (meta.hiddenFieldIds && Array.isArray(meta.hiddenFieldIds)) {
            parsedHiddenFieldIds = meta.hiddenFieldIds;
          }
        } catch (e) {}
      }
      setModTabs(parsedTabs);
      setSelectedFormTab(parsedTabs[0] || 'General Form');
      setConnections(parsedConnections);
      setScreenTabs(parsedScreenTabs);
      setHiddenTabs(parsedHiddenTabs);
      setHiddenScreenTabs(parsedHiddenScreenTabs);
      setHiddenFieldIds(parsedHiddenFieldIds);
    }
  }, [activeModule]);

  // Apply sorting and advanced filters on Modules
  const filteredModules = useMemo(() => {
    let result = [...modules];

    // Standard Search
    if (searchTerm) {
      const term = (searchTerm || '').toLowerCase();
      result = result.filter(m => 
        (m.name || '').toLowerCase().includes(term) || 
        (m.id || '').toLowerCase().includes(term)
      );
    }

    // Advanced Popup Filters
    if (appliedFilters.length > 0) {
      result = result.filter(m => {
        return appliedFilters.every(f => {
          const mValue = String(m[f.field] || '').toLowerCase();
          const fValue = f.value.toLowerCase();
          if (f.operator === 'equals') return mValue === fValue;
          if (f.operator === 'contains') return mValue.includes(fValue);
          if (f.operator === 'starts_with') return mValue.startsWith(fValue);
          if (f.operator === 'ends_with') return mValue.endsWith(fValue);
          return true;
        });
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = (a.order_index || 0) - (b.order_index || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [modules, searchTerm, appliedFilters, sortBy, sortOrder]);

  // Save module details change
  const handleSaveModuleDetails = async (
    customTabs?: string[], 
    customConnections?: any[], 
    customScreenTabs?: string[],
    customHiddenTabs?: string[],
    customHiddenScreenTabs?: string[],
    customHiddenFieldIds?: number[]
  ) => {
    if (!activeModule) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Merge with existing metadata
      let existingMeta = {};
      if (activeModule.metadata) {
        try {
          existingMeta = typeof activeModule.metadata === 'string' ? JSON.parse(activeModule.metadata) : activeModule.metadata;
        } catch (e) {}
      }

      const finalTabs = customTabs !== undefined ? customTabs : modTabs;
      const finalConnections = customConnections !== undefined ? customConnections : connections;
      const finalScreenTabs = customScreenTabs !== undefined ? customScreenTabs : screenTabs;
      const finalHiddenTabs = customHiddenTabs !== undefined ? customHiddenTabs : hiddenTabs;
      const finalHiddenScreenTabs = customHiddenScreenTabs !== undefined ? customHiddenScreenTabs : hiddenScreenTabs;
      const finalHiddenFieldIds = customHiddenFieldIds !== undefined ? customHiddenFieldIds : hiddenFieldIds;

      const updatedMetadata = {
        ...existingMeta,
        tabs: finalTabs,
        connections: finalConnections,
        screenTabs: finalScreenTabs,
        hiddenTabs: finalHiddenTabs,
        hiddenScreenTabs: finalHiddenScreenTabs,
        hiddenFieldIds: finalHiddenFieldIds
      };

      const res = await fetch(`/api/admin/modules/${activeModule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: modName,
          is_active: modIsActive,
          order_index: modOrderIndex,
          metadata: updatedMetadata
        })
      });

      if (res.ok) {
        setSuccess('Module properties saved successfully!');
        const updatedModule = {
          ...activeModule,
          name: modName,
          is_active: modIsActive,
          order_index: modOrderIndex,
          metadata: updatedMetadata
        };
        setActiveModule(updatedModule);
        loadWorkspaceData();
        onModuleChange?.();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to update module properties');
      }
    } catch (e) {
      setError('Error saving module properties');
    } finally {
      setLoading(false);
    }
  };

  // Re-order custom fields on the live form canvas and persist to DB
  const handleReorderFields = async (reorderedFields: CustomField[]) => {
    // 1. Instantly update local fields state to keep the UX extremely responsive and fluid
    const updatedFields = fields.map(f => {
      const match = reorderedFields.find(rf => rf.id === f.id);
      if (match) {
        return { ...f, order_index: reorderedFields.indexOf(match) + 1 };
      }
      return f;
    });
    setFields(updatedFields);

    // 2. Persist to server in background
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const promises = reorderedFields.map((field, idx) => {
        const newOrder = idx + 1;
        return fetch(`/api/hr/custom-fields/${field.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ order_index: newOrder })
        });
      });

      await Promise.all(promises);
      loadWorkspaceData(); // Fetch absolute source of truth
    } catch (err) {
      console.error('Failed to save field order indices:', err);
      setError('Failed to persist field order layout');
    }
  };

  // Drag & Drop handlers for Form Canvas reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...activeFields];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);

    await handleReorderFields(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Unified Deletion Confirmation execution logic mimicking SOP Management
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const { type, id } = deleteTarget;
    try {
      if (type === 'module') {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/modules/${id}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          setSuccess('Module deleted successfully!');
          if (activeModule?.id === id) {
            setActiveModule(null);
          }
          loadWorkspaceData();
          onModuleChange?.();
        } else {
          const d = await res.json();
          setError(d.error || 'Failed to delete module');
        }
      } else if (type === 'tab') {
        const tabName = id as string;
        if (modTabs.length <= 1) {
          setError('Must keep at least one tab!');
          setDeleteTarget(null);
          setLoading(false);
          return;
        }
        const updated = modTabs.filter(t => t !== tabName);
        setModTabs(updated);
        const nextTab = updated[0];
        setSelectedFormTab(nextTab);
        await handleSaveModuleDetails(updated);
        setSuccess('Tab deleted successfully!');
      } else if (type === 'screen_tab' as any) {
        const tabName = id as string;
        if (screenTabs.length <= 1) {
          setError('Must keep at least one screen tab!');
          setDeleteTarget(null);
          setLoading(false);
          return;
        }
        const updated = screenTabs.filter(t => t !== tabName);
        setScreenTabs(updated);
        await handleSaveModuleDetails(undefined, undefined, updated);
        setSuccess('Screen tab deleted successfully!');
      } else if (type === 'field') {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/hr/custom-fields/${id}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          setSuccess('Field deleted successfully!');
          loadWorkspaceData();
        } else {
          setError('Failed to delete field');
        }
      } else if (type === 'connection') {
        const updated = connections.filter(c => c.id !== id);
        setConnections(updated);
        await handleSaveModuleDetails(undefined, updated);
        setSuccess('Connection deleted successfully!');
      }
    } catch (err) {
      console.error('Failed delete confirmation operation:', err);
      setError('An error occurred during deletion execution');
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  // Open create module modal with defaults
  const handleCreateModule = () => {
    setNewModuleId('');
    setNewModuleName('');
    setNewModuleIcon('Database');
    setNewModuleVisible(true);
    setNewModuleOrderIndex((modules.length + 1) * 10);
    setIsCreateModuleModalOpen(true);
  };

  // Submit the create module form to the server
  const submitCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleId) {
      setError('Module ID is required');
      return;
    }
    const cleanId = newModuleId.toLowerCase().replace(/[^a-z0-9_]/g, '_').trim();
    if (!cleanId) {
      setError('Invalid Module ID');
      return;
    }
    if (!newModuleName) {
      setError('Module Name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setIsCreateModuleModalOpen(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: cleanId,
          name: newModuleName,
          is_active: newModuleVisible,
          order_index: Number(newModuleOrderIndex) || 0,
          metadata: { 
            icon: newModuleIcon, 
            tabs: ['General Form'], 
            connections: [] 
          }
        })
      });

      if (res.ok) {
        setSuccess('New Module Created Successfully / تم إنشاء الموديول بنجاح!');
        loadWorkspaceData();
        onModuleChange?.();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to create module');
      }
    } catch (e) {
      setError('Connection failure creating module');
    } finally {
      setLoading(false);
    }
  };

  // Add tab inside the Form customizer
  const handleAddFormTab = () => {
    const defaultName = `Form Tab ${modTabs.length + 1} / تابة جديدة ${modTabs.length + 1}`;
    setPromptInputValue(defaultName);
    setPromptConfig({
      title: 'Add Form Tab / إضافة تابة للنموذج',
      description: 'Enter new tab label for form sections / أدخل اسم التابة الجديدة للنموذج:',
      defaultValue: defaultName,
      placeholder: 'e.g. Identity Details / بيانات الهوية',
      onConfirm: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (modTabs.includes(trimmed)) {
          setError('Tab already exists / هذه التابة موجودة بالفعل!');
          return;
        }
        const updated = [...modTabs, trimmed];
        setModTabs(updated);
        setSelectedFormTab(trimmed);
        setTimeout(() => handleSaveModuleDetails(updated), 200);
      }
    });
  };

  // Rename tab inside the Form customizer
  const handleRenameFormTab = (oldName: string) => {
    setPromptInputValue(oldName);
    setPromptConfig({
      title: 'Rename Form Tab / تعديل اسم تابة النموذج',
      description: `Change name for "${oldName}" / تعديل الاسم للتابة:`,
      defaultValue: oldName,
      placeholder: 'New tab label...',
      onConfirm: async (newName) => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldName) return;
        if (modTabs.includes(trimmed)) {
          setError('Tab name already exists / اسم التابة موجود بالفعل!');
          return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
          const updatedTabs = modTabs.map(t => t === oldName ? trimmed : t);
          setModTabs(updatedTabs);
          if (selectedFormTab === oldName) {
            setSelectedFormTab(trimmed);
          }

          // Update any fields associated with this tab
          const oldEntityType = `${activeModule?.id}:${oldName}`;
          const newEntityType = `${activeModule?.id}:${trimmed}`;
          const fieldsToUpdate = fields.filter(f => f.entity_type === oldEntityType);

          const token = localStorage.getItem('token');
          const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          };

          const updatePromises = fieldsToUpdate.map(f => {
            return fetch(`/api/hr/custom-fields/${f.id}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ entity_type: newEntityType })
            });
          });

          await Promise.all(updatePromises);
          await handleSaveModuleDetails(updatedTabs);
          setSuccess('Tab renamed and fields migrated / تم تعديل اسم التابة بنجاح!');
          loadWorkspaceData();
        } catch (e) {
          console.error(e);
          setError('Failed to rename tab and migrate fields / فشل في تعديل اسم التابة');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Remove tab
  const handleRemoveFormTab = (tabName: string) => {
    if (modTabs.length <= 1) {
      setError('Must keep at least one tab / يجب الإبقاء على تابة واحدة على الأقل!');
      return;
    }
    setDeleteTarget({
      type: 'tab',
      id: tabName,
      title: 'Delete Tab / حذف التابة',
      message: `Are you sure you want to delete the tab "${tabName}" and its layout structure?`
    });
  };

  // Add Screen Tab (outer module screen tab)
  const handleAddScreenTab = () => {
    const defaultName = `Screen Tab ${screenTabs.length + 1} / تابة خارجية ${screenTabs.length + 1}`;
    setPromptInputValue(defaultName);
    setPromptConfig({
      title: 'Add Screen Tab / إضافة تابة للشاشة الخارجية',
      description: 'Enter screen tab label / اسم تابة الشاشة الخارجية الجديدة:',
      defaultValue: defaultName,
      placeholder: 'e.g. Logs / السجلات',
      onConfirm: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (screenTabs.includes(trimmed)) {
          setError('Screen tab already exists / هذه التابة موجودة بالفعل!');
          return;
        }
        const updated = [...screenTabs, trimmed];
        setScreenTabs(updated);
        setTimeout(() => handleSaveModuleDetails(undefined, undefined, updated), 200);
      }
    });
  };

  // Rename Screen Tab (outer module screen tab)
  const handleRenameScreenTab = (oldName: string) => {
    setPromptInputValue(oldName);
    setPromptConfig({
      title: 'Rename Screen Tab / تعديل اسم تابة الشاشة الخارجية',
      description: `Change name for "${oldName}" / تعديل الاسم للتابة الخارجية:`,
      defaultValue: oldName,
      placeholder: 'New screen tab label...',
      onConfirm: (newName) => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldName) return;
        if (screenTabs.includes(trimmed)) {
          setError('Screen tab already exists / اسم تابة الشاشة موجود بالفعل!');
          return;
        }
        const updated = screenTabs.map(t => t === oldName ? trimmed : t);
        setScreenTabs(updated);
        setTimeout(() => handleSaveModuleDetails(undefined, undefined, updated), 200);
      }
    });
  };

  // Remove Screen Tab (outer module screen tab)
  const handleRemoveScreenTab = (tabName: string) => {
    if (screenTabs.length <= 1) {
      setError('Must keep at least one screen tab / يجب الإبقاء على تابة واحدة على الأقل!');
      return;
    }
    setDeleteTarget({
      type: 'screen_tab' as any,
      id: tabName,
      title: 'Delete Screen Tab / حذف تابة الشاشة الخارجية',
      message: `Are you sure you want to delete the screen tab "${tabName}"?`
    });
  };

  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [draggedScreenTabIndex, setDraggedScreenTabIndex] = useState<number | null>(null);

  const handleDragStartScreenTab = (e: React.DragEvent, index: number) => {
    setDraggedScreenTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverScreenTab = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDropScreenTab = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedScreenTabIndex === null || draggedScreenTabIndex === index) return;
    const updated = [...screenTabs];
    const item = updated.splice(draggedScreenTabIndex, 1)[0];
    updated.splice(index, 0, item);
    setScreenTabs(updated);
    setDraggedScreenTabIndex(null);
    handleSaveModuleDetails(undefined, undefined, updated);
  };

  const handleDragStartFormTab = (e: React.DragEvent, index: number) => {
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverFormTab = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDropFormTab = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTabIndex === null || draggedTabIndex === index) return;
    const updated = [...modTabs];
    const item = updated.splice(draggedTabIndex, 1)[0];
    updated.splice(index, 0, item);
    setModTabs(updated);
    setDraggedTabIndex(null);
    handleSaveModuleDetails(updated);
  };

  const handleToggleScreenTabVisibility = (tabName: string) => {
    const isHidden = hiddenScreenTabs.includes(tabName);
    const updated = isHidden
      ? hiddenScreenTabs.filter(t => t !== tabName)
      : [...hiddenScreenTabs, tabName];
    setHiddenScreenTabs(updated);
    handleSaveModuleDetails(undefined, undefined, undefined, undefined, updated);
  };

  const handleToggleFormTabVisibility = (tabName: string) => {
    const isHidden = hiddenTabs.includes(tabName);
    const updated = isHidden
      ? hiddenTabs.filter(t => t !== tabName)
      : [...hiddenTabs, tabName];
    setHiddenTabs(updated);
    handleSaveModuleDetails(undefined, undefined, undefined, updated, undefined);
  };

  const handleToggleFieldVisibility = (fieldId: number) => {
    const isHidden = hiddenFieldIds.includes(fieldId);
    const updated = isHidden
      ? hiddenFieldIds.filter(id => id !== fieldId)
      : [...hiddenFieldIds, fieldId];
    setHiddenFieldIds(updated);
    handleSaveModuleDetails(undefined, undefined, undefined, undefined, undefined, updated);
  };

  // Get active fields for selected module & selected tab
  const activeFields = useMemo(() => {
    if (!activeModule) return [];
    const entityType = `${activeModule.id}:${selectedFormTab}`;
    return fields
      .filter(f => f.entity_type === entityType)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }, [fields, activeModule, selectedFormTab]);

  // Create field
  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModule) return;
    if (!newFieldName || !newFieldLabelEn || !newFieldLabelAr) {
      setError('Please provide Field DB Name and Display Labels');
      return;
    }

    const cleanFieldName = newFieldName.toLowerCase().replace(/[^a-z0-9_]/g, '_').trim();
    const entityType = `${activeModule.id}:${selectedFormTab}`;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/hr/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          entity_type: entityType,
          field_name: cleanFieldName,
          field_label_ar: newFieldLabelAr,
          field_label_en: newFieldLabelEn,
          field_type: newFieldType.toLowerCase().replace(/\s+/g, '_'),
          is_required: newFieldRequired,
          options: newFieldOptions || null,
          relation_target_table: newFieldTarget || null,
          relation_display_column: newFieldDisplay || null,
          order_index: activeFields.length + 1
        })
      });

      if (res.ok) {
        setSuccess('Custom field created!');
        setIsAddingField(false);
        setNewFieldName('');
        setNewFieldLabelEn('');
        setNewFieldLabelAr('');
        setNewFieldOptions('');
        setNewFieldTarget('');
        loadWorkspaceData();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to save field');
      }
    } catch (e) {
      setError('Failed to transmit custom field structure');
    } finally {
      setLoading(false);
    }
  };

  // Helper to execute update layout label
  const performUpdateLayoutLabel = async (fieldId: number, labelEn: string, labelAr: string) => {
    const fld = fields.find(f => f.id === fieldId);
    if (!fld) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/hr/custom-fields/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          entity_type: fld.entity_type,
          field_name: fld.field_name,
          field_label_ar: labelAr || fld.field_label_ar,
          field_label_en: labelEn || fld.field_label_en,
          field_type: fld.field_type,
          is_required: fld.is_required,
          options: fld.options,
          relation_target_table: fld.relation_target_table,
          relation_display_column: fld.relation_display_column
        })
      });

      if (res.ok) {
        setSuccess('Layout component updated successfully!');
        loadWorkspaceData();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to update layout label');
      }
    } catch (e) {
      setError('Failed to update layout label');
    } finally {
      setLoading(false);
    }
  };

  // Helper to execute create layout structure
  const performAddLayoutStructure = async (
    structureType: 'section_break' | 'column_break' | 'empty_column' | 'form_tab',
    labelEn: string,
    labelAr: string
  ) => {
    if (!activeModule) return;
    const count = activeFields.length;
    const entityType = `${activeModule.id}:${selectedFormTab}`;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/hr/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          entity_type: entityType,
          field_name: `layout_${structureType}_${Date.now()}`,
          field_label_ar: labelAr || 'تقسيم تلقائي',
          field_label_en: labelEn || structureType.replace('_', ' ').toUpperCase(),
          field_type: structureType,
          is_required: false,
          order_index: count + 1
        })
      });
      loadWorkspaceData();
    } catch (e) {
      setError('Failed to add layout component');
    } finally {
      setLoading(false);
    }
  };

  // Add Mock Section or Column directly to layout
  const handleAddLayoutStructure = (structureType: 'section_break' | 'column_break' | 'empty_column' | 'form_tab') => {
    if (!activeModule) return;

    if (structureType === 'form_tab') {
      const defaultEn = 'Tab';
      const defaultAr = 'تابة';
      setPromptInputValue(defaultEn);
      setPromptConfig({
        title: 'Add Form Tab (English) / إضافة تابة للنموذج (إنجليزي)',
        description: 'Enter English tab name / أدخل اسم التابة بالإنجليزي:',
        defaultValue: defaultEn,
        placeholder: 'e.g. Primary Info',
        onConfirm: (newEn) => {
          setTimeout(() => {
            setPromptInputValue(defaultAr);
            setPromptConfig({
              title: 'Add Form Tab (Arabic) / إضافة تابة للنموذج (عربي)',
              description: 'Enter Arabic tab name / أدخل اسم التابة بالعربي:',
              defaultValue: defaultAr,
              placeholder: 'مثال: البيانات الأساسية',
              onConfirm: (newAr) => {
                performAddLayoutStructure(structureType, newEn.trim() || defaultEn, newAr.trim() || defaultAr);
              }
            });
          }, 100);
        }
      });
    } else {
      const defaultEn = structureType.replace('_', ' ').toUpperCase();
      const defaultAr = structureType === 'section_break' ? 'تقسيم تلقائي' : 'فاصل أعمدة';
      setPromptInputValue(defaultEn);
      setPromptConfig({
        title: `Add Layout Label (English) / إضافة عنوان ${structureType} (إنجليزي)`,
        description: `Enter English label for ${structureType} (or keep default):`,
        defaultValue: defaultEn,
        placeholder: 'e.g. Personal Information',
        onConfirm: (newEn) => {
          setTimeout(() => {
            setPromptInputValue(defaultAr);
            setPromptConfig({
              title: `Add Layout Label (Arabic) / إضافة عنوان ${structureType} (عربي)`,
              description: `Enter Arabic label for ${structureType} (or keep default):`,
              defaultValue: defaultAr,
              placeholder: 'مثال: البيانات الشخصية',
              onConfirm: (newAr) => {
                performAddLayoutStructure(structureType, newEn.trim() || defaultEn, newAr.trim() || defaultAr);
              }
            });
          }, 100);
        }
      });
    }
  };

  // Edit the labels of a section or form tab layout divider
  const handleEditLayoutLabel = (fieldId: number) => {
    const fld = fields.find(f => f.id === fieldId);
    if (!fld) return;

    setPromptInputValue(fld.field_label_en || '');
    setPromptConfig({
      title: 'Edit Layout Label (English) / تعديل اسم التقسيم (إنجليزي)',
      description: `Enter new English label for "${fld.field_label_en || fld.field_name}":`,
      defaultValue: fld.field_label_en || '',
      placeholder: 'e.g. Primary Info',
      onConfirm: (newEn) => {
        setTimeout(() => {
          setPromptInputValue(fld.field_label_ar || '');
          setPromptConfig({
            title: 'Edit Layout Label (Arabic) / تعديل اسم التقسيم (عربي)',
            description: `Enter new Arabic label for "${newEn}":`,
            defaultValue: fld.field_label_ar || '',
            placeholder: 'مثال: البيانات الأساسية',
            onConfirm: (newAr) => {
              performUpdateLayoutLabel(fieldId, newEn.trim(), newAr.trim());
            }
          });
        }, 100);
      }
    });
  };

  // Delete Custom Field - triggers DeleteConfirmation modal
  const handleDeleteField = (fieldId: number) => {
    const fld = fields.find(f => f.id === fieldId);
    const label = fld ? (fld.field_label_en || fld.field_name) : 'this field';
    setDeleteTarget({
      type: 'field',
      id: fieldId,
      title: 'Delete Field / حذف الحقل',
      message: `Are you sure you want to delete the custom field or layout component "${label}"? This action cannot be undone and will erase its structure.`
    });
  };

  // Add Module-to-Module Connection
  const handleAddConnection = () => {
    if (!connTargetModule) {
      alert('Please select target module!');
      return;
    }
    const newConn = {
      id: `conn_${Date.now()}`,
      target_module: connTargetModule,
      type: connType,
      source_field: connSourceField,
      target_field: connTargetField
    };
    const updated = [...connections, newConn];
    setConnections(updated);
    setConnTargetModule('');
    setConnSourceField('');
    setConnTargetField('');
    
    // Save details
    setTimeout(() => handleSaveModuleDetails(), 100);
  };

  // Remove connection - triggers DeleteConfirmation modal
  const handleRemoveConnection = (connId: string) => {
    setDeleteTarget({
      type: 'connection',
      id: connId,
      title: 'Delete Connection / حذف رابط الموديول',
      message: 'Are you sure you want to delete this module-to-module relation? This action cannot be undone.'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-800">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">System Module Studio (Build)</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No-Code Module Creator & Schema Relations Mapper</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            انشئ موديول جديد، صمم النماذج، تحكم بالتقسيمات والتابات، واربط الموديولات والحقول ببعضها بمرونة كاملة.
          </p>
        </div>

        {!activeModule && (
          <button
            onClick={handleCreateModule}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Module / موديول جديد</span>
          </button>
        )}

        {activeModule && (
          <button
            onClick={() => setActiveModule(null)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to List / العودة للقائمة</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!activeModule ? (
          /* MODULES LIST SCREEN WITH SEARCH AND PICTURE-ALIGNED FILTERS */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Elegant Search, Advanced Filters & Sort Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs relative">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search modules... / بحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Filter Trigger (aligned with user picture) */}
                <div className="relative">
                  <button
                    onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer transition-all"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Filter</span>
                    {appliedFilters.length > 0 && (
                      <span className="bg-indigo-600 text-white rounded-full px-1.5 py-0.2 text-[9px]">
                        {appliedFilters.length}
                      </span>
                    )}
                  </button>

                  {/* Filter Popup - Mimicking User's Filter Image Exactly */}
                  {isFilterPopupOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Advanced Conditions</span>
                        <button onClick={() => setIsFilterPopupOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Multiple filter rows */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filterRows.map((row, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs">
                            <select
                              value={row.field}
                              onChange={(e) => {
                                const updated = [...filterRows];
                                updated[idx].field = e.target.value as any;
                                setFilterRows(updated);
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-700 outline-none"
                            >
                              <option value="id">ID</option>
                              <option value="name">Name</option>
                              <option value="is_active">Is Active</option>
                              <option value="order_index">Order Index</option>
                            </select>

                            <select
                              value={row.operator}
                              onChange={(e) => {
                                const updated = [...filterRows];
                                updated[idx].operator = e.target.value as any;
                                setFilterRows(updated);
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-700 outline-none"
                            >
                              <option value="contains">Contains</option>
                              <option value="equals">Equals</option>
                              <option value="starts_with">Starts With</option>
                              <option value="ends_with">Ends With</option>
                            </select>

                            <input
                              type="text"
                              value={row.value}
                              onChange={(e) => {
                                const updated = [...filterRows];
                                updated[idx].value = e.target.value;
                                setFilterRows(updated);
                              }}
                              placeholder="Value..."
                              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-700 w-24 outline-none"
                            />

                            <button
                              onClick={() => {
                                setFilterRows(filterRows.filter((_, i) => i !== idx));
                              }}
                              className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => setFilterRows([...filterRows, { field: 'name', operator: 'contains', value: '' }])}
                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Row
                        </button>
                      </div>

                      {/* Popup Buttons aligned with image */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setFilterRows([{ field: 'name', operator: 'contains', value: '' }]);
                            setAppliedFilters([]);
                            setIsFilterPopupOpen(false);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] rounded-lg"
                        >
                          Clear Filters
                        </button>
                        <button
                          onClick={() => {
                            setAppliedFilters(filterRows.filter(r => r.value.trim() !== ''));
                            setIsFilterPopupOpen(false);
                          }}
                          className="px-3 py-1.5 bg-black hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sorting and counts */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Sort by / ترتيب:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-600 outline-none"
                >
                  <option value="order_index">Order Index</option>
                  <option value="name">Module Name</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Modules Grid list */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-xs gap-3 bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Loading system modular structure...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModules.map((m) => {
                  let tabsCount = 1;
                  try {
                    const parsed = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
                    if (parsed?.tabs) tabsCount = parsed.tabs.length;
                  } catch(e) {}

                  return (
                    <div 
                      key={m.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold uppercase">
                            {m.id}
                          </span>
                          <span className={`w-2.5 h-2.5 rounded-full ${m.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>

                        <div>
                          <h3 className="font-black text-sm text-slate-900">{m.name}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order index: {m.order_index}</p>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tabsCount} internal forms configured</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                        <button
                          onClick={() => setActiveModule(m)}
                          className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-3 py-2 rounded-xl transition-all"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Design / تصميم</span>
                        </button>

                        <button
                          onClick={() => {
                            setPromptInputValue(m.name);
                            setPromptConfig({
                              title: 'Rename Module / تعديل اسم الموديول',
                              description: `Change name for "${m.name}":`,
                              defaultValue: m.name,
                              placeholder: 'New module name...',
                              onConfirm: (newName) => {
                                const trimmed = newName.trim();
                                if (!trimmed || trimmed === m.name) return;
                                setModName(trimmed);
                                setActiveModule(m);
                                setLoading(true);
                                fetch(`/api/admin/modules/${m.id}`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                                  },
                                  body: JSON.stringify({
                                    name: trimmed,
                                    is_active: m.is_active !== false,
                                    order_index: m.order_index || 10,
                                    metadata: m.metadata
                                  })
                                })
                                .then(res => {
                                  if (res.ok) {
                                    setSuccess('Module renamed successfully / تم تعديل اسم الموديول بنجاح!');
                                    loadWorkspaceData();
                                  } else {
                                    setError('Failed to rename module');
                                  }
                                })
                                .catch(() => {
                                  setError('Failed to rename module');
                                })
                                .finally(() => {
                                  setLoading(false);
                                });
                              }
                            });
                          }}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                          title="Modify Name / تعديل الاسم"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Allow deletion of custom ones or warn */}
                        <button
                          onClick={() => setDeleteTarget({
                            type: 'module',
                            id: m.id,
                            title: 'Delete Module / حذف الموديول',
                            message: `Are you sure you want to permanently delete the module "${m.name}"? This action cannot be undone and will remove all custom fields and configurations associated with it.`
                          })}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete / حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* DESIGN MODE (THREE TABS: DETAILS, FORM, CONNECTIONS) */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Context Header with Active Module info */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Currently Designing</span>
                <h2 className="text-lg font-black text-white">{activeModule.name} ({activeModule.id})</h2>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold">
                <Database className="w-3.5 h-3.5 text-indigo-300" />
                <span>Custom Schema Active</span>
              </div>
            </div>

            {/* 4-Tab Navigator */}
            <div className="flex items-center gap-1 border-b border-slate-200">
              <button
                onClick={() => setDesignerTab('details')}
                className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                  designerTab === 'details' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Details / تفاصيل الموديول</span>
              </button>

              <button
                onClick={() => setDesignerTab('form')}
                className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                  designerTab === 'form' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Form Customizer / مخصص النموذج</span>
              </button>

              <button
                onClick={() => setDesignerTab('preview')}
                className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                  designerTab === 'preview' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Live Preview / معاينة تفاعلية</span>
              </button>

              <button
                onClick={() => setDesignerTab('connections')}
                className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                  designerTab === 'connections' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Connections & Links / روابط الموديول</span>
              </button>
            </div>

            {/* TAB CONTENT: 1. DETAILS */}
            {designerTab === 'details' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-black text-sm text-slate-900">Module Core Settings</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configure meta attributes & ordering index</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Module Name / مسمى الموديول</label>
                    <input
                      type="text"
                      value={modName}
                      onChange={(e) => setModName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Order Index (Sort Weight)</label>
                    <input
                      type="number"
                      value={modOrderIndex}
                      onChange={(e) => setModOrderIndex(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={modIsActive}
                        onChange={(e) => setModIsActive(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-700">Activate module in global sidebar (Is Active)</span>
                    </label>
                  </div>
                </div>

                {/* Tab layout tags configure block */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {/* 1. Module Screen Tabs (Outer Tabs) */}
                  <div className="space-y-3 bg-indigo-50/15 p-4 rounded-xl border border-indigo-100">
                    <div>
                      <h4 className="text-xs font-black text-indigo-700 flex items-center gap-1.5">
                        <Layout className="w-4 h-4 text-indigo-500" />
                        <span>Module Screen Tabs / تابات شاشة الموديول الخارجية</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Drag items to reorder them instantly. Toggle visibility to show or hide tabs from the main module view / اسحب العناصر لإعادة الترتيب، أو اضغط على العين للتحكم في ظهور التابات
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {screenTabs.map((t, idx) => {
                        const isHidden = hiddenScreenTabs.includes(t);
                        return (
                          <div 
                            key={idx} 
                            draggable
                            onDragStart={(e) => handleDragStartScreenTab(e, idx)}
                            onDragOver={(e) => handleDragOverScreenTab(e, idx)}
                            onDrop={(e) => handleDropScreenTab(e, idx)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border transition-all duration-200 select-none ${
                              isHidden 
                                ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60" 
                                : "bg-white border-indigo-200 text-slate-700 shadow-3xs hover:border-indigo-400"
                            }`}
                          >
                            <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                            <span className={isHidden ? "line-through" : ""}>{t}</span>
                            
                            <div className="flex items-center gap-1 border-l border-slate-100 pl-1.5 ml-0.5">
                              <button
                                type="button"
                                onClick={() => handleToggleScreenTabVisibility(t)}
                                className={`p-0.5 rounded-lg transition-colors cursor-pointer ${
                                  isHidden 
                                    ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100" 
                                    : "text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                }`}
                                title={isHidden ? "Show Tab / إظهار التابة" : "Hide Tab / إخفاء التابة"}
                              >
                                {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRenameScreenTab(t)}
                                className="text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors p-0.5 rounded hover:bg-slate-100"
                                title="Rename / إعادة تسمية"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleRemoveScreenTab(t)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5 hover:bg-rose-50 rounded"
                                title="Delete / حذف"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleAddScreenTab}
                        className="flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Tab / إضافة تابة (شاشة خارجية)</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Inner Form Sections/Tabs */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-slate-500" />
                        <span>Form Sections / تابات وأقسام النموذج الداخلية</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Drag to reorder. Toggle visibility to control which custom form tabs are available in live forms / اسحب العناصر لإعادة الترتيب، أو اضغط على العين للتحكم في ظهور أقسام النموذج
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {modTabs.map((t, idx) => {
                        const isHidden = hiddenTabs.includes(t);
                        return (
                          <div 
                            key={idx} 
                            draggable
                            onDragStart={(e) => handleDragStartFormTab(e, idx)}
                            onDragOver={(e) => handleDragOverFormTab(e, idx)}
                            onDrop={(e) => handleDropFormTab(e, idx)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 select-none ${
                              isHidden 
                                ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60" 
                                : "bg-white border-slate-200 text-slate-700 shadow-3xs hover:border-slate-300"
                            }`}
                          >
                            <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                            <span className={isHidden ? "line-through" : ""}>{t}</span>

                            <div className="flex items-center gap-1 border-l border-slate-100 pl-1.5 ml-0.5">
                              <button
                                type="button"
                                onClick={() => handleToggleFormTabVisibility(t)}
                                className={`p-0.5 rounded-lg transition-colors cursor-pointer ${
                                  isHidden 
                                    ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100" 
                                    : "text-violet-500 hover:text-violet-700 hover:bg-violet-50"
                                }`}
                                title={isHidden ? "Show Section / إظهار القسم" : "Hide Section / إخفاء القسم"}
                              >
                                {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRenameFormTab(t)}
                                className="text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors p-0.5 rounded hover:bg-slate-100"
                                title="Rename / إعادة تسمية"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleRemoveFormTab(t)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5 hover:bg-rose-50 rounded"
                                title="Delete / حذف"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleAddFormTab}
                        className="flex items-center gap-1 bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Form Tab / إضافة تابة للنموذج</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => handleSaveModuleDetails()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Module Configuration</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. FORM CUSTOMIZER */}
            {designerTab === 'form' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Form layout control column */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* MAIN ADD FIELDS AND TAB CONFIGURATION - STYLED EXACTLY */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Fields list configure</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Add standard or interactive fields into form preview</p>
                      </div>

                      <div className="flex flex-col items-end gap-2.5">
                        <div className="flex items-center gap-2">
                          {/* Layout Controls Menu aligned with the Arabic instructions */}
                          <div className="relative">
                            <button
                              onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
                              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-black text-slate-700 transition-all cursor-pointer shadow-3xs border border-slate-200/50"
                            >
                              <Layout className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Layout Division / تقسيمات</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {isLayoutMenuOpen && (
                              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-xs text-slate-700">
                                <button
                                  onClick={() => { handleAddLayoutStructure('form_tab'); setIsLayoutMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-violet-600 font-bold"
                                >
                                  <Layers className="w-4 h-4 text-violet-500" />
                                  Add Tab / إضافة تابة
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => { handleAddLayoutStructure('section_break'); setIsLayoutMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold"
                                >
                                  <PlusCircle className="w-4 h-4 text-indigo-500" />
                                  Section (Add division block)
                                </button>
                                <button
                                  onClick={() => { handleAddLayoutStructure('section_break'); setIsLayoutMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold"
                                >
                                  <ArrowRight className="w-4 h-4 text-emerald-500 rotate-90" />
                                  Add section below
                                </button>
                                <button
                                  onClick={() => { setIsLayoutMenuOpen(false); alert('Click delete icon next to section header inside preview below.'); }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-500 font-bold"
                                >
                                  <MinusCircle className="w-4 h-4 text-rose-500" />
                                  Remove section
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => { handleAddLayoutStructure('column_break'); setIsLayoutMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold"
                                >
                                  <PlusCircle className="w-4 h-4 text-cyan-500" />
                                  Column (Add break point)
                                </button>
                                <button
                                  onClick={() => { handleAddLayoutStructure('column_break'); setIsLayoutMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold"
                                >
                                  <Layout className="w-4 h-4 text-indigo-400" />
                                  Add column
                                </button>
                                <button
                                  onClick={() => { handleAddLayoutStructure('empty_column'); setIsLayoutMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold text-slate-400"
                                >
                                  <Layout className="w-4 h-4" />
                                  Empty column
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setIsAddingField(!isAddingField)}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Fields / إضافة حقول</span>
                          </button>
                        </div>

                        {/* + Add Tab Button placed directly under the Add Fields button as requested */}
                        <button
                          onClick={handleAddFormTab}
                          className="flex items-center gap-1 bg-white text-indigo-600 hover:bg-indigo-50/50 px-3 py-1.5 rounded-xl text-xs font-black border border-dashed border-indigo-300 hover:border-indigo-500 transition-all cursor-pointer shadow-3xs"
                          title="Add Form Tab / إضافة تابة للنموذج"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Tab (Form / داخل النموذج)</span>
                        </button>
                      </div>
                    </div>

                    {isAddingField && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200/60"
                      >
                        <form onSubmit={handleCreateField} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Field Type / نوع الحقل</label>
                              <select
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-black text-slate-700"
                              >
                                {ALL_FIELD_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">DB Column name (no spaces) *</label>
                              <input
                                type="text"
                                required
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                placeholder="e.g. employee_age"
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Label English *</label>
                              <input
                                type="text"
                                required
                                value={newFieldLabelEn}
                                onChange={(e) => setNewFieldLabelEn(e.target.value)}
                                placeholder="e.g. Employee Age"
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Label Arabic *</label>
                              <input
                                type="text"
                                required
                                value={newFieldLabelAr}
                                onChange={(e) => setNewFieldLabelAr(e.target.value)}
                                placeholder="مثال: عمر الموظف"
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 text-right"
                              />
                            </div>
                          </div>

                          {/* Conditional Options or Link properties */}
                          {['Select', 'Autocomplete'].includes(newFieldType) && (
                            <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Select choices (comma-separated)</label>
                              <input
                                type="text"
                                value={newFieldOptions}
                                onChange={(e) => setNewFieldOptions(e.target.value)}
                                placeholder="Male, Female, Other"
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                              />
                            </div>
                          )}

                          {['Link', 'Table', 'Table MultiSelect'].includes(newFieldType) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-3 rounded-lg border border-slate-200">
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Relation Target Table / Module</label>
                                <select
                                  value={newFieldTarget}
                                  onChange={(e) => setNewFieldTarget(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                                >
                                  <option value="">-- Choose Module --</option>
                                  {modules.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Display Column</label>
                                <input
                                  type="text"
                                  value={newFieldDisplay}
                                  onChange={(e) => setNewFieldDisplay(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-mono"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                              <input
                                type="checkbox"
                                checked={newFieldRequired}
                                onChange={(e) => setNewFieldRequired(e.target.checked)}
                                className="rounded text-indigo-600"
                              />
                              Is Mandatory (Required)
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsAddingField(false)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-black text-xs"
                              >
                                Create Field
                              </button>
                            </div>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </div>

                  {/* STUNNING VISUAL LAYOUT PREVIEW CANVAS */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-96 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Live Form Canvas</span>
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
                        {activeFields.length} elements loaded
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
                      {/* Tab bar dividing Active Live Form Canvas exactly like Image 3 */}
                      <div className="border-b border-slate-200 -mx-6 -mt-6 bg-slate-50/50 rounded-t-xl flex items-center justify-between px-4 overflow-x-auto min-h-12 scrollbar-none">
                        <div className="flex items-center">
                          {modTabs.map((t) => {
                            const isSelected = selectedFormTab === t;
                            return (
                              <div
                                key={t}
                                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all relative border-r border-slate-200/40 last:border-r-0 group cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-indigo-700 font-black border-t-2 border-t-indigo-600 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                                }`}
                                onClick={() => setSelectedFormTab(t)}
                              >
                                <button className="cursor-pointer focus:outline-hidden whitespace-nowrap">
                                  {t}
                                </button>
                                
                                {/* Option to quick edit or delete tab inside the live preview */}
                                <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRenameFormTab(t); }}
                                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-200 transition-all"
                                    title="Rename Tab / إعادة تسمية التابة"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveFormTab(t); }}
                                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-200 transition-all"
                                    title="Delete Tab / حذف التابة"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Tab button on the far right like in Image 3 */}
                        <div className="py-2">
                          <button
                            onClick={handleAddFormTab}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                            title="Add Form Tab / إضافة تابة للنموذج"
                          >
                            <Plus className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Add tab</span>
                          </button>
                        </div>
                      </div>

                      {/* Structure preview parser rendering like elegant ERP forms */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeFields.map((f, index) => {
                          const isSectionBreak = f.field_type === 'section_break' || f.field_name.includes('section_');
                          const isColumnBreak = f.field_type === 'column_break' || f.field_name.includes('column_');
                          const isEmptyColumn = f.field_type === 'empty_column' || f.field_name.includes('empty_');
                          const isFormTab = f.field_type === 'form_tab' || f.field_name.includes('form_tab_');

                          if (isFormTab) {
                            const isHidden = hiddenFieldIds.includes(f.id);
                            return (
                              <div 
                                key={f.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`col-span-1 md:col-span-2 pt-4 pb-2 border-b-2 border-violet-200 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all px-3 rounded-xl ${
                                  isHidden ? 'bg-slate-100 opacity-60 text-slate-400' : 'bg-violet-50/10'
                                } ${
                                  draggedIndex === index ? 'opacity-40 bg-violet-50/20 border-dashed border-violet-400' : ''
                                } ${
                                  dragOverIndex === index ? 'border-violet-500 ring-2 ring-violet-500/10' : ''
                                }`}
                              >
                                <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isHidden ? 'text-slate-400 line-through' : 'text-violet-700'}`}>
                                  <GripVertical className="w-3.5 h-3.5 text-violet-400 cursor-grab" />
                                  <Layers className="w-4 h-4 text-violet-500" />
                                  FORM TAB DIVIDER: {f.field_label_en} / {f.field_label_ar}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleFieldVisibility(f.id)}
                                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                      isHidden 
                                        ? "text-slate-400 hover:text-slate-600 hover:bg-slate-200" 
                                        : "text-violet-600 hover:text-violet-800 hover:bg-violet-50"
                                    }`}
                                    title={isHidden ? "Show Tab in live forms / إظهار التابة" : "Hide Tab in live forms / إخفاء التابة"}
                                  >
                                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleEditLayoutLabel(f.id)}
                                    className="text-slate-500 hover:text-indigo-600 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Tab Label / تعديل اسم التابة"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteField(f.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                    title="Remove Tab Divider"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (isSectionBreak) {
                            const isHidden = hiddenFieldIds.includes(f.id);
                            return (
                              <div 
                                key={f.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`col-span-1 md:col-span-2 pt-4 pb-2 border-b-2 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all ${
                                  isHidden ? 'bg-slate-100 opacity-60 text-slate-400 border-slate-200' : 'border-indigo-100'
                                } ${
                                  draggedIndex === index ? 'opacity-40 bg-indigo-50/10 border-dashed border-indigo-400' : ''
                                } ${
                                  dragOverIndex === index ? 'border-indigo-500 ring-2 ring-indigo-500/10' : ''
                                }`}
                              >
                                <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isHidden ? 'text-slate-400 line-through' : 'text-indigo-700'}`}>
                                  <GripVertical className="w-3.5 h-3.5 text-indigo-400 cursor-grab" />
                                  <Layout className="w-4 h-4" />
                                  {f.field_label_en} / {f.field_label_ar}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleFieldVisibility(f.id)}
                                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                      isHidden 
                                        ? "text-slate-400 hover:text-slate-600 hover:bg-slate-200" 
                                        : "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                    }`}
                                    title={isHidden ? "Show Section / إظهار القسم" : "Hide Section / إخفاء القسم"}
                                  >
                                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleEditLayoutLabel(f.id)}
                                    className="text-slate-500 hover:text-indigo-600 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Section Label / تعديل اسم القسم"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteField(f.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                    title="Remove Division"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (isColumnBreak || isEmptyColumn) {
                            return (
                              <div 
                                key={f.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`border rounded-lg p-3 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all ${
                                  draggedIndex === index ? 'opacity-40 bg-indigo-50/10 border-dashed border-indigo-400' : 'border-dashed border-indigo-200 bg-indigo-50/10'
                                } ${
                                  dragOverIndex === index ? 'border-indigo-500 ring-2 ring-indigo-500/10' : ''
                                }`}
                              >
                                <span className="text-[10px] font-mono font-bold text-indigo-600 flex items-center gap-1">
                                  <GripVertical className="w-3.5 h-3.5 text-indigo-400 cursor-grab" />
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                  {isColumnBreak ? 'COLUMN BREAK POINT' : 'EMPTY PLACEHOLDER'}
                                </span>
                                <button
                                  onClick={() => handleDeleteField(f.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          }

                          const isHidden = hiddenFieldIds.includes(f.id);
                          return (
                            <div 
                              key={f.id} 
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDrop={(e) => handleDrop(e, index)}
                              onDragEnd={handleDragEnd}
                              className={`p-3 border rounded-xl relative group transition-all cursor-grab active:cursor-grabbing ${
                                f.field_type === 'long_text' || f.field_type === 'text_editor' ? 'col-span-1 md:col-span-2' : ''
                              } ${
                                isHidden ? 'opacity-60 bg-slate-100 border-slate-200 text-slate-400' : 'bg-slate-50/20 hover:bg-slate-50/70 border-slate-200'
                              } ${
                                draggedIndex === index ? 'opacity-40 bg-indigo-50/20 border-dashed border-indigo-400' : ''
                              } ${
                                dragOverIndex === index ? 'border-indigo-500 ring-2 ring-indigo-500/10' : ''
                              }`}
                            >
                              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFieldVisibility(f.id)}
                                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                    isHidden 
                                      ? "text-slate-400 hover:text-slate-600 hover:bg-slate-200" 
                                      : "text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                  }`}
                                  title={isHidden ? "Show Field / إظهار الحقل" : "Hide Field / إخفاء الحقل"}
                                >
                                  {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(f.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Field"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${isHidden ? 'text-slate-400 line-through' : 'text-slate-400'}`}>
                                  <GripVertical className="w-3 h-3 text-slate-300" />
                                  {f.field_type}
                                </span>
                                {f.is_required && <span className="text-[9px] bg-rose-50 text-rose-600 px-1 rounded font-bold">Required</span>}
                              </div>

                              <div className="flex items-baseline justify-between gap-1">
                                <span className={`text-xs font-bold ${isHidden ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{f.field_label_en}</span>
                                <span className={`text-[10px] font-bold ${isHidden ? 'text-slate-400 line-through' : 'text-slate-400'}`}>{f.field_label_ar}</span>
                              </div>

                              <div className="mt-2 text-[11px] text-slate-400 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                                <span>Preview placeholder...</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                              </div>
                            </div>
                          );
                        })}

                        {activeFields.length === 0 && (
                          <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <p className="text-sm text-slate-500 font-semibold tracking-wide">Drag & Drop a section here from another tab</p>
                            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">OR</p>
                            <button
                              onClick={() => handleAddLayoutStructure('section_break')}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black border border-slate-200 cursor-pointer shadow-3xs transition-all flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Add a new section</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Properties panel description summary side */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                    <Info className="w-4 h-4 text-indigo-500" />
                    <span>Design Assistant</span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    هنا يمكنك تقسيم نموذج الإدخال (DocType) الخاص بك إلى تابات، وتخصيص كل تابة بإضافة حقول إدخال متنوعة من القائمة الكاملة المتاحة في النظام (مثل Barcode و HTML والمرفقات ومفاتيح الربط).
                  </p>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-indigo-600 block">نصائح للتصميم:</span>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-500 text-[11px]">
                      <li>استخدم <strong>Layout Division</strong> لتقسيم الصفحة إلى أقسام وأعمدة ليكون المظهر مرتباً.</li>
                      <li>اربط الموديولات ببعضها باستخدام حقول من نوع <strong>Link</strong> أو <strong>Table</strong>.</li>
                      <li>الحقول المضافة هنا تظهر تلقائياً للمستخدمين عند تعبئة البيانات.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. LIVE FORM PREVIEW MODE */}
            {designerTab === 'preview' && (
              <FormPreview 
                activeModule={activeModule}
                modTabs={modTabs.filter(t => !hiddenTabs.includes(t))}
                fields={fields.filter(f => !hiddenFieldIds.includes(f.id))}
                initialTab={selectedFormTab}
              />
            )}

            {/* TAB CONTENT: 3. CONNECTIONS MAPPER (Seventh picture mockup style) */}
            {designerTab === 'connections' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Connections Map / ربط الموديولات</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configure visual links, relational syncs or state pipelines with other systems</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    {connections.length} relational links active
                  </span>
                </div>

                {/* Form to add a connection */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Establish Link / إنشاء رابط جديد</span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Target Module / الموديول المستهدف</label>
                      <select
                        value={connTargetModule}
                        onChange={(e) => setConnTargetModule(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="">-- Choose Module --</option>
                        {modules.filter(m => m.id !== activeModule.id).map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Relation Type / نوع الربط</label>
                      <select
                        value={connType}
                        onChange={(e) => setConnType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="field_link">Field Link / ربط حقول</option>
                        <option value="status_sync">Status Sync / مزامنة حالة</option>
                        <option value="pipeline_transition">Pipeline Transition / انتقال مسار عمل</option>
                        <option value="child_table_link">Child Table / جدول تابع</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Source Connector Column</label>
                      <input
                        type="text"
                        value={connSourceField}
                        onChange={(e) => setConnSourceField(e.target.value)}
                        placeholder="e.g. customer_id"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Target Connector Column</label>
                      <input
                        type="text"
                        value={connTargetField}
                        onChange={(e) => setConnTargetField(e.target.value)}
                        placeholder="e.g. id"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleAddConnection}
                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect Module / تفعيل الربط</span>
                    </button>
                  </div>
                </div>

                {/* Connections visually rendered like picture 7 block lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {connections.map((c) => {
                    const targetObj = modules.find(m => m.id === c.target_module);
                    return (
                      <div key={c.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-xs transition-all flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Workflow className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-black text-slate-800">
                              {activeModule.name} <span className="text-slate-400 font-normal">➔</span> {targetObj?.name || c.target_module}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold font-mono">
                            <span className="bg-slate-100 px-2 py-0.5 rounded uppercase">{c.type.replace('_', ' ')}</span>
                            <span>({c.source_field || 'N/A'} ➔ {c.target_field || 'N/A'})</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveConnection(c.id)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {connections.length === 0 && (
                    <div className="col-span-2 py-16 text-center text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                      No active module-to-module links defined yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmation
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.title || 'Confirm Deletion / تأكيد الحذف'}
        message={deleteTarget?.message || 'Are you sure you want to delete this element? This action cannot be undone.'}
        loading={loading}
      />

      <AnimatePresence>
        {promptConfig && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-indigo-500" />
                  <span>{promptConfig.title}</span>
                </h3>
                {promptConfig.description && (
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{promptConfig.description}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={promptInputValue}
                  onChange={(e) => setPromptInputValue(e.target.value)}
                  placeholder={promptConfig.placeholder || 'Enter label...'}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-hidden transition-all shadow-3xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      promptConfig.onConfirm(promptInputValue);
                      setPromptConfig(null);
                    } else if (e.key === 'Escape') {
                      setPromptConfig(null);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPromptConfig(null)}
                  className="px-4 py-2 text-xs font-black text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all"
                >
                  Cancel / إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    promptConfig.onConfirm(promptInputValue);
                    setPromptConfig(null);
                  }}
                  className="px-4 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Confirm / تأكيد
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add New Module Modal / فورم إضافة موديول جديد */}
        {isCreateModuleModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Add New Module / موديول جديد</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Configure custom module schema variables securely</p>
                </div>
                <button 
                  onClick={() => setIsCreateModuleModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitCreateModule} className="p-6 space-y-4">
                {/* Module ID (Key) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Module ID (Key) / معرف الموديول (lowercase English only)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. custom_evaluation"
                    value={newModuleId}
                    onChange={(e) => setNewModuleId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-hidden transition-all shadow-3xs"
                  />
                  <p className="text-[9px] text-slate-400 font-bold">Lowercase alphabets, numbers, and underscores only. This acts as the database key identifier.</p>
                </div>

                {/* Module Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Module Display Name / اسم الموديول
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Employee Performance Evaluation"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-hidden transition-all shadow-3xs"
                  />
                </div>

                {/* Icon Selector with real time Lucide mapping preview */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Icon Selector / قائمة اختيار الأيقونة (Lucide Icon)
                  </label>
                  <div className="grid grid-cols-6 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-36 overflow-y-auto">
                    {[
                      { name: 'Database', ar: 'قاعدة بيانات' },
                      { name: 'Sparkles', ar: 'تطوير' },
                      { name: 'Layers', ar: 'طبقات' },
                      { name: 'Settings', ar: 'إعدادات' },
                      { name: 'Link2', ar: 'رابط' },
                      { name: 'Calendar', ar: 'تقويم' },
                      { name: 'FileText', ar: 'مستند' },
                      { name: 'CheckSquare', ar: 'مهام' },
                      { name: 'LayoutGrid', ar: 'شبكة' },
                      { name: 'FileSpreadsheet', ar: 'جدول' },
                      { name: 'Kanban', ar: 'كانبان' },
                      { name: 'UserPlus', ar: 'موارد' },
                      { name: 'Briefcase', ar: 'عمل' },
                      { name: 'TrendingUp', ar: 'نمو' },
                      { name: 'DollarSign', ar: 'محاسبة' },
                      { name: 'ShoppingCart', ar: 'مخزون' },
                      { name: 'Activity', ar: 'نشاط' },
                      { name: 'Cpu', ar: 'تقنية' }
                    ].map((ic) => {
                      const LucideIcon = (LucideIcons as any)[ic.name] || Database;
                      const isSelected = newModuleIcon === ic.name;
                      return (
                        <button
                          key={ic.name}
                          type="button"
                          onClick={() => setNewModuleIcon(ic.name)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                          title={`${ic.name} - ${ic.ar}`}
                        >
                          <LucideIcon className="w-5 h-5 shrink-0" />
                          <span className="text-[8px] font-black mt-1 uppercase truncate max-w-full">{ic.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visible Toggle & Order Index */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Order Index / ترتيب الفرز
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newModuleOrderIndex}
                      onChange={(e) => setNewModuleOrderIndex(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-hidden transition-all shadow-3xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Module Visible / موديول مرئي
                    </label>
                    <div className="flex items-center gap-2.5 h-11">
                      <button
                        type="button"
                        onClick={() => setNewModuleVisible(!newModuleVisible)}
                        className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none relative cursor-pointer ${
                          newModuleVisible ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <div 
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all absolute top-0.5 ${
                            newModuleVisible ? 'left-6' : 'left-0.5'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-bold text-slate-600">
                        {newModuleVisible ? 'Visible / مرئي' : 'Hidden / مخفي'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModuleModalOpen(false)}
                    className="px-4 py-2 text-xs font-black text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all"
                  >
                    Cancel / إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Module / إنشاء الموديول</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
