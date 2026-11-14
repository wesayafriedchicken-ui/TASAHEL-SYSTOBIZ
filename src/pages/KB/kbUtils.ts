import { KnowledgeArticle } from '../../types';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export const slugifyHeading = (rawText: string, existingSlugs: Set<string> = new Set()): string => {
  let clean = rawText
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '')
    .replace(/&#39;/g, '')
    .trim();

  let slug = clean
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) slug = 'heading';

  let uniqueSlug = slug;
  let counter = 1;
  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  existingSlugs.add(uniqueSlug);
  return uniqueSlug;
};

export const extractTableOfContents = (content: string): TocHeading[] => {
  if (!content) return [];

  const found: { index: number; level: number; text: string; existingId?: string }[] = [];

  // 1. Search for HTML headings <h1..4>
  const htmlRegex = /<h([1-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = htmlRegex.exec(content)) !== null) {
    const level = parseInt(match[1], 10);
    const attrs = match[2] || '';
    const innerHtml = match[3] || '';
    
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const existingId = idMatch ? idMatch[1] : undefined;

    const text = innerHtml.replace(/<[^>]+>/g, '').trim();
    if (text) {
      found.push({ index: match.index, level, text, existingId });
    }
  }

  // 2. Search for Markdown headings
  const mdRegex = /^(#{1,4})\s+(.+)$/gm;
  while ((match = mdRegex.exec(content)) !== null) {
    const level = match[1].length;
    let text = match[2].trim();
    text = text.replace(/<[^>]+>/g, '').trim();
    if (text && !text.startsWith('<h') && !text.endsWith('>')) {
      found.push({ index: match.index, level, text });
    }
  }

  // Sort in document appearance order
  found.sort((a, b) => a.index - b.index);

  const slugs = new Set<string>();
  const toc: TocHeading[] = [];

  for (const item of found) {
    const id = item.existingId || slugifyHeading(item.text, slugs);
    slugs.add(id);
    toc.push({
      id,
      text: item.text,
      level: item.level
    });
  }

  return toc;
};

export const markdownToHtml = (md: string): string => {
  if (!md) return '';

  const lines = md.split('\n');
  const result: string[] = [];

  let inList = false;
  let inOrderedList = false;
  let inTable = false;
  let tableHeaders: string[] = [];
  let inCode = false;

  const usedHeadingSlugs = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block handler
    if (trimmed.startsWith('```')) {
      if (inCode) {
        result.push('</pre></div>');
        inCode = false;
      } else {
        result.push('<div class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs my-4 overflow-x-auto"><pre>');
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      result.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    // Table handler
    if (trimmed.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
        if (nextLine.startsWith('|') && nextLine.includes('---')) {
          i++; // Skip divider
        }

        result.push('<div class="overflow-x-auto my-6 border border-slate-200 rounded-2xl shadow-sm"><table class="min-w-full divide-y divide-slate-200 text-sm"><thead class="bg-slate-50"><tr>');
        tableHeaders.forEach(h => {
          result.push(`<th class="px-4 py-3 text-left font-bold text-slate-700">${h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`);
        });
        result.push('</tr></thead><tbody class="divide-y divide-slate-100 bg-white">');
      } else {
        result.push('<tr>');
        cells.forEach(c => {
          let cellHtml = c
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>');
          result.push(`<td class="px-4 py-3 text-slate-800">${cellHtml}</td>`);
        });
        result.push('</tr>');
      }
      continue;
    } else {
      if (inTable) {
        result.push('</tbody></table></div>');
        inTable = false;
      }
    }

    // Lists handler
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.substring(2);
      if (!inList) {
        result.push('<ul class="list-disc pl-6 my-3 space-y-1.5 text-slate-700">');
        inList = true;
      }
      result.push(`<li>${content}</li>`);
      continue;
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, '');
      if (!inOrderedList) {
        result.push('<ol class="list-decimal pl-6 my-3 space-y-1.5 text-slate-700">');
        inOrderedList = true;
      }
      result.push(`<li>${content}</li>`);
      continue;
    } else {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
    }

    // Headings handler with automatic slug ids
    if (trimmed.startsWith('#### ')) {
      const text = trimmed.substring(5);
      const id = slugifyHeading(text, usedHeadingSlugs);
      result.push(`<h4 id="${id}" class="text-base font-bold text-slate-800 mt-4 mb-2 scroll-mt-24">${text}</h4>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      const text = trimmed.substring(4);
      const id = slugifyHeading(text, usedHeadingSlugs);
      result.push(`<h3 id="${id}" class="text-lg font-bold text-slate-800 mt-5 mb-2 scroll-mt-24">${text}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      const text = trimmed.substring(3);
      const id = slugifyHeading(text, usedHeadingSlugs);
      result.push(`<h2 id="${id}" class="text-xl font-bold text-slate-900 mt-6 mb-3 border-b border-slate-100 pb-1 scroll-mt-24">${text}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      const text = trimmed.substring(2);
      const id = slugifyHeading(text, usedHeadingSlugs);
      result.push(`<h1 id="${id}" class="text-2xl font-black text-slate-900 mt-8 mb-4 scroll-mt-24">${text}</h1>`);
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      result.push('<hr class="my-6 border-slate-200" />');
      continue;
    }

    // Paragraphs
    if (trimmed === '') {
      continue;
    }

    // Check if it's already a full HTML tag block
    if (
      trimmed.startsWith('<div') || 
      trimmed.startsWith('<table') || 
      trimmed.startsWith('<details') || 
      trimmed.startsWith('<summary') || 
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<ul') || 
      trimmed.startsWith('<ol') || 
      trimmed.startsWith('<li') || 
      trimmed.startsWith('<p') || 
      trimmed.startsWith('<blockquote') || 
      trimmed.startsWith('<pre') || 
      trimmed.startsWith('<tr') || 
      trimmed.startsWith('<td') || 
      trimmed.startsWith('<th')
    ) {
      result.push(line);
    } else {
      result.push(`<p class="my-2 text-slate-700 leading-relaxed">${line}</p>`);
    }
  }

  // Close any open tags
  if (inTable) result.push('</tbody></table></div>');
  if (inList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');
  if (inCode) result.push('</pre></div>');

  let finalHtml = result.join('\n');

  // Inline styling replacements (bold, italic, links, etc.)
  finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');
  finalHtml = finalHtml.replace(/_(.*?)_/g, '<em>$1</em>');

  // Markdown links: [text](url)
  finalHtml = finalHtml.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>');

  // Ensure all HTML headings have an id attribute matching their slug
  finalHtml = finalHtml.replace(/<h([1-4])(\b[^>]*)>([\s\S]*?)<\/h\1>/gi, (fullMatch, level, attrs, inner) => {
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    if (idMatch) {
      usedHeadingSlugs.add(idMatch[1]);
      return fullMatch;
    }
    const cleanText = inner.replace(/<[^>]+>/g, '').trim();
    const id = slugifyHeading(cleanText || `section-${level}`, usedHeadingSlugs);
    const scrollClass = attrs.includes('scroll-mt') ? '' : ' scroll-mt-24';
    return `<h${level} id="${id}"${attrs}${scrollClass}>${inner}</h${level}>`;
  });

  return finalHtml;
};

export const stripHtmlAndMarkdown = (htmlOrMarkdown: string) => {
  if (!htmlOrMarkdown) return '';

  // 1. Strip HTML tags
  let text = htmlOrMarkdown.replace(/<\/?[^>]+(>|$)/g, " ");

  // 2. Decode some basic HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 3. Strip Markdown images/links
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 4. Strip Markdown headings, bold, italic, list markers, code backticks
  text = text
    .replace(/#{1,6}\s+/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/(`{1,3})(.*?)\1/g, '$2')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s+/gm, '');

  // 5. Cleanup whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
};

