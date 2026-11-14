import React, { useState, useEffect } from 'react';
import {
  FileText,
  ExternalLink,
  RotateCw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  AlertCircle,
  Globe,
  HardDrive,
  Layers,
  Sparkles
} from 'lucide-react';

export interface CVDocumentViewerProps {
  url: string;
  candidateName?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

/**
 * Smart Link Formatter for candidate CV and portfolio links.
 * Automatically adapts Google Drive, PDFs/Documents, Canva, Behance, and web portfolios into iframe-ready preview URLs.
 */
export function formatCvEmbedUrl(rawUrl: string): { embedUrl: string; provider: 'google_drive' | 'google_viewer' | 'direct' | 'empty' } {
  if (!rawUrl || !rawUrl.trim()) {
    return { embedUrl: '', provider: 'empty' };
  }
  const trimmed = rawUrl.trim();

  // 1. Google Drive File Links
  // Match: https://drive.google.com/file/d/FILE_ID/view... -> /preview
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`,
      provider: 'google_drive'
    };
  }

  // Match: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const driveOpenMatch = trimmed.match(/drive\.google\.com\/(?:open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch && driveOpenMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`,
      provider: 'google_drive'
    };
  }

  // Google Docs / Sheets / Presentations
  if (trimmed.includes('docs.google.com/document/d/')) {
    const docId = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (docId) {
      return {
        embedUrl: `https://docs.google.com/document/d/${docId}/preview`,
        provider: 'google_drive'
      };
    }
  }

  if (trimmed.includes('docs.google.com/spreadsheets/d/')) {
    const sheetId = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (sheetId) {
      return {
        embedUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/preview`,
        provider: 'google_drive'
      };
    }
  }

  if (trimmed.includes('docs.google.com/presentation/d/')) {
    const slideId = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (slideId) {
      return {
        embedUrl: `https://docs.google.com/presentation/d/${slideId}/preview`,
        provider: 'google_drive'
      };
    }
  }

  // 2. Direct PDF / Office document URLs
  const isDocExtension = /\.(pdf|docx?|pptx?|xlsx?|txt|rtf)(\?.*)?$/i.test(trimmed);
  if (isDocExtension) {
    return {
      embedUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(trimmed)}&embedded=true`,
      provider: 'google_viewer'
    };
  }

  // Already wrapped in Google Docs Viewer
  if (trimmed.includes('docs.google.com/viewer')) {
    return {
      embedUrl: trimmed,
      provider: 'google_viewer'
    };
  }

  // 3. Generic Portfolios, Canva, Behance, GitHub, Personal Sites
  return {
    embedUrl: trimmed,
    provider: 'direct'
  };
}

export const CVDocumentViewer: React.FC<CVDocumentViewerProps> = ({
  url,
  candidateName,
  isExpanded = false,
  onToggleExpand,
  className = ''
}) => {
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [forceViewerMode, setForceViewerMode] = useState<'auto' | 'google_viewer' | 'direct'>('auto');

  // Compute smart embed URL
  const { embedUrl: autoEmbedUrl, provider } = formatCvEmbedUrl(url);

  let finalEmbedUrl = autoEmbedUrl;
  if (forceViewerMode === 'google_viewer') {
    finalEmbedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url.trim())}&embedded=true`;
  } else if (forceViewerMode === 'direct') {
    finalEmbedUrl = url.trim();
  }

  useEffect(() => {
    setIsLoading(true);
  }, [finalEmbedUrl, reloadKey]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setReloadKey(prev => prev + 1);
  };

  if (!url || !url.trim()) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1 font-serif">
          No CV or Portfolio Link Provided
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto">
          This candidate profile does not have an attached document link yet. You can add one via the Edit Profile action.
        </p>
      </div>
    );
  }

  const getProviderBadge = () => {
    if (provider === 'google_drive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <HardDrive className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Google Drive Preview
        </span>
      );
    }
    if (provider === 'google_viewer') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Document / PDF Viewer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        Web / Portfolio Embed
      </span>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 md:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: Badge & Source URL pill */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0 max-w-full">
          {getProviderBadge()}

          {/* Truncated source URL pill */}
          <div
            title={`Source: ${url}`}
            className="group flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-mono max-w-[260px] sm:max-w-[380px] md:max-w-[480px] transition-colors"
          >
            <span className="truncate">{url}</span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 transition-colors shrink-0"
              title="Copy link"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode switch fallback dropdown if needed */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setForceViewerMode('auto')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                forceViewerMode === 'auto'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Smart Auto
            </button>
            <button
              type="button"
              onClick={() => setForceViewerMode('google_viewer')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                forceViewerMode === 'google_viewer'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Docs Engine
            </button>
            <button
              type="button"
              onClick={() => setForceViewerMode('direct')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                forceViewerMode === 'direct'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Direct
            </button>
          </div>

          {/* Reload button */}
          <button
            type="button"
            onClick={handleReload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
            title="Reload Viewer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Reload</span>
          </button>

          {/* Open in New Tab button */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b5e20] hover:bg-green-800 text-white text-xs font-bold transition-all shadow-xs"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </a>

          {/* Optional Expand Toggle */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={isExpanded ? 'Normal view' : 'Expand full canvas'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Responsive Viewer Container */}
      <div className="relative w-full h-[750px] min-h-[70vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Loading Spinner Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center transition-opacity">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="absolute -inset-1 rounded-2xl border-2 border-dashed border-emerald-500 animate-spin" />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
              Initializing Zero-Storage Viewer
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Rendering candidate portfolio document for {candidateName || 'Candidate'}...
            </p>
          </div>
        )}

        {/* Embedded Iframe */}
        <iframe
          key={`${finalEmbedUrl}-${reloadKey}`}
          src={finalEmbedUrl}
          title={candidateName ? `${candidateName}'s CV / Portfolio` : 'Candidate CV / Portfolio Document'}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 rounded-2xl bg-white dark:bg-slate-950"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />

        {/* Bottom Helpful Footnote */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Zero-Storage Smart Embed Viewer &bull; Real-time cloud preview without backend storage consumption
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 font-bold transition-colors inline-flex items-center gap-1"
          >
            Having trouble viewing? Open externally <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
