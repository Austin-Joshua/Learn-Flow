import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { PublicVerificationResponse, DocumentVerificationResponse } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  Award,
  Download,
  AlertTriangle,
  Building2,
  FileCheck2,
  Upload,
  FileText,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Stamp,
  GraduationCap,
  Layers,
  Key,
} from 'lucide-react';

export const PublicVerifyCertificatePage: React.FC = () => {
  const { code: paramCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const initialCode = paramCode || searchParams.get('code') || '';

  const [activeTab, setActiveTab] = useState<'code' | 'upload'>('code');
  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [verificationResult, setVerificationResult] = useState<PublicVerificationResponse | null>(null);
  const [documentResult, setDocumentResult] = useState<DocumentVerificationResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualCodeOverride, setManualCodeOverride] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleVerifyCode = async (codeToVerify: string) => {
    const formatted = codeToVerify.trim().toUpperCase();
    if (!formatted) return;

    setIsLoading(true);
    setErrorMessage(null);
    setVerificationResult(null);
    setDocumentResult(null);

    try {
      const res = await api.certificates.verifyPublic(formatted);
      setVerificationResult(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setErrorMessage(`Certificate code '${formatted}' was not found in the official registry.`);
      } else {
        setErrorMessage('Failed to connect to the credential registry. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDocument = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    if (!file) {
      setErrorMessage('Please select a certificate document to upload (PDF, PNG, or JPEG).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setVerificationResult(null);
    setDocumentResult(null);

    try {
      const res = await api.certificates.verifyDocument(file, manualCodeOverride.trim() || undefined);
      setDocumentResult(res.data);
    } catch (err: unknown) {
      console.error('Document verification error', err);
      setErrorMessage('Document verification service error. Ensure the file is under 15MB and valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      handleVerifyDocument(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      handleVerifyDocument(file);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  useEffect(() => {
    if (initialCode) {
      setActiveTab('code');
      setInputCode(initialCode);
      handleVerifyCode(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="max-w-4xl mx-auto font-sans min-h-[70vh] pb-12">
      {/* Header */}
      <div className="text-center mb-6 space-y-1.5">
        <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Learnflow Institutional Credential Registry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Public Certificate Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Authenticate Learnflow diplomas, verify 100% curriculum completion, and inspect cryptographic HMAC-SHA256 signatures by code or document upload.
        </p>
      </div>

      {/* Verification Mode Tabs */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              setActiveTab('code');
              setErrorMessage(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-2 ${
              activeTab === 'code'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify by Code</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              setErrorMessage(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-2 ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Certificate Document</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Verify by Code */}
      {activeTab === 'code' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto mb-8 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyCode(inputCode);
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. LF-ACAD-7749-SYSARCH"
                className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputCode.trim()}
              className="h-10 px-5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center space-x-1.5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify Code</span>
              )}
            </button>
          </form>

          {/* Quick Demo Test Chips */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Sample Verification Codes for Testing:
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => {
                  setInputCode('LF-ACAD-7749-SYSARCH');
                  handleVerifyCode('LF-ACAD-7749-SYSARCH');
                }}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-md text-[10px] font-mono font-medium transition cursor-pointer"
              >
                LF-ACAD-7749-SYSARCH (Valid: Ada Lovelace)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputCode('LF-DSA-8821-MASTERY');
                  handleVerifyCode('LF-DSA-8821-MASTERY');
                }}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-md text-[10px] font-mono font-medium transition cursor-pointer"
              >
                LF-DSA-8821-MASTERY (Valid: DSA Track)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputCode('LF-REVOKED9999DEMO');
                  handleVerifyCode('LF-REVOKED9999DEMO');
                }}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-md text-[10px] font-mono font-medium transition cursor-pointer"
              >
                LF-REVOKED9999DEMO (Revoked Test)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Upload Certificate Document */}
      {activeTab === 'upload' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto mb-8 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <Upload className="w-10 h-10 text-sky-600 dark:text-sky-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Drag & Drop Certificate or Click to Browse
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports Official PDF, PNG, or JPEG formats (max 15MB)
            </p>
            {selectedFile && (
              <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono text-slate-800 dark:text-slate-200">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>{selectedFile.name}</span>
                <span className="text-slate-400 text-[10px]">({Math.round(selectedFile.size / 1024)} KB)</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Optional: Enter Verification Code manually (if scanned from paper or camera photo):
            </label>
            <input
              type="text"
              value={manualCodeOverride}
              onChange={(e) => setManualCodeOverride(e.target.value)}
              placeholder="e.g. LF-ACAD-7749-SYSARCH"
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 uppercase"
            />
          </div>

          <button
            type="button"
            onClick={() => handleVerifyDocument()}
            disabled={isLoading || !selectedFile}
            className="w-full h-10 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Security Elements & Registry...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Scan & Authenticate Document</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="max-w-2xl mx-auto bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-5 text-center text-rose-800 dark:text-rose-300 shadow-xs mb-8">
          <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold">Verification Notice</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{errorMessage}</p>
        </div>
      )}

      {/* Result View: Document Upload Multi-Factor Result */}
      {documentResult && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Main Verdict Header Banner */}
          {documentResult.is_authentic ? (
            <div className="bg-emerald-950/90 text-white p-6 rounded-2xl border border-emerald-500/40 shadow-sm flex items-center justify-between">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authenticity Verdict: REAL & VALID</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Official Learnflow Credential Authenticated
                </h2>
                <p className="text-xs text-emerald-200/90 mt-1 max-w-lg">
                  Passed all 5/5 forensic and registry verification standards. Cryptographically signed and matched with 100% course completion in PostgreSQL.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                <Award className="w-10 h-10 text-emerald-300" />
              </div>
            </div>
          ) : documentResult.status === 'revoked' ? (
            <div className="bg-rose-950/90 text-white p-6 rounded-2xl border border-rose-500/40 shadow-sm flex items-center justify-between">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Authenticity Verdict: REVOKED CREDENTIAL</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Credential Null & Voided
                </h2>
                <p className="text-xs text-rose-200/90 mt-1 max-w-lg">
                  This certificate was officially voided by the Academic Integrity Directorate. Reason:{' '}
                  {documentResult.revocation_reason || 'Academic policy violation'}.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-full bg-rose-500/20 border border-rose-400/30">
                <XCircle className="w-10 h-10 text-rose-300" />
              </div>
            </div>
          ) : (
            <div className="bg-rose-950/90 text-white p-6 rounded-2xl border border-rose-500/40 shadow-sm flex items-center justify-between">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Authenticity Verdict: FRAUDULENT / FAKE</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Certificate Verification Failed
                </h2>
                <p className="text-xs text-rose-200/90 mt-1 max-w-lg">
                  {documentResult.message || 'This document is unverified, forged, or fails institutional criteria.'}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-full bg-rose-500/20 border border-rose-400/30">
                <ShieldAlert className="w-10 h-10 text-rose-300" />
              </div>
            </div>
          )}

          {/* Multi-Factor Forensic Checklist Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase font-mono text-xs flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Multi-Factor Institutional Inspection Ledger</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Check 1: Institutional Logo & Crest */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-3">
                <Stamp className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Learnflow Official Seal</span>
                    {documentResult.logo_crest_verified ? (
                      <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                        PASS
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                        FAIL
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {documentResult.logo_crest_verified
                      ? 'Academic crest and header branding markers verified.'
                      : 'Missing or tampered institutional seal.'}
                  </p>
                </div>
              </div>

              {/* Check 2: Geometry & Layout */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-3">
                <Layers className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Document Geometry & Framing</span>
                    {documentResult.document_layout_valid ? (
                      <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                        PASS
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                        FAIL
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {documentResult.document_layout_valid
                      ? 'Landscape aspect ratio and structural border alignment valid.'
                      : 'Irregular aspect ratio or non-conforming placement.'}
                  </p>
                </div>
              </div>

              {/* Check 3: 100% Course Completion */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-3">
                <GraduationCap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Curriculum Completion Audit</span>
                    {documentResult.course_completion_verified ? (
                      <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                        PASS (100%)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                        FAIL ({documentResult.completion_percentage}%)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {documentResult.course_completion_verified
                      ? 'Confirmed 100% curriculum lessons and passed laboratory assessments.'
                      : 'Course completion requirements incomplete in student record.'}
                  </p>
                </div>
              </div>

              {/* Check 4: Cryptographic HMAC Signature */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-3">
                <Key className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">PostgreSQL Registry & HMAC</span>
                    {documentResult.signature_integrity_verified && documentResult.database_record_matched ? (
                      <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                        MATCHED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                        UNMATCHED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {documentResult.signature_integrity_verified && documentResult.database_record_matched
                      ? 'HMAC-SHA256 signature verified against platform root key ring.'
                      : 'No valid key ring signature or verification code not registered.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Anomalies List (if any) */}
            {documentResult.anomalies && documentResult.anomalies.length > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                <span className="font-bold">Detected Security Anomalies:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {documentResult.anomalies.map((anom, i) => (
                    <li key={i}>{anom}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Credential Dossier Details (if record exists) */}
          {documentResult.database_record_matched && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono text-xs">
                Authoritative Credential Dossier
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-mono uppercase text-[10px]">Recipient Name</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    {documentResult.recipient_name}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-mono uppercase text-[10px]">Curriculum Program</span>
                  <p className="font-bold text-sm text-sky-600 dark:text-sky-400 mt-0.5">
                    {documentResult.course_title}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-mono uppercase text-[10px]">Issuance Date</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {documentResult.issued_at
                        ? new Date(documentResult.issued_at).toLocaleDateString()
                        : 'Official Timestamp'}
                    </span>
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-mono uppercase text-[10px]">Verification Code</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                      {documentResult.verification_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(documentResult.verification_code || '')}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title="Copy Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {documentResult.pdf_download_url && (
                <a
                  href={documentResult.pdf_download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official Vector PDF</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Result View: Code Search Result */}
      {verificationResult && !documentResult && (
        <div className="max-w-2xl mx-auto">
          {verificationResult.valid ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/40 shadow-xs overflow-hidden">
              <div className="bg-emerald-950/80 text-white p-6 border-b border-emerald-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-emerald-300 text-xs font-semibold uppercase tracking-wider font-mono mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Certificate Status: Valid</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Official Credential Authenticated
                  </h2>
                </div>
                <Award className="w-10 h-10 text-emerald-400 opacity-80" />
              </div>

              <div className="p-6 space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                    Recipient Name
                  </span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {verificationResult.recipient_name}
                  </p>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                    Curriculum Program
                  </span>
                  <p className="text-base font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                    {verificationResult.course_title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                      Issuance Date
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(verificationResult.issued_at || '').toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                      Authority
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Learnflow Academic Directorate</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5">
                  <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cryptographic Token
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200 break-all">
                      {verificationResult.verification_code}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(verificationResult.verification_code || '')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title="Copy Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <FileCheck2 className="w-4 h-4 shrink-0" />
                    <span>HMAC-SHA256 signature verified against platform root key ring.</span>
                  </div>
                </div>

                {verificationResult.pdf_download_url && (
                  <a
                    href={verificationResult.pdf_download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center space-x-2 h-10 px-4 bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Certificate PDF</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-800 shadow-xs overflow-hidden">
              <div className="bg-rose-950/80 text-white p-6 border-b border-rose-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-rose-300 text-xs font-semibold uppercase tracking-wider font-mono mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Certificate Status: Revoked</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Credential Voided
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-4 text-rose-800 dark:text-rose-300">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                    Academic Integrity Revocation Notice
                  </h4>
                  <p className="text-xs mt-1 text-rose-700 dark:text-rose-300">
                    Reason: {verificationResult.revocation_reason || 'Academic policy violation.'}
                  </p>
                  {verificationResult.revoked_at && (
                    <p className="text-[10px] font-mono text-rose-500 mt-1">
                      Revoked on: {new Date(verificationResult.revoked_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500 text-center">
                  This credential is no longer recognized or authenticated by Learnflow.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
