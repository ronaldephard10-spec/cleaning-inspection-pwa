import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertTriangle, XCircle, Trash2, Maximize2, X, FileText } from 'lucide-react';
import { InspectionItem, InspectionStatus } from '../types';

interface InspectionCardProps {
  item: InspectionItem;
  onStatusChange: (status: InspectionStatus, score: number) => void;
  onNotesChange: (notes: string) => void;
  onPhotoChange: (photoUrl?: string) => void;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({
  item,
  onStatusChange,
  onNotesChange,
  onPhotoChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress / convert image to base64 with max dimensions for PDF performance
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          onPhotoChange(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so same photo can be re-selected if desired
    e.target.value = '';
  };

  const statusConfig = {
    pass: {
      label: 'Pass',
      points: '1.0',
      activeClasses: 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400 font-semibold',
      inactiveClasses: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
      icon: CheckCircle2,
    },
    needs_attention: {
      label: 'Needs Attention',
      points: '0.5',
      activeClasses: 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400 font-semibold',
      inactiveClasses: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
      icon: AlertTriangle,
    },
    fail: {
      label: 'Fail',
      points: '0.0',
      activeClasses: 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400 font-semibold',
      inactiveClasses: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
      icon: XCircle,
    },
  };

  const getBorderColor = () => {
    if (item.status === 'pass') return 'border-slate-800 hover:border-slate-700';
    if (item.status === 'needs_attention') return 'border-amber-900/50 bg-amber-950/10';
    return 'border-rose-900/50 bg-rose-950/10';
  };

  return (
    <div
      id={`inspection-item-${item.id}`}
      className={`rounded-2xl border bg-slate-900/90 p-4 sm:p-5 transition shadow-sm ${getBorderColor()}`}
    >
      {/* Item Header */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-sky-400 mt-0.5">
            {item.number}
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Current score pill */}
        <div className="shrink-0 text-right">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-bold tracking-tight ${
              item.status === 'pass'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                : item.status === 'needs_attention'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                : 'bg-rose-950 text-rose-300 border border-rose-800/80'
            }`}
          >
            {item.score.toFixed(1)} pt
          </span>
        </div>
      </div>

      {/* 3-State Segmented Control */}
      <div className="mb-4">
        <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Audit Assessment
        </label>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-950 p-1.5 border border-slate-800">
          {/* Pass */}
          <button
            type="button"
            id={`btn-pass-${item.id}`}
            onClick={() => onStatusChange('pass', 1.0)}
            className={`flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs sm:text-sm font-semibold transition active:scale-95 min-h-[46px] ${
              item.status === 'pass'
                ? statusConfig.pass.activeClasses
                : statusConfig.pass.inactiveClasses
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Pass (1.0)</span>
          </button>

          {/* Needs Attention */}
          <button
            type="button"
            id={`btn-attn-${item.id}`}
            onClick={() => onStatusChange('needs_attention', 0.5)}
            className={`flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs sm:text-sm font-semibold transition active:scale-95 min-h-[46px] ${
              item.status === 'needs_attention'
                ? statusConfig.needs_attention.activeClasses
                : statusConfig.needs_attention.inactiveClasses
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">Attn (0.5)</span>
          </button>

          {/* Fail */}
          <button
            type="button"
            id={`btn-fail-${item.id}`}
            onClick={() => onStatusChange('fail', 0.0)}
            className={`flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs sm:text-sm font-semibold transition active:scale-95 min-h-[46px] ${
              item.status === 'fail'
                ? statusConfig.fail.activeClasses
                : statusConfig.fail.inactiveClasses
            }`}
          >
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Fail (0.0)</span>
          </button>
        </div>
      </div>

      {/* Camera Capture & Thumbnail */}
      <div className="mb-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
            <Camera className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Photographic Evidence</span>
          </label>

          {/* Hidden camera input specified by requirements */}
          <input
            ref={fileInputRef}
            id={`camera-input-${item.id}`}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileCapture}
            className="hidden"
          />

          {!item.photoUrl ? (
            <button
              type="button"
              id={`capture-btn-${item.id}`}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 transition active:scale-95"
            >
              <Camera className="w-4 h-4 text-sky-400" />
              <span>Capture Photo</span>
            </button>
          ) : (
            <button
              type="button"
              id={`retake-btn-${item.id}`}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs sm:text-sm text-sky-400 hover:text-sky-300 font-semibold"
            >
              Retake Photo
            </button>
          )}
        </div>

        {/* Thumbnail Preview if Photo is Captured */}
        {item.photoUrl && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div
              onClick={() => setShowPreviewModal(true)}
              className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden border border-slate-700 cursor-pointer shrink-0 group"
            >
              <img
                src={item.photoUrl}
                alt={`Photo for ${item.title}`}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                Photo Captured & Embedded
              </p>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">
                Will be included in PDF report
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom Photo"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                id={`remove-photo-${item.id}`}
                onClick={() => onPhotoChange(undefined)}
                className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition"
                title="Remove Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes Field */}
      <div>
        <label
          htmlFor={`notes-${item.id}`}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 mb-1.5"
        >
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Deficiency Notes & Observations</span>
          {item.status !== 'pass' && (
            <span className="text-amber-400 font-medium text-xs">(Recommended for deficiencies)</span>
          )}
        </label>
        <textarea
          id={`notes-${item.id}`}
          rows={2}
          value={item.notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add deficiency notes or specifics..."
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition resize-y"
        />
      </div>

      {/* Zoom Modal for Photo */}
      {showPreviewModal && item.photoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <h4 className="text-base font-bold text-white truncate">
                {item.title} - Visual Proof
              </h4>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={item.photoUrl}
              alt={item.title}
              className="w-full max-h-[65vh] object-contain rounded-xl border border-slate-800 bg-black"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
