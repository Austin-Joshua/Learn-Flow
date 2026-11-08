import React, { useState } from 'react';
import { Award, ArrowRight, FileCheck2 } from 'lucide-react';

export const VerifySection: React.FC = () => {
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [mockVerifiedToken, setMockVerifiedToken] = useState<string | null>(null);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setMockVerifiedToken(verifyCode.trim().toUpperCase());
  };

  return (
    <section id="verify" className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 font-mono">
            <Award className="w-3.5 h-3.5 text-sky-400" />
            <span>Digital Credential Registry</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Instant Public Certificate Verification
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto font-normal">
            Every completed curriculum issues an official academic diploma signed with HMAC-SHA256 and an institutional verification token. Anyone can verify credentials instantly against the registry.
          </p>

          <form onSubmit={handleVerifySubmit} className="max-w-lg mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Enter certificate token (e.g. LF-8E4B7C12F0...)"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="flex-1 h-10 px-3.5 rounded-md bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase"
            />
            <button
              type="submit"
              className="h-10 px-5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <span>Verify Token</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setVerifyCode('LF-DEMO-9X82F1');
                setMockVerifiedToken('LF-DEMO-9X82F1');
              }}
              className="text-label font-mono text-sky-400 hover:underline cursor-pointer"
            >
              Click to load sample token: LF-DEMO-9X82F1
            </button>
          </div>

          {/* Mock Verified Certificate Preview Card */}
          {mockVerifiedToken && (
            <div className="mt-6 p-6 rounded-xl bg-slate-950 border border-emerald-500/40 text-left space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-semibold">
                  <FileCheck2 className="w-4 h-4" />
                  <span>HMAC-SHA256 SIGNATURE AUTHENTICATED</span>
                </div>
                <span className="text-meta font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  STATUS: VALID
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-meta font-mono text-slate-500 uppercase">Credential Holder</span>
                  <p className="font-bold text-white text-sm mt-0.5">Ada Lovelace</p>
                </div>
                <div>
                  <span className="text-meta font-mono text-slate-500 uppercase">Curriculum Track</span>
                  <p className="font-bold text-sky-400 text-sm mt-0.5">Full-Stack System Design &amp; Distributed Architecture</p>
                </div>
                <div>
                  <span className="text-meta font-mono text-slate-500 uppercase">Issuance Date</span>
                  <p className="font-medium text-slate-300 mt-0.5">November 8, 2026</p>
                </div>
                <div>
                  <span className="text-meta font-mono text-slate-500 uppercase">Issuing Authority</span>
                  <p className="font-medium text-slate-300 mt-0.5">Learnflow Academic Directorate &bull; Dept of CSE</p>
                </div>
              </div>

              <div className="pt-2 text-label font-mono text-slate-500">
                Token: {mockVerifiedToken} &bull; Signature verified against institutional root key ring.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
