import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { InspectionItem } from '../types';

interface ScoreBannerProps {
  items: InspectionItem[];
}

export const ScoreBanner: React.FC<ScoreBannerProps> = ({ items }) => {
  const totalPossible = items.length || 1;
  const earnedPoints = items.reduce((acc, item) => acc + item.score, 0);
  const scorePercent = Math.round((earnedPoints / totalPossible) * 100);
  const isCompliant = scorePercent >= 85;

  const passCount = items.filter((i) => i.status === 'pass').length;
  const attnCount = items.filter((i) => i.status === 'needs_attention').length;
  const failCount = items.filter((i) => i.status === 'fail').length;

  return (
    <div
      id="realtime-score-banner"
      className={`sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors duration-300 shadow-lg ${
        isCompliant
          ? 'bg-slate-950/95 border-emerald-500/40'
          : 'bg-slate-950/95 border-rose-500/40'
      }`}
    >
      <div className="max-w-4xl mx-auto px-3.5 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Score Badge and Label */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div
              className={`flex h-13 w-13 sm:h-15 sm:w-15 shrink-0 items-center justify-center rounded-xl border font-black text-xl sm:text-2xl shadow-inner transition-colors ${
                isCompliant
                  ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-300'
                  : 'bg-rose-950/90 border-rose-500/70 text-rose-300'
              }`}
            >
              {scorePercent}%
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                  Compliance Score
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  ({earnedPoints.toFixed(1)} / {totalPossible.toFixed(1)} pts)
                </span>
              </div>

              {/* Required Badge status */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {isCompliant ? (
                  <span
                    id="badge-compliant"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold text-emerald-300"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    PASSED - COMPLIANT
                  </span>
                ) : (
                  <span
                    id="badge-non-compliant"
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/50 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold text-rose-300 animate-pulse"
                  >
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    ACTION REQUIRED - NON-COMPLIANT
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick counts */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-1.5 text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-2 sm:px-2.5 py-1.5 rounded-lg" title="Passed">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">{passCount}</span>
              <span className="hidden sm:inline text-slate-300 font-normal">Pass</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 sm:px-2.5 py-1.5 rounded-lg" title="Needs Attention">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-bold">{attnCount}</span>
              <span className="hidden sm:inline text-slate-300 font-normal">Attn</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-rose-300 bg-rose-950/60 border border-rose-800/80 px-2 sm:px-2.5 py-1.5 rounded-lg" title="Failed">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span className="font-bold">{failCount}</span>
              <span className="hidden sm:inline text-slate-300 font-normal">Fail</span>
            </div>
          </div>
        </div>

        {/* Progress Bar with 85% Passing Threshold indicator */}
        <div className="mt-2.5 relative">
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompliant ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, scorePercent))}%` }}
            />
          </div>
          {/* Target marker line at 85% */}
          <div
            className="absolute -top-1 bottom-0 w-0.5 bg-sky-400 pointer-events-none"
            style={{ left: '85%' }}
            title="85% Passing Target"
          />
        </div>
      </div>
    </div>
  );
};
