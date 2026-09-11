'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Send,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Building,
  ClipboardList,
} from 'lucide-react';
import { AuditFormData, InspectionItem, INITIAL_INSPECTION_ITEMS } from '../src/types';
import { FacilityHeader } from '../src/components/FacilityHeader';
import { ScoreBanner } from '../src/components/ScoreBanner';
import { InspectionCard } from '../src/components/InspectionCard';
import { SignaturePad } from '../src/components/SignaturePad';
import { PWAInstallButton } from '../src/components/PWAInstallButton';
import { OfflineIndicator } from '../src/components/OfflineIndicator';
import { generateInspectionPdf } from '../lib/pdf-generator';

const STORAGE_KEY = 'commercial_cleaning_audit_draft_v1';

export default function AuditInspectionPage() {
  // Auto-populate current timestamp
  const getInitialTimestamp = () => {
    const now = new Date();
    return `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const [formData, setFormData] = useState<AuditFormData>({
    facilityName: '',
    facilityEmail: '',
    supervisorName: '',
    supervisorEmail: 'ronald@marketingdo.net',
    inspectionDateTime: getInitialTimestamp(),
    items: INITIAL_INSPECTION_ITEMS.map((item) => ({
      ...item,
      status: 'pass',
      score: 1.0,
      notes: '',
      photoUrl: undefined,
    })),
    supervisorSignature: '',
    generalNotes: '',
  });

  // UI state
  const [submissionState, setSubmissionState] = useState<'idle' | 'generating_pdf' | 'dispatching' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pdfPreviewUri, setPdfPreviewUri] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);

  // Restore draft from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.items && parsed.items.length === 10) {
          setFormData(parsed);
          setIsDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn('Could not restore audit draft:', e);
    }
  }, []);

  // Save changes to localStorage for offline protection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      // Ignore quota errors for large images
    }
  }, [formData]);

  // Score calculation
  const totalItems = formData.items.length || 1;
  const earnedPoints = formData.items.reduce((acc, item) => acc + item.score, 0);
  const scorePercent = Math.round((earnedPoints / totalItems) * 100);
  const isCompliant = scorePercent >= 85;
  const complianceStatus = isCompliant ? 'PASSED - COMPLIANT' : 'ACTION REQUIRED - NON-COMPLIANT';

  // Handle checklist item modifications
  const handleItemStatusChange = (id: string, status: InspectionItem['status'], score: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, status, score } : item)),
    }));
  };

  const handleItemNotesChange = (id: string, notes: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, notes } : item)),
    }));
  };

  const handleItemPhotoChange = (id: string, photoUrl?: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, photoUrl } : item)),
    }));
  };

  // Quick populate for demo / testing
  const handleLoadDemoData = () => {
    setFormData({
      facilityName: 'OmniHealth Medical Plaza - Tower 1',
      facilityEmail: 'operations@omnihealthplaza.org',
      supervisorName: 'Ronald Ephard',
      supervisorEmail: 'ronald@marketingdo.net',
      inspectionDateTime: getInitialTimestamp(),
      items: INITIAL_INSPECTION_ITEMS.map((item, index) => {
        if (index === 1) {
          return {
            ...item,
            status: 'needs_attention',
            score: 0.5,
            notes: 'Minor water spotting on 2nd-floor executive sink fixtures; polished on spot.',
          };
        }
        if (index === 6) {
          return {
            ...item,
            status: 'needs_attention',
            score: 0.5,
            notes: 'High HVAC return intake grill has light particulate buildup; scheduled for HEPA extraction.',
          };
        }
        return {
          ...item,
          status: 'pass',
          score: 1.0,
          notes: 'Standard maintained according to ISSA quality guidelines.',
        };
      }),
      supervisorSignature: formData.supervisorSignature || '',
      generalNotes: 'Overall facility exhibits high cleanliness adherence. Deficiencies documented in sections 2 & 7 are low-severity.',
    });
  };

  // Form Reset
  const handleResetForm = () => {
    if (window.confirm('Start a new inspection? Any unsent data will be cleared.')) {
      localStorage.removeItem(STORAGE_KEY);
      setFormData({
        facilityName: '',
        facilityEmail: '',
        supervisorName: '',
        supervisorEmail: 'ronald@marketingdo.net',
        inspectionDateTime: getInitialTimestamp(),
        items: INITIAL_INSPECTION_ITEMS.map((item) => ({
          ...item,
          status: 'pass',
          score: 1.0,
          notes: '',
          photoUrl: undefined,
        })),
        supervisorSignature: '',
        generalNotes: '',
      });
      setSubmissionState('idle');
      setStatusMessage('');
      setErrorMessage('');
    }
  };

  // Preview PDF in browser
  const handlePreviewPdf = async () => {
    try {
      setErrorMessage('');
      const result = await generateInspectionPdf(formData);
      setPdfPreviewUri(result.dataUri);
      setShowPdfModal(true);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('PDF preview error:', e);
      setErrorMessage(`Failed to generate PDF preview: ${e.message}`);
    }
  };

  // Download PDF locally
  const handleDownloadPdf = async () => {
    try {
      setErrorMessage('');
      const result = await generateInspectionPdf(formData);
      result.doc.save(result.filename);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('PDF download error:', e);
      setErrorMessage(`Failed to download PDF: ${e.message}`);
    }
  };

  // Validation before dispatch
  const validateForm = (): boolean => {
    if (!formData.facilityName.trim()) {
      setErrorMessage('Please enter the Facility Name before dispatching report.');
      document.getElementById('facility-name-input')?.focus();
      return false;
    }
    if (!formData.facilityEmail.trim()) {
      setErrorMessage('Please enter the Facility Manager Email for report delivery.');
      document.getElementById('facility-email-input')?.focus();
      return false;
    }
    if (!formData.supervisorName.trim()) {
      setErrorMessage('Please enter the Inspecting Supervisor Name.');
      document.getElementById('supervisor-name-input')?.focus();
      return false;
    }
    if (!formData.supervisorSignature) {
      setErrorMessage('Digital signature required: Please sign in the supervisor sign-off pad at the bottom.');
      document.getElementById('signature-pad-container')?.scrollIntoView({ behavior: 'smooth' });
      return false;
    }
    return true;
  };

  // Submit and Email via Resend
  const handleSubmitAndEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) return;

    try {
      // Step 1: Generating PDF
      setSubmissionState('generating_pdf');
      setStatusMessage('Generating executive-grade PDF audit report...');
      await new Promise((r) => setTimeout(r, 400)); // Optical feedback for supervisor

      const pdfResult = await generateInspectionPdf(formData);

      // Step 2: Dispatching Report
      setSubmissionState('dispatching');
      setStatusMessage(`Dispatching audit report to ${formData.facilityEmail}...`);

      const payload = {
        pdfBase64: pdfResult.base64,
        facilityEmail: formData.facilityEmail.trim(),
        supervisorEmail: formData.supervisorEmail.trim(),
        facilityName: formData.facilityName.trim(),
        score: scorePercent,
        status: complianceStatus,
        inspectorName: formData.supervisorName.trim(),
        inspectionDate: formData.inspectionDateTime,
      };

      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to dispatch report via Resend');
      }

      // Step 3: Success
      setSubmissionState('success');
      setStatusMessage(resData.message || 'Audit report and PDF successfully dispatched!');
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Submission error:', e);
      setSubmissionState('error');
      setErrorMessage(e.message || 'Error occurred while dispatching audit report.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white pb-24">
      {/* Top Mobile-First App Bar */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-3 sm:py-3.5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-blue-700 text-white shadow-md shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                  CleanAudit Pro
                </h1>
                <span className="rounded-md bg-sky-950 px-2 py-0.5 text-xs font-bold text-sky-400 border border-sky-800/60">
                  PWA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Commercial Quality Audit Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadDemoData}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-200 transition"
              title="Autofill sample audit data for testing"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Sample Demo</span>
            </button>

            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Real-time Scoring Banner (Sticky below header) */}
      <ScoreBanner items={formData.items} />

      {/* Main Content Form */}
      <main className="max-w-4xl mx-auto w-full px-3.5 sm:px-4 pt-4 sm:pt-6 space-y-6">
        {/* Draft Restored Alert Banner */}
        {isDraftRestored && (
          <div className="flex items-center justify-between gap-2.5 rounded-xl bg-sky-950/70 border border-sky-800/70 p-3.5 text-sm text-sky-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
              <span>Restored your active inspection draft from phone storage.</span>
            </div>
            <button
              onClick={() => setIsDraftRestored(false)}
              className="text-sm font-bold text-sky-300 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl bg-rose-950/90 border border-rose-800 p-4 text-sm sm:text-base text-rose-200 shadow-md animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-100 text-base">Audit Form Notification</p>
              <p className="mt-1 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-300 hover:text-white text-sm font-bold p-1 rounded-md"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Banner */}
        {submissionState === 'success' && (
          <div className="rounded-2xl bg-emerald-950/90 border border-emerald-500/60 p-5 sm:p-6 text-emerald-100 shadow-xl animate-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shrink-0 font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-white">Inspection Audit Dispatched!</h3>
                <p className="text-sm sm:text-base text-emerald-200 mt-1 leading-relaxed">{statusMessage}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition"
                  >
                    <Download className="w-4 h-4" />
                    Download Executive PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="flex items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-900/60 hover:bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Start New Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitAndEmail} className="space-y-6">
          {/* Section 1: Metadata & Facility Header */}
          <section aria-labelledby="facility-section-title">
            <FacilityHeader
              facilityName={formData.facilityName}
              facilityEmail={formData.facilityEmail}
              supervisorName={formData.supervisorName}
              supervisorEmail={formData.supervisorEmail}
              inspectionDateTime={formData.inspectionDateTime}
              onFacilityNameChange={(val) => setFormData((prev) => ({ ...prev, facilityName: val }))}
              onFacilityEmailChange={(val) => setFormData((prev) => ({ ...prev, facilityEmail: val }))}
              onSupervisorNameChange={(val) => setFormData((prev) => ({ ...prev, supervisorName: val }))}
              onSupervisorEmailChange={(val) => setFormData((prev) => ({ ...prev, supervisorEmail: val }))}
              onInspectionDateTimeChange={(val) => setFormData((prev) => ({ ...prev, inspectionDateTime: val }))}
            />
          </section>

          {/* Section 2: 10-Point Commercial Checklist */}
          <section aria-labelledby="checklist-section-title" className="space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-sky-400" />
                <h2 id="checklist-section-title" className="text-base sm:text-lg font-bold text-white">
                  10-Point Commercial Quality Inspection Checklist
                </h2>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-300">
                All 10 Areas Required
              </span>
            </div>

            <div className="space-y-4">
              {formData.items.map((item) => (
                <InspectionCard
                  key={item.id}
                  item={item}
                  onStatusChange={(status, score) => handleItemStatusChange(item.id, status, score)}
                  onNotesChange={(notes) => handleItemNotesChange(item.id, notes)}
                  onPhotoChange={(photoUrl) => handleItemPhotoChange(item.id, photoUrl)}
                />
              ))}
            </div>
          </section>

          {/* Section 3: Digital Signature Pad */}
          <section
            aria-labelledby="signature-section-title"
            className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-md"
          >
            <SignaturePad
              value={formData.supervisorSignature}
              onChange={(sigUrl) => setFormData((prev) => ({ ...prev, supervisorSignature: sigUrl }))}
              supervisorName={formData.supervisorName}
            />
          </section>

          {/* Section 4: General Executive Summary Notes */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-md">
            <label
              htmlFor="general-notes-input"
              className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 mb-1.5"
            >
              Executive Summary & Client Recommendations (Optional)
            </label>
            <textarea
              id="general-notes-input"
              rows={3}
              value={formData.generalNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, generalNotes: e.target.value }))}
              placeholder="Provide overall facility impressions, client-facing remarks, or scheduled corrective actions..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition resize-y"
            />
          </section>

          {/* Section 5: Action & Submission Bar */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-5 h-5 ${isCompliant ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span className="font-bold text-white text-base sm:text-lg">
                    Ready to Generate Audit Record
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Delivers certified PDF to <strong>{formData.facilityEmail || 'Facility Manager'}</strong> via Resend API
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  id="preview-pdf-btn"
                  onClick={handlePreviewPdf}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3.5 px-5 text-sm sm:text-base font-semibold text-slate-200 transition active:scale-95 min-h-[48px]"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Preview PDF</span>
                </button>

                <button
                  type="submit"
                  id="dispatch-report-btn"
                  disabled={submissionState === 'generating_pdf' || submissionState === 'dispatching'}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm sm:text-base font-bold text-white shadow-lg transition active:scale-95 min-h-[48px] ${
                    isCompliant
                      ? 'bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40'
                      : 'bg-linear-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 shadow-rose-950/40'
                  } disabled:opacity-50 disabled:pointer-events-none`}
                >
                  {submissionState === 'generating_pdf' ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : submissionState === 'dispatching' ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Dispatching Report...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Audit Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Demo button on mobile */}
            <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs sm:text-sm text-slate-300">
              <span>Target standard: 85% passing threshold</span>
              <button
                type="button"
                onClick={handleLoadDemoData}
                className="text-sky-400 hover:underline font-semibold"
              >
                Autofill Demo
              </button>
            </div>
          </section>
        </form>
      </main>

      {/* PDF Fullscreen Preview Modal */}
      {showPdfModal && pdfPreviewUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-6 animate-in fade-in">
          <div className="flex flex-col w-full max-w-4xl h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  Executive PDF Audit Report Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-1">
              <iframe
                src={pdfPreviewUri}
                title="Audit Report PDF Preview"
                className="w-full h-full rounded-b-xl border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
