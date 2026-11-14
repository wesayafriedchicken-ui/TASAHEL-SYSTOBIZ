import { useState, useEffect, useCallback } from 'react';
import {
  SalesScopeSchemaConfig,
  SchemaSectionItem,
  SchemaFieldItem,
  SchemaActionItem,
  getSalesDefaultSchema
} from './salesModuleRegistry';

export const CRM_SCHEMA_CHANGE_EVENT = 'crm_schema_customizations_changed';

export function useSalesSchema(scopeKey: string) {
  const [schema, setSchema] = useState<SalesScopeSchemaConfig>(() => {
    // Initial sync from localStorage cache or defaults
    try {
      const cached = localStorage.getItem(`crm_schema_cache_${scopeKey}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore parse error
    }
    return getSalesDefaultSchema(scopeKey);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load customizations from DB / API
  const loadSchema = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/schema-customizations/${scopeKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.schema_config && Array.isArray(data.schema_config.sections)) {
          const defaultSchema = getSalesDefaultSchema(scopeKey);
          const savedConfig: SalesScopeSchemaConfig = data.schema_config;

          // Merge sections: keep default sections and append/merge saved ones
          const mergedSections: SchemaSectionItem[] = defaultSchema.sections.map((defSec) => {
            const savedSec = savedConfig.sections?.find((ss) => ss.id === defSec.id || ss.name === defSec.name);
            if (!savedSec) return defSec;

            // Items (fields and tables)
            const mergedItems: SchemaFieldItem[] = [...(savedSec.items || [])];
            // If default schema contains items not in saved, append them
            defSec.items.forEach((defItem) => {
              if (!mergedItems.some((m) => m.id === defItem.id)) {
                mergedItems.push(defItem);
              }
            });

            // Actions
            const mergedActions: SchemaActionItem[] = [...(savedSec.actions || [])];
            defSec.actions?.forEach((defAct) => {
              if (!mergedActions.some((m) => m.action_key === defAct.action_key)) {
                mergedActions.push(defAct);
              }
            });

            return {
              ...defSec,
              ...savedSec,
              items: mergedItems,
              actions: mergedActions
            };
          });

          // Append any custom sections created by user
          savedConfig.sections?.forEach((savedSec) => {
            if (!mergedSections.some((ms) => ms.id === savedSec.id || ms.name === savedSec.name)) {
              mergedSections.push(savedSec);
            }
          });

          const finalConfig: SalesScopeSchemaConfig = {
            ...defaultSchema,
            displayName: savedConfig.displayName || defaultSchema.displayName,
            description: savedConfig.description || defaultSchema.description,
            sections: mergedSections
          };

          setSchema(finalConfig);
          try {
            localStorage.setItem(`crm_schema_cache_${scopeKey}`, JSON.stringify(finalConfig));
          } catch {
            // Ignore cache error
          }
          setIsLoading(false);
          return;
        }
      }
      // If no server customization exists, load defaults
      const defaults = getSalesDefaultSchema(scopeKey);
      setSchema(defaults);
      try {
        localStorage.setItem(`crm_schema_cache_${scopeKey}`, JSON.stringify(defaults));
      } catch {
        // Ignore cache error
      }
    } catch (err: any) {
      console.warn(`[useSalesSchema] Failed to load schema for ${scopeKey}, using cache/defaults:`, err);
      const defaults = getSalesDefaultSchema(scopeKey);
      setSchema(defaults);
    } finally {
      setIsLoading(false);
    }
  }, [scopeKey]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  // Persist schema to DB
  const saveSchema = async (updatedSchema?: SalesScopeSchemaConfig): Promise<{ success: boolean; message?: string }> => {
    setIsSaving(true);
    const toSave = updatedSchema || schema;
    try {
      const res = await fetch(`/api/crm/schema-customizations/${scopeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema_config: toSave })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      setSchema(toSave);
      try {
        localStorage.setItem(`crm_schema_cache_${scopeKey}`, JSON.stringify(toSave));
        window.dispatchEvent(new CustomEvent(CRM_SCHEMA_CHANGE_EVENT, { detail: { scopeKey, schema: toSave } }));
      } catch {
        // Ignore cache error
      }

      setIsSaving(false);
      return { success: true, message: 'Schema changes successfully saved and applied.' };
    } catch (err: any) {
      console.error('[useSalesSchema] Save failed:', err);
      // Fallback: save to localStorage so user doesn't lose changes
      try {
        localStorage.setItem(`crm_schema_cache_${scopeKey}`, JSON.stringify(toSave));
        window.dispatchEvent(new CustomEvent(CRM_SCHEMA_CHANGE_EVENT, { detail: { scopeKey, schema: toSave } }));
      } catch {
        // Ignore
      }
      setIsSaving(false);
      return { success: true, message: 'Saved to local workspace storage.' };
    }
  };

  // Reset schema to default
  const resetSchema = async (): Promise<{ success: boolean; message?: string }> => {
    setIsSaving(true);
    try {
      await fetch(`/api/crm/schema-customizations/${scopeKey}`, { method: 'DELETE' });
      const defaults = getSalesDefaultSchema(scopeKey);
      setSchema(defaults);
      try {
        localStorage.removeItem(`crm_schema_cache_${scopeKey}`);
        window.dispatchEvent(new CustomEvent(CRM_SCHEMA_CHANGE_EVENT, { detail: { scopeKey, schema: defaults } }));
      } catch {
        // Ignore
      }
      setIsSaving(false);
      return { success: true, message: 'Restored system defaults successfully.' };
    } catch (err: any) {
      console.error('[useSalesSchema] Reset failed:', err);
      setIsSaving(false);
      return { success: false, message: 'Could not reset schema.' };
    }
  };

  // Add Custom Field to section
  const addCustomField = (
    sectionId: string,
    fieldData: Omit<SchemaFieldItem, 'type' | 'isCustom'>
  ) => {
    const newField: SchemaFieldItem = {
      ...fieldData,
      type: 'field',
      isCustom: true
    };

    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            items: [...sec.items, newField]
          };
        }
        return sec;
      });
      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Add Custom Table to section
  const addCustomTable = (
    sectionId: string,
    tableData: { id: string; label: string; permLevel?: number; description?: string }
  ) => {
    const newTable: SchemaFieldItem = {
      id: tableData.id,
      label: tableData.label,
      type: 'table',
      permLevel: tableData.permLevel ?? 1,
      description: tableData.description,
      isCustom: true
    };

    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            items: [...sec.items, newTable]
          };
        }
        return sec;
      });
      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Add Custom Section
  const addCustomSection = (sectionData: { name: string; description?: string }) => {
    const newSection: SchemaSectionItem = {
      id: `sec_custom_${Date.now()}`,
      name: sectionData.name,
      description: sectionData.description,
      isCustom: true,
      items: [],
      actions: []
    };

    setSchema((prev) => {
      const updated = { ...prev, sections: [...prev.sections, newSection] };
      saveSchema(updated);
      return updated;
    });
  };

  // Add Action / Button control to section
  const addActionControl = (
    sectionId: string,
    actionData: {
      action_key: string;
      label_en: string;
      permission_scope: 'super_admin' | 'everyone' | 'direct_manager' | 'self';
      state: 'active' | 'disabled' | 'hidden';
      tooltip_text?: string;
    }
  ) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          const newAction: SchemaActionItem = {
            id: `act_${Date.now()}`,
            action_key: actionData.action_key,
            section_name: sec.name,
            label_en: actionData.label_en,
            permission_scope: actionData.permission_scope,
            state: actionData.state,
            tooltip_text: actionData.tooltip_text,
            isCustom: true
          };
          return {
            ...sec,
            actions: [...(sec.actions || []), newAction]
          };
        }
        return sec;
      });
      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Update Field Security & Behavior
  const updateFieldSecurity = (
    sectionId: string,
    fieldId: string,
    updates: Partial<SchemaFieldItem>
  ) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            items: sec.items.map((it) => {
              if (it.id === fieldId) {
                return { ...it, ...updates };
              }
              return it;
            })
          };
        }
        return sec;
      });
      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Reorder items within a section (direction: 'up' | 'down')
  const reorderItem = (sectionId: string, itemIndex: number, direction: 'up' | 'down') => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          const items = [...sec.items];
          const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
          if (targetIndex < 0 || targetIndex >= items.length) return sec;
          const [moved] = items.splice(itemIndex, 1);
          items.splice(targetIndex, 0, moved);
          return { ...sec, items };
        }
        return sec;
      });
      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Delete field or table item
  const deleteItem = (sectionId: string, itemId: string) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            items: sec.items.filter((it) => it.id !== itemId)
          };
        }
        return sec;
      });
      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Delete action
  const deleteAction = (sectionId: string, actionKey: string) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            actions: sec.actions?.filter((act) => act.action_key !== actionKey)
          };
        }
        return sec;
      });
      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Delete section
  const deleteSection = (sectionId: string) => {
    setSchema((prev) => {
      const updated = {
        ...prev,
        sections: prev.sections.filter((sec) => sec.id !== sectionId)
      };
      saveSchema(updated);
      return updated;
    });
  };

  return {
    schema,
    isLoading,
    isSaving,
    error,
    reload: loadSchema,
    saveSchema,
    resetSchema,
    addCustomField,
    addCustomTable,
    addCustomSection,
    addActionControl,
    updateFieldSecurity,
    reorderItem,
    deleteItem,
    deleteAction,
    deleteSection
  };
}
