import React from 'react';
import { DYNAMIC_DNA_OFFICE, SA_PUBLIC_HOLIDAYS_2026 } from '../../../utils/geoUtils';
import { Settings, Building2, MapPin, Clock, Calendar, ShieldCheck } from 'lucide-react';

export const AdminSettingsScreen: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Governance</span>
            <span>·</span>
            <span>Workplace Parameters</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workplace Configuration & Settings
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Authoritative office coordinates, allowed geofence perimeter, shift windows, and statutory holidays.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Office & Coordinates Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-[#2F3E96]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Workplace Geofence Configuration
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Workplace Facility:</span>
              <span className="font-bold text-slate-900">{DYNAMIC_DNA_OFFICE.name}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Programme:</span>
              <span className="font-semibold text-slate-800">{DYNAMIC_DNA_OFFICE.programme}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-slate-50 p-2.5 rounded border border-[#E5E7EB]">
                <span className="text-[10px] text-slate-500 block">Latitude:</span>
                <span className="font-bold text-slate-900">{DYNAMIC_DNA_OFFICE.coordinates.latitude}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-[#E5E7EB]">
                <span className="text-[10px] text-slate-500 block">Longitude:</span>
                <span className="font-bold text-slate-900">{DYNAMIC_DNA_OFFICE.coordinates.longitude}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-slate-800">
              <span className="text-[10px] font-bold uppercase text-[#2F3E96] block">
                Geofence Radius Constraint:
              </span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {DYNAMIC_DNA_OFFICE.allowedRadiusMeters} Metres
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Learners must be within 100 metres of DynamicDNA to receive a Daily Access ID and clock in on designated Office days.
              </p>
            </div>
          </div>
        </div>

        {/* Shift Timings & Attendance Rules Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-[#2F3E96]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Shift Windows & Attendance Rules
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Clock-In Window Opens:</span>
                <span className="font-mono font-bold text-slate-900">07:15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-700">Present (On-Time):</span>
                <span className="font-mono font-bold text-emerald-800">07:15 — 09:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-amber-700">Late Status Applied:</span>
                <span className="font-mono font-bold text-amber-800">After 09:00</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="font-semibold text-slate-700">Clock-Out Clearance:</span>
                <span className="font-mono font-bold text-slate-900">Available At 15:15</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-[#E5E7EB] rounded text-[11px] text-slate-600">
              <strong>Attendance Statuses:</strong> Strictly recorded as <code>Present</code>, <code>Late</code>, or <code>Absent</code>.
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Public Holidays */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-[#2F3E96]" />
          <h3 className="text-xs font-bold text-slate-900 uppercase">
            South Africa Statutory Public Holidays (Excluded From Registers)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
          {Object.entries(SA_PUBLIC_HOLIDAYS_2026).map(([dateStr, name]) => (
            <div key={dateStr} className="p-2.5 bg-slate-50 border border-[#E5E7EB] rounded">
              <span className="font-mono text-[11px] text-slate-500 block">{dateStr}</span>
              <span className="font-semibold text-slate-800">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
