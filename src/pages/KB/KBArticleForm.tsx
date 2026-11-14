import React, { useState, useEffect, useRef, useMemo } from 'react';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, 
  Zap, 
  RefreshCw, 
  Plus, 
  Link as LinkIcon, 
  Tag, 
  Users, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List as ListIcon, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Minus, 
  Eraser, 
  Package,
  ArrowUpRight,
  Table,
  HelpCircle,
  X,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKB } from './KBContext';
import { cn } from '../../lib/utils';
import { markdownToHtml, extractTableOfContents, TocHeading } from './kbUtils';
import { KnowledgeArticle } from '../../types';

interface KBArticleFormProps {
  initialData?: Partial<KnowledgeArticle>;
  isEditing?: boolean;
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting?: boolean;
  onCancel: () => void;
  onDelete?: () => void;
}

export const KBArticleForm: React.FC<KBArticleFormProps> = ({
  initialData,
  isEditing = false,
  onSubmit,
  isSubmitting = false,
  onCancel,
  onDelete
}) => {
  const navigate = useNavigate();
  const { 
    categories, 
    departments, 
    globalStatuses, 
    sops, 
    products, 
    showToast,
    canAccessSops,
    canAccessProducts
  } = useKB();

  const [formData, setFormData] = useState<Partial<KnowledgeArticle>>({
    title: '',
    content: '',
    category_id: categories.length > 0 ? categories[0]?.id : 0,
    tags: '',
    attachments: '[]',
    related_sop_id: null as any,
    content_type: 'Article',
    external_url: '',
    status: globalStatuses.find(s => s.module_id === 'kb' && s.is_default)?.label || 'Draft',
    visible_departments: '[]',
    product_id: undefined,
    change_summary: '',
    ...initialData
  });

  // Sync initialData if it updates (e.g. from fetch in edit page)
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        category_id: initialData.category_id || prev.category_id || (categories[0]?.id || 0),
        status: initialData.status || prev.status || 'Draft',
        content_type: initialData.content_type || prev.content_type || 'Article'
      }));
    }
  }, [initialData, categories]);

  // Multiple external URLs parsing & updating
  const externalUrls = useMemo(() => {
    if (!formData.external_url) return [''];
    const parts = formData.external_url.split(',').map(s => s.trim());
    return parts.length > 0 ? parts : [''];
  }, [formData.external_url]);

  const updateExternalUrls = (urls: string[]) => {
    setFormData(prev => ({
      ...prev,
      external_url: urls.join(',')
    }));
  };

  // Check if selected category is related to Product or Service
  const activeSelectedCat = useMemo(() => {
    return categories.find(c => c.id === formData.category_id);
  }, [categories, formData.category_id]);

  const activeCatName = useMemo(() => {
    return activeSelectedCat?.name?.toLowerCase() || '';
  }, [activeSelectedCat]);

  const isProductOrServiceCategory = useMemo(() => {
    return activeCatName.includes('product') ||
           activeCatName.includes('service');
  }, [activeCatName]);

  const displayedProducts = useMemo(() => {
    return products.filter(p => {
      if (activeCatName.includes('product')) {
        return p.type === 'product';
      }
      if (activeCatName.includes('service')) {
        return p.type === 'service';
      }
      return true;
    });
  }, [products, activeCatName]);

  // AI Assistant State
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Visual Editor State
  const [editorTab, setEditorTab] = useState<'visual' | 'code'>('visual');
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const lastVisualContentRef = useRef<string>('');

  useEffect(() => {
    if (editorTab === 'visual' && visualEditorRef.current) {
      const currentVal = formData.content || '';
      if (currentVal !== lastVisualContentRef.current) {
        const hasHtmlTags = /<[a-z][\s\S]*>/i.test(currentVal);
        let htmlToSet = currentVal;
        if (!hasHtmlTags && currentVal.trim() !== '') {
          htmlToSet = markdownToHtml(currentVal);
        }
        visualEditorRef.current.innerHTML = htmlToSet;
        lastVisualContentRef.current = currentVal;
      }
    }
  }, [formData.content, editorTab]);

  const insertAtCursor = (textToInsert: string) => {
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = formData.content || '';
      const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
      setFormData(prev => ({ ...prev, content: newText }));
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
      }, 50);
    } else {
      setFormData(prev => ({ ...prev, content: (prev.content || '') + '\n' + textToInsert }));
    }
  };

  const insertHtmlAtCursor = (htmlToInsert: string) => {
    if (editorTab === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const el = document.createElement("div");
        el.innerHTML = htmlToInsert;
        const frag = document.createDocumentFragment();
        let node;
        while ((node = el.firstChild)) {
          frag.appendChild(node);
        }
        range.insertNode(frag);
        const updatedHtml = visualEditorRef.current.innerHTML;
        lastVisualContentRef.current = updatedHtml;
        setFormData(prev => ({ ...prev, content: updatedHtml }));
      } else {
        visualEditorRef.current.innerHTML += htmlToInsert;
        const updatedHtml = visualEditorRef.current.innerHTML;
        lastVisualContentRef.current = updatedHtml;
        setFormData(prev => ({ ...prev, content: updatedHtml }));
      }
    } else {
      insertAtCursor(htmlToInsert);
    }
  };

  const RICH_TEMPLATES: Record<string, string> = {
    'callout-info': `<div class="p-4 mb-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl text-blue-800 font-medium flex items-start gap-2">
  <span class="text-lg">ℹ️</span>
  <div>
    <strong>Information Heading</strong>
    <p class="text-sm mt-1">This is an informational callout block. Use it to highlight critical context, hints, or helpful explanations.</p>
  </div>
</div>`,
    'callout-success': `<div class="p-4 mb-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 font-medium flex items-start gap-2">
  <span class="text-lg">✅</span>
  <div>
    <strong>Success / Tip Heading</strong>
    <p class="text-sm mt-1">This is a success or best practice callout block. Use it to highlight recommendations, best practices, or successfully completed steps.</p>
  </div>
</div>`,
    'callout-warning': `<div class="p-4 mb-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-800 font-medium flex items-start gap-2">
  <span class="text-lg">⚠️</span>
  <div>
    <strong>Important Warning Heading</strong>
    <p class="text-sm mt-1">This is a warning or alert callout block. Use it to highlight risks, crucial policies, or actions that must be avoided.</p>
  </div>
</div>`,
    'table': `<div class="overflow-x-auto my-6 border border-slate-200 rounded-2xl shadow-sm">
  <table class="min-w-full divide-y divide-slate-200 text-sm">
    <thead class="bg-slate-50">
      <tr>
        <th class="px-4 py-3 text-left font-bold text-slate-700">Feature / Metric</th>
        <th class="px-4 py-3 text-left font-bold text-slate-700">Target Value</th>
        <th class="px-4 py-3 text-left font-bold text-slate-700">Current Status</th>
        <th class="px-4 py-3 text-left font-bold text-slate-700">Notes / Comments</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 bg-white">
      <tr>
        <td class="px-4 py-3 text-slate-800 font-medium">Sales Conversion</td>
        <td class="px-4 py-3 text-slate-600">15%</td>
        <td class="px-4 py-3 text-amber-700 font-semibold">12%</td>
        <td class="px-4 py-3 text-slate-500">Moving up due to new CRM tools</td>
      </tr>
      <tr>
        <td class="px-4 py-3 text-slate-800 font-medium">Response Time</td>
        <td class="px-4 py-3 text-slate-600">&lt; 2 Hours</td>
        <td class="px-4 py-3 text-emerald-700 font-semibold">1.8 Hours</td>
        <td class="px-4 py-3 text-slate-500">Target met successfully</td>
      </tr>
      <tr>
        <td class="px-4 py-3 text-slate-800 font-medium">Customer Satisfaction</td>
        <td class="px-4 py-3 text-slate-600">&gt; 90%</td>
        <td class="px-4 py-3 text-emerald-700 font-semibold">94%</td>
        <td class="px-4 py-3 text-slate-500">Excellent feedback on recent support</td>
      </tr>
    </tbody>
  </table>
</div>`,
    'timeline': `<div class="space-y-4 my-6">
  <div class="flex gap-4">
    <div class="flex flex-col items-center">
      <div class="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm">1</div>
      <div class="w-0.5 h-10 bg-indigo-100"></div>
    </div>
    <div class="pt-1">
      <h4 class="text-base font-bold text-slate-800">First Step / Discovery</h4>
      <p class="text-sm text-slate-600 mt-1">Gather requirements, verify client objectives, and establish scope boundaries.</p>
    </div>
  </div>
  <div class="flex gap-4">
    <div class="flex flex-col items-center">
      <div class="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm">2</div>
      <div class="w-0.5 h-10 bg-indigo-100"></div>
    </div>
    <div class="pt-1">
      <h4 class="text-base font-bold text-slate-800">Second Step / Execution</h4>
      <p class="text-sm text-slate-600 mt-1">Develop solutions following best practices and conduct internal QA testing.</p>
    </div>
  </div>
  <div class="flex gap-4">
    <div class="flex flex-col items-center">
      <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">3</div>
    </div>
    <div class="pt-1">
      <h4 class="text-base font-bold text-slate-800">Third Step / Delivery</h4>
      <p class="text-sm text-slate-600 mt-1">Deploy changes to production, train staff, and gather final feedback.</p>
    </div>
  </div>
</div>`,
    'faq': `<div class="my-6 space-y-4">
  <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
    <span>🙋</span>
    <span>Frequently Asked Questions</span>
  </h3>
  
  <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
    <h4 class="text-sm font-bold text-slate-800">Q1: How do we initiate a refund request?</h4>
    <p class="text-xs text-slate-600 mt-2 leading-relaxed">
      <strong>A:</strong> Go to the Sales CRM module, select the specific customer, and click on <strong>Request Refund</strong>. Submit the form with details and approval will be routed to the Finance team.
    </p>
  </div>

  <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
    <h4 class="text-sm font-bold text-slate-800">Q2: Who has permission to edit Knowledge Base articles?</h4>
    <p class="text-xs text-slate-600 mt-2 leading-relaxed">
      <strong>A:</strong> Only users assigned with the 'Editor' or 'Administrator' roles in the Knowledge Base settings can create or edit articles. General staff have read-only access.
    </p>
  </div>
</div>`
  };

  // Live Table of Contents detection
  const formToc: TocHeading[] = useMemo(() => {
    return extractTableOfContents(formData.content || '');
  }, [formData.content]);

  // FAQ Accordion Customization State
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqTitle, setFaqTitle] = useState('');
  const [includeFaqTitle, setIncludeFaqTitle] = useState(false);
  const [faqItems, setFaqItems] = useState<Array<{ q: string; a: string }>>([
    {
      q: 'How do I submit a new request?',
      a: 'Navigate to the relevant module, click the New Request button, fill in the required fields, and submit for team review.'
    },
    {
      q: 'Who has permission to approve changes?',
      a: 'Only designated Team Leads and Department Managers with approval privileges can review and grant status updates.'
    },
    {
      q: 'What is the standard response time?',
      a: 'Standard priority items are processed within 2 business hours, while urgent requests are routed immediately.'
    }
  ]);

  // Data Table Customization State
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableColsCount, setTableColsCount] = useState(4);
  const [tableRowsCount, setTableRowsCount] = useState(3);
  const [tableHeaders, setTableHeaders] = useState<string[]>([
    'Feature / Metric',
    'Target Value',
    'Current Status',
    'Notes / Remarks'
  ]);

  const handleUpdateColsCount = (newCount: number) => {
    const validCount = Math.max(1, Math.min(10, newCount));
    setTableColsCount(validCount);
    setTableHeaders(prev => {
      const next = [...prev];
      if (validCount > next.length) {
        for (let i = next.length; i < validCount; i++) {
          next.push(`Column ${i + 1}`);
        }
      } else {
        return next.slice(0, validCount);
      }
      return next;
    });
  };

  const handleInsertCustomTable = () => {
    const cols = tableHeaders.slice(0, tableColsCount);
    const rows: string[][] = [];
    for (let r = 0; r < tableRowsCount; r++) {
      const rowData: string[] = [];
      for (let c = 0; c < tableColsCount; c++) {
        rowData.push(`Data ${r + 1}.${c + 1}`);
      }
      rows.push(rowData);
    }

    if (editorTab === 'code') {
      const mdHeader = `| ${cols.map(c => c || 'Column').join(' | ')} |`;
      const mdDivider = `| ${cols.map(() => '---').join(' | ')} |`;
      const mdRows = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
      const mdTable = `\n${mdHeader}\n${mdDivider}\n${mdRows}\n`;
      insertAtCursor(mdTable);
    } else {
      const htmlTable = `<div class="overflow-x-auto my-6 border border-slate-200 rounded-2xl shadow-sm">
  <table class="min-w-full divide-y divide-slate-200 text-sm">
    <thead class="bg-slate-50">
      <tr>
        ${cols.map(h => `<th class="px-4 py-3 text-left font-bold text-slate-700">${h || 'Column'}</th>`).join('')}
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 bg-white">
      ${rows.map(row => `
      <tr class="hover:bg-slate-50/50">
        ${row.map(cell => `<td class="px-4 py-3 text-slate-800 text-xs">${cell}</td>`).join('')}
      </tr>`).join('')}
    </tbody>
  </table>
</div>\n`;
      insertHtmlAtCursor(htmlTable);
    }

    setShowTableModal(false);
    showToast(`Table inserted (${tableColsCount} columns × ${tableRowsCount} rows)!`, 'success');
  };

  const handleAddTableRow = () => {
    if (editorTab !== 'visual' || !visualEditorRef.current) {
      showToast('Switch to Visual Editor to add rows dynamically', 'error');
      return;
    }
    const selection = window.getSelection();
    let table: HTMLTableElement | null = null;
    if (selection && selection.anchorNode) {
      let curr: Node | null = selection.anchorNode;
      while (curr && curr !== visualEditorRef.current) {
        if (curr.nodeName === 'TABLE') {
          table = curr as HTMLTableElement;
          break;
        }
        curr = curr.parentNode;
      }
    }
    if (!table) {
      table = visualEditorRef.current.querySelector('table');
    }
    if (!table) {
      setShowTableModal(true);
      return;
    }

    const colCount = table.querySelector('thead tr')?.children.length || table.rows[0]?.cells.length || 3;
    let tbody = table.querySelector('tbody');
    if (!tbody) {
      tbody = document.createElement('tbody');
      tbody.className = 'divide-y divide-slate-100 bg-white';
      table.appendChild(tbody);
    }

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/50';
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.className = 'px-4 py-3 text-slate-800 text-xs';
      td.textContent = `New Data ${tbody.rows.length + 1}.${i + 1}`;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);

    const updatedHtml = visualEditorRef.current.innerHTML;
    lastVisualContentRef.current = updatedHtml;
    setFormData(prev => ({ ...prev, content: updatedHtml }));
    showToast('New row added to table', 'success');
  };

  const handleAddTableColumn = () => {
    if (editorTab !== 'visual' || !visualEditorRef.current) {
      showToast('Switch to Visual Editor to add columns dynamically', 'error');
      return;
    }
    const selection = window.getSelection();
    let table: HTMLTableElement | null = null;
    if (selection && selection.anchorNode) {
      let curr: Node | null = selection.anchorNode;
      while (curr && curr !== visualEditorRef.current) {
        if (curr.nodeName === 'TABLE') {
          table = curr as HTMLTableElement;
          break;
        }
        curr = curr.parentNode;
      }
    }
    if (!table) {
      table = visualEditorRef.current.querySelector('table');
    }
    if (!table) {
      setShowTableModal(true);
      return;
    }

    const theadRow = table.querySelector('thead tr');
    const colIndex = (theadRow?.children.length || 0) + 1;
    if (theadRow) {
      const th = document.createElement('th');
      th.className = 'px-4 py-3 text-left font-bold text-slate-700 text-xs';
      th.textContent = `Column ${colIndex}`;
      theadRow.appendChild(th);
    }

    const tbodyRows = table.querySelectorAll('tbody tr');
    if (tbodyRows.length > 0) {
      tbodyRows.forEach((row, rIdx) => {
        const td = document.createElement('td');
        td.className = 'px-4 py-3 text-slate-800 text-xs';
        td.textContent = `Data ${rIdx + 1}.${colIndex}`;
        row.appendChild(td);
      });
    }

    const updatedHtml = visualEditorRef.current.innerHTML;
    lastVisualContentRef.current = updatedHtml;
    setFormData(prev => ({ ...prev, content: updatedHtml }));
    showToast(`New column (${colIndex}) added to table`, 'success');
  };

  const handleRemoveTableRow = () => {
    if (editorTab !== 'visual' || !visualEditorRef.current) return;
    const table = visualEditorRef.current.querySelector('table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (tbody && tbody.rows.length > 1) {
      tbody.deleteRow(tbody.rows.length - 1);
      const updatedHtml = visualEditorRef.current.innerHTML;
      lastVisualContentRef.current = updatedHtml;
      setFormData(prev => ({ ...prev, content: updatedHtml }));
      showToast('Row removed from table', 'success');
    } else {
      showToast('Cannot delete the last remaining row', 'error');
    }
  };

  const handleRemoveTableColumn = () => {
    if (editorTab !== 'visual' || !visualEditorRef.current) return;
    const table = visualEditorRef.current.querySelector('table');
    if (!table) return;
    const theadRow = table.querySelector('thead tr');
    if (theadRow && theadRow.children.length > 1) {
      const colIdx = theadRow.children.length - 1;
      theadRow.removeChild(theadRow.lastElementChild!);
      const tbodyRows = table.querySelectorAll('tbody tr');
      tbodyRows.forEach(row => {
        if (row.children.length > colIdx) {
          row.removeChild(row.children[colIdx]);
        }
      });
      const updatedHtml = visualEditorRef.current.innerHTML;
      lastVisualContentRef.current = updatedHtml;
      setFormData(prev => ({ ...prev, content: updatedHtml }));
      showToast('Column removed from table', 'success');
    } else {
      showToast('Cannot delete the last remaining column', 'error');
    }
  };

  const handleInsertCustomFaq = () => {
    const validQuestions = faqItems.filter(item => item.q.trim() !== '' || item.a.trim() !== '');
    if (validQuestions.length === 0) {
      showToast('Please specify at least one question', 'error');
      return;
    }

    const hasTitle = includeFaqTitle && faqTitle.trim() !== '';
    const titleHtml = hasTitle
      ? `<h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
    <span>🙋</span>
    <span>${faqTitle.trim()}</span>
  </h3>`
      : '';

    const questionsHtml = validQuestions.map(item => `
  <details class="group p-4 bg-white border border-slate-200 rounded-2xl shadow-xs transition-all hover:border-slate-300">
    <summary class="text-sm font-bold text-slate-800 list-none flex items-center justify-between cursor-pointer select-none">
      <span>${item.q.trim() || 'Question'}</span>
      <span class="text-xs font-mono text-slate-400 group-open:rotate-180 transition-transform">▼</span>
    </summary>
    <div class="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
      ${item.a.trim() || 'Answer description goes here.'}
    </div>
  </details>`).join('\n');

    const fullFaqHtml = `<div class="my-6 space-y-3">
  ${titleHtml}
  ${questionsHtml}
</div>\n`;

    insertHtmlAtCursor(fullFaqHtml);
    setShowFaqModal(false);
    showToast(`FAQ Accordion inserted with ${validQuestions.length} questions!`, 'success');
  };

  const handleInsertTemplate = (templateType: string) => {
    if (templateType === 'table') {
      setShowTableModal(true);
      return;
    }
    if (templateType === 'faq') {
      setShowFaqModal(true);
      return;
    }
    const templateHtml = RICH_TEMPLATES[templateType];
    if (templateHtml) {
      insertHtmlAtCursor(templateHtml);
      showToast('Template inserted at cursor!', 'success');
    }
  };

  const handleAiAction = async (action: 'draft' | 'polish' | 'translate' | 'insert-template', templateType?: string) => {
    if (action === 'insert-template') {
      if (templateType && RICH_TEMPLATES[templateType]) {
        handleInsertTemplate(templateType);
        return;
      }
    }
    setIsAiGenerating(true);
    setAiError(null);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const selectedCat = categories.find(c => c.id === formData.category_id);
      const categoryName = selectedCat ? `${selectedCat.name} (${selectedCat.department_name})` : '';

      const res = await fetch('/api/kb/ai-assist', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action,
          text: formData.content || '',
          title: formData.title || '',
          category: categoryName,
          instructions: action === 'insert-template' ? templateType : aiInstructions
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'AI Assistant request failed');
      }

      const data = await res.json();
      const aiResult = data.result;
      let processedContent = aiResult;

      if (editorTab === 'visual' && action !== 'insert-template') {
        processedContent = markdownToHtml(aiResult);
      }

      if (action === 'draft') {
        setFormData(prev => ({ ...prev, content: processedContent }));
        showToast('Draft generated successfully!', 'success');
      } else if (action === 'polish') {
        setFormData(prev => ({ ...prev, content: processedContent }));
        showToast('Content polished successfully!', 'success');
      } else if (action === 'translate') {
        setFormData(prev => ({ ...prev, content: processedContent }));
        showToast('Content translated successfully!', 'success');
      } else if (action === 'insert-template') {
        insertHtmlAtCursor(aiResult);
        showToast('Template inserted!', 'success');
      }
      setAiInstructions('');
    } catch (err: any) {
      console.error('AI Action Error:', err);
      setAiError(err.message || 'AI Assist failed');
      showToast(err.message || 'AI Assist failed', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || formData.category_id === 0) {
      if (categories && categories.length > 0) {
        formData.category_id = categories[0]?.id || 0;
      } else {
        alert('Please select or create a category first.');
        return;
      }
    }
    onSubmit(formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left / Main Form Column */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title *</label>
            <input 
              required
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              placeholder="e.g. Standard Return & Refund Policy 2026"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category *</label>
              <select 
                required
                value={formData.category_id || (categories[0]?.id || 0)}
                onChange={e => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.department_name || 'General'})
                  </option>
                ))}
              </select>
            </div>

            {/* If Category is Product or Service */}
            {isProductOrServiceCategory && (
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Link to Product / Service</span>
                  </label>
                  {formData.product_id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/catalog/items/${formData.product_id}`)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                      title="View product/service page"
                    >
                      <span>View in Catalog</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <select
                  value={formData.product_id || ''}
                  onChange={e => setFormData({ ...formData, product_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-xs font-bold text-slate-700"
                >
                  <option value="">-- Select related item (none) --</option>
                  {displayedProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type === 'product' ? 'Product' : 'Service'}) - {p.price} {p.currency}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Content Type</label>
              <select 
                value={formData.content_type || 'Article'}
                onChange={e => setFormData({ ...formData, content_type: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                <option value="Article">Rich Text Article</option>
                <option value="PDF">PDF Document</option>
                <option value="Video">Video Link</option>
                <option value="Link">External Link</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select 
                value={formData.status || 'Draft'}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                {globalStatuses.filter(s => s.module_id === 'kb').length > 0 ? (
                  globalStatuses.filter(s => s.module_id === 'kb').map(s => (
                    <option key={s.id} value={s.label}>{s.label}</option>
                  ))
                ) : (
                  <>
                    <option value="Draft">Draft</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Published">Published</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* External URLs */}
          <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-500" />
                External URLs / Links (for PDF/Video/Link)
              </span>
              <span className="text-[10px] text-indigo-500 font-bold lowercase">Supports multiple links</span>
            </label>
            <div className="space-y-2">
              {externalUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    value={url}
                    onChange={e => {
                      const newUrls = [...externalUrls];
                      newUrls[index] = e.target.value;
                      updateExternalUrls(newUrls);
                    }}
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm"
                    placeholder="e.g. https://example.com/document.pdf or video url"
                  />
                  {externalUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newUrls = externalUrls.filter((_, idx) => idx !== index);
                        updateExternalUrls(newUrls);
                      }}
                      className="px-3 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center cursor-pointer"
                      title="Remove link"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => updateExternalUrls([...externalUrls, ''])}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold mt-1 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Another URL
            </button>
          </div>

          {/* Related SOP and Tags */}
          <div className={cn("grid gap-6", canAccessSops !== false ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
            {canAccessSops !== false && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Related SOP</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={formData.related_sop_id || ''}
                    onChange={e => setFormData({ ...formData, related_sop_id: e.target.value ? parseInt(e.target.value) : null as any })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  >
                    <option value="">None</option>
                    {sops.map(sop => (
                      <option key={sop.id} value={sop.id}>{sop.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags (comma separated)</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={formData.tags || ''}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="refunds, policies, onboarding"
                />
              </div>
            </div>
          </div>

          {/* Department Access Control */}
          <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Department Access Control
              </label>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">
                {(() => {
                  try {
                    const depts = JSON.parse(formData.visible_departments || '[]');
                    return depts.length === 0 ? 'Public (All Departments)' : `${depts.length} Restricted Departments`;
                  } catch (e) {
                    return 'Public (All Departments)';
                  }
                })()}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select which departments can see this article. If no department is selected, the article will be visible to everyone.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {departments.map(dept => {
                let isSelected = false;
                try {
                  const depts = JSON.parse(formData.visible_departments || '[]');
                  isSelected = Array.isArray(depts) && depts.map(Number).includes(Number(dept.id));
                } catch (e) {}

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      let currentDepts: number[] = [];
                      try {
                        currentDepts = JSON.parse(formData.visible_departments || '[]');
                        if (!Array.isArray(currentDepts)) currentDepts = [];
                      } catch (e) {}

                      let updatedDepts: number[];
                      if (currentDepts.map(Number).includes(Number(dept.id))) {
                        updatedDepts = currentDepts.map(Number).filter(id => id !== Number(dept.id));
                      } else {
                        updatedDepts = [...currentDepts.map(Number), Number(dept.id)];
                      }
                      setFormData(prev => ({
                        ...prev,
                        visible_departments: JSON.stringify(updatedDepts)
                      }));
                    }}
                    className={cn(
                      "px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 cursor-pointer",
                      isSelected 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isSelected ? "bg-white" : "bg-slate-300"
                    )} />
                    {dept.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Content (Rich Text / Markdown) *
              </label>

              <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setEditorTab('visual')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    editorTab === 'visual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <span>📝 Visual Editor (WYSIWYG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('code')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    editorTab === 'code' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <span>💻 Code / Markdown</span>
                </button>
              </div>
            </div>

            {editorTab === 'visual' ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                {/* Visual Formatting Toolbar */}
                <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap gap-2 items-center">
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      title="Normal Text"
                      onClick={() => {
                        document.execCommand('formatBlock', false, '<p>');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                    >
                      P
                    </button>
                    <button
                      type="button"
                      title="Heading 2"
                      onClick={() => {
                        document.execCommand('formatBlock', false, '<h2>');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 border-l border-slate-100 rounded-md transition-all cursor-pointer"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      title="Heading 3"
                      onClick={() => {
                        document.execCommand('formatBlock', false, '<h3>');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 border-l border-slate-100 rounded-md transition-all cursor-pointer"
                    >
                      H3
                    </button>
                  </div>

                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Bold"
                      onClick={() => {
                        document.execCommand('bold');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Italic"
                      onClick={() => {
                        document.execCommand('italic');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Underline"
                      onClick={() => {
                        document.execCommand('underline');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Strikethrough"
                      onClick={() => {
                        document.execCommand('strikeThrough');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Bullet List"
                      onClick={() => {
                        document.execCommand('insertUnorderedList');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Numbered List"
                      onClick={() => {
                        document.execCommand('insertOrderedList');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Align Left"
                      onClick={() => {
                        document.execCommand('justifyLeft');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Align Center"
                      onClick={() => {
                        document.execCommand('justifyCenter');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Align Right"
                      onClick={() => {
                        document.execCommand('justifyRight');
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />

                  <button
                    type="button"
                    title="Insert Link"
                    onClick={() => {
                      const url = prompt('Enter link URL:', 'https://');
                      if (url) {
                        document.execCommand('createLink', false, url);
                        const h = visualEditorRef.current?.innerHTML || '';
                        setFormData({ ...formData, content: h });
                      }
                    }}
                    className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Horizontal Line"
                    onClick={() => {
                      document.execCommand('insertHorizontalRule');
                      const h = visualEditorRef.current?.innerHTML || '';
                      setFormData({ ...formData, content: h });
                    }}
                    className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 px-1">Color:</span>
                    {['#0f172a', '#4f46e5', '#10b981', '#ef4444', '#f59e0b'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          document.execCommand('foreColor', false, c);
                          const h = visualEditorRef.current?.innerHTML || '';
                          setFormData({ ...formData, content: h });
                        }}
                        className="w-4 h-4 rounded-full border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="h-5 w-[1px] bg-slate-200 mx-1" />

                  {/* Table & FAQ insertion controls */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      title="Insert Configurable Table"
                      onClick={() => setShowTableModal(true)}
                      className="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Table className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      title="Add Row to Table"
                      onClick={handleAddTableRow}
                      className="px-1.5 py-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded transition-all cursor-pointer"
                    >
                      +Row
                    </button>
                    <button
                      type="button"
                      title="Add Column to Table"
                      onClick={handleAddTableColumn}
                      className="px-1.5 py-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded transition-all cursor-pointer"
                    >
                      +Col
                    </button>
                    <button
                      type="button"
                      title="Remove Row from Table"
                      onClick={handleRemoveTableRow}
                      className="px-1.5 py-1 text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-all cursor-pointer"
                    >
                      -Row
                    </button>
                    <button
                      type="button"
                      title="Remove Column from Table"
                      onClick={handleRemoveTableColumn}
                      className="px-1.5 py-1 text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-all cursor-pointer"
                    >
                      -Col
                    </button>
                  </div>

                  <button
                    type="button"
                    title="Insert FAQ Accordion"
                    onClick={() => setShowFaqModal(true)}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>FAQ</span>
                  </button>

                  <button
                    type="button"
                    title="Clear Formatting"
                    onClick={() => {
                      document.execCommand('removeFormat');
                      const h = visualEditorRef.current?.innerHTML || '';
                      setFormData({ ...formData, content: h });
                    }}
                    className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-600 transition-all cursor-pointer ml-auto"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>

                {/* Visual Editor Content Editable */}
                <div 
                  ref={visualEditorRef}
                  contentEditable
                  onInput={(e) => {
                    const html = e.currentTarget.innerHTML;
                    lastVisualContentRef.current = html;
                    setFormData(prev => ({ ...prev, content: html }));
                  }}
                  className="prose prose-slate max-w-none focus:outline-none min-h-[420px] p-8 bg-white text-slate-800 leading-relaxed overflow-y-auto custom-scrollbar"
                  style={{ direction: 'rtl', textAlign: 'right' }}
                />

                <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    WYSIWYG Mode: Format visually with live styles.
                  </p>
                </div>
              </div>
            ) : (
              <div data-color-mode="light" className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <MDEditor
                  value={formData.content || ''}
                  onChange={(val) => setFormData({ ...formData, content: val || '' })}
                  preview="live"
                  height={450}
                  previewOptions={{
                    remarkPlugins: [[remarkGfm]],
                  }}
                  textareaProps={{
                    placeholder: 'Start writing your article... Markdown and HTML tags supported.',
                    required: formData.content_type === 'Article'
                  }}
                />
              </div>
            )}
          </div>

          {/* Change summary if editing */}
          {isEditing && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Summary *</label>
              <input 
                required
                value={formData.change_summary || ''}
                onChange={e => setFormData({ ...formData, change_summary: e.target.value })}
                className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-slate-800"
                placeholder="Briefly describe what you changed (e.g. Updated Section 3 with new return fees)"
              />
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-6 flex justify-between items-center border-t border-slate-100">
            {isEditing && onDelete ? (
              <button 
                type="button"
                onClick={onDelete}
                className="text-rose-600 font-bold text-xs hover:underline cursor-pointer"
              >
                Delete Article
              </button>
            ) : <div />}

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onCancel}
                className="px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Article' : 'Publish Article')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right Column: AI Assistant, Templates, Quick Emojis */}
      <div className="lg:col-span-4 space-y-6">
        {/* AI Writing Assistant */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Writing Assistant</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Drafting, polishing, and auto-translation powered by Gemini.
            </p>
          </div>

          {aiError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">
              {aiError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instructions (Optional)</label>
            <textarea 
              value={aiInstructions}
              onChange={e => setAiInstructions(e.target.value)}
              placeholder="e.g. Write formal corporate policy in Arabic with bullet points..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 min-h-[70px] resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isAiGenerating}
              onClick={() => handleAiAction('draft')}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isAiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Draft Article</span>
            </button>
            <button
              type="button"
              disabled={isAiGenerating || !formData.content}
              onClick={() => handleAiAction('polish')}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isAiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
              <span>Polish Text</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isAiGenerating || !formData.content}
              onClick={() => handleAiAction('translate')}
              className="w-full flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              🌐 Rephrase & Enhance English
            </button>
          </div>
        </div>

        {/* Templates & Rich Snippets */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Rich Templates (Insert at cursor)
            </h5>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Instant
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleInsertTemplate('callout-info')}
              className="flex items-center justify-between p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">ℹ️</span>
                <span className="text-xs font-semibold text-blue-900">Info Callout</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleInsertTemplate('callout-success')}
              className="flex items-center justify-between p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">✅</span>
                <span className="text-xs font-semibold text-emerald-900">Success Tip Box</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleInsertTemplate('callout-warning')}
              className="flex items-center justify-between p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span className="text-xs font-semibold text-amber-900">Warning Alert</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-base">📊</span>
                <div>
                  <span className="text-xs font-semibold block">Data Table</span>
                  <span className="text-[10px] text-slate-400">Custom rows &amp; columns</span>
                </div>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleInsertTemplate('timeline')}
              className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-base">⏳</span>
                <span className="text-xs font-semibold">Step Timeline</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => setShowFaqModal(true)}
              className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-base">🙋</span>
                <div>
                  <span className="text-xs font-semibold block">FAQ Accordion</span>
                  <span className="text-[10px] text-slate-400">Multiple Q&amp;As, optional title</span>
                </div>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Live Table of Contents Detector */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Table of Contents
            </h5>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {formToc.length} {formToc.length === 1 ? 'Heading' : 'Headings'}
            </span>
          </div>

          {formToc.length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <p className="text-xs text-slate-400 italic">No headings found</p>
              <p className="text-[10px] text-slate-400 mt-1">Use H2, H3, or # Headings to auto-generate the outline.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
              {formToc.map((item, idx) => (
                <div 
                  key={`toc-preview-${item.id}-${idx}`}
                  className={cn(
                    "text-xs truncate transition-colors py-0.5 flex items-center gap-1.5",
                    item.level === 1 ? "font-bold text-slate-800" :
                    item.level === 2 ? "pl-2 font-medium text-slate-700" :
                    "pl-4 text-slate-500"
                  )}
                  title={item.text}
                >
                  <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 px-1 py-0.2 rounded font-semibold shrink-0">H{item.level}</span>
                  <span className="truncate">{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Emojis Selector */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Emojis</h5>
          <div className="grid grid-cols-6 gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {['💡', 'ℹ️', '✅', '⚠️', '🙋', '🚀', '📦', '📊', '💻', '📞', '🤝', '🎯'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertHtmlAtCursor(emoji)}
                className="flex items-center justify-center p-1.5 hover:bg-white rounded-lg text-lg hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-none hover:shadow-sm"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Accordion Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-xs">
                  🙋
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Insert FAQ Accordion</h3>
                  <p className="text-xs text-slate-500">Configure multiple questions and answers. Section title is optional.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              {/* Optional Title Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFaqTitle}
                      onChange={(e) => setIncludeFaqTitle(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span>Include Section Title</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                </div>

                {includeFaqTitle && (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="text"
                      value={faqTitle}
                      onChange={(e) => setFaqTitle(e.target.value)}
                      placeholder="e.g. Frequently Asked Questions"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400">
                      Leave empty or untick if you do not want an accordion section title heading.
                    </p>
                  </div>
                )}
              </div>

              {/* Questions List Header & Quick Count */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Questions &amp; Answers ({faqItems.length})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                    {[2, 3, 4, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setFaqItems(prev => {
                            if (cnt > prev.length) {
                              const extra = Array.from({ length: cnt - prev.length }).map((_, idx) => ({
                                q: `Question ${prev.length + idx + 1}`,
                                a: `Answer for question ${prev.length + idx + 1} goes here.`
                              }));
                              return [...prev, ...extra];
                            }
                            return prev.slice(0, cnt);
                          });
                        }}
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                          faqItems.length === cnt
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        )}
                      >
                        {cnt} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {faqItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span>Question {idx + 1}</span>
                        </span>
                        {faqItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFaqItems(faqItems.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={item.q}
                        onChange={(e) => {
                          const updated = [...faqItems];
                          updated[idx].q = e.target.value;
                          setFaqItems(updated);
                        }}
                        placeholder={`Question #${idx + 1}`}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />

                      <textarea
                        value={item.a}
                        onChange={(e) => {
                          const updated = [...faqItems];
                          updated[idx].a = e.target.value;
                          setFaqItems(updated);
                        }}
                        placeholder="Answer details..."
                        rows={2}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFaqItems([
                      ...faqItems,
                      {
                        q: `Question ${faqItems.length + 1}`,
                        a: `Answer description for question ${faqItems.length + 1}.`
                      }
                    ]);
                  }}
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Question</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {faqItems.length} {faqItems.length === 1 ? 'question' : 'questions'} ready
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertCustomFaq}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Insert FAQ Accordion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-xs">
                  📊
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Insert Data Table</h3>
                  <p className="text-xs text-slate-500">Configure custom number of columns and rows.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              {/* Dimensions: Columns & Rows */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Columns</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateColsCount(tableColsCount - 1)}
                      disabled={tableColsCount <= 1}
                      className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-lg font-bold text-slate-800 w-8 text-center">{tableColsCount}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateColsCount(tableColsCount + 1)}
                      disabled={tableColsCount >= 10}
                      className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rows</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTableRowsCount(Math.max(1, tableRowsCount - 1))}
                      disabled={tableRowsCount <= 1}
                      className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-lg font-bold text-slate-800 w-8 text-center">{tableRowsCount}</span>
                    <button
                      type="button"
                      onClick={() => setTableRowsCount(Math.min(25, tableRowsCount + 1))}
                      disabled={tableRowsCount >= 25}
                      className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Dimension Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '3×3 Grid', c: 3, r: 3 },
                    { label: '4×3 Table', c: 4, r: 3 },
                    { label: '4×5 Table', c: 4, r: 5 },
                    { label: '5×4 Matrix', c: 5, r: 4 },
                    { label: '6×6 Grid', c: 6, r: 6 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        handleUpdateColsCount(preset.c);
                        setTableRowsCount(preset.r);
                      }}
                      className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                        tableColsCount === preset.c && tableRowsCount === preset.r
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Header Titles */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Column Headers ({tableColsCount})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from({ length: tableColsCount }).map((_, cIdx) => (
                    <div key={cIdx} className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Column {cIdx + 1}</span>
                      <input
                        type="text"
                        value={tableHeaders[cIdx] || ''}
                        onChange={(e) => {
                          const updated = [...tableHeaders];
                          updated[cIdx] = e.target.value;
                          setTableHeaders(updated);
                        }}
                        placeholder={`Header ${cIdx + 1}`}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {tableColsCount} columns × {tableRowsCount} rows
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertCustomTable}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Insert Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KBArticleForm;
