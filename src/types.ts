export type InspectionStatus = 'pass' | 'needs_attention' | 'fail';

export interface InspectionItem {
  id: string;
  number: number;
  title: string;
  description: string;
  status: InspectionStatus;
  score: number; // 1.0 for pass, 0.5 for needs_attention, 0.0 for fail
  notes: string;
  photoUrl?: string; // base64 data url
}

export interface AuditFormData {
  facilityName: string;
  facilityEmail: string;
  supervisorName: string;
  supervisorEmail: string;
  inspectionDateTime: string;
  items: InspectionItem[];
  supervisorSignature: string; // base64 png
  generalNotes?: string;
}

export interface AuditReportPayload {
  pdfBase64: string;
  facilityEmail: string;
  supervisorEmail: string;
  facilityName: string;
  score: number;
  status: 'PASSED - COMPLIANT' | 'ACTION REQUIRED - NON-COMPLIANT';
  inspectorName: string;
  inspectionDate: string;
}

export const INITIAL_INSPECTION_ITEMS: Omit<InspectionItem, 'status' | 'score' | 'notes' | 'photoUrl'>[] = [
  {
    id: 'entryway',
    number: 1,
    title: 'Entryway & Reception Foyer',
    description: 'Glass doors streak-free, matting vacuumed, threshold clean, reception desk & seating sanitized.',
  },
  {
    id: 'restroom_sanitation',
    number: 2,
    title: 'Restroom Sanitation & Fixtures',
    description: 'Toilets, urinals, sinks, counters disinfected, chrome polished, mirrors spotless, zero odors.',
  },
  {
    id: 'restroom_restocking',
    number: 3,
    title: 'Restroom Consumable Restocking',
    description: 'Hand soap, paper towels, toilet tissue, and seat covers fully replenished in all dispensers.',
  },
  {
    id: 'floor_care',
    number: 4,
    title: 'Floor Care (Vacuuming, Mopping, Edges)',
    description: 'Carpet vacuumed wall-to-wall, hard surfaces damp-mopped, baseboards & corner dirt removed.',
  },
  {
    id: 'waste_removal',
    number: 5,
    title: 'Waste & Recycling Removal',
    description: 'All waste bins emptied, liners replaced, cans wiped down inside & out, recycling sorted.',
  },
  {
    id: 'kitchen_breakroom',
    number: 6,
    title: 'Kitchen & Breakroom Sanitation',
    description: 'Counters, tables, sink, exterior of microwave/refrigerator sanitized, sponge & supplies organized.',
  },
  {
    id: 'high_low_dusting',
    number: 7,
    title: 'High/Low Dusting (Vents, Blinds, Sills)',
    description: 'HVAC return vents cleared, window blinds dusted, chair rungs & computer display frames wiped.',
  },
  {
    id: 'interior_glass',
    number: 8,
    title: 'Interior Glass & Sneeze Partitions',
    description: 'Conference room glass, partition sneeze guards, interior office windows cleaned free of smudges.',
  },
  {
    id: 'touchpoint_sanitization',
    number: 9,
    title: 'Touchpoint Sanitization (Doors, Switches)',
    description: 'Doorknobs, crash bars, light switches, elevator buttons, handrails disinfected with hospital-grade EPA germicide.',
  },
  {
    id: 'security_lockup',
    number: 10,
    title: 'Security & Facility Lockup Protocols',
    description: 'Interior windows secured, non-essential lights extinguished, emergency exits clear, alarm/lock verified.',
  },
];
