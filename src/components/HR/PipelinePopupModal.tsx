import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X, ExternalLink, Sparkles } from 'lucide-react';

export interface PopupConfig {
  title?: string;
  message?: string;
  checkbox_label?: string;
  button_label?: string;
  action_type?: string; // 'navigate_employee' | 'navigate_module' | 'link' | 'text_only'
  action_target?: string;
}

interface PipelinePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  config?: PopupConfig;
  onConfirmAction?: (data: { closeJobOpening: boolean; action_type?: string; action_target?: string }) => void;
}

export const PipelinePopupModal: React.FC<PipelinePopupModalProps> = ({
  isOpen,
  onClose,
  candidateName = 'Marc',
  config = {},
  onConfirmAction
}) => {
  const [closeJobOpening, setCloseJobOpening] = useState(true);

  if (!isOpen) return null;

  // Replace placeholders in title and message
  const rawTitle = config.title || '[Candidate Name] got the job!';
  const rawMessage = config.message || 'Add [Candidate Name] as a new employee now.';
  const checkboxLabel = config.checkbox_label !== undefined ? config.checkbox_label : 'Close this job opening and remove the public posting';
  const buttonLabel = config.button_label || 'Add New Employee';

  const formattedTitle = rawTitle.replace(/\[Candidate Name\]|\[Name\]|\[candidate\]/gi, candidateName);
  const formattedMessage = rawMessage.replace(/\[Candidate Name\]|\[Name\]|\[candidate\]/gi, candidateName);

  const handleConfirm = () => {
    if (onConfirmAction) {
      onConfirmAction({
        closeJobOpening,
        action_type: config.action_type || 'navigate_employee',
        action_target: config.action_target || 'directory'
      });
    } else {
      onClose();
    }
  };

  // Sample decorative confetti pieces
  const confettiPieces = [
    { bg: 'bg-emerald-400', top: 'top-8', left: 'left-8', rotate: 'rotate-12', size: 'w-2 h-2' },
    { bg: 'bg-indigo-400', top: 'top-12', right: 'right-12', rotate: '-rotate-45', size: 'w-2.5 h-2.5' },
    { bg: 'bg-amber-400', top: 'top-20', left: 'left-16', rotate: 'rotate-45', size: 'w-2 h-2' },
    { bg: 'bg-pink-400', top: 'top-28', right: 'right-20', rotate: 'rotate-12', size: 'w-3 h-3' },
    { bg: 'bg-purple-400', top: 'top-10', left: 'left-1/3', rotate: '-rotate-12', size: 'w-2.5 h-2.5' },
    { bg: 'bg-rose-400', top: 'top-32', left: 'left-10', rotate: 'rotate-45', size: 'w-2 h-2' },
    { bg: 'bg-cyan-400', top: 'top-36', right: 'right-8', rotate: '-rotate-30', size: 'w-2.5 h-2.5' },
    { bg: 'bg-emerald-500', top: 'top-44', right: 'right-1/4', rotate: 'rotate-12', size: 'w-2 h-2' },
    { bg: 'bg-blue-400', top: 'top-16', right: 'right-1/3', rotate: '-rotate-45', size: 'w-2 h-2' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl sm:rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden max-w-lg w-full p-6 sm:p-8 relative font-sans text-slate-800"
        >
          {/* Confetti Decorative Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-80">
            {confettiPieces.map((p, idx) => (
              <div 
                key={idx} 
                className={`absolute ${p.bg} ${p.size} ${p.top} ${p.left || ''} ${p.right || ''} ${p.rotate} rounded-xs opacity-80 animate-pulse`} 
              />
            ))}
          </div>

          {/* Close button */}
          <button 
            type="button"
            onClick={onClose} 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all z-10 cursor-pointer shadow-2xs"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Badge */}
          <div className="text-center pt-2 relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EEF8F0] border border-emerald-100/90 text-[#1E701E] shadow-xs mb-3">
              <CheckCircle2 className="w-7 h-7 text-[#1E701E]" />
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight leading-snug">
              {formattedTitle}
            </h3>

            {/* Message */}
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              {formattedMessage}
            </p>
          </div>

          {/* Checkbox Section (if checkboxLabel is provided) */}
          {checkboxLabel && (
            <div className="mt-6 relative z-10">
              <label className="bg-slate-100/80 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors group">
                <input 
                  type="checkbox" 
                  checked={closeJobOpening}
                  onChange={(e) => setCloseJobOpening(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1E701E] focus:ring-[#1E701E] border-slate-300 accent-[#1E701E] cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">
                  {checkboxLabel}
                </span>
              </label>
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6 bg-slate-50/60 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 sm:p-6 rounded-b-3xl sm:rounded-b-[32px] relative z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#2563EB] hover:text-blue-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-[#1E701E] hover:bg-[#165516] text-white text-xs sm:text-sm font-extrabold rounded-full shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <span>{buttonLabel}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
