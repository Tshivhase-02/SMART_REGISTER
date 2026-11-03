import React, { useState } from 'react';
import {
  Map,
  Layers,
  GitBranch,
  User,
  ShieldCheck,
  Monitor,
  Smartphone,
  Compass,
  FileCode,
  Palette,
  Sliders,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  Clock,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export const SpecsDocumentationScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(1);

  const deliverables = [
    { id: 1, label: '1. Sitemap', icon: Map },
    { id: 2, label: '2. Information Architecture', icon: Layers },
    { id: 3, label: '3. User Journeys', icon: GitBranch },
    { id: 4, label: '4. Learner Workflows', icon: User },
    { id: 5, label: '5. Admin Workflows', icon: ShieldCheck },
    { id: 6, label: '6. Desktop Wireframes', icon: Monitor },
    { id: 7, label: '7. Mobile Wireframes', icon: Smartphone },
    { id: 8, label: '8. Navigation Structure', icon: Compass },
    { id: 9, label: '9. Component Library', icon: FileCode },
    { id: 10, label: '10. Design System', icon: Palette },
    { id: 11, label: '11. Responsive Layouts', icon: Sliders },
    { id: 12, label: '12. UI Specifications', icon: CheckCircle2 },
    { id: 13, label: '13. Attendance Screens', icon: Clock },
    { id: 14, label: '14. Schedule Management', icon: Calendar },
    { id: 15, label: '15. Register Downloads', icon: FileSpreadsheet },
    { id: 16, label: '16. Printable Register', icon: Printer },
    { id: 17, label: '17. Empty States', icon: AlertCircle },
    { id: 18, label: '18. Error States', icon: AlertCircle },
    { id: 19, label: '19. Loading States', icon: RefreshCw },
    { id: 20, label: '20. Frontend Architecture', icon: Cpu },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DynamicDNA · DVT Learnership Programme</span>
            <span>·</span>
            <span>System Architecture Dossier</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Complete Enterprise Specifications (20 Deliverables)
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Comprehensive product design, UX flows, and frontend architectural specifications for SmartRegister.
          </p>
        </div>
      </div>

      {/* 2. Horizontal Scrollable Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {deliverables.map((d) => {
            const Icon = d.icon;
            const isActive = activeTab === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setActiveTab(d.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded whitespace-nowrap font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#2F3E96] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Deliverable Content Viewport */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs text-xs space-y-4">
        {activeTab === 1 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">1. Complete Sitemap</h3>
            <div className="p-4 bg-slate-900 text-slate-200 rounded font-mono text-[11px] overflow-x-auto">
              <pre className="text-emerald-400">
{`SmartRegister (DynamicDNA DVT Programme)
│
├── /learner (Strictly Isolated Role View)
│   ├── /dashboard                 [Overview: Today's Schedule, Clock Status, Summary]
│   ├── /attendance                [Daily Terminal: Access ID, GPS Verification, In/Out]
│   ├── /history                   [Filterable Personal Ledger: Daily, Weekly, Monthly]
│   ├── /report-absence            [Absence Reporting & Supervisor Review Status]
│   └── /profile                   [Learner Dossier: DVT Number, Phone & Photo Updates]
│
├── /admin (Supervisory Governance)
│   ├── /dashboard                 [SETA KPIs, Real-time Stream, Absence Stream]
│   ├── /learners                  [Enrollment, Profiles, Status Toggles]
│   ├── /attendance                [Master Register Overview, Status Filters]
│   ├── /absence-requests          [Review Queue, Approve/Reject Actions]
│   ├── /register-downloads        [Printable A4 Portrait Register, Excel & CSV Exports]
│   ├── /system-controls           [Terminal Enable/Disable, Emergency Overrides]
│   ├── /schedule-management       [Hybrid Weekly Schedules, Office vs WFH Toggles]
│   └── /settings                  [Campus Geofence (100m), Coordinates, Public Holidays]
│
└── /architecture-specs            [Interactive 20-Deliverable Specification Repository]`}</pre>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">2. Information Architecture</h3>
            <p className="text-slate-600">
              Information domain relationships and security barriers for DynamicDNA DVT attendance:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-bold text-slate-900 block">Learner Entity</span>
                <p className="text-slate-600 text-[11px]">
                  Attributes: First Name, Last Name, Phone Number, Auto-generated Learner Number (DVT-2026-XXX), Programme ("DVT Learnership Programme"), Role, Status.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-bold text-slate-900 block">Daily Access ID Model</span>
                <p className="text-slate-600 text-[11px]">
                  Format: SR-YYYYMMDD-XXXXX. Valid for single day only, expires automatically at midnight, unique per learner. Generated upon successful GPS verification (Office) or schedule check (WFH).
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-bold text-slate-900 block">Schedule & Register Rules</span>
                <p className="text-slate-600 text-[11px]">
                  Authoritative hybrid schedules set by Admin (Default: Mon WFH, Tue Office, Wed WFH, Thu WFH, Fri Office). Register statuses strictly limited to: Present, Late, Absent.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">3. User Journeys</h3>
            <div className="p-4 bg-slate-900 text-slate-200 rounded font-mono text-[11px] overflow-x-auto">
              <pre className="text-sky-300">
{`Journey 1: Learner on Office Day (Tuesday)
Learner Arrives at DynamicDNA (Centroid: -26.097841, 27.998357)
      │
      ▼
Opens SmartRegister ──> System Queries Device GPS ──> Within 100m?
      │
      ├── YES ──> Daily Access ID Generated (e.g. SR-20261102-X7K4Q)
      │           Clock-In Enabled (07:15 - 09:00 = Present | After 09:00 = Late)
      │           Attendance Submitted ──> Disable Clock-In ("Attendance Already Registered")
      │
      └── NO  ──> Location Verification Failed / Access Denied
                  "You are outside the authorised attendance zone."

Journey 2: Learner on WFH Day (Monday, Wednesday, Thursday)
Learner Opens SmartRegister from Home
      │
      ▼
System Identifies WFH Schedule ──> GPS NOT required ──> Daily Access ID Generated
      │
      ▼
Learner Clocks In via WFH Channel (07:15 - 09:00)`}</pre>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">4. Learner Workflows</h3>
            <div className="space-y-2 text-slate-700">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>1. Profile Creation:</strong> Learner enters First Name, Last Name, Phone Number. System auto-generates sequential number (e.g., DVT-2026-001).
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>2. Morning Attendance:</strong> Opens dashboard, reviews schedule, verifies Daily Access ID, clocks in (Present or Late).
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>3. Departure:</strong> Available at 15:15. Learner clocks out to seal daily shift hours.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>4. Absence Reporting:</strong> Selects date, reason (Sick, Family Emergency, Medical, Transport, Study, Other), enters comments, and tracks approval.
              </div>
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">5. Admin Workflows</h3>
            <div className="space-y-2 text-slate-700">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>1. Schedule Management:</strong> Switch days between Office and WFH, apply schedules to all learners, configure specific future calendar overrides.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>2. Absence Approvals:</strong> View pending absence requests, review justifications, approve or reject (approved automatically logged as Absent in register).
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>3. Register Generation:</strong> Generate A4 Portrait registers with repeated learner names, 4-5 dates per page, and export PDF/Excel/CSV.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>4. System Controls:</strong> Immediate overrides to enable/disable clock in/out, convert day types, or broadcast emergency suspensions.
              </div>
            </div>
          </div>
        )}

        {activeTab === 6 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">6. Desktop Wireframes (1440px Baseline)</h3>
            <div className="border border-slate-300 rounded bg-slate-50 p-4 font-mono text-[10px] text-slate-700">
              <div className="border border-slate-400 p-2 mb-2 bg-white flex justify-between font-bold">
                <span>[HEADER: DynamicDNA | DVT Learnership · Today: Office · Daily Access ID · SAST Clock]</span>
              </div>
              <div className="grid grid-cols-12 gap-2 h-48">
                <div className="col-span-3 border border-slate-400 p-2 bg-white">
                  <strong>[ROLE-ISOLATED SIDEBAR]</strong>
                  <div className="text-[9px] mt-1 space-y-0.5">
                    <div>· Dashboard</div>
                    <div>· Attendance</div>
                    <div>· History</div>
                    <div>· Report Absence</div>
                    <div>· Profile</div>
                  </div>
                </div>
                <div className="col-span-9 border border-slate-400 p-2 bg-white space-y-2">
                  <div className="border border-dashed border-slate-300 p-1 bg-slate-50">
                    Welcome Banner · Daily Access ID (SR-20261102-X7K4Q)
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <div className="border border-slate-300 p-1 text-center">Schedule: Office</div>
                    <div className="border border-slate-300 p-1 text-center">Location: Verified</div>
                    <div className="border border-slate-300 p-1 text-center">Clock-In: Available</div>
                    <div className="border border-slate-300 p-1 text-center">Clock-Out: 15:15</div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <div className="border border-slate-300 p-1 text-center">Present: 7</div>
                    <div className="border border-slate-300 p-1 text-center">Late: 1</div>
                    <div className="border border-slate-300 p-1 text-center">Absent: 1</div>
                    <div className="border border-slate-300 p-1 text-center">Rate: 89%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 7 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">7. Mobile Wireframes (375px - 414px)</h3>
            <p className="text-slate-600">
              Clean vertical stacking, 48px touch targets, and role-aware bottom navigation.
            </p>
            <div className="max-w-xs mx-auto border-2 border-slate-800 rounded-xl p-3 bg-slate-50 font-mono text-[9px]">
              <div className="bg-white p-2 border border-slate-300 rounded mb-2 font-bold flex justify-between">
                <span>SmartRegister (DVT)</span>
                <span>08:15</span>
              </div>
              <div className="bg-white p-2 border border-slate-300 rounded mb-2">
                <span>Today: Office · Verified (25m)</span>
                <span className="block font-bold text-[#0F4C81]">Access ID: SR-20261102-X7K4Q</span>
              </div>
              <div className="bg-[#0F4C81] text-white p-2 rounded text-center font-bold mb-2">
                Clock In (Present)
              </div>
              <div className="bg-white p-1.5 border border-slate-300 rounded flex justify-around text-center font-bold text-slate-700">
                <span>Home</span>
                <span>Clock</span>
                <span>History</span>
                <span>Absence</span>
                <span>Profile</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 8 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">8. Navigation Structure</h3>
            <p className="text-slate-600">
              Strict isolation: Learners never see or access Admin navigation or Admin routes.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="font-bold text-[#0F4C81] block mb-1">Learner Navigation</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                  <li>Dashboard</li>
                  <li>Attendance (Clock In / Out)</li>
                  <li>Attendance History</li>
                  <li>Report Absence</li>
                  <li>Profile</li>
                </ul>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="font-bold text-slate-900 block mb-1">Admin Navigation</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                  <li>Dashboard</li>
                  <li>Learners</li>
                  <li>Attendance</li>
                  <li>Absence Requests</li>
                  <li>Register Downloads</li>
                  <li>System Controls</li>
                  <li>Work Schedule Management</li>
                  <li>Settings</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 9 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">9. Component Library</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-slate-800">
              {[
                'Navbar with Daily ID',
                'Role-Gated Sidebar',
                'Mobile Bottom Nav',
                'Daily Access Generator',
                'Geofence Calculator (100m)',
                'A4 Printable Register',
                'Schedule Calendar Grid',
                'System Emergency Override',
                'Absence Approval Table',
                'Profile Creation Modal',
                'CSV Ledger Exporter',
                'SA Holiday Evaluator',
              ].map((c, i) => (
                <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-[11px]">
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 10 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">10. DynamicDNA Official Design System & Palette</h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 border border-[#E5E7EB] rounded bg-white">
                <div className="h-8 rounded bg-[#F4B52C] mb-1" />
                <span className="font-bold block text-[11px]">Brand Gold</span>
                <span className="font-mono text-[9px] text-slate-500">#F4B52C</span>
              </div>
              <div className="p-2 border border-[#E5E7EB] rounded bg-white">
                <div className="h-8 rounded bg-[#2F3E96] mb-1" />
                <span className="font-bold block text-[11px]">Brand Blue</span>
                <span className="font-mono text-[9px] text-slate-500">#2F3E96</span>
              </div>
              <div className="p-2 border border-[#E5E7EB] rounded bg-white">
                <div className="h-8 rounded bg-[#F5F5F5] border border-slate-300 mb-1" />
                <span className="font-bold block text-[11px]">Page Background</span>
                <span className="font-mono text-[9px] text-slate-500">#F5F5F5</span>
              </div>
              <div className="p-2 border border-[#E5E7EB] rounded bg-white">
                <div className="h-8 rounded bg-[#FFFFFF] border border-slate-300 mb-1" />
                <span className="font-bold block text-[11px]">Card Background</span>
                <span className="font-mono text-[9px] text-slate-500">#FFFFFF</span>
              </div>
              <div className="p-2 border border-[#E5E7EB] rounded bg-white">
                <div className="h-8 rounded bg-[#333333] mb-1" />
                <span className="font-bold block text-[11px]">Primary Text</span>
                <span className="font-mono text-[9px] text-slate-500">#333333</span>
              </div>
              <div className="p-2 border border-[#E5E7EB] rounded bg-white">
                <div className="h-8 rounded bg-[#E5E7EB] border border-slate-300 mb-1" />
                <span className="font-bold block text-[11px]">Border Color</span>
                <span className="font-mono text-[9px] text-slate-500">#E5E7EB</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 11 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">11. Responsive Layouts</h3>
            <p className="text-slate-600">
              Fluid breakpoints optimized for mobile field check-ins and desktop administrative reporting:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
              <li><strong>Mobile (&lt; 768px):</strong> Touch bottom navigation bar, single-column KPI cards, full-width touch buttons.</li>
              <li><strong>Tablet (768px - 1024px):</strong> Collapsible sidebar, 2-column metrics, horizontal scroll data tables.</li>
              <li><strong>Desktop (1024px - 1440px+):</strong> Full 240px sidebar, multi-column dashboard, split stream view.</li>
            </ul>
          </div>
        )}

        {activeTab === 12 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">12. UI Specifications</h3>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 font-mono text-[11px] space-y-1">
              <div>ORGANIZATION: DynamicDNA | DVT Learnership Programme</div>
              <div>COORDINATES: -26.097841, 27.998357 | RADIUS: 100 Metres</div>
              <div>CLOCK-IN: Opens 07:15 | Present: 07:15 - 09:00 | Late: After 09:00</div>
              <div>CLOCK-OUT: Available At 15:15</div>
              <div>STATUSES ALLOWED: Present, Late, Absent ONLY</div>
            </div>
          </div>
        )}

        {activeTab === 13 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">13. Attendance Screens</h3>
            <p className="text-slate-600">
              Learner morning check-in terminal dynamically enforces rules based on whether today is an Office day (GPS $\le$ 100m) or a Work From Home day.
            </p>
          </div>
        )}

        {activeTab === 14 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">14. Schedule Management Screens</h3>
            <p className="text-slate-600">
              Enables administrators to configure hybrid office/WFH schedules, save changes, reset to default, and apply to all learners.
            </p>
          </div>
        )}

        {activeTab === 15 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">15. Register Download Screens</h3>
            <p className="text-slate-600">
              Generates Daily, Weekly, Monthly, and Custom Range registers exported directly to PDF, Excel, and CSV format.
            </p>
          </div>
        )}

        {activeTab === 16 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">16. Printable Register Designs (A4 Portrait)</h3>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded font-mono text-[11px] space-y-2">
              <p className="font-bold text-slate-900">A4 Portrait Specification Guidelines:</p>
              <div>· Strict Portrait orientation (no landscape).</div>
              <div>· Learner names repeated on every page.</div>
              <div>· Maximum 4 or 5 dates per page; continues automatically onto new pages.</div>
              <div>· Weekends and public holidays strictly excluded.</div>
              <div>· Statuses limited strictly to Present, Late, Absent.</div>
            </div>
          </div>
        )}

        {activeTab === 17 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">17. Empty States</h3>
            <p className="text-slate-600">
              Designed with clear, non-cluttered explanatory notices (e.g. "No attendance records found matching current query", "No absence requests pending review").
            </p>
          </div>
        )}

        {activeTab === 18 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">18. Error States</h3>
            <div className="space-y-2 text-slate-700">
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded">
                <strong>Geofence Denial:</strong> "Attendance Denied. Today is an Office Day. You must be physically present at DynamicDNA."
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded">
                <strong>Emergency Lock:</strong> "Attendance Is Temporarily Disabled By The Administrator."
              </div>
            </div>
          </div>
        )}

        {activeTab === 19 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">19. Loading States</h3>
            <p className="text-slate-600">
              Subtle CSS spinners and skeleton states on GPS acquisition and register generation.
            </p>
          </div>
        )}

        {activeTab === 20 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase">20. Complete Frontend Architecture</h3>
            <p className="text-slate-600">
              Modular TypeScript React architecture powered by Context API, Tailwind CSS, Haversine geospatial calculation, and browser print CSS engine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
