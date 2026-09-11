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
          ? 'bg-slate-950/90 border-emerald-500/30'
          : 'bg-slate-950/90 border-rose-500/30'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Score Badge and Label */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-extrabold text-lg sm:text-xl shadow-inner transition-colors ${
                isCompliant
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-500/60 text-rose-400'
              }`}
            >
              {scorePercent}%
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Compliance Score
                </span>
                <span className="text-[11px] text-slate-500">
                  ({earnedPoints.toFixed(1)} / {totalPossible.toFixed(1)} pts)
                </span>
              </div>

              {/* Required Badge status */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {isCompliant ? (
                  <span
                    id="badge-compliant"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-400"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    PASSED - COMPLIANT
                  </span>
                ) : (
                  <span
                    id="badge-non-compliant"
                    className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/40 px-2.5 py-0.5 text-xs font-bold text-rose-400 animate-pulse"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    ACTION REQUIRED - NON-COMPLIANT
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick counts */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-1 rounded-lg" title="Passed">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="font-bold">{passCount}</span>
              <span className="hidden sm:inline text-slate-400 font-normal">Pass</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-1 rounded-lg" title="Needs Attention">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold">{attnCount}</span>
              <span className="hidden sm:inline text-slate-400 font-normal">Attn</span>
            </div>
            <div className="flex items-center gap-1 text-rose-400 bg-rose-950/40 border border-rose-900/60 px-2 py-1 rounded-lg" title="Failed">
              <XCircle className="w-3.5 h-3.5" />
              <span className="font-bold">{failCount}</span>
              <span className="hidden sm:inline text-slate-400 font-normal">Fail</span>
            </div>
          </div>
        </div>

        {/* Progress Bar with 85% Passing Threshold indicator */}
        <div className="mt-2 relative">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompliant ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, scorePercent))}%` }}
            />
          </div>
          {/* Target marker line at 85% */}
          <div
            className="absolute -top-1 bottom-0 w-0.5 bg-sky-400/80 pointer-events-none"
            style={{ left: '85%' }}
            title="85% Passing Target"
          />
        </div>
      </div>
    </div>
  );
};
