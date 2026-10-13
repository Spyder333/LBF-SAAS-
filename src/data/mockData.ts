import { Customer, Invoice, ServiceDetail } from '../types';

export const LBF_SERVICES: ServiceDetail[] = [
  {
    id: 'line_boring_fabrication',
    name: 'Line Boring & Fabrication',
    shortDesc: 'Workshop precision boring, bore buildup, and heavy steel fabrication.',
    fullDesc: 'State-of-the-art horizontal and vertical line boring machines restoring pin joints, boom pivots, and bearing housings back to OEM tolerances (within ±0.02mm). Integrated fabrication and stress-relieving.',
    icon: 'Wrench',
    standardRateUnit: 'per bore (standard 65mm-150mm)',
    defaultRate: 480,
    typicalTurnaround: '2-4 Days',
    formulaTemplate: 'Base Bore Fee + (Bore Diameter mm * 2.8) + (Bore Length mm * 1.5) + Setup Hours * $95',
    specifications: [
      'Diameters from 45mm up to 850mm',
      'Automatic spiral bore welding system',
      'Optical bore laser alignment',
      'Structural crack gouging & reinforcement'
    ]
  },
  {
    id: 'onsite_lineboring',
    name: 'Onsite Lineboring',
    shortDesc: 'Mobile rigs deployed directly to mine sites, quarries & civil projects.',
    fullDesc: 'Fully equipped 4x4 mobile line boring units equipped with onboard power generators, hydraulic drive units, and rotary automated MIG welders. Eliminate machine teardown and transport downtime.',
    icon: 'Truck',
    standardRateUnit: 'per shift / rig hour',
    defaultRate: 185,
    typicalTurnaround: 'Same Day / 24-48hr Site Response',
    formulaTemplate: 'Rig Mobilization ($450) + (Distance km * $2.50) + (Rig Hours * $185) + Site Allowance ($120/day)',
    specifications: [
      'Self-contained 35kVA diesel generators',
      'Climax & York portable boring bars',
      'Mine-spec safety compliant vehicles',
      'Single-point & multi-station simultaneous boring'
    ]
  },
  {
    id: 'bucket_repair',
    name: 'Bucket Repair & Rebuild',
    shortDesc: 'Excavator, front-end loader, dragline and shovel bucket restoration.',
    fullDesc: 'Comprehensive structural bucket overhaul: pin boss rebuilds, ear replacement, heel shroud renewals, side cutter replacement, cracked structural beam repair, and high-wear zone cladding.',
    icon: 'HardHat',
    standardRateUnit: 'per bucket overhaul job',
    defaultRate: 2600,
    typicalTurnaround: '3-6 Days',
    formulaTemplate: 'Gouging & Prep ($350) + (Hinges/Ears Replaced * $420) + Hardfacing Area m² * $290 + Labor Hours * $85',
    specifications: [
      'Capacities from 0.8m³ mini excavators to 35m³ mining shovels',
      'Chromium carbide wear package liners',
      'Chocky bar and wear button installation',
      'Pre-heating & Post-weld thermal heat management'
    ]
  },
  {
    id: 'cutting_edge_replacement',
    name: 'Cutting Edge Replacement',
    shortDesc: 'Hardox 450/500/600 weld-on & bolt-on base edge replacements.',
    fullDesc: 'High-precision removal of worn, cracked or scalloped base edges. Installation of premium through-hardened bevelled base edges, half-arrow edges, weld-on adapters, and corner shrouds.',
    icon: 'Scissors',
    standardRateUnit: 'per blade meter',
    defaultRate: 650,
    typicalTurnaround: '1-3 Days',
    formulaTemplate: 'Base Edge Material (Thickness mm * Length m * $8.2) + Oxy-cutting Prep ($180) + Weld Hours * $90',
    specifications: [
      'Genuine Hardox 450, 500, and Raex wear steels',
      'Precision CNC bevelled edge profiles',
      'Weld-on corner protectors and cast lip systems',
      'Fast-turnaround bucket turnaround service'
    ]
  },
  {
    id: 'co2_welding',
    name: 'CO2 Welding & Hardfacing',
    shortDesc: 'Heavy structural flux-core MIG/MAG welding and automated hardfacing.',
    fullDesc: 'High-deposition CO2 / mixed gas flux-core arc welding for heavy industrial equipment, excavator carbody cracks, chassis stiffeners, crusher frames, and abrasion-resistant hardfacing overlays.',
    icon: 'Flame',
    standardRateUnit: 'per welding hour + consumables',
    defaultRate: 95,
    typicalTurnaround: 'Continuous 24/7 Shifts',
    formulaTemplate: 'Welder Hours * $95 + Wire Spools (kg) * $18.50 + Shielding Gas (m³) * $32 + QA Testing ($150)',
    specifications: [
      'AWS D1.1 & AS/NZS 1554.1 certified coded welders',
      'Heavy-duty 500A & 600A water-cooled MIG power sources',
      'Ultrasonic & Magnetic Particle Non-Destructive Testing (NDT)',
      'High-impact / high-abrasion flux-core wire overlays'
    ]
  },
  {
    id: 'industrial_gearboxes',
    name: 'Industrial Gearboxes',
    shortDesc: 'Reconditioning, housing bore reclamation, shaft repair & gear cutting.',
    fullDesc: 'Complete overhaul and diagnostic testing for mining conveyor drives, ball mill gearboxes, crusher reducers, slew drives, and heavy planetary gear systems. Includes bearing housing line boring and shaft sleeve reclamation.',
    icon: 'Cog',
    standardRateUnit: 'per gearbox rebuild stage',
    defaultRate: 3400,
    typicalTurnaround: '5-10 Days',
    formulaTemplate: 'Teardown/Inspection ($400) + Housing Bore Boring ($750) + Bearing/Seal Kit ($1200) + Reassembly & Spin Test ($650)',
    specifications: [
      'Planetary, helical, bevel, and worm gearboxes',
      'Laser shaft alignment & backlash measurement',
      'Magnetic particle crack detection on gear teeth',
      'No-load spin test run with temperature and vibration monitoring'
    ]
  },
  {
    id: 'new_bucket_fabrication',
    name: 'New Bucket Fabrication',
    shortDesc: 'Custom heavy-duty rock, coal, and skeleton buckets manufactured to order.',
    fullDesc: 'End-to-end design and fabrication of heavy-duty rock buckets (HDR), severe-duty (SD), and coal buckets tailored to specific machine kinematic curves, soil density, and rock abrasion indexes.',
    icon: 'Box',
    standardRateUnit: 'per manufactured bucket',
    defaultRate: 9800,
    typicalTurnaround: '2-3 Weeks',
    formulaTemplate: '(Capacity m³ * $4200) + Steel Grade Factor + Ear Boring ($950) + Wear Package ($1400) + QA Certificate',
    specifications: [
      '3D CAD finite element analysis (FEA) optimized geometry',
      'Full Hardox floor, cheeks, and heel bands',
      'Integrated ground engaging tools (GET) of choice (Cat, Hensley, ESCO)',
      'Manufacturer serial plate and load test certification'
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-pacific',
    companyName: 'Pasific ltd',
    contactPerson: 'Operations Team',
    email: 'ops@pasificltd.co.zw',
    phone: '+263 77 900 0000',
    address: 'Harare, Zimbabwe',
    city: 'Harare',
    taxNumber: 'PAS-0001',
    balanceDue: 0,
    createdAt: '2026-10-13',
    notes: 'Default fleet record retained for workshop operations.',
    equipmentFleet: [
      { id: 'eq-pacific-1', make: 'CAT', model: '320D', type: 'Excavator', serialNumber: 'CAT-320D-001', pinBoreSpecs: 'Bucket pivot 90mm' }
    ]
  }
];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_SPREADSHEET_DATA = [
  ['LBF SOLUTIONS - JOB RATE & ENGINEERING FORMULA MASTER', '', '', '', '', ''],
  ['Project Ref: LBF-CALC-2026', 'Date:', '2026-09-15', 'Currency: USD', '', ''],
  ['', '', '', '', '', ''],
  ['SERVICE / ITEM CODE', 'DESCRIPTION', 'QTY / METERS', 'UNIT RATE ($)', 'FORMULA / CALCULATION', 'LINE TOTAL ($)'],
  ['LB-01', 'Onsite Line Boring Rig Standard Rate', '12', '185', '=C5*D5', '2220.00'],
  ['LB-02', 'Bore Mobile Rig Mobilization Distance (km)', '180', '2.50', '=C6*D6', '450.00'],
  ['BR-03', 'Excavator Bucket Pin Boss Weld Buildup', '4', '320', '=C7*D7', '1280.00'],
  ['CE-04', 'Hardox 500 Cutting Edge 40mm Profile (m)', '3.5', '620', '=C8*D8', '2170.00'],
  ['WELD-05', 'CO2 Heavy Flux-core Coded Welder (hrs)', '14', '95', '=C9*D9', '1330.00'],
  ['GEAR-06', 'Industrial Gearbox Bore Reclaim & Test', '1', '1450', '=C10*D10', '1450.00'],
  ['', '', '', '', '', ''],
  ['', '', '', 'SUBTOTAL:', '=SUM(F5:F10)', '8900.00'],
  ['', '', '', 'DISCOUNT (5%):', '=F12*0.05', '445.00'],
  ['', '', '', 'TAXABLE AMOUNT:', '=F12-F13', '8455.00'],
  ['', '', '', 'VAT / TAX (15%):', '=F14*0.15', '1268.25'],
  ['', '', '', 'FINAL ESTIMATE TOTAL:', '=F14+F15', '9723.25']
];
