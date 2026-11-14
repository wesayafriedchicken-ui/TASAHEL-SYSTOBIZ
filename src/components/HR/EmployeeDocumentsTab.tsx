import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FolderPlus, LayoutGrid, Search, SlidersHorizontal, Lock, Check,
  X, Trash2, Eye, Download, Loader2, ArrowLeft, Plus, Upload, FileText, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmployeeDocument } from '../../types';
import { uploadFileToStorage } from '../../lib/storage';

interface ExtendedDocument extends EmployeeDocument {
  folder?: string;
  size?: string;
}

interface EmployeeDocumentsTabProps {
  emp: any;
  currentUser: any;
  onRefreshEmployee: () => Promise<void>;
  isViewOnly?: boolean;
  onMarkDirty?: () => void;
  onSaveEmployeeDetails?: (updated: any) => Promise<void>;
}

export const EmployeeDocumentsTab: React.FC<EmployeeDocumentsTabProps> = ({ 
  emp, 
  currentUser, 
  onRefreshEmployee,
  isViewOnly = false,
  onMarkDirty,
  onSaveEmployeeDetails
}) => {
  const [documents, setDocuments] = useState<ExtendedDocument[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<ExtendedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to open base64 or remote URL in new tab without about:blank#blocked
  const openDataUrlInNewTab = (dataUrl: string, fileName: string) => {
    if (!dataUrl) return;
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      window.open(dataUrl, '_blank');
      return;
    }
    
    try {
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0]?.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(arr[1] || '');
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Error opening blob URL:', err);
      // Fallback download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  // Custom form states
  const [uploadForm, setUploadForm] = useState({
    name: '',
    folder: 'Employee Uploads',
    url: ''
  });

  // Default standard folders as shown in the image
  const defaultFolders = [
    { name: 'Employee Uploads', isLocked: false, iconType: 'user' },
    { name: 'Resumes and Applications', isLocked: true, iconType: 'folder' },
    { name: 'Signed Documents', isLocked: false, iconType: 'signature' },
    { name: 'Tasklist Attachments', isLocked: true, iconType: 'folder' },
    { name: 'Workflow Attachments', isLocked: true, iconType: 'folder' }
  ];

  const [folders, setFolders] = useState<any[]>(defaultFolders);

  // Load and seed documents if empty
  useEffect(() => {
    const rawDocs = emp.documents || [];
    const normalized = rawDocs.map((doc: any) => ({
      ...doc,
      folder: doc.folder || 'Employee Uploads'
    }));
    setDocuments(normalized);
  }, [emp.documents, emp.id]);

  // Persist updated document list back to db
  const saveDocumentsToDatabase = async (updatedDocs: ExtendedDocument[], triggerAlert = true) => {
    setIsSaving(true);
    if (onMarkDirty) onMarkDirty();
    try {
      if (onSaveEmployeeDetails) {
        await onSaveEmployeeDetails({ documents: updatedDocs });
      } else {
        const res = await fetch(`/api/hr/employees/${emp.user_id || emp.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id?.toString() || '1'
          },
          body: JSON.stringify({ documents: updatedDocs })
        });

        if (res.ok) {
          await onRefreshEmployee();
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error('Failed to sync documents with backend server:', errData);
        }
      }
    } catch (err) {
      console.error('Error saving documents to DB:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Upload single file directly to Supabase Storage
  const uploadSingleFileToStorage = async (file: File, targetFolder: string): Promise<ExtendedDocument> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
    const folderPath = `employee-docs/${emp?.id || 'general'}`;
    const uploaded = await uploadFileToStorage(file, folderPath);
    return {
      id: Date.now() + Math.floor(Math.random() * 1000000),
      name: uploaded.name || file.name,
      type: uploaded.type || fileExt,
      url: uploaded.url,
      uploaded_at: new Date().toISOString(),
      folder: targetFolder,
      size: uploaded.size
    };
  };

  // Multiple File Upload Handler
  const handleMultipleFilesUpload = async (filesList: FileList | File[], customFolder?: string) => {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    const targetFolder = customFolder || selectedFolder || 'Employee Uploads';
    setIsSaving(true);
    try {
      const newDocs = await Promise.all(files.map(f => uploadSingleFileToStorage(f, targetFolder)));
      const updated = [...documents, ...newDocs];
      setDocuments(updated);
      await saveDocumentsToDatabase(updated, true);
    } catch (err) {
      console.error('Error uploading multiple files:', err);
      alert('Error uploading files to storage. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and Drop files upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFilesUpload(e.dataTransfer.files);
    }
  };

  // Direct File Input Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFilesUpload(e.target.files);
      // Reset input value
      e.target.value = '';
    }
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Manual Document Addition via Modal
  const handleManualUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalFiles.length > 0) {
      await handleMultipleFilesUpload(modalFiles, uploadForm.folder);
      setIsUploadModalOpen(false);
      setModalFiles([]);
      setUploadForm({
        name: '',
        folder: selectedFolder || 'Employee Uploads',
        url: ''
      });
      return;
    }

    if (!uploadForm.name.trim()) return;

    const newDoc: EmployeeDocument = {
      id: Date.now(),
      name: uploadForm.name.endsWith('.pdf') ? uploadForm.name : `${uploadForm.name}.pdf`,
      type: 'pdf',
      url: uploadForm.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploaded_at: new Date().toISOString()
    };

    const extendedDoc = {
      ...newDoc,
      folder: uploadForm.folder,
      size: '1.2 MB'
    } as any;

    const updated = [...documents, extendedDoc];
    setDocuments(updated);
    saveDocumentsToDatabase(updated, true);
    setIsUploadModalOpen(false);
    
    // Reset form
    setUploadForm({
      name: '',
      folder: selectedFolder || 'Employee Uploads',
      url: ''
    });
  };

  // Delete Document
  const handleDeleteDocument = (docId: string | number) => {
    if (!window.confirm('هل أنت متاكد من حذف هذا المستند نهائياً؟ (Are you sure you want to delete this document permanently?)')) return;
    const updated = documents.filter(doc => String(doc.id) !== String(docId));
    setDocuments(updated);
    saveDocumentsToDatabase(updated, true);
  };

  // Filter and search
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = (doc.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesFolder = selectedFolder ? doc.folder === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  // Calculate items count for each folder
  const getFolderItemCount = (folderName: string) => {
    return documents.filter(doc => doc.folder === folderName).length;
  };

  // Trigger manual select
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle adding custom folder
  const handleAddCustomFolder = () => {
    const folderName = prompt('Enter new folder name:');
    if (!folderName || folderName.trim() === '') return;
    
    if (folders.some(f => (f.name || '').toLowerCase() === (folderName || '').toLowerCase())) {
      alert('A folder with this name already exists.');
      return;
    }

    const updatedFolders = [...folders, { name: folderName, isLocked: false, iconType: 'folder' }];
    setFolders(updatedFolders);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header matching the exact theme */}
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-3xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1b5e20] leading-none">Documents</h2>
          </div>
        </div>
        {selectedFolder && (
          <button 
            onClick={() => setSelectedFolder(null)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all border border-transparent"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Folders
          </button>
        )}
      </div>

      {/* Toolbar exactly matching the image */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        {/* Left Side Buttons */}
        <div className="flex items-center gap-2">
          {!isViewOnly && (
            <>
              {/* Upload Button */}
              <button 
                onClick={triggerFileSelect}
                className="flex items-center gap-2 px-5 py-2 text-xs font-black text-[#1b5e20] bg-white hover:bg-[#1b5e20]/5 border border-[#1b5e20] rounded-full shadow-sm transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#1b5e20]" />
                Upload
              </button>

              {/* Hidden input supporting multiple files */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar"
                className="hidden" 
              />

              {/* Create Folder Button */}
              <button 
                onClick={handleAddCustomFolder}
                className="w-9 h-9 border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                title="Create a folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Grid View Selection Button */}
          <button 
            className="w-12 h-9 border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center gap-1 hover:bg-slate-50 transition-all cursor-pointer"
            title="View options"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[10px] text-slate-400">▼</span>
          </button>
        </div>

        {/* Right Side Search Bar */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-xs justify-end">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] rounded-full pl-9 pr-4 py-2 transition-all outline-none text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* Filter/Slider Settings icon */}
          <button 
            className="w-10 h-8 border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer gap-1"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-[10px] text-slate-400">▼</span>
          </button>
        </div>
      </div>

      {/* Main Folders Grid matching the image layout */}
      <AnimatePresence mode="wait">
        {!selectedFolder ? (
          <motion.div 
            key="folders-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {folders.map((folder) => {
              const count = getFolderItemCount(folder.name);
              
              // Resolve folder icon
              let IconComponent = Folder;
              if (folder.iconType === 'signature') {
                IconComponent = PenTool; // Beautiful handwriting/signature representation
              }

              return (
                <div 
                  key={folder.name}
                  onClick={() => setSelectedFolder(folder.name)}
                  className="bg-white border border-slate-200/80 hover:border-[#1b5e20] hover:shadow-lg transition-all rounded-[24px] p-6 flex flex-col items-start min-h-[170px] cursor-pointer relative group"
                >
                  {/* Lock Indicator */}
                  {folder.isLocked && (
                    <div className="absolute top-4 left-4 text-slate-400" title="Locked Folder">
                      <Lock className="w-4 h-4 text-slate-400/80" />
                    </div>
                  )}

                  {/* Icon Container matching image colors */}
                  <div className="w-14 h-14 bg-slate-50 text-[#1b5e20] rounded-2xl flex items-center justify-center mb-4 border border-slate-100 group-hover:bg-[#1b5e20]/5 transition-all">
                    {folder.iconType === 'user' ? (
                      <div className="relative">
                        <Folder className="w-7 h-7 text-[#1b5e20]" />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-[7px] font-bold">👤</span>
                      </div>
                    ) : (
                      <IconComponent className="w-7 h-7 text-[#1b5e20]" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#1b5e20] group-hover:underline leading-tight line-clamp-2">
                      {folder.name}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400">
                      {count} {count === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* Folder Files List View */
          <motion.div 
            key="folder-files-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4"
          >
            {/* Folder Header Breadcrumb */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-[#1b5e20] tracking-wide uppercase flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-[#1b5e20]" />
                  {selectedFolder}
                </h3>
              </div>

              {!isViewOnly && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1 text-[#1565c0] hover:text-[#0d47a1] text-xs font-black transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 bg-[#1565c0]/10 text-[#1565c0] rounded-full p-0.5" />
                    Add New Link/Doc
                  </button>
                </div>
              )}
            </div>

            {/* List of files in the current folder */}
            <div className="space-y-1 divide-y divide-slate-100">
              {filteredDocuments.map((doc) => {
                const isImage = doc.url?.startsWith('data:image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(doc.type?.toLowerCase() || '');
                return (
                  <div key={doc.id} className="flex items-center justify-between py-3 hover:bg-slate-50/80 rounded-xl px-3 group transition-all">
                    <div 
                      onClick={() => setPreviewDoc(doc)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                    >
                      {isImage ? (
                        <img 
                          src={doc.url} 
                          alt={doc.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-baseline flex-wrap gap-1">
                          <span className="text-[#1565c0] font-black text-sm hover:underline truncate block">
                            {doc.name}
                          </span>
                          {doc.size && (
                            <span className="text-[10px] text-slate-400 font-bold">
                              ({doc.size})
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Uploaded on {new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Download / Preview and Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 text-slate-500 hover:text-[#1b5e20] hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-200"
                        title="معاينة المستند (Preview Document)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button 
                        type="button"
                        onClick={() => openDataUrlInNewTab(doc.url, doc.name)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-200"
                        title="تحميل / فتح في نافذة جديدة (Download / Open in New Window)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {!isViewOnly && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                          title="حذف المستند (Delete Document)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredDocuments.length === 0 && (
                <div className="text-center py-10 text-xs font-bold text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No documents in this folder yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag & Drop Upload Zone at the bottom */}
      {!isViewOnly && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`border border-dashed p-4 rounded-2xl flex justify-between items-center text-xs font-bold transition-all cursor-pointer ${
            dragActive 
              ? 'border-[#1b5e20] bg-[#1b5e20]/5 text-[#1b5e20]' 
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Drag and drop multiple files or images to upload</span>
          </div>
          <div className="text-slate-400">
            {folders.length} folders
          </div>
        </div>
      )}

      {/* Manual Upload Document Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-[#1b5e20]/5">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#1b5e20]" />
                  Add New Documents / Link
                </h3>
                <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-full transition-all text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleManualUploadSubmit} className="p-6 space-y-4">
                {/* Select Multiple Files */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                    Select Files / Images
                  </label>
                  <div 
                    onClick={() => modalFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-[#1b5e20] bg-slate-50 hover:bg-[#1b5e20]/5 p-3.5 rounded-xl cursor-pointer text-center transition-all"
                  >
                    <Upload className="w-5 h-5 text-[#1b5e20] mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-600 block">
                      {modalFiles.length > 0 
                        ? `Selected ${modalFiles.length} file(s)` 
                        : 'Click to select multiple files or images'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">PDF, PNG, JPG, Word, Excel, ZIP, etc.</span>
                  </div>
                  <input 
                    type="file"
                    ref={modalFileInputRef}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setModalFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                  {modalFiles.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                      {modalFiles.map((f, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-bold">
                          <span className="truncate max-w-[200px]">{f.name}</span>
                          <span className="text-slate-400">{formatBytes(f.size)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Folder</label>
                  <select
                    value={uploadForm.folder}
                    onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value })}
                    className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-3 py-2.5 transition-all outline-none text-slate-800"
                  >
                    {folders.map(f => (
                      <option key={f.name} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {modalFiles.length === 0 && (
                  <>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Or Single Item Name</label>
                      <input 
                        type="text" 
                        value={uploadForm.name}
                        onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                        className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-4 py-2.5 transition-all outline-none text-slate-800"
                        placeholder="e.g. Health_Insurance_Consent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">URL (Optional)</label>
                      <input 
                        type="url"
                        value={uploadForm.url}
                        onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                        className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-4 py-2.5 transition-all outline-none text-slate-800"
                        placeholder="https://example.com/document.pdf"
                      />
                    </div>
                  </>
                )}

                <div className="pt-3 flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setModalFiles([]);
                    }}
                    className="px-5 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-black text-white bg-[#1b5e20] hover:bg-[#123e15] rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {modalFiles.length > 0 ? `Upload ${modalFiles.length} File(s)` : 'Add Document'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#1b5e20]/10 text-[#1b5e20] flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-800 text-sm truncate">{previewDoc.name}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Folder: {previewDoc.folder} • Uploaded on {new Date(previewDoc.uploaded_at).toLocaleDateString()} {previewDoc.size ? `• ${previewDoc.size}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openDataUrlInNewTab(previewDoc.url, previewDoc.name)}
                  className="px-3.5 py-1.5 bg-[#1b5e20] hover:bg-[#123e15] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل / فتح (Open / Download)</span>
                </button>

                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-100/60 min-h-[350px]">
              {previewDoc.url?.startsWith('data:image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(previewDoc.type?.toLowerCase() || '') ? (
                <img 
                  src={previewDoc.url} 
                  alt={previewDoc.name} 
                  className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-lg border border-slate-200" 
                />
              ) : previewDoc.url?.startsWith('data:application/pdf') || previewDoc.type?.toLowerCase() === 'pdf' ? (
                <iframe 
                  src={previewDoc.url} 
                  title={previewDoc.name}
                  className="w-full h-[65vh] rounded-2xl border border-slate-200 shadow-sm bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-md">
                  <FileText className="w-12 h-12 text-[#1b5e20] mx-auto opacity-80" />
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 text-sm">{previewDoc.name}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      انقر على زر التحميل/الفتح بالتقاط رابط المعاينة بأمان دون حظر المتصفح.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDataUrlInNewTab(previewDoc.url, previewDoc.name)}
                    className="px-4 py-2 bg-[#1b5e20] text-white text-xs font-bold rounded-xl hover:bg-[#123e15] transition-all cursor-pointer"
                  >
                    فتح المستند الآن (Open Document)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
