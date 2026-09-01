import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Play, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { runAllTests, TestResult } from '../utils/testSuite';

interface SelfTestModalProps {
  onClose: () => void;
}

export const SelfTestModal: React.FC<SelfTestModalProps> = ({ onClose }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const executeTests = () => {
    setRunning(true);
    setTimeout(() => {
      const res = runAllTests();
      setResults(res);
      setRunning(false);
    }, 200);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const totalPassed = results.filter(r => r.passed).length;
  const allPassed = results.length > 0 && totalPassed === results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                SipLumo Logic Self-Test
              </h2>
              <p className="text-xs text-slate-500">
                Automated verification of math, streaks & unit formulas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        <div className={`p-4 rounded-2xl flex items-center justify-between border text-xs font-bold ${
          allPassed
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            {allPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-amber-600" />}
            <span>{running ? 'Running tests...' : `All Tests Passed (${totalPassed} / ${results.length})`}</span>
          </div>
          <button
            onClick={executeTests}
            disabled={running}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-xs hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>Re-run</span>
          </button>
        </div>

        {/* Test items */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {results.map((r, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  {r.name}
                </span>
                <span className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                  r.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}>
                  {r.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {r.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Expected: <span className="font-semibold text-slate-700 dark:text-slate-300">{r.expected}</span> &bull; Received: <span className="font-semibold text-slate-700 dark:text-slate-300">{r.received}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
