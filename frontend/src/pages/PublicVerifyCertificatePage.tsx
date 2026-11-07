import React, { useState, useEffect } from 'react';
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
    } catch (err: any) {
      if (err.response?.status === 404) {
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
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Public Credential Verification Portal
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
          Cryptographically verify the authentic status, course criteria, and tamper-evident signature of Learnflow credentials.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(inputCode);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              required
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. LF-9E56C34FA178B45CD34E9871FA4673B2"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputCode.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>

      {/* Error View */}
      {errorMessage && (
        <div className="max-w-xl mx-auto bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-base font-bold">Verification Failed</h3>
          <p className="text-sm text-rose-700 mt-1">{errorMessage}</p>
        </div>
      )}

      {/* Valid Result View */}
      {verificationResult && verificationResult.valid && (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Authentic Verified Credential</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Learnflow Certificate of Achievement
              </h2>
            </div>
            <Award className="w-12 h-12 text-emerald-200/80 flex-shrink-0 hidden sm:block" />
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recipient</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{verificationResult.recipient_name}</p>
            </div>

            <div className="border-b border-slate-100 pb-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Curriculum</span>
              <p className="text-lg font-bold text-indigo-900 mt-1">{verificationResult.course_title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-5 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Issuance Date</span>
                <p className="font-medium text-slate-700 mt-1 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{new Date(verificationResult.issued_at || '').toLocaleDateString()}</span>
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Issuer</span>
                <p className="font-medium text-slate-700 mt-1 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Learnflow Directorate</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cryptographic Token</span>
              <p className="text-xs font-mono font-bold text-slate-800 break-all mt-1">
                {verificationResult.verification_code}
              </p>
              <div className="mt-2 flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>HMAC-SHA256 signature verified against platform root key ring.</span>
              </div>
            </div>

            {verificationResult.pdf_download_url && (
              <a
                href={verificationResult.pdf_download_url}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Certificate PDF</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Revoked Result View */}
      {verificationResult && !verificationResult.valid && verificationResult.status === 'revoked' && (
        <div className="bg-white rounded-3xl border border-rose-300 shadow-xl overflow-hidden max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white p-6 sm:p-8 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-rose-100 text-xs font-semibold uppercase tracking-wider mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>Certificate Status: Revoked</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Credential Voided
              </h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800">
              <h4 className="text-sm font-bold">Academic Integrity Revocation Notice</h4>
              <p className="text-xs mt-1 text-rose-700">
                Reason: {verificationResult.revocation_reason || 'Academic policy violation.'}
              </p>
              {verificationResult.revoked_at && (
                <p className="text-xs mt-1 text-rose-600">
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
