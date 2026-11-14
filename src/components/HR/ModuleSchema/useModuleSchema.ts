import { useState, useEffect, useCallback } from 'react';
import {
  ModuleSchemaConfig,
  SchemaSubTabItem,
  SchemaSectionItem,
  SchemaFieldItem,
  SchemaActionItem,
  getModuleDefaultSchema
} from './hrModuleRegistry';

export function useModuleSchema(targetPage: string) {
  const [schema, setSchema] = useState<ModuleSchemaConfig>(() => getModuleDefaultSchema(targetPage));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load customizations from DB / API
  const loadSchema = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hr/schema-customizations/${targetPage}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.schema_config && data.schema_config.subTabs) {
          // Merge saved config over defaults
          const defaultSchema = getModuleDefaultSchema(targetPage);
          const savedConfig: ModuleSchemaConfig = data.schema_config;

          // Merge subtabs
          const mergedSubTabs: SchemaSubTabItem[] = defaultSchema.subTabs.map((defTab) => {
            const savedTab = savedConfig.subTabs?.find((st) => st.id === defTab.id);
            if (!savedTab) return defTab;

            // Merge sections within tab
            const mergedSections: SchemaSectionItem[] = defTab.sections.map((defSec) => {
              const savedSec = savedTab.sections?.find((ss) => ss.name === defSec.name);
              if (!savedSec) return defSec;

              // Items (fields and tables)
              const mergedItems: SchemaFieldItem[] = [...(savedSec.items || [])];
              // Ensure default items that aren't in saved are appended if newly added in code
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

            // Include any user-created custom sections
            savedTab.sections?.forEach((savedSec) => {
              if (!mergedSections.some((ms) => ms.name === savedSec.name)) {
                mergedSections.push(savedSec);
              }
            });

            return {
              ...defTab,
              ...savedTab,
              sections: mergedSections
            };
          });

          // Include any user-created custom subTabs
          savedConfig.subTabs?.forEach((savedTab) => {
            if (!mergedSubTabs.some((mst) => mst.id === savedTab.id)) {
              mergedSubTabs.push(savedTab);
            }
          });

          setSchema({
            ...defaultSchema,
            displayName: savedConfig.displayName || defaultSchema.displayName,
            description: savedConfig.description || defaultSchema.description,
            subTabs: mergedSubTabs
          });
          setIsLoading(false);
          return;
        }
      }
      // If no saved customization, use defaults
      setSchema(getModuleDefaultSchema(targetPage));
    } catch (err: any) {
      console.warn('Could not load schema customizations, falling back to defaults:', err);
      setSchema(getModuleDefaultSchema(targetPage));
    } finally {
      setIsLoading(false);
    }
  }, [targetPage]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  // Save to DB
  const saveSchema = async (newConfig: ModuleSchemaConfig): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/hr/schema-customizations/${targetPage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema_config: newConfig })
      });
      if (res.ok) {
        setSchema(newConfig);
        setIsSaving(false);
        return true;
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save schema customizations');
      }
    } catch (err: any) {
      console.error('Error saving schema:', err);
      setError(err.message || 'Failed to save');
      setIsSaving(false);
      return false;
    }
  };

  // Reset to default
  const resetSchema = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      await fetch(`/api/hr/schema-customizations/${targetPage}`, { method: 'DELETE' });
      const defaults = getModuleDefaultSchema(targetPage);
      setSchema(defaults);
      setIsSaving(false);
      return true;
    } catch (err) {
      console.error('Error resetting schema:', err);
      setIsSaving(false);
      return false;
    }
  };

  // Mutators on in-memory schema (call saveSchema when user clicks Save)
  const addCustomField = (
    tabId: string,
    sectionName: string,
    fieldData: Omit<SchemaFieldItem, 'id' | 'type'> & { id?: string }
  ) => {
    const newFieldId = fieldData.id || `custom_fld_${Date.now()}`;
    const newField: SchemaFieldItem = {
      id: newFieldId,
      type: 'field',
      label: fieldData.label,
      dataType: fieldData.dataType || 'text',
      permLevel: fieldData.permLevel ?? 0,
      ownOnly: fieldData.ownOnly ?? false,
      readOnly: fieldData.readOnly ?? false,
      hidden: fieldData.hidden ?? false,
      isRequired: fieldData.isRequired ?? false,
      maskValue: fieldData.maskValue ?? false,
      allowOnSubmit: fieldData.allowOnSubmit ?? true,
      options: fieldData.options || [],
      isCustom: true
    };

    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          return {
            ...sec,
            items: [...sec.items, newField]
          };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const addCustomTable = (
    tabId: string,
    sectionName: string,
    tableData: { label: string; permLevel?: number; description?: string }
  ) => {
    const newTableId = `custom_tbl_${Date.now()}`;
    const newTable: SchemaFieldItem = {
      id: newTableId,
      type: 'table',
      label: tableData.label,
      permLevel: tableData.permLevel ?? 0,
      isCustom: true
    };

    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          return {
            ...sec,
            items: [...sec.items, newTable]
          };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const addCustomSection = (tabId: string, sectionName: string) => {
    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        if (st.sections.some((s) => s.name === sectionName)) return st;
        return {
          ...st,
          sections: [
            ...st.sections,
            {
              name: sectionName,
              items: [],
              actions: []
            }
          ]
        };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const addActionControl = (
    tabId: string,
    sectionName: string,
    actionData: Omit<SchemaActionItem, 'action_key' | 'tab_id' | 'section_name'> & { action_key?: string }
  ) => {
    const newActionKey = actionData.action_key || `act_${Date.now()}`;
    const newAction: SchemaActionItem = {
      action_key: newActionKey,
      tab_id: tabId,
      section_name: sectionName,
      label_en: actionData.label_en,
      label_ar: actionData.label_ar || actionData.label_en,
      state: actionData.state || 'active',
      permission_scope: actionData.permission_scope || 'everyone',
      tooltip_text: actionData.tooltip_text || '',
      isCustom: true
    };

    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          const currentActions = sec.actions || [];
          return {
            ...sec,
            actions: [...currentActions, newAction]
          };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const updateActionControl = (
    tabId: string,
    sectionName: string,
    actionKey: string,
    patch: Partial<SchemaActionItem>
  ) => {
    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          const updatedActs = (sec.actions || []).map((act) => {
            if (act.action_key !== actionKey) return act;
            return { ...act, ...patch };
          });
          return { ...sec, actions: updatedActs };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const deleteActionControl = (tabId: string, sectionName: string, actionKey: string) => {
    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          return {
            ...sec,
            actions: (sec.actions || []).filter((a) => a.action_key !== actionKey)
          };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const reorderFields = (tabId: string, sectionName: string, fromIndex: number, toIndex: number) => {
    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          const newItems = [...sec.items];
          if (fromIndex < 0 || fromIndex >= newItems.length || toIndex < 0 || toIndex >= newItems.length) {
            return sec;
          }
          const [moved] = newItems.splice(fromIndex, 1);
          newItems.splice(toIndex, 0, moved);
          return { ...sec, items: newItems };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const reorderActions = (tabId: string, sectionName: string, fromIndex: number, toIndex: number) => {
    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          const newActions = [...(sec.actions || [])];
          if (fromIndex < 0 || fromIndex >= newActions.length || toIndex < 0 || toIndex >= newActions.length) {
            return sec;
          }
          const [moved] = newActions.splice(fromIndex, 1);
          newActions.splice(toIndex, 0, moved);
          return { ...sec, actions: newActions };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const updateFieldSecurity = (
    tabId: string,
    sectionName: string,
    fieldId: string,
    patch: Partial<SchemaFieldItem>
  ) => {
    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          const updatedItems = sec.items.map((item) => {
            if (item.id !== fieldId) return item;
            return { ...item, ...patch };
          });
          return { ...sec, items: updatedItems };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  const deleteFieldOrTable = (tabId: string, sectionName: string, itemId: string) => {
    setSchema((prev) => {
      const updatedTabs = prev.subTabs.map((st) => {
        if (st.id !== tabId) return st;
        const updatedSecs = st.sections.map((sec) => {
          if (sec.name !== sectionName) return sec;
          return {
            ...sec,
            items: sec.items.filter((i) => i.id !== itemId)
          };
        });
        return { ...st, sections: updatedSecs };
      });
      return { ...prev, subTabs: updatedTabs };
    });
  };

  return {
    schema,
    setSchema,
    isLoading,
    isSaving,
    error,
    saveSchema,
    resetSchema,
    addCustomField,
    addCustomTable,
    addCustomSection,
    addActionControl,
    updateActionControl,
    deleteActionControl,
    reorderFields,
    reorderActions,
    updateFieldSecurity,
    deleteFieldOrTable
  };
}
