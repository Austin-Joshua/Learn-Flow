import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Certificate } from '../types';
import { PageHeader, EmptyState } from '../components/ui';
import { Award, ShieldCheck } from 'lucide-react';
import { CertificateDiplomaCard } from '../components/certificate/CertificateDiplomaCard';

export const LearnerCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="My Verified Certificates"
        subtitle="Permanent academic diplomas and course credentials signed with HMAC-SHA256 and authenticated in the institutional registry."
      />

      {/* Security Info Banner */}
      <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Every Learnflow certificate includes a cryptographic signature token verifiable by employers and universities in the public credential registry.
          </span>
        </div>
        <Link
          to="/verify"
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 ml-4 hidden sm:inline"
        >
          Open Public Registry &rarr;
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />}
          title="No certificates earned yet"
          description="Complete 100% of curriculum lessons and pass all required assessments in an enrolled course to mint your authentic certificate."
          action={
            <Link
              to="/courses"
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold shadow-sm transition inline-block"
            >
              Explore Courses
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {certificates.map((cert) => (
            <CertificateDiplomaCard key={cert.id} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  );
};
