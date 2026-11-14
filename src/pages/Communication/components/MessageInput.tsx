import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  X, 
  Megaphone, 
  Loader2,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { useComm } from '../context/CommContext';
import { VoiceRecorder } from './VoiceRecorder';
import { compressImageBeforeUpload, getFileCategory } from '../utils/mediaCompressor';
import { uploadFileToStorage } from '../../../lib/storage';

interface MessageInputProps {
  onSendMessage: (data: {
    content: string;
    mentions?: number[];
    is_announcement?: boolean;
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    audio_duration?: number;
  }) => Promise<void>;
  placeholder?: string;
  isAnnouncementAllowed?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = 'Type a message... (Press Enter to send, Shift+Enter for new line)',
  isAnnouncementAllowed = false,
}) => {
  const { employees, currentUser, playNotificationSound } = useComm();

  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Staged attachment
  const [attachment, setAttachment] = useState<{
    file: File;
    name: string;
    type: string;
    previewUrl?: string;
  } | null>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(0);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter employees for @mention
  const filteredEmployees = mentionQuery !== null
    ? employees
        .filter((emp) =>
          emp.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          (emp.department && emp.department.toLowerCase().includes(mentionQuery.toLowerCase()))
        )
        .slice(0, 6)
    : [];

  // Detect @mention trigger in text
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    setCursorPosition(pos);

    // Look back from current cursor for '@'
    const textBeforeCursor = val.slice(0, pos);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\s.-]*)$/);

    if (lastAtMatch && lastAtMatch.index !== undefined) {
      setMentionQuery(lastAtMatch[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }

    // Auto-expand textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  // Insert mention into text
  const insertMention = (empName: string) => {
    if (!textareaRef.current || mentionQuery === null) return;
    const val = content;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const textAfterCursor = val.slice(cursorPosition);

    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1) {
      const newText = textBeforeCursor.slice(0, atIndex) + `@${empName} ` + textAfterCursor;
      setContent(newText);
      setMentionQuery(null);
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = atIndex + empName.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    }
  };

  // Handle keyboard navigation for mentions & Enter to send
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredEmployees.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredEmployees.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredEmployees.length) % filteredEmployees.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredEmployees[mentionIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle file select (PDF, Excel, Images, etc.)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Client-side image compression to drastically cut storage & egress
    let finalFile = rawFile;
    let previewUrl: string | undefined = undefined;

    if (rawFile.type.startsWith('image/')) {
      finalFile = await compressImageBeforeUpload(rawFile, 1280, 1280, 0.75);
      previewUrl = URL.createObjectURL(finalFile);
    }

    setAttachment({
      file: finalFile,
      name: rawFile.name,
      type: rawFile.type,
      previewUrl,
    });

    if (e.target) e.target.value = '';
  };

  // Submit message
  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed && !attachment) return;

    // Extract mentioned user IDs
    const mentions: number[] = [];
    employees.forEach((emp) => {
      if (trimmed.includes(`@${emp.name}`)) {
        mentions.push(emp.id);
      }
    });

    let uploadedUrl: string | undefined;
    let uploadedName: string | undefined;
    let uploadedType: string | undefined;

    if (attachment) {
      setUploading(true);
      try {
        const uploaded = await uploadFileToStorage(attachment.file, 'chat-attachments');
        uploadedUrl = uploaded.url;
        uploadedName = attachment.name;
        uploadedType = attachment.type;
      } catch (err) {
        console.error('Attachment upload failed:', err);
      } finally {
        setUploading(false);
      }
    }

    try {
      await onSendMessage({
        content: trimmed,
        mentions: mentions.length > 0 ? mentions : undefined,
        is_announcement: isAnnouncement,
        attachment_url: uploadedUrl,
        attachment_name: uploadedName,
        attachment_type: uploadedType,
      });

      // Clear states
      setContent('');
      setAttachment(null);
      setIsAnnouncement(false);
      setMentionQuery(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  // Send voice note
  const handleVoiceNoteReady = async (audioBlob: Blob, durationSeconds: number) => {
    setIsRecording(false);
    setUploading(true);

    try {
      const mime = audioBlob.type || 'audio/webm';
      const ext = mime.includes('mp4') || mime.includes('aac') ? 'mp4' : (mime.includes('ogg') ? 'ogg' : 'webm');
      const audioFile = new File([audioBlob], `voice_${Date.now()}.${ext}`, {
        type: mime,
      });

      const uploaded = await uploadFileToStorage(audioFile, 'chat-voice');

      await onSendMessage({
        content: '🎙️ Voice Note',
        attachment_url: uploaded.url,
        attachment_name: 'Voice Note',
        attachment_type: 'audio',
        audio_duration: durationSeconds,
      });
    } catch (err) {
      console.error('Voice note upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative border-t border-slate-200 bg-white p-3 sm:px-4">
      {/* Mention autocomplete popup */}
      {mentionQuery !== null && filteredEmployees.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30 animate-fadeIn">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Mention Member
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filteredEmployees.map((emp, idx) => (
              <div
                key={emp.id}
                onClick={() => insertMention(emp.name)}
                onMouseEnter={() => setMentionIndex(idx)}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                  idx === mentionIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'
                }`}
              >
                {emp.avatar_url ? (
                  <img src={emp.avatar_url} alt="" className="w-6 h-6 rounded-md object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center">
                    {emp.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{emp.name}</p>
                  {emp.department && (
                    <p className="text-[10px] text-slate-400 truncate">{emp.department}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice Recorder Active View */}
      {isRecording ? (
        <VoiceRecorder
          onAudioReady={handleVoiceNoteReady}
          onCancel={() => setIsRecording(false)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {/* Staged Attachment Chip Preview */}
          {attachment && (
            <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl w-fit max-w-full">
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt="Preview"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                <p className="text-xs font-medium text-slate-800 truncate">{attachment.name}</p>
                <p className="text-[10px] text-slate-400 uppercase">
                  {(attachment.file.size / 1024).toFixed(0)} KB • Ready to send
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input container */}
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white rounded-2xl p-2 transition-all shadow-xs">
            {/* Action Bar (Attachments, Mic, Announcement) */}
            <div className="flex items-center gap-1 shrink-0 pb-1">
              {/* Attachment Picker 📎 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach PDF, Excel, or Image"
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/70 rounded-xl transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx,.txt"
                className="hidden"
              />

              {/* Voice Note Button 🎙️ */}
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                title="Record voice note"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-200/70 rounded-xl transition-colors"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Announcement Switcher (Admin / Leaders) */}
              {isAnnouncementAllowed && (
                <button
                  type="button"
                  onClick={() => setIsAnnouncement(!isAnnouncement)}
                  title={isAnnouncement ? "Announcement mode ON" : "Toggle announcement"}
                  className={`p-2 rounded-xl transition-colors ${
                    isAnnouncement
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-amber-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Main Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 max-h-36 min-h-[36px] bg-transparent resize-none border-0 p-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-0 leading-relaxed font-sans"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading || (!content.trim() && !attachment)}
              title="Send message"
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-xs transition-transform active:scale-95 shrink-0 flex items-center justify-center"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
