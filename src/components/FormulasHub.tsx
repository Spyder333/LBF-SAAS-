import React, { useState } from 'react';
import {
  Calculator,
  Wrench,
  Truck,
  Flame,
  Scissors,
  Cog,
  Box,
  HardHat,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

interface FormulasHubProps {
  onSendToInvoice: (desc: string, total: number, formula: string) => void;
}

export const FormulasHub: React.FC<FormulasHubProps> = ({ onSendToInvoice }) => {
  const [activeCalculator, setActiveCalculator] = useState<
    'line_boring' | 'onsite_rig' | 'bucket_wear' | 'cutting_edge' | 'co2_welding' | 'gearbox' | 'new_bucket'
  >('line_boring');

  // 1. Line Boring Speed, Feed & Cost State
  const [boreDiameter, setBoreDiameter] = useState<number>(110); // mm
  const [boreLength, setBoreLength] = useState<number>(180); // mm
  const [numBores, setNumBores] = useState<number>(2);
  const [surfaceSpeed, setSurfaceSpeed] = useState<number>(45); // m/min (carbide tool in mild steel)
  const [feedPerRev, setFeedPerRev] = useState<number>(0.15); // mm/rev
  const [depthOfCut, setDepthOfCut] = useState<number>(1.5); // mm
  const [hourlyBoreRate, setHourlyBoreRate] = useState<number>(120); // $/hr

  // Calculations for Line Boring
  const rpm = Math.round((surfaceSpeed * 1000) / (Math.PI * boreDiameter));
  const feedSpeed = Math.round(rpm * feedPerRev * 10) / 10; // mm/min
  const timePerPassMin = feedSpeed > 0 ? Math.round((boreLength / feedSpeed) * 10) / 10 : 0;
  const estimatedMachiningHours = Math.round(((timePerPassMin * 3 * numBores + 60) / 60) * 10) / 10; // 3 passes + 1hr setup
  const totalLineBoringCost = Math.round(estimatedMachiningHours * hourlyBoreRate * 100) / 100;

  // 2. Onsite Lineboring Mobilization State
  const [travelDistanceKm, setTravelDistanceKm] = useState<number>(140);
  const [onsiteRigHours, setOnsiteRigHours] = useState<number>(16);
  const [kmRate, setKmRate] = useState<number>(2.50);
  const [baseMobFee, setBaseMobFee] = useState<number>(450);
  const [rigHourlyRate, setRigHourlyRate] = useState<number>(185);
  const [perDiemAllowance, setPerDiemAllowance] = useState<number>(120);

  const travelCost = travelDistanceKm * kmRate;
  const rigHoursCost = onsiteRigHours * rigHourlyRate;
  const totalOnsiteCost = baseMobFee + travelCost + rigHoursCost + perDiemAllowance;

  // 3. Bucket Repair & Hardfacing State
  const [bucketCapacityM3, setBucketCapacityM3] = useState<number>(3.5);
  const [numEarsToRebuild, setNumEarsToRebuild] = useState<number>(2);
  const [hardfacingAreaM2, setHardfacingAreaM2] = useState<number>(2.5);
  const [earRebuildCostPerUnit, setEarRebuildCostPerUnit] = useState<number>(420);
  const [hardfacingRatePerM2, setHardfacingRatePerM2] = useState<number>(290);
  const [baseBucketPrep, setBaseBucketPrep] = useState<number>(380);

  const totalBucketRepairCost =
    baseBucketPrep +
    numEarsToRebuild * earRebuildCostPerUnit +
    hardfacingAreaM2 * hardfacingRatePerM2;

  // 4. Cutting Edge Replacement State
  const [edgeLengthMeters, setEdgeLengthMeters] = useState<number>(3.2);
  const [edgeThicknessMm, setEdgeThicknessMm] = useState<number>(35);
  const [steelGrade, setSteelGrade] = useState<'Hardox 450' | 'Hardox 500' | 'Hardox 600'>('Hardox 500');
  const [weldingHoursCuttingEdge, setWeldingHoursCuttingEdge] = useState<number>(8);

  const steelMultiplier = steelGrade === 'Hardox 600' ? 1.3 : steelGrade === 'Hardox 500' ? 1.15 : 1.0;
  const baseBladeCostPerMeter = 480 * steelMultiplier;
  const bladeMaterialTotal = Math.round(edgeLengthMeters * baseBladeCostPerMeter * 100) / 100;
  const prepGougeCost = 280;
  const weldLaborTotal = weldingHoursCuttingEdge * 95;
  const totalCuttingEdgeCost = Math.round(bladeMaterialTotal + prepGougeCost + weldLaborTotal);

  // 5. CO2 Welding & Consumable Heat Input
  const [weldAmps, setWeldAmps] = useState<number>(280);
  const [weldVolts, setWeldVolts] = useState<number>(29);
  const [travelSpeedMmMin, setTravelSpeedMmMin] = useState<number>(250);
  const [arcEfficiency, setArcEfficiency] = useState<number>(0.85); // MAG / Flux-core
  const [welderHours, setWelderHours] = useState<number>(14);
  const [wireSpoolsKg, setWireSpoolsKg] = useState<number>(45);

  const heatInputKjMm =
    travelSpeedMmMin > 0
      ? Math.round(((weldVolts * weldAmps * 60) / (travelSpeedMmMin * 1000)) * arcEfficiency * 100) / 100
      : 0;
  const totalWeldingCost = Math.round(welderHours * 95 + wireSpoolsKg * 5.8 + 150);

  // 6. Industrial Gearbox Overhaul Cost
  const [gearboxKw, setGearboxKw] = useState<number>(132); // kW motor rating
  const [housingBoresToReclaim, setHousingBoresToReclaim] = useState<number>(2);
  const [bearingSealKitTier, setBearingSealKitTier] = useState<number>(1450);

  const teardownNDT = 650;
  const boreReclaimCost = housingBoresToReclaim * 850;
  const spinTestAlign = 720;
  const totalGearboxCost = teardownNDT + boreReclaimCost + bearingSealKitTier + spinTestAlign;

  // 7. New Bucket Fabrication
  const [newCapM3, setNewCapM3] = useState<number>(4.0);
  const [bucketTypeDuty, setBucketTypeDuty] = useState<'Heavy Duty Rock' | 'Severe Duty Extreme' | 'Coal Loading'>('Heavy Duty Rock');
  const [includeWearPackage, setIncludeWearPackage] = useState<boolean>(true);

  const ratePerM3 = bucketTypeDuty === 'Severe Duty Extreme' ? 2800 : bucketTypeDuty === 'Heavy Duty Rock' ? 2400 : 1900;
  const totalNewBucketCost =
    Math.round(newCapM3 * ratePerM3) +
    950 + // Ear boring
    (includeWearPackage ? 1450 : 0);

  const calculators = [
    { id: 'line_boring', name: 'Line Boring Machining', icon: Wrench },
    { id: 'onsite_rig', name: 'Onsite Rig Mobilization', icon: Truck },
    { id: 'bucket_wear', name: 'Bucket Repair & Hardfacing', icon: HardHat },
    { id: 'cutting_edge', name: 'Cutting Edge Sizing', icon: Scissors },
    { id: 'co2_welding', name: 'CO2 Welding & Heat Input', icon: Flame },
    { id: 'gearbox', name: 'Industrial Gearbox Overhaul', icon: Cog },
    { id: 'new_bucket', name: 'New Bucket Fabrication', icon: Box }
  ] as const;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-industrial text-white tracking-wide">
              ENGINEERING & PRICING FORMULAS HUB
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Live mathematical and metallurgical formula calculators for all 7 LBF Solutions services. Directly push any calculation into an automated invoice.
            </p>
          </div>
        </div>

        {/* Calculator Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2 mt-4 sm:mt-5">
          {calculators.map((c) => {
            const Icon = c.icon;
            const isActive = activeCalculator === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCalculator(c.id as any)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700 hover:bg-stone-800/80'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-stone-950' : 'text-amber-400'}`} />
                <span className="text-xs leading-tight">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CALCULATOR 1: LINE BORING SPEED & FEED */}
      {activeCalculator === 'line_boring' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-industrial text-white">
                Line Boring Machining Speed, Feed & Cost Formula
              </h3>
            </div>
            <span className="text-xs font-mono bg-stone-950 px-2.5 py-1 rounded text-amber-400 border border-stone-800 self-start sm:self-auto">
              RPM = (Vc &times; 1000) / (&pi; &times; D)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Bore Diameter (mm):</label>
                  <input
                    type="number"
                    value={boreDiameter}
                    onChange={(e) => setBoreDiameter(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Bore Length (mm):</label>
                  <input
                    type="number"
                    value={boreLength}
                    onChange={(e) => setBoreLength(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Number of Bores:</label>
                  <input
                    type="number"
                    value={numBores}
                    onChange={(e) => setNumBores(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Cutting Surface Speed Vc (m/min):</label>
                  <input
                    type="number"
                    value={surfaceSpeed}
                    onChange={(e) => setSurfaceSpeed(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Feed Rate (mm/rev):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={feedPerRev}
                    onChange={(e) => setFeedPerRev(parseFloat(e.target.value) || 0.01)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Machining Hourly Rate ($/hr):</label>
                  <input
                    type="number"
                    value={hourlyBoreRate}
                    onChange={(e) => setHourlyBoreRate(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* Live Calculated Output */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  Machining Metrics:
                </h4>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Calculated Spindle Speed (RPM):</span>
                  <span className="font-mono font-bold text-white">{rpm} RPM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Linear Feed Rate:</span>
                  <span className="font-mono font-bold text-white">{feedSpeed} mm/min</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Pass Cut Time per Bore:</span>
                  <span className="font-mono font-bold text-white">{timePerPassMin} minutes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Estimated Total Machining Hours:</span>
                  <span className="font-mono font-bold text-emerald-400">{estimatedMachiningHours} hrs</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-base font-bold">
                  <span className="text-stone-200">TOTAL LINE BORING ESTIMATE:</span>
                  <span className="font-mono text-2xl text-amber-400">${totalLineBoringCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSendToInvoice(
                    `Line Boring & Machining (${numBores} Bores @ ${boreDiameter}mm dia x ${boreLength}mm length)`,
                    totalLineBoringCost,
                    `Formula: (${estimatedMachiningHours} hrs * $${hourlyBoreRate}/hr)`
                  )
                }
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export Calculation to Automated Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 2: ONSITE RIG MOBILIZATION */}
      {activeCalculator === 'onsite_rig' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-industrial text-white">
                Onsite Mobile Rig Mobilization & Field Rate Formula
              </h3>
            </div>
            <span className="text-xs font-mono bg-stone-950 px-2.5 py-1 rounded text-amber-400 border border-stone-800 self-start sm:self-auto">
              Total = Base + (km &times; $2.50) + (RigHrs &times; $185) + Allowance
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Mine Site Distance (Roundtrip km):</label>
                  <input
                    type="number"
                    value={travelDistanceKm}
                    onChange={(e) => setTravelDistanceKm(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Travel Rate per km ($):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kmRate}
                    onChange={(e) => setKmRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Base Rig Mobilization ($):</label>
                  <input
                    type="number"
                    value={baseMobFee}
                    onChange={(e) => setBaseMobFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Onsite Rig Machining Hours:</label>
                  <input
                    type="number"
                    value={onsiteRigHours}
                    onChange={(e) => setOnsiteRigHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Rig Hourly Rate ($/hr):</label>
                  <input
                    type="number"
                    value={rigHourlyRate}
                    onChange={(e) => setRigHourlyRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Site Safety & Per Diem ($):</label>
                  <input
                    type="number"
                    value={perDiemAllowance}
                    onChange={(e) => setPerDiemAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  Cost Breakdown:
                </h4>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Base Mobilization (4x4 & 35kVA Gen):</span>
                  <span className="font-mono font-bold text-white">${baseMobFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Mileage Allowance ({travelDistanceKm}km @ ${kmRate}/km):</span>
                  <span className="font-mono font-bold text-white">${travelCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Field Rig Labor ({onsiteRigHours} hrs @ ${rigHourlyRate}/hr):</span>
                  <span className="font-mono font-bold text-white">${rigHoursCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Site Compliance & Per Diem:</span>
                  <span className="font-mono font-bold text-white">${perDiemAllowance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-base font-bold">
                  <span className="text-stone-200">TOTAL ONSITE COST:</span>
                  <span className="font-mono text-2xl text-amber-400">${totalOnsiteCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSendToInvoice(
                    `Onsite Mobile Lineboring Deployment (${onsiteRigHours} hrs onsite, ${travelDistanceKm}km distance)`,
                    totalOnsiteCost,
                    `Formula: $${baseMobFee} base + (${travelDistanceKm}km * $${kmRate}) + (${onsiteRigHours}hrs * $${rigHourlyRate})`
                  )
                }
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export Calculation to Automated Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 3: BUCKET REPAIR & HARDFACING */}
      {activeCalculator === 'bucket_wear' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-industrial text-white">
                Bucket Repair, Re-bushing & Hardfacing Estimator
              </h3>
            </div>
            <span className="text-xs font-mono bg-stone-950 px-2.5 py-1 rounded text-amber-400 border border-stone-800 self-start sm:self-auto">
              Prep + (Ears &times; $420) + (Hardfacing m&sup2; &times; $290)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 mb-1">Bucket Capacity (m³):</label>
                <input
                  type="number"
                  step="0.1"
                  value={bucketCapacityM3}
                  onChange={(e) => setBucketCapacityM3(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Bucket Hinge Ears to Line Bore / Rebuild:</label>
                <input
                  type="number"
                  value={numEarsToRebuild}
                  onChange={(e) => setNumEarsToRebuild(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Hardfacing Area (m² overlay):</label>
                <input
                  type="number"
                  step="0.1"
                  value={hardfacingAreaM2}
                  onChange={(e) => setHardfacingAreaM2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                />
              </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  Repair Package Breakdown:
                </h4>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Arc-Air Gouging & Crack Prep:</span>
                  <span className="font-mono font-bold text-white">${baseBucketPrep.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Hinge Ear Machining ({numEarsToRebuild} ears):</span>
                  <span className="font-mono font-bold text-white">${(numEarsToRebuild * earRebuildCostPerUnit).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Chromium Hardfacing ({hardfacingAreaM2} m²):</span>
                  <span className="font-mono font-bold text-white">${(hardfacingAreaM2 * hardfacingRatePerM2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-base font-bold">
                  <span className="text-stone-200">TOTAL BUCKET REPAIR:</span>
                  <span className="font-mono text-2xl text-amber-400">${totalBucketRepairCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSendToInvoice(
                    `Bucket Rebuild & Hardfacing (${bucketCapacityM3}m³ bucket, ${numEarsToRebuild} ear bores, ${hardfacingAreaM2}m² hardfacing)`,
                    totalBucketRepairCost,
                    `Formula: Prep + (${numEarsToRebuild} ears * $${earRebuildCostPerUnit}) + (${hardfacingAreaM2}m² * $${hardfacingRatePerM2})`
                  )
                }
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export Calculation to Automated Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 4: CUTTING EDGE REPLACEMENT */}
      {activeCalculator === 'cutting_edge' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-industrial text-white">
                Hardox Cutting Edge Sizing & Replacement Formula
              </h3>
            </div>
            <span className="text-xs font-mono bg-stone-950 px-2.5 py-1 rounded text-amber-400 border border-stone-800 self-start sm:self-auto">
              Length &times; Steel Grade Rate + Gouging + Weld Hours
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Blade Length (meters):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={edgeLengthMeters}
                    onChange={(e) => setEdgeLengthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Edge Thickness (mm):</label>
                  <input
                    type="number"
                    value={edgeThicknessMm}
                    onChange={(e) => setEdgeThicknessMm(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Wear Steel Grade:</label>
                  <select
                    value={steelGrade}
                    onChange={(e) => setSteelGrade(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200"
                  >
                    <option value="Hardox 450">Hardox 450 (Standard Wear)</option>
                    <option value="Hardox 500">Hardox 500 (High Abrasion)</option>
                    <option value="Hardox 600">Hardox 600 (Extreme Abrasion)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">CO2 Full Penetration Weld Hours:</label>
                  <input
                    type="number"
                    value={weldingHoursCuttingEdge}
                    onChange={(e) => setWeldingHoursCuttingEdge(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  Cost Breakdown:
                </h4>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">{steelGrade} Blade Profile ({edgeLengthMeters}m @ {edgeThicknessMm}mm):</span>
                  <span className="font-mono font-bold text-white">${bladeMaterialTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Oxy-Acetylene Removal & Bevel Prep:</span>
                  <span className="font-mono font-bold text-white">${prepGougeCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Multi-pass Weld Labor ({weldingHoursCuttingEdge} hrs @ $95/hr):</span>
                  <span className="font-mono font-bold text-white">${weldLaborTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-base font-bold">
                  <span className="text-stone-200">TOTAL CUTTING EDGE REPLACEMENT:</span>
                  <span className="font-mono text-2xl text-amber-400">${totalCuttingEdgeCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSendToInvoice(
                    `Cutting Edge Replacement (${edgeLengthMeters}m ${steelGrade} ${edgeThicknessMm}mm blade, full weld)`,
                    totalCuttingEdgeCost,
                    `Formula: (${edgeLengthMeters}m * $${baseBladeCostPerMeter.toFixed(2)}) + Prep + (${weldingHoursCuttingEdge}hrs * $95)`
                  )
                }
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export Calculation to Automated Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 5: CO2 WELDING & HEAT INPUT */}
      {activeCalculator === 'co2_welding' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-industrial text-white">
                CO2 Welding Heat Input & Consumable Formula
              </h3>
            </div>
            <span className="text-xs font-mono bg-stone-950 px-2.5 py-1 rounded text-amber-400 border border-stone-800 self-start sm:self-auto">
              Q (kJ/mm) = (V &times; A &times; 60) / (TravelSpeed &times; 1000) &times; &eta;
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Welding Current (Amps):</label>
                  <input
                    type="number"
                    value={weldAmps}
                    onChange={(e) => setWeldAmps(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Arc Voltage (Volts):</label>
                  <input
                    type="number"
                    value={weldVolts}
                    onChange={(e) => setWeldVolts(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 mb-1">Travel Speed (mm/min):</label>
                  <input
                    type="number"
                    value={travelSpeedMmMin}
                    onChange={(e) => setTravelSpeedMmMin(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Wire Spool Consumption (kg):</label>
                  <input
                    type="number"
                    value={wireSpoolsKg}
                    onChange={(e) => setWireSpoolsKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Total Coded Welder Hours:</label>
                <input
                  type="number"
                  value={welderHours}
                  onChange={(e) => setWelderHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                />
              </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  Metallurgical Heat & Cost Results:
                </h4>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Calculated Heat Input (kJ/mm):</span>
                  <span className="font-mono font-bold text-emerald-400">{heatInputKjMm} kJ/mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Coded Welder Labor ({welderHours} hrs @ $95/hr):</span>
                  <span className="font-mono font-bold text-white">${(welderHours * 95).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Flux-core Wire ({wireSpoolsKg}kg @ $5.80/kg):</span>
                  <span className="font-mono font-bold text-white">${(wireSpoolsKg * 5.8).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">CO2 / Mixed Gas & NDT Inspection:</span>
                  <span className="font-mono font-bold text-white">$150.00</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-base font-bold">
                  <span className="text-stone-200">TOTAL CO2 WELDING COST:</span>
                  <span className="font-mono text-2xl text-amber-400">${totalWeldingCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSendToInvoice(
                    `CO2 Flux-Core Structural Welding (${welderHours} hrs @ ${heatInputKjMm} kJ/mm heat input, ${wireSpoolsKg}kg wire)`,
                    totalWeldingCost,
                    `Formula: (${welderHours}hrs * $95) + (${wireSpoolsKg}kg * $5.80) + Gas/NDT`
                  )
                }
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export Calculation to Automated Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 6: INDUSTRIAL GEARBOXES */}
      {activeCalculator === 'gearbox' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Cog className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-industrial text-white">
                Industrial Gearbox Reconditioning & Bore Reclamation
              </h3>
            </div>
            <span className="text-xs font-mono bg-stone-950 px-2.5 py-1 rounded text-amber-400 border border-stone-800 self-start sm:self-auto">
              Teardown + (Housing Bores &times; $850) + Kit + Spin Test
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 mb-1">Gearbox Power Rating (kW):</label>
                <input
                  type="number"
                  value={gearboxKw}
                  onChange={(e) => setGearboxKw(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Housing Bearing Pockets to Line Bore & Reclaim:</label>
                <input
                  type="number"
                  value={housingBoresToReclaim}
                  onChange={(e) => setHousingBoresToReclaim(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Bearing & Viton Seal Kit Tier ($):</label>
                <input
                  type="number"
                  value={bearingSealKitTier}
                  onChange={(e) => setBearingSealKitTier(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                />
              </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  Reclamation Stages:
                </h4>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Teardown, Ultrasonic Wash & NDT Test:</span>
                  <span className="font-mono font-bold text-white">${teardownNDT.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Line Boring Housing Pockets ({housingBoresToReclaim} @ $850):</span>
                  <span className="font-mono font-bold text-white">${boreReclaimCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Heavy Bearing & Viton Seal Kit:</span>
                  <span className="font-mono font-bold text-white">${bearingSealKitTier.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Laser Shaft Alignment & 4-hr Spin Test:</span>
                  <span className="font-mono font-bold text-white">${spinTestAlign.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-base font-bold">
                  <span className="text-stone-200">TOTAL GEARBOX OVERHAUL:</span>
                  <span className="font-mono text-2xl text-amber-400">${totalGearboxCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSendToInvoice(
                    `Industrial Gearbox Overhaul (${gearboxKw}kW Drive, ${housingBoresToReclaim} line-bored pockets, spin tested)`,
                    totalGearboxCost,
                    `Formula: Teardown + (${housingBoresToReclaim} * $850) + Kit + Spin Test`
                  )
                }
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export Calculation to Automated Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 7: NEW BUCKET FABRICATION */}
      {activeCalculator === 'new_bucket' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-industrial text-white">
                New Bucket Fabrication Estimator
              </h3>
            </div>
            <span className="text-xs font-mono bg-stone-950 px-2.5 py-1 rounded text-amber-400 border border-stone-800 self-start sm:self-auto">
              (Capacity m&sup3; &times; Steel Factor) + Ear Boring + Wear Package
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 mb-1">Bucket Capacity (m³):</label>
                <input
                  type="number"
                  step="0.5"
                  value={newCapM3}
                  onChange={(e) => setNewCapM3(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 font-mono text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Bucket Duty Class:</label>
                <select
                  value={bucketTypeDuty}
                  onChange={(e) => setBucketTypeDuty(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200"
                >
                  <option value="Heavy Duty Rock">Heavy Duty Rock (HDR) - $2,400/m³</option>
                  <option value="Severe Duty Extreme">Severe Duty Extreme (XSD) - $2,800/m³</option>
                  <option value="Coal Loading">High-Capacity Coal Bucket - $1,900/m³</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="includeWearPkg"
                  checked={includeWearPackage}
                  onChange={(e) => setIncludeWearPackage(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="includeWearPkg" className="text-stone-300">
                  Include Full Hardox Cheek Plates & Heel Shrouds (+$1,450)
                </label>
              </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  Fabrication Breakdown:
                </h4>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Base Shell Fabrication ({newCapM3}m³ @ {bucketTypeDuty}):</span>
                  <span className="font-mono font-bold text-white">${(newCapM3 * ratePerM3).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">Ear Bracket Line Boring & Kinematic Alignment:</span>
                  <span className="font-mono font-bold text-white">$950.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800">
                  <span className="text-stone-400">High-Abrasion Wear Package:</span>
                  <span className="font-mono font-bold text-white">{includeWearPackage ? '$1,450.00' : '$0.00'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-base font-bold">
                  <span className="text-stone-200">TOTAL NEW BUCKET FABRICATION:</span>
                  <span className="font-mono text-2xl text-amber-400">${totalNewBucketCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSendToInvoice(
                    `New Bucket Fabrication (${newCapM3}m³ ${bucketTypeDuty} with precision ear boring)`,
                    totalNewBucketCost,
                    `Formula: (${newCapM3}m³ * $${ratePerM3}) + $950 Ear Boring ${includeWearPackage ? '+ $1450 Wear Package' : ''}`
                  )
                }
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export Calculation to Automated Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
