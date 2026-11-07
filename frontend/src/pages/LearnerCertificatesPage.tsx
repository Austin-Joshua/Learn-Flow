import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Certificate } from '../types';
import {
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Copy,
  Check,
  CheckCircle2
} from 'lucide-react';

export const LearnerCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCerts = async () => {
      setIsLoading(true);
      try {
        const res = await api.certificates.myCertificates();
        setCertificates(res.data);
      } catch (err) {
        console.error('Failed to load certificates', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCerts();
  }, []);

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          My Verified Certificates
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Permanent, tamper-evident credentials cryptographically signed with HMAC-SHA256 and 128-bit verification entropy.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-56 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 max-w-xl mx-auto">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No certificates earned yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Complete all lessons and pass required assessments in an enrolled course to mint your certificate.
          </p>
          <Link
            to="/courses"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cryptographically Verified</span>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
                  {cert.course_title || 'Certified Curriculum Track'}
                </h3>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-4">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Verification Code
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 break-all mt-0.5">
                    {cert.verification_code}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <a
                  href={`/api/v1/certificates/${cert.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyLink(cert.verification_code)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition text-xs font-medium flex items-center space-x-1"
                    title="Copy Public Link"
                  >
                    {copiedCode === cert.verification_code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/verify/${cert.verification_code}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                    title="Open Verification Portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
