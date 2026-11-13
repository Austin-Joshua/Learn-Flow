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
  Loader2,
} from 'lucide-react';
import { downloadCertificatePdf, downloadCertificateImage } from '../../utils/certificateDownload';

interface CertificateDiplomaCardProps {
  certificate: Certificate;
}

export const CertificateDiplomaCard: React.FC<CertificateDiplomaCardProps> = ({ certificate }) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState<boolean>(false);

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

  const exportData = {
    id: certificate.id,
    verificationCode: certificate.verification_code,
    recipientName: certificate.recipient_name || 'Verified Learner',
    courseTitle: certificate.course_title || 'Learnflow Course',
    issuedAt: certificate.issued_at,
  };

  const handleDownloadPdf = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await downloadCertificatePdf(exportData);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isDownloadingImage) return;
    setIsDownloadingImage(true);
    try {
      await downloadCertificateImage(exportData);
    } catch (err) {
      console.error('Image download error:', err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const pdfDownloadUrl = `/api/v1/certificates/${certificate.id}/download`;
  const imageDownloadUrl = `/api/v1/certificates/${certificate.id}/download-image`;

  return (
    <div className="card-uplift bg-white dark:bg-[#071914] border border-slate-200 dark:border-[#E4F455]/20 rounded-2xl shadow-xs hover:border-[#163E44]/40 dark:hover:border-[#E4F455]/55 transition-all overflow-hidden flex flex-col lg:flex-row">
      {/* Left: Compact Visual Diploma Card Frame */}
      <div className="lg:w-[55%] p-3 sm:p-4 bg-slate-100/70 dark:bg-[#04100C] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-[#E4F455]/15 flex items-center justify-center">
        <div className="w-full relative bg-[#FAF8F5] dark:bg-[#0c1822] border-2 sm:border-3 border-[#0B1E28] dark:border-[#C5A059]/50 rounded-xl shadow-md overflow-hidden text-slate-900 dark:text-slate-100">
          {/* Inner Antique Gold Border */}
          <div className="m-1.5 sm:m-2 p-3 sm:p-4 border border-[#C5A059]/70 dark:border-[#C5A059]/40 rounded-lg relative">
            {/* Corner Gold Diamonds */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-[#C5A059] rotate-45" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-[#C5A059] rotate-45" />
            <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#C5A059] rotate-45" />
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#C5A059] rotate-45" />

            {/* Top Academic Crest */}
            <div className="text-center mb-1.5 sm:mb-2">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#C5A059] bg-[#0B1E28] text-white shadow-xs mx-auto mb-1">
                <span className="font-serif font-bold text-xs tracking-wider text-[#FAF8F5]">LF</span>
              </div>
              <h2 className="font-serif font-extrabold text-[11px] sm:text-xs tracking-wider uppercase text-[#0B1E28] dark:text-[#E2E8F0]">
                Learnflow Institute of Advanced Computing
              </h2>
              <p className="text-[9px] sm:text-[10px] font-serif tracking-widest text-[#C5A059] dark:text-[#D4AF37] uppercase mt-0.5">
                Official Diploma of Academic Achievement &amp; Curriculum Mastery
              </p>
              <div className="flex items-center justify-center my-1.5">
                <div className="h-px bg-[#E2D8C3] dark:bg-slate-700 w-16 sm:w-24" />
                <div className="w-1 h-1 bg-[#C5A059] rotate-45 mx-1.5" />
                <div className="h-px bg-[#E2D8C3] dark:bg-slate-700 w-16 sm:w-24" />
              </div>
            </div>

            {/* Conferment Citation */}
            <div className="text-center my-2 space-y-0.5">
              <p className="text-[10px] italic text-slate-600 dark:text-slate-300 font-serif">
                This authoritative credential is proud to certify that
              </p>
              <h3 className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#0B1E28] dark:text-white pt-0.5">
                {certificate.recipient_name || 'Ada Lovelace'}
              </h3>
              <div className="h-0.5 w-28 sm:w-36 bg-[#C5A059] mx-auto mb-1" />
              <p className="text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                has satisfied all institutional criteria, achieved <span className="font-bold text-emerald-700 dark:text-emerald-400">100% course completion</span>, and demonstrated verified mastery in
              </p>
              <h4 className="font-serif text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-300 pt-0.5">
                {certificate.course_title || 'Full-Stack System Design & Distributed Architecture'}
              </h4>
            </div>

            {/* Seals & Signatures Row */}
            <div className="mt-2.5 pt-2 border-t border-[#E2D8C3]/80 dark:border-slate-800 grid grid-cols-3 items-end gap-1.5 text-center">
              {/* Left: Official Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#C5A059] bg-[#FEF9C3] dark:bg-amber-950/40 text-[#0B1E28] dark:text-amber-200 flex flex-col items-center justify-center shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-[6px] font-bold tracking-tighter uppercase font-mono mt-0.5">100% Mastery</span>
                  <span className="text-[5px] tracking-widest uppercase text-[#C5A059] font-serif">Official Seal</span>
                </div>
              </div>

              {/* Center: Turing Signature */}
              <div className="space-y-0.5">
                <div className="font-serif italic text-[11px] text-slate-800 dark:text-slate-200 select-none">
                  Alan Turing
                </div>
                <div className="h-px bg-slate-300 dark:bg-slate-700 w-14 sm:w-20 mx-auto" />
                <p className="text-[8px] font-bold text-slate-800 dark:text-slate-300">Dr. Alan Turing</p>
                <p className="text-[7px] text-slate-500 dark:text-slate-400">Provost of Computing</p>
              </div>

              {/* Right: Hopper / Instructor Signature */}
              <div className="space-y-0.5">
                <div className="font-serif italic text-[11px] text-slate-800 dark:text-slate-200 select-none">
                  Grace Hopper
                </div>
                <div className="h-px bg-slate-300 dark:bg-slate-700 w-14 sm:w-20 mx-auto" />
                <p className="text-[8px] font-bold text-slate-800 dark:text-slate-300">Grace Hopper</p>
                <p className="text-[7px] text-slate-500 dark:text-slate-400">Directorate Systems Lead</p>
              </div>
            </div>

            {/* Bottom Verification Strip */}
            <div className="mt-2 pt-1.5 border-t border-dashed border-[#C5A059]/40 flex flex-wrap items-center justify-between text-[8px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <Calendar className="w-2.5 h-2.5 text-slate-400" />
                <span>Issued: {formattedDate}</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Code: {certificate.verification_code}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>HMAC-SHA256</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Authoritative Credential Details & Export Toolbar */}
      <div className="lg:w-[45%] p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Credential Dossier
            </span>
            <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              <span>Valid &amp; Verified</span>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Graduate Candidate</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Graduate: {certificate.recipient_name || 'Ada Lovelace'}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Academic Program</span>
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                Curriculum: {certificate.course_title || 'Full-Stack System Design & Distributed Architecture'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Issuance Date</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">{formattedDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Authority</span>
                <span className="text-slate-700 dark:text-slate-300 text-[11px]">Learnflow Directorate</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Verification Code
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
                  title="Copy Verification Code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-200 select-all">
                {certificate.verification_code}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            {/* Download Vector PDF */}
            <a
              href={pdfDownloadUrl}
              onClick={handleDownloadPdf}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </a>

            {/* Download High-Res PNG Image */}
            <a
              href={imageDownloadUrl}
              onClick={handleDownloadImage}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
            >
              {isDownloadingImage ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-white" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{isDownloadingImage ? 'Generating Image...' : 'Download PNG Image'}</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Verification Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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
              className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer text-center"
              title="Verify in Public Registry"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Verify in Registry</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

