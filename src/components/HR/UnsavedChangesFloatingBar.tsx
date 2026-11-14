import React from 'react';
import { Save, RotateCcw, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export interface UnsavedChangesFloatingBarProps {
  show: boolean;
  isSaving: boolean;
  saveStatus?: 'idle' | 'success' | 'error';
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  title?: string;
  subtitle?: string;
  saveButtonText?: string;
  discardButtonText?: string;
  changedCount?: number;
}

export const UnsavedChangesFloatingBar: React.FC<UnsavedChangesFloatingBarProps> = ({
  show,
  isSaving,
  saveStatus = 'idle',
  onSave,
  onDiscard,
  title = "Unsaved Changes",
  subtitle = "You have unsaved edits in this employee file.",
  saveButtonText = "Save Changes",
  discardButtonText = "Discard",
  changedCount
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="unsaved-changes-floating-bar"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] w-[94%] max-w-2xl font-sans"
        >
          <div className="bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl md:rounded-full p-2.5 md:p-3 md:pl-5 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 ring-1 ring-white/10">
            {/* Left side: Pulsing Indicator & Status Text */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-xs shadow-emerald-400"></span>
                </span>
                
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-black text-white tracking-tight">
                      {title}
                    </span>
                    {changedCount !== undefined && changedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/30">
                        {changedCount} {changedCount === 1 ? 'change' : 'changes'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                    {subtitle}
                  </span>
                </div>
              </div>

              {/* Keyboard shortcut badge on desktop */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400">
                <span>Ctrl</span>
                <span>+</span>
                <span>S</span>
              </div>
            </div>

            {/* Right side: Discard & Save Action Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
              <button
                type="button"
                id="btn-discard-unsaved-changes"
                onClick={onDiscard}
                disabled={isSaving}
                className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/90 active:bg-slate-800 rounded-full transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                title="Discard all unsaved edits"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>{discardButtonText}</span>
              </button>

              <button
                type="button"
                id="btn-save-unsaved-changes"
                onClick={onSave}
                disabled={isSaving}
                className={cn(
                  "px-5 py-2 text-xs font-black rounded-full transition-all cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-70",
                  saveStatus === 'success'
                    ? "bg-emerald-600 text-white shadow-emerald-900/30"
                    : saveStatus === 'error'
                    ? "bg-rose-600 text-white shadow-rose-900/30 hover:bg-rose-700"
                    : "bg-[#1E701E] hover:bg-[#155415] text-white shadow-emerald-950/40 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                )}
                title="Save all changes to server"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : saveStatus === 'success' ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                <span>
                  {isSaving 
                    ? 'Saving Changes...' 
                    : saveStatus === 'success' 
                    ? 'Saved Successfully!' 
                    : saveButtonText}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
