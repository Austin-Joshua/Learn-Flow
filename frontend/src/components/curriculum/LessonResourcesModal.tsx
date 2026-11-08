import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../../services/api';
import { Lesson, LearningResource } from '../../types';
import { FileText, Upload, Trash2, Download, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface LessonResourcesModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LessonResourcesModal: React.FC<LessonResourcesModalProps> = ({
  lesson,
  isOpen,
  onClose,
}) => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadResources = async () => {
    if (!lesson) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.curriculum.listResources(lesson.id);
      setResources(res.data);
    } catch (err: unknown) {
      console.error('Failed to load lesson resources', err);
      setError('Could not fetch existing lesson resources.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && lesson) {
      loadResources();
      setSelectedFile(null);
      setResourceTitle('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, lesson]);

  if (!isOpen || !lesson) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!resourceTitle.trim()) {
        setResourceTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB quarantine limit.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Request presigned upload URL
      const mimeType = selectedFile.type || 'application/octet-stream';
      const presignedRes = await api.curriculum.getResourceUploadUrl(lesson.id, {
        filename: selectedFile.name,
        mime_type: mimeType,
        file_size_bytes: selectedFile.size,
      });

      const { upload_url, file_id } = presignedRes.data;

      // 2. Direct upload to S3/MinIO quarantine bucket
      await axios.put(upload_url, selectedFile, {
        headers: {
          'Content-Type': mimeType,
        },
      });

      // 3. Register resource & trigger scan/inspection
      await api.curriculum.registerResource(lesson.id, {
        file_id,
        title: resourceTitle.trim() || selectedFile.name,
      });

      setSuccess('Resource uploaded, scanned, and attached successfully.');
      setSelectedFile(null);
      setResourceTitle('');
      await loadResources();
    } catch (err: unknown) {
      console.error('Upload failed', err);
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError('Upload failed during quarantine scan or attachment.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.curriculum.deleteResource(resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
    } catch (err: unknown) {
      console.error('Failed to delete resource', err);
      setError('Could not delete resource.');
    }
  };

  const handleDownload = async (resourceId: string, title: string) => {
    try {
      const res = await api.curriculum.getDownloadUrl(resourceId);
      window.open(res.data.download_url, '_blank');
    } catch (err: unknown) {
      console.error('Failed to get download URL', err);
      setError(`Could not download ${title}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-meta font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Lesson Resources
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {lesson.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Existing Resources List */}
        <div className="flex-1 overflow-y-auto mb-6 pr-1 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Attached Documents & References ({resources.length})
          </h4>

          {isLoading ? (
            <div className="py-6 flex justify-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : resources.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              No downloadable resources attached to this lesson yet.
            </p>
          ) : (
            resources.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <div className="flex items-center space-x-3 truncate">
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
                    <p className="text-meta text-slate-400 font-mono">
                      {r.file_size_bytes ? `${Math.round(r.file_size_bytes / 1024)} KB` : 'Document'} • {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(r.id, r.title)}
                    className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
            Attach New Resource
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resource Title
              </label>
              <input
                type="text"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="e.g. Lecture Slides, Cheatsheet, Code Samples"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select File (PDF, DOCX, ZIP, Code)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 dark:file:bg-sky-950/60 dark:file:text-sky-300 hover:file:bg-sky-100"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning & Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Attach to Lesson</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

