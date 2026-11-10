import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Certificate } from '../../types';
import {
  Award,
  Download,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface CertificateDiplomaCardProps {
  certificate: Certificate;
}

export const CertificateDiplomaCard: React.FC<CertificateDiplomaCardProps> = ({ certificate }) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const formattedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificate.verification_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify?code=${certificate.verification_code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const pdfDownloadUrl = `/api/v1/certificates/${certificate.id}/download`;
  const imageDownloadUrl = `/api/v1/certificates/${certificate.id}/download-image`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Visual Diploma Presentation Frame */}
      <div className="p-3 sm:p-5 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="relative bg-[#FAF8F5] dark:bg-[#0c1822] border-4 border-[#0B1E28] dark:border-[#C5A059]/50 rounded-xl shadow-lg overflow-hidden text-slate-900 dark:text-slate-100">
          {/* Inner Antique Gold Border */}
          <div className="m-2 sm:m-3 p-4 sm:p-6 border-2 border-[#C5A059]/70 dark:border-[#C5A059]/40 rounded-lg relative">
            {/* Corner Gold Diamonds */}
            <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-[#C5A059] rotate-45" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C5A059] rotate-45" />
            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 bg-[#C5A059] rotate-45" />
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-[#C5A059] rotate-45" />

            {/* Top Academic Crest */}
            <div className="text-center mb-2 sm:mb-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#C5A059] bg-[#0B1E28] text-white shadow-xs mx-auto mb-1.5">
                <span className="font-serif font-bold text-sm tracking-wider text-[#FAF8F5]">LF</span>
              </div>
              <h2 className="font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase text-[#0B1E28] dark:text-[#E2E8F0]">
                Learnflow Institute of Advanced Computing
              </h2>
              <p className="text-[10px] sm:text-xs font-serif tracking-widest text-[#C5A059] dark:text-[#D4AF37] uppercase mt-0.5">
                Official Diploma of Academic Achievement & Curriculum Mastery
              </p>
              <div className="flex items-center justify-center my-2">
                <div className="h-px bg-[#E2D8C3] dark:bg-slate-700 w-24 sm:w-36" />
                <div className="w-1.5 h-1.5 bg-[#C5A059] rotate-45 mx-2" />
                <div className="h-px bg-[#E2D8C3] dark:bg-slate-700 w-24 sm:w-36" />
              </div>
            </div>

            {/* Conferment Citation */}
            <div className="text-center my-3 sm:my-4 space-y-1">
              <p className="text-[11px] sm:text-xs italic text-slate-600 dark:text-slate-300 font-serif">
                This authoritative credential is proud to certify that
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#0B1E28] dark:text-white pt-0.5 pb-1">
                {certificate.recipient_name || 'Ada Lovelace'}
              </h3>
              <div className="h-0.5 w-40 sm:w-56 bg-[#C5A059] mx-auto mb-2" />
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                has satisfied all institutional criteria, achieved <span className="font-bold text-emerald-700 dark:text-emerald-400">100% course completion</span>, and demonstrated verified mastery in
              </p>
              <h4 className="font-serif text-sm sm:text-lg font-bold text-sky-800 dark:text-sky-300 pt-1">
                {certificate.course_title || 'Full-Stack System Design & Distributed Architecture'}
              </h4>
            </div>

            {/* Seals & Signatures Row */}
            <div className="mt-4 pt-3 border-t border-[#E2D8C3]/80 dark:border-slate-800 grid grid-cols-3 items-end gap-2 text-center">
              {/* Left: Official Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#C5A059] bg-[#FEF9C3] dark:bg-amber-950/40 text-[#0B1E28] dark:text-amber-200 flex flex-col items-center justify-center shadow-xs">
                  <Award className="w-4 h-4 text-[#C5A059]" />
                  <span className="text-[7px] font-bold tracking-tighter uppercase font-mono mt-0.5">100% Mastery</span>
                  <span className="text-[6px] tracking-widest uppercase text-[#C5A059] font-serif">Official Seal</span>
                </div>
              </div>

              {/* Center: Turing Signature */}
              <div className="space-y-0.5">
                <div className="font-serif italic text-xs sm:text-sm text-slate-800 dark:text-slate-200 select-none">
                  Alan Turing
                </div>
                <div className="h-px bg-slate-300 dark:bg-slate-700 w-16 sm:w-24 mx-auto" />
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-800 dark:text-slate-300">Dr. Alan Turing</p>
                <p className="text-[7px] text-slate-500 dark:text-slate-400">Provost of Computing</p>
              </div>

              {/* Right: Hopper / Instructor Signature */}
              <div className="space-y-0.5">
                <div className="font-serif italic text-xs sm:text-sm text-slate-800 dark:text-slate-200 select-none">
                  Grace Hopper
                </div>
                <div className="h-px bg-slate-300 dark:bg-slate-700 w-16 sm:w-24 mx-auto" />
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-800 dark:text-slate-300">Grace Hopper</p>
                <p className="text-[7px] text-slate-500 dark:text-slate-400">Directorate Systems Lead</p>
              </div>
            </div>

            {/* Bottom Verification Strip */}
            <div className="mt-3 pt-2 border-t border-dashed border-[#C5A059]/40 flex flex-wrap items-center justify-between text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Issued: {formattedDate}</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Code: {certificate.verification_code}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>HMAC-SHA256 Authenticated</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Export Toolbar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Vector PDF */}
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official PDF</span>
          </a>

          {/* Download High-Res PNG Image */}
          <a
            href={imageDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Download PNG Image</span>
          </a>
        </div>

        <div className="flex items-center space-x-2">
          {/* Copy Verification Code */}
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center space-x-1 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Copy Verification Code"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Code Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          {/* Copy Verification Link */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center space-x-1 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Copy Public Link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Open Public Verification */}
          <Link
            to={`/verify?code=${certificate.verification_code}`}
            className="inline-flex items-center space-x-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer"
            title="Verify in Public Registry"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Verify in Registry</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
