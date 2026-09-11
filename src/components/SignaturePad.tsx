import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  value: string; // Base64 data URL
  onChange: (dataUrl: string) => void;
  supervisorName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  supervisorName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!value);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Setup canvas with high DPI
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a'; // Deep navy ink

      // If existing value, render it
      if (value) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          setHasDrawn(true);
        };
        img.src = value;
      }
    }
  }, [value]);

  useEffect(() => {
    setupCanvas();

    const handleResize = () => {
      // Re-setup on resize
      if (!canvasRef.current) return;
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
    } else {
      return {
        x: (e as MouseEvent).clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x + 0.1, coords.y + 0.1); // Make small dot on click
      ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    const lastPos = lastPosRef.current || coords;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
    onChange('');
  };

  return (
    <div id="signature-pad-container" className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <PenTool className="w-3.5 h-3.5 text-sky-400" />
          <span>Supervisor Digital Sign-Off</span>
          <span className="text-rose-400">*</span>
        </label>
        <div className="flex items-center gap-2">
          {hasDrawn && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <Check className="w-3 h-3" /> Signed
            </span>
          )}
          <button
            type="button"
            id="clear-signature-btn"
            onClick={handleClear}
            className="flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 transition active:scale-95"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Clear Signature</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-xl border border-slate-700 bg-white shadow-inner overflow-hidden touch-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block w-full h-[160px]"
        />

        {/* Signature baseline line guide */}
        <div className="pointer-events-none absolute bottom-9 left-6 right-6 border-b border-dashed border-slate-300 flex justify-between items-end pb-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            ✕ Sign on the line above
          </span>
          <span className="text-[10px] text-slate-400">
            {supervisorName ? `Authorized: ${supervisorName}` : 'Field Supervisor'}
          </span>
        </div>

        {!hasDrawn && !isDrawing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-slate-400/80 font-medium">
              Draw signature here with finger or stylus
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 italic">
        By signing above, the supervisor formally certifies that on-site commercial cleaning standards have been physically inspected and accurately evaluated.
      </p>
    </div>
  );
};
