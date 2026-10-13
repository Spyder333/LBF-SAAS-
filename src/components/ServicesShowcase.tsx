import React from 'react';
import {
  Wrench,
  Truck,
  HardHat,
  Scissors,
  Flame,
  Cog,
  Box,
  Check,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Clock,
  Zap
} from 'lucide-react';
import { LBF_SERVICES } from '../data/mockData';
import { ServiceCategory } from '../types';

interface ServicesShowcaseProps {
  onSelectServiceToInvoice: (serviceId: ServiceCategory) => void;
  onOpenFormulaCalculator: () => void;
}

export const ServicesShowcase: React.FC<ServicesShowcaseProps> = ({
  onSelectServiceToInvoice,
  onOpenFormulaCalculator
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench':
        return <Wrench className="w-6 h-6 text-amber-400" />;
      case 'Truck':
        return <Truck className="w-6 h-6 text-amber-400" />;
      case 'HardHat':
        return <HardHat className="w-6 h-6 text-amber-400" />;
      case 'Scissors':
        return <Scissors className="w-6 h-6 text-amber-400" />;
      case 'Flame':
        return <Flame className="w-6 h-6 text-amber-400" />;
      case 'Cog':
        return <Cog className="w-6 h-6 text-amber-400" />;
      case 'Box':
        return <Box className="w-6 h-6 text-amber-400" />;
      default:
        return <Wrench className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-xs border border-amber-500/20 font-bold">
              7 CORE CAPABILITIES
            </span>
            <span className="text-xs text-stone-400">&bull; Mining, Earthmoving & Industrial Plants</span>
          </div>
          <h2 className="text-2xl font-bold font-industrial text-white tracking-wide mt-1">
            LBF SOLUTIONS &bull; HARARE WORKSHOP HQ
          </h2>
          <p className="text-xs text-amber-400 font-semibold mt-0.5">
            Repair your buckets with us &bull; Lineboring and Fabrication solutions
          </p>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Carlton Road, Harare, Zimbabwe, 17032 &bull; Tel: 077 900 4626 &bull; WhatsApp: +263 77 900 4626.
            Precision line boring, excavator bucket rebuilds, Hardox cutting edges, and mobile field rig services.
          </p>
        </div>

        <button
          onClick={onOpenFormulaCalculator}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold border border-stone-700 transition-colors whitespace-nowrap"
        >
          <Calculator className="w-4 h-4 text-amber-400" />
          <span>Launch Formula Calculators</span>
        </button>
      </div>

      {/* The 7 Services Grid - Optimized for High-Resolution Computer Displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {LBF_SERVICES.map((s, idx) => (
          <div
            key={s.id}
            id={`service-card-${s.id}`}
            className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all group"
          >
            <div>
              {/* Header with Roman numeral & Icon */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {getIcon(s.icon)}
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded bg-stone-950 border border-stone-800">
                    Service {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][idx]}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-1.5 justify-end">
                    <Clock className="w-3 h-3 text-stone-500" />
                    <span>{s.typicalTurnaround}</span>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold font-industrial text-white group-hover:text-amber-400 transition-colors">
                {s.name}
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                {s.fullDesc}
              </p>

              {/* Rate & Formula Formula Pill */}
              <div className="mt-4 p-3 bg-stone-950 rounded-xl border border-stone-800">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Base Unit Rate</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    ${s.defaultRate}{' '}
                    <span className="text-[10px] text-stone-500 font-sans font-normal">
                      {s.standardRateUnit}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-stone-800/80">
                  <p className="text-[10px] text-amber-400/90 font-mono truncate" title={s.formulaTemplate}>
                    fx: {s.formulaTemplate}
                  </p>
                </div>
              </div>

              {/* Key Specifications Bullet points */}
              <div className="mt-4 space-y-1.5">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Technical Specifications:
                </p>
                {s.specifications.map((spec, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-2 text-xs text-stone-300">
                    <Check className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <span className="leading-tight">{spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Action */}
            <div className="mt-6 pt-4 border-t border-stone-800">
              <button
                id={`quote-service-${s.id}`}
                onClick={() => onSelectServiceToInvoice(s.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-stone-950 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <span>Create Invoice with Formulas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
