import React, { useState } from 'react';
import { 
  Smile, 
  MessageSquare, 
  Trash2, 
  FileText, 
  FileSpreadsheet, 
  File, 
  Download, 
  ExternalLink,
  CheckCheck,
  Megaphone,
  X
} from 'lucide-react';
import { CommMessage } from '../types';
import { useComm } from '../context/CommContext';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { formatRelativeTime, getFileCategory } from '../utils/mediaCompressor';

interface MessageBubbleProps {
  message: CommMessage;
  onDeleteMessage?: (id: number) => void;
  onToggleReaction: (messageId: number, emoji: string) => void;
  isThreadView?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '👏', '✔️', '🚀'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onDeleteMessage,
  onToggleReaction,
  isThreadView = false,
}) => {
  const { currentUser, openThread, employees } = useComm();
  const [showImageModal, setShowImageModal] = useState(false);

  const isCurrentUser = Number(message.sender_id) === Number(currentUser?.id);
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.email === 'admin@opex.com';

  const fileCategory = message.attachment_type ? getFileCategory(message.attachment_type) : null;

  // Render text with @mentions highlighted
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    // Match @[Name] or @Name
    const parts = text.split(/(@[a-zA-Z0-9_.\s-]+?(?=\s|$|[.,!?]))/g);

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const mentionName = part.slice(1).trim();
        const matchedEmp = employees.find(
          (e) => e.name.toLowerCase() === mentionName.toLowerCase()
        );
        return (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold text-xs transition-colors hover:bg-indigo-200 cursor-pointer"
            title={matchedEmp ? `${matchedEmp.name} (${matchedEmp.department || 'Employee'})` : part}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Sender initials
  const initials = (message.sender_name || 'User')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`group relative flex gap-3 px-3 sm:px-4 py-2 hover:bg-slate-50/80 transition-colors rounded-xl ${
        message.is_announcement ? 'bg-amber-50/40 border-l-4 border-amber-500' : ''
      }`}
    >
      {/* Sender Avatar */}
      <div className="shrink-0 pt-0.5">
        {message.sender_avatar ? (
          <img
            src={message.sender_avatar}
            alt={message.sender_name || 'User'}
            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shadow-sm"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {initials}
          </div>
        )}
      </div>

      {/* Main Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Sender Name, Announcement tag, & Timestamp */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-bold text-slate-900 truncate">
            {message.sender_name || 'Unknown'}
          </span>
          {message.is_announcement && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-amber-500 text-white rounded tracking-wider shadow-xs">
              <Megaphone className="w-2.5 h-2.5" /> Announcement
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-medium">
            {formatRelativeTime(message.created_at)}
          </span>
        </div>

        {/* Text Body */}
        {message.content && (
          <div className="text-sm text-slate-800 leading-relaxed break-words whitespace-pre-wrap font-sans">
            {renderMessageContent(message.content)}
          </div>
        )}

        {/* Attachment Renderer */}
        {message.attachment_url && (
          <div className="mt-2">
            {fileCategory === 'audio' ? (
              <VoiceNotePlayer
                src={message.attachment_url}
                duration={message.audio_duration}
                isSender={isCurrentUser}
              />
            ) : fileCategory === 'image' ? (
              <div className="relative group/img inline-block max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name || 'Attachment'}
                  className="max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setShowImageModal(true)}
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <a
                    href={message.attachment_url}
                    download={message.attachment_name || 'image'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors backdrop-blur-xs shadow-xs"
                    title="Download image"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              // Document / File Card (PDF, Excel, Word, etc.)
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all max-w-sm shadow-xs">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                  {fileCategory === 'pdf' ? (
                    <div className="w-full h-full bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs border border-rose-200">
                      <FileText className="w-5 h-5" />
                    </div>
                  ) : fileCategory === 'excel' ? (
                    <div className="w-full h-full bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs border border-emerald-200">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs border border-blue-200">
                      <File className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate" title={message.attachment_name}>
                    {message.attachment_name || 'Document File'}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {message.attachment_type || 'File'}
                  </p>
                </div>

                <a
                  href={message.attachment_url}
                  download={message.attachment_name || 'download'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Reaction Chips */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.reactions.map((r, i) => {
              const hasReacted = r.user_ids?.includes(Number(currentUser?.id));
              return (
                <button
                  key={i}
                  onClick={() => onToggleReaction(message.id, r.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                    hasReacted
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title={`${r.count} reactions`}
                >
                  <span>{r.emoji}</span>
                  <span className="text-[11px] font-bold">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread replies footer (Only in main view, not inside thread drawer itself) */}
        {!isThreadView && message.reply_count && message.reply_count > 0 ? (
          <div className="mt-2">
            <button
              onClick={() => openThread(message)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors py-0.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>
                {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
              </span>
              {message.last_reply_at && (
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  • Last reply {formatRelativeTime(message.last_reply_at)}
                </span>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {/* Floating Hover Action Bar */}
      <div className="absolute right-3 -top-3 hidden group-hover:flex items-center bg-white border border-slate-200 shadow-md rounded-xl px-1.5 py-1 gap-1 z-10 animate-fadeIn">
        {/* Quick Reactions */}
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onToggleReaction(message.id, emoji)}
            className="p-1 hover:bg-slate-100 rounded-lg text-sm transition-transform hover:scale-125"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}

        <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

        {/* Reply in Thread button (if not already in thread drawer) */}
        {!isThreadView && (
          <button
            onClick={() => openThread(message)}
            title="Reply in thread"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete Message (if sender or admin) */}
        {(isCurrentUser || isAdmin) && onDeleteMessage && (
          <button
            onClick={() => onDeleteMessage(message.id)}
            title="Delete message"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {showImageModal && message.attachment_url && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={message.attachment_url}
              alt={message.attachment_name || 'Enlarged Preview'}
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {message.attachment_name && (
              <div className="mt-2 text-white/80 text-xs font-mono">
                {message.attachment_name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
