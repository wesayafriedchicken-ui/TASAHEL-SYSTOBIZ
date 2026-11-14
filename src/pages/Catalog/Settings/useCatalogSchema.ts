import { useState, useEffect, useCallback } from 'react';
import {
  CatalogScopeSchemaConfig,
  SchemaSectionItem,
  SchemaFieldItem,
  SchemaActionItem,
  getCatalogDefaultSchema
} from './catalogModuleRegistry';

export const CATALOG_SCHEMA_CHANGE_EVENT = 'catalog_schema_customizations_changed';

export function useCatalogSchema(scopeKey: string) {
  const [schema, setSchema] = useState<CatalogScopeSchemaConfig>(() => {
    // Initial sync from localStorage cache or defaults
    try {
      const cached = localStorage.getItem(`catalog_schema_cache_${scopeKey}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore parse error
    }
    return getCatalogDefaultSchema(scopeKey);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load customizations from DB / API
  const loadSchema = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/schema-customizations/${scopeKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.schema_config && Array.isArray(data.schema_config.sections)) {
          const defaultSchema = getCatalogDefaultSchema(scopeKey);
          const savedConfig: CatalogScopeSchemaConfig = data.schema_config;

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

          const finalConfig: CatalogScopeSchemaConfig = {
            ...defaultSchema,
            displayName: savedConfig.displayName || defaultSchema.displayName,
            description: savedConfig.description || defaultSchema.description,
            sections: mergedSections
          };

          setSchema(finalConfig);
          try {
            localStorage.setItem(`catalog_schema_cache_${scopeKey}`, JSON.stringify(finalConfig));
          } catch {
            // Ignore cache error
          }
          setIsLoading(false);
          return;
        }
      }
      // If no server customization exists, load defaults
      const defaults = getCatalogDefaultSchema(scopeKey);
      setSchema(defaults);
      try {
        localStorage.setItem(`catalog_schema_cache_${scopeKey}`, JSON.stringify(defaults));
      } catch {
        // Ignore cache error
      }
    } catch (err: any) {
      console.warn(`[useCatalogSchema] Error loading schema from server for "${scopeKey}", falling back to local defaults:`, err);
      const defaults = getCatalogDefaultSchema(scopeKey);
      setSchema(defaults);
    } finally {
      setIsLoading(false);
    }
  }, [scopeKey]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  // Save changes to Server & Local Cache
  const saveSchema = async (updatedSchema?: CatalogScopeSchemaConfig): Promise<{ success: boolean; message?: string }> => {
    const configToSave = updatedSchema || schema;
    setIsSaving(true);
    try {
      // 1. Always update local cache immediately for zero-latency UI
      localStorage.setItem(`catalog_schema_cache_${scopeKey}`, JSON.stringify(configToSave));

      // 2. Dispatch cross-tab and cross-component notification
      window.dispatchEvent(
        new CustomEvent(CATALOG_SCHEMA_CHANGE_EVENT, {
          detail: { scopeKey, schema: configToSave }
        })
      );

      // 3. Persist to API endpoint
      const res = await fetch(`/api/products/schema-customizations/${scopeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema_config: configToSave })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setIsSaving(false);
      return { success: true, message: 'Customization persisted successfully' };
    } catch (err: any) {
      console.warn('[useCatalogSchema] Server persistence failed, saved locally:', err);
      setIsSaving(false);
      return { success: false, message: 'Saved to local workspace storage.' };
    }
  };

  // Reset to default schema definition
  const resetSchema = async (): Promise<{ success: boolean }> => {
    setIsSaving(true);
    try {
      await fetch(`/api/products/schema-customizations/${scopeKey}`, { method: 'DELETE' });
    } catch {
      // Ignore network error on reset
    }

    const defaults = getCatalogDefaultSchema(scopeKey);
    setSchema(defaults);
    try {
      localStorage.removeItem(`catalog_schema_cache_${scopeKey}`);
      localStorage.setItem(`catalog_schema_cache_${scopeKey}`, JSON.stringify(defaults));
    } catch {
      // Ignore storage error
    }

    window.dispatchEvent(
      new CustomEvent(CATALOG_SCHEMA_CHANGE_EVENT, {
        detail: { scopeKey, schema: defaults }
      })
    );

    setIsSaving(false);
    return { success: true };
  };

  // Add Custom Field to Section
  const addCustomField = (
    sectionId: string,
    fieldData: Omit<SchemaFieldItem, 'type' | 'isCustom'>
  ) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const newField: SchemaFieldItem = {
          ...fieldData,
          type: 'field',
          isCustom: true,
          permLevel: fieldData.permLevel ?? 0,
          orderIndex: sec.items.length
        };
        return {
          ...sec,
          items: [...sec.items, newField]
        };
      });

      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Add Custom Repeater Table to Section
  const addCustomTable = (
    sectionId: string,
    tableData: { id: string; label: string; description?: string; permLevel?: number }
  ) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const newTable: SchemaFieldItem = {
          id: tableData.id,
          label: tableData.label,
          description: tableData.description,
          type: 'table',
          isCustom: true,
          permLevel: tableData.permLevel ?? 0,
          orderIndex: sec.items.length
        };
        return {
          ...sec,
          items: [...sec.items, newTable]
        };
      });

      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Add Custom Section to Scope
  const addCustomSection = (sectionData: { name: string; description?: string }) => {
    setSchema((prev) => {
      const newSecId = `sec_custom_${Date.now()}`;
      const newSection: SchemaSectionItem = {
        id: newSecId,
        name: sectionData.name,
        description: sectionData.description,
        isCustom: true,
        orderIndex: prev.sections.length,
        items: [],
        actions: []
      };

      const updated = {
        ...prev,
        sections: [...prev.sections, newSection]
      };
      saveSchema(updated);
      return updated;
    });
  };

  // Register Custom Action Button to Section
  const addActionControl = (
    sectionId: string,
    actionData: Omit<SchemaActionItem, 'isCustom'>
  ) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const newAction: SchemaActionItem = {
          ...actionData,
          isCustom: true,
          orderIndex: sec.actions?.length || 0
        };
        return {
          ...sec,
          actions: [...(sec.actions || []), newAction]
        };
      });

      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Update Field Security, Permissions & Sensitivity
  const updateFieldSecurity = (
    sectionId: string,
    fieldId: string,
    updates: Partial<Pick<SchemaFieldItem, 'permLevel' | 'maskValue' | 'readOnly' | 'hidden' | 'isRequired' | 'label'>>
  ) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: sec.items.map((item) => {
            if (item.id !== fieldId) return item;
            return {
              ...item,
              ...updates
            };
          })
        };
      });

      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Reorder Field Item (Up / Down)
  const reorderItem = (sectionId: string, itemIndex: number, direction: 'up' | 'down') => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (targetIndex < 0 || targetIndex >= sec.items.length) return sec;

        const newItems = [...sec.items];
        const [moved] = newItems.splice(itemIndex, 1);
        newItems.splice(targetIndex, 0, moved);

        return {
          ...sec,
          items: newItems
        };
      });

      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Delete Custom Field or Table
  const deleteItem = (sectionId: string, itemId: string) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: sec.items.filter((item) => item.id !== itemId)
        };
      });

      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Delete Action Button
  const deleteAction = (sectionId: string, actionKey: string) => {
    setSchema((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          actions: sec.actions?.filter((act) => act.action_key !== actionKey)
        };
      });

      const updated = { ...prev, sections: nextSections };
      saveSchema(updated);
      return updated;
    });
  };

  // Delete Custom Section
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
