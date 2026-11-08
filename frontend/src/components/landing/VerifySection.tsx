import React, { useState } from 'react';
import { Award, ArrowRight, FileCheck2 } from 'lucide-react';

export const VerifySection: React.FC = () => {
  const [verifyCode, setVerifyCode] = useState<string>('LF-8E487C12F0');
  const [mockVerifiedToken, setMockVerifiedToken] = useState<string | null>('LF-8E487C12F0');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setIsScanning(true);
    setMockVerifiedToken(null);
    setTimeout(() => {
      setIsScanning(false);
      setMockVerifiedToken(verifyCode.trim().toUpperCase());
    }, 550);
  };

  const handleLoadSample = (sample: string) => {
    setVerifyCode(sample);
    setIsScanning(true);
    setMockVerifiedToken(null);
    setTimeout(() => {
      setIsScanning(false);
      setMockVerifiedToken(sample);
    }, 500);
  };

  return (
    <section id="verify" className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-xl relative overflow-hidden">
          {/* Scanning Beam Animation */}
          {isScanning && (
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-hero-scan" />
          )}

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
              placeholder="Enter certificate token (e.g. LF-8E487C12F0...)"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="flex-1 h-11 px-4 rounded-lg bg-slate-950 border border-slate-700 text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 uppercase"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="h-11 px-5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isScanning ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Token</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Click Samples */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-label font-mono">
            <span className="text-slate-400">Sample Tokens:</span>
            <button
              type="button"
              onClick={() => handleLoadSample('LF-8E487C12F0')}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-sky-300 cursor-pointer transition-colors"
            >
              LF-8E487C12F0 (From Verification Demo)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('LF-DEMO-9X82F1')}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              LF-DEMO-9X82F1
            </button>
          </div>

          {/* Mock Verified Certificate Preview Card (From Screenshot media_1794124093746_cf00e67f.png) */}
          {mockVerifiedToken && (
            <div className="mt-6 p-6 rounded-xl bg-slate-950 border border-emerald-500/40 text-left space-y-4 animate-in fade-in shadow-2xl">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-semibold">
                  <FileCheck2 className="w-4 h-4" />
                  <span>HMAC-SHA256 SIGNATURE AUTHENTICATED</span>
                </div>
                <span className="text-meta font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  STATUS: OFFICIAL PASS &bull; VALID
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-meta font-mono text-slate-400 gap-2">
                <span>Token: <strong className="text-sky-400">{mockVerifiedToken}</strong></span>
                <span>Signature: <strong className="text-emerald-400">0x8a92... verified against root key ring</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
