import React from 'react';
import { Building2, Mail, UserCheck, Calendar, RefreshCw } from 'lucide-react';

interface FacilityHeaderProps {
  facilityName: string;
  facilityEmail: string;
  supervisorName: string;
  supervisorEmail: string;
  inspectionDateTime: string;
  onFacilityNameChange: (val: string) => void;
  onFacilityEmailChange: (val: string) => void;
  onSupervisorNameChange: (val: string) => void;
  onSupervisorEmailChange: (val: string) => void;
  onInspectionDateTimeChange: (val: string) => void;
}

export const FacilityHeader: React.FC<FacilityHeaderProps> = ({
  facilityName,
  facilityEmail,
  supervisorName,
  supervisorEmail,
  inspectionDateTime,
  onFacilityNameChange,
  onFacilityEmailChange,
  onSupervisorNameChange,
  onSupervisorEmailChange,
  onInspectionDateTimeChange,
}) => {
  const refreshTimestamp = () => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    onInspectionDateTimeChange(formatted);
  };

  return (
    <div
      id="facility-metadata-card"
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:p-6 shadow-md"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white leading-tight">
              Facility & Audit Protocol Information
            </h2>
            <p className="text-xs text-slate-400">
              Required header information for executive certification & PDF dispatch
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshTimestamp}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-400 transition"
          title="Update to Current Time"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Now</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Facility Name (Text, required) */}
        <div>
          <label
            htmlFor="facility-name-input"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Facility Name</span>
            <span className="text-rose-400">*</span>
          </label>
          <input
            id="facility-name-input"
            type="text"
            required
            value={facilityName}
            onChange={(e) => onFacilityNameChange(e.target.value)}
            placeholder="e.g., Nexus Corporate Towers - Building B"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>

        {/* Facility Manager Email (Email, required) */}
        <div>
          <label
            htmlFor="facility-email-input"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Facility Manager Email</span>
            <span className="text-rose-400">*</span>
          </label>
          <input
            id="facility-email-input"
            type="email"
            required
            value={facilityEmail}
            onChange={(e) => onFacilityEmailChange(e.target.value)}
            placeholder="manager@commercialfacility.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>

        {/* Inspecting Supervisor Name (Text, required) */}
        <div>
          <label
            htmlFor="supervisor-name-input"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Inspecting Supervisor Name</span>
            <span className="text-rose-400">*</span>
          </label>
          <input
            id="supervisor-name-input"
            type="text"
            required
            value={supervisorName}
            onChange={(e) => onSupervisorNameChange(e.target.value)}
            placeholder="e.g., Ronald Ephard"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>

        {/* Supervisor Notification Email (Email, default: ronald@marketingdo.net) */}
        <div>
          <label
            htmlFor="supervisor-email-input"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Supervisor Notification Email</span>
            <span className="text-slate-400 font-normal text-[11px]">(CC Copy)</span>
          </label>
          <input
            id="supervisor-email-input"
            type="email"
            value={supervisorEmail}
            onChange={(e) => onSupervisorEmailChange(e.target.value)}
            placeholder="ronald@marketingdo.net"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>

        {/* Inspection Date & Time (auto-populated with current timestamp) */}
        <div className="md:col-span-2">
          <label
            htmlFor="inspection-time-input"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Inspection Date & Time</span>
            <span className="text-emerald-400 font-normal text-[10px]">(Auto-populated)</span>
          </label>
          <input
            id="inspection-time-input"
            type="text"
            value={inspectionDateTime}
            onChange={(e) => onInspectionDateTimeChange(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>
    </div>
  );
};