export const getMergedAttachmentsAndLinks = (article: Partial<KnowledgeArticle>) => {
  const list: { title: string; url: string; is_link: boolean }[] = [];

  // 1. Safely Parse Stored Attachments
  if (article.attachments) {
    const raw = article.attachments.trim();
    if (raw !== '') {
      if (raw.startsWith('[') && raw.endsWith(']')) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item, index) => {
              const urlStr = typeof item === 'string' ? item : (item.url || '');
              const titleStr = typeof item === 'string' ? `Attachment ${index + 1}` : (item.title || `Attachment ${index + 1}`);
              if (urlStr) {
                list.push({ title: titleStr, url: urlStr, is_link: false });
              }
            });
          }
        } catch (e) {
          console.error("Error parsing attachments JSON", e);
        }
      } else {
        // Handle comma-separated or plain string
        raw.split(',').forEach((url, index) => {
          const trimmedUrl = url.trim();
          if (trimmedUrl) {
            list.push({ title: `Attachment ${index + 1}`, url: trimmedUrl, is_link: false });
          }
        });
      }
    }
  }

  // 2. Add External URLs if set
  if (article.external_url && article.external_url.trim() !== '') {
    const urls = article.external_url.split(',').map(u => u.trim()).filter(u => u !== '');
    urls.forEach((url, index) => {
      const titleStr = urls.length > 1 ? `External Link ${index + 1}` : 'External Link';
      list.push({ title: titleStr, url, is_link: true });
    });
  }

  // 3. Extract Links from Markdown & HTML Content
  if (article.content) {
    const contentStr = article.content;

    // Markdown links: [text](url)
    const mdRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = mdRegex.exec(contentStr)) !== null) {
      const text = match[1];
      const url = match[2];
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
        list.push({ title: text || 'Linked Document', url, is_link: true });
      }
    }

    // HTML links: <a href="...">text</a>
    const htmlRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*?>(.*?)<\/a>/g;
    while ((match = htmlRegex.exec(contentStr)) !== null) {
      const url = match[2];
      const text = match[3].replace(/<[^>]*>/g, '');
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
        list.push({ title: text || 'Linked Document', url, is_link: true });
      }
    }
  }

  // De-duplicate lists by URL
  const uniqueList: typeof list = [];
  const seenUrls = new Set<string>();
  for (const item of list) {
    const cleanUrl = item.url.trim();
    if (!seenUrls.has(cleanUrl)) {
      seenUrls.add(cleanUrl);
      uniqueList.push({ ...item, url: cleanUrl });
    }
  }

  return uniqueList;
};

export const sanitizeArticleData = (data: any, categories: any[] = [], defaultStatus = 'Draft') => {
  return {
    ...data,
    title: data.title || '',
    content: data.content || '',
    tags: data.tags || '',
    attachments: data.attachments || '[]',
    external_url: data.external_url || '',
    status: data.status || defaultStatus,
    content_type: data.content_type || 'Article',
    category_id: data.category_id || (categories && categories.length > 0 ? categories[0]?.id : 0),
    related_sop_id: data.related_sop_id || null,
    visible_departments: data.visible_departments || '[]',
    product_id: data.product_id || undefined,
    change_summary: ''
  };
};
