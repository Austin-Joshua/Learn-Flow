import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { PublicVerificationResponse } from '../types';
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
  FileCheck2
} from 'lucide-react';

export const PublicVerifyCertificatePage: React.FC = () => {
  const { code: paramCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const initialCode = paramCode || searchParams.get('code') || '';

  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [verificationResult, setVerificationResult] = useState<PublicVerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (codeToVerify: string) => {
    const formatted = codeToVerify.trim().toUpperCase();
    if (!formatted) return;

    setIsLoading(true);
    setErrorMessage(null);
    setVerificationResult(null);

    try {
      const res = await api.certificates.verifyPublic(formatted);
      setVerificationResult(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setErrorMessage('Certificate record not found. Please verify the code and re-try.');
      } else {
        setErrorMessage('Failed to verify certificate signature with the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans min-h-[70vh]">
      {/* Header */}
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Credential Registry</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Public Certificate Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          Verify the authenticity, completion criteria, and HMAC-SHA256 signature of Learnflow credentials against the institutional registry.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(inputCode);
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
              placeholder="e.g. LF-8E4B7C12F0..."
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputCode.trim()}
            className="h-10 px-5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>

      {/* Error View */}
      {errorMessage && (
        <div className="max-w-xl mx-auto bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-5 text-center text-rose-800 dark:text-rose-300 shadow-xs mb-8">
          <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold">Verification Failed</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{errorMessage}</p>
        </div>
      )}

      {/* Valid Result View */}
      {verificationResult && verificationResult.valid && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden max-w-2xl mx-auto">
          <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider font-mono mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Authentic Verified Credential</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Learnflow Certificate of Achievement
              </h2>
            </div>
            <Award className="w-10 h-10 text-sky-400 flex-shrink-0 hidden sm:block" />
          </div>

          <div className="p-6 space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">Recipient</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{verificationResult.recipient_name}</p>
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">Curriculum Program</span>
              <p className="text-base font-bold text-sky-600 dark:text-sky-400 mt-0.5">{verificationResult.course_title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 text-xs">
              <div>
                <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">Issuance Date</span>
                <p className="font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(verificationResult.issued_at || '').toLocaleDateString()}</span>
                </p>
              </div>
              <div>
                <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">Authority</span>
                <p className="font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Learnflow Academic Directorate</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5">
              <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cryptographic Token</span>
              <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200 break-all mt-1">
                {verificationResult.verification_code}
              </p>
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
      )}

      {/* Revoked Result View */}
      {verificationResult && !verificationResult.valid && verificationResult.status === 'revoked' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-800 shadow-xs overflow-hidden max-w-2xl mx-auto">
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
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">Academic Integrity Revocation Notice</h4>
              <p className="text-xs mt-1 text-rose-700 dark:text-rose-300">
                Reason: {verificationResult.revocation_reason || 'Academic policy violation.'}
              </p>
              {verificationResult.revoked_at && (
                <p className="text-[11px] font-mono text-rose-500 mt-1">
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
  );
};
