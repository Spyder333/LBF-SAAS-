import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  Calculator,
  HelpCircle,
  FileDown,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  List,
  Table
} from 'lucide-react';
import { parseExcelFile, exportMatrixToExcel } from '../lib/excel';
import { evaluateFormula, indexToColLetter } from '../lib/formulaEngine';
import { INITIAL_SPREADSHEET_DATA } from '../data/mockData';

interface ExcelManagerProps {
  onCreateInvoiceFromCalculation?: (desc: string, total: number, formula: string) => void;
}

const TEMPLATES: Record<string, (string | number)[][]> = {
  master_rates: INITIAL_SPREADSHEET_DATA,
  bore_tolerances: [
    ['LBF SOLUTIONS - BORE DIMENSION & TOLERANCE INSPECTION LOG', '', '', '', '', ''],
    ['Equipment: CAT 349D Excavator', 'Bore ID: Boom Hinge B1', 'Target Spec: 110.00mm (+0.02 / -0.00)', '', '', ''],
    ['', '', '', '', '', ''],
    ['BORE LOCATION', 'NOMINAL (mm)', 'AS-RECEIVED (mm)', 'POST-WELD BUILDUP (mm)', 'FINAL MACHINED (mm)', 'DEVIATION (mm)'],
    ['Boom Foot Left', '110.00', '111.45', '108.80', '110.01', '=E5-B5'],
    ['Boom Foot Right', '110.00', '111.60', '108.65', '110.00', '=E6-B6'],
    ['Stick Cylinder Ear A', '90.00', '91.20', '88.90', '90.02', '=E7-B7'],
    ['Stick Cylinder Ear B', '90.00', '91.15', '88.85', '90.01', '=E8-B8'],
    ['Bucket Pivot Hinge', '100.00', '101.85', '98.50', '100.02', '=E9-B9'],
    ['', '', '', '', '', ''],
    ['', 'AVERAGE DEVIATION:', '', '', '=AVERAGE(F5:F9)', 'mm'],
    ['', 'MAX OUT OF ROUND:', '', '', '=MAX(F5:F9)', 'mm']
  ],
  gearbox_calc: [
    ['LBF SOLUTIONS - INDUSTRIAL GEARBOX RECLAMATION COSTING', '', '', '', ''],
    ['Job: Metso Nordberg C120 Crusher Reducer', 'Stage: Complete Overhaul', '', '', ''],
    ['', '', '', '', ''],
    ['OPERATION CODE', 'DESCRIPTION', 'HOURS / QTY', 'RATE ($)', 'COST ($)'],
    ['OP-01', 'Teardown, ultrasonic wash & NDT crack inspection', '6', '85', '=C5*D5'],
    ['OP-02', 'Bore pocket buildup welding (CO2 flux-core)', '8', '95', '=C6*D6'],
    ['OP-03', 'Precision boring housing bearing journals (320mm)', '10', '120', '=C7*D7'],
    ['OP-04', 'Shaft journal metallizing / ground reclamation', '5', '110', '=C8*D8'],
    ['PART-05', 'Heavy spherical roller bearings (2 units)', '2', '650', '=C9*D9'],
    ['PART-06', 'Viton lip seal kit & high-temp synthetic lube', '1', '380', '=C10*D10'],
    ['OP-07', 'Laser alignment, gear backlash & 4hr spin test', '6', '95', '=C11*D11'],
    ['', '', '', '', ''],
    ['', '', 'TOTAL RECLAMATION:', '=SUM(E5:E11)', '']
  ],
  bucket_hardox: [
    ['LBF SOLUTIONS - BUCKET HARDOX WEAR PLATE & CUTTING EDGE ESTIMATOR', '', '', '', ''],
    ['Customer: Blackrock Mining', 'Bucket Capacity: 4.5m³ Rock Bucket', '', '', ''],
    ['', '', '', '', ''],
    ['COMPONENT', 'MATERIAL GRADE', 'QTY / DIMENSION', 'UNIT COST ($)', 'TOTAL ($)'],
    ['Base Cutting Edge', 'Hardox 500 (40mm)', '3.4 meters', '580', '=3.4*580'],
    ['Cheek Wear Plates', 'Hardox 450 (20mm)', '2 plates', '420', '=C6*D6'],
    ['Heel Shrouds', 'Cast Alloy Wear Protectors', '5 units', '190', '=C7*D7'],
    ['Side Cutters', 'Hardox 500 Bolt-on Set', '2 sets', '310', '=C8*D8'],
    ['Bottom Wear Strips', 'Hardox 450 (15mm x 150mm)', '6 strips', '180', '=C9*D9'],
    ['Oxy-Gouging & Welder Labor', 'Coded AWS Welder (CO2)', '18 hours', '95', '=18*95'],
    ['', '', '', '', ''],
    ['', '', 'TOTAL OVERHAUL ESTIMATE:', '=SUM(E5:E10)', '']
  ]
};

export const ExcelManager: React.FC<ExcelManagerProps> = ({ onCreateInvoiceFromCalculation }) => {
  const [data, setData] = useState<(string | number)[][]>(INITIAL_SPREADSHEET_DATA);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 4, col: 4 });
  const [formulaInput, setFormulaInput] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('master_rates');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'grid'
  );
  const [excelToast, setExcelToast] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [confirmClearSheet, setConfirmClearSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum rows and columns to display
  const rowCount = Math.max(data.length + 3, 20);
  const colCount = Math.max(data.reduce((max, r) => Math.max(max, r.length), 0) + 2, 8);

  // Function to look up raw cell value
  const getRawValue = (r: number, c: number): string | number => {
    if (r >= 0 && r < data.length && c >= 0 && c < (data[r]?.length || 0)) {
      return data[r][c] ?? '';
    }
    return '';
  };

  // Function to resolve cell value by address (e.g. "A1", "C5")
  const getCellValueByAddr = (addr: string): string | number => {
    const match = addr.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return 0;
    const colStr = match[1];
    const rowNum = parseInt(match[2], 10) - 1; // 1-indexed to 0-indexed

    // Calculate column index
    let colIndex = 0;
    for (let i = 0; i < colStr.length; i++) {
      colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 64);
    }
    colIndex -= 1;

    const raw = getRawValue(rowNum, colIndex);
    if (typeof raw === 'string' && raw.startsWith('=')) {
      return evaluateFormula(raw, getCellValueByAddr);
    }
    return raw;
  };

  // Evaluate displayed cell content
  const getDisplayValue = (r: number, c: number): string | number => {
    const raw = getRawValue(r, c);
    if (typeof raw === 'string' && raw.startsWith('=')) {
      return evaluateFormula(raw, getCellValueByAddr);
    }
    return raw;
  };

  // Sync formula bar input when active cell changes
  useEffect(() => {
    const raw = getRawValue(activeCell.row, activeCell.col);
    setFormulaInput(String(raw));
  }, [activeCell, data]);

  // Update cell value
  const updateCellValue = (r: number, c: number, val: string | number) => {
    const newData = data.map((row) => [...row]);
    while (newData.length <= r) {
      newData.push([]);
    }
    while (newData[r].length <= c) {
      newData[r].push('');
    }
    newData[r][c] = val;
    setData(newData);
  };

  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCellValue(activeCell.row, activeCell.col, formulaInput);
  };

  const handleInsertFunction = (fn: string) => {
    const prefix = formulaInput.startsWith('=') ? formulaInput : '=';
    let insertion = '';
    if (fn === 'SUM') insertion = `${prefix}SUM(A1:A5)`;
    else if (fn === 'AVERAGE') insertion = `${prefix}AVERAGE(A1:A5)`;
    else if (fn === 'MIN') insertion = `${prefix}MIN(A1:A5)`;
    else if (fn === 'MAX') insertion = `${prefix}MAX(A1:A5)`;
    else if (fn === 'IF') insertion = `${prefix}IF(C5>100, C5*0.9, C5)`;
    else if (fn === 'MULTIPLY') insertion = `${prefix}C5*D5`;
    else if (fn === 'TAX') insertion = `${prefix}E12*0.15`;

    setFormulaInput(insertion);
    updateCellValue(activeCell.row, activeCell.col, insertion);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsEvaluating(true);
      const parsed = await parseExcelFile(file);
      setData(parsed.data);
      setActiveCell({ row: 0, col: 0 });
    } catch (err) {
      setExcelToast({ type: 'error', text: 'Failed to parse spreadsheet file: ' + (err as Error).message });
      setTimeout(() => setExcelToast(null), 5000);
    } finally {
      setIsEvaluating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    // Generate calculated grid
    const calculatedGrid: (string | number)[][] = [];
    for (let r = 0; r < data.length; r++) {
      const rowArr: (string | number)[] = [];
      const colLen = data[r]?.length || 0;
      for (let c = 0; c < colLen; c++) {
        const disp = getDisplayValue(r, c);
        rowArr.push(disp);
      }
      calculatedGrid.push(rowArr);
    }
    exportMatrixToExcel(calculatedGrid, `LBF_${selectedTemplate}_Export.xlsx`);
  };

  const handleTemplateChange = (tmplKey: string) => {
    setSelectedTemplate(tmplKey);
    if (TEMPLATES[tmplKey]) {
      setData(TEMPLATES[tmplKey]);
      setActiveCell({ row: 4, col: 4 });
    }
  };

  // Convert current cell result to Invoice Line Item
  const handleSendToInvoice = () => {
    const currentVal = getDisplayValue(activeCell.row, activeCell.col);
    const rawVal = getRawValue(activeCell.row, activeCell.col);
    const num = typeof currentVal === 'number' ? currentVal : parseFloat(String(currentVal).replace(/[$,]/g, ''));
    if (isNaN(num) || num <= 0) {
      setExcelToast({ type: 'error', text: 'Please select a cell containing a valid calculated numeric amount to push to invoice.' });
      setTimeout(() => setExcelToast(null), 4000);
      return;
    }

    const rowDesc = String(getRawValue(activeCell.row, 1) || getRawValue(activeCell.row, 0) || 'Custom Machining / Fabrication');
    const formulaStr = String(rawVal).startsWith('=') ? String(rawVal) : 'Calculated Rate';

    if (onCreateInvoiceFromCalculation) {
      onCreateInvoiceFromCalculation(rowDesc, num, formulaStr);
      setExcelToast({ type: 'success', text: `Calculation "$${num.toFixed(2)}" sent to New Invoice draft!` });
      setTimeout(() => setExcelToast(null), 4000);
    }
  };

  const activeCellCoord = `${indexToColLetter(activeCell.col)}${activeCell.row + 1}`;
  const activeCellDisplay = getDisplayValue(activeCell.row, activeCell.col);

  // Identify headers and card rows for responsive Card View
  const headerRowIndex = data.findIndex((row, idx) => idx >= 2 && row.filter(Boolean).length >= 3);
  const headers = headerRowIndex !== -1 ? data[headerRowIndex].map(String) : [];
  const cardRows = data
    .map((row, rIdx) => ({ row, rIdx }))
    .filter(({ row, rIdx }) => {
      if (rIdx <= (headerRowIndex !== -1 ? headerRowIndex : 2)) return false;
      return row.some((c) => String(c).trim() !== '');
    });

  return (
    <div className="space-y-6">
      
      {/* Excel Notification Toast */}
      {excelToast && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg transition-all ${
          excelToast.type === 'error'
            ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            : excelToast.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-stone-900 border-amber-500/40 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{excelToast.text}</span>
          </div>
          <button
            onClick={() => setExcelToast(null)}
            className="text-stone-400 hover:text-white p-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Controls & Toolbar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-industrial text-white tracking-wide">
                EXCEL SPREADSHEET & FORMULA WORKBOOK
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Live spreadsheet grid with formula calculations (=SUM, =AVERAGE, =IF, math), XLSX import/export, and industrial templates.
            </p>
          </div>

          {/* Action Buttons - Consolidated Clusters */}
          <div className="flex flex-wrap items-center gap-2.5 justify-end">
            {/* Cluster 1: View Toggle & Template Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
                <button
                  type="button"
                  id="excel-view-grid-btn"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Spreadsheet Table Grid"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  id="excel-view-cards-btn"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Mobile Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              {/* Template Selector */}
              <select
                id="spreadsheet-template-select"
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer max-w-[210px] truncate"
              >
                <option value="master_rates">Master Rates &amp; Costing</option>
                <option value="bore_tolerances">Bore Tolerance Log</option>
                <option value="gearbox_calc">Gearbox Overhaul</option>
                <option value="bucket_hardox">Hardox &amp; Cutting Edges</option>
              </select>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            {/* Cluster 2: Segmented File Import & Export Control */}
            <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                id="upload-excel-file-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Import Excel or CSV file"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Import</span>
              </button>
              <button
                id="download-excel-btn"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 transition-colors cursor-pointer"
                title="Download spreadsheet as .XLSX"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .XLSX</span>
              </button>
            </div>

            {/* Cluster 3: Primary Action (Push to Invoice) */}
            {onCreateInvoiceFromCalculation && (
              <button
                id="send-cell-to-invoice-btn"
                onClick={handleSendToInvoice}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                title="Send selected cell's calculated value into a new invoice"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Send to Invoice</span>
              </button>
            )}
          </div>
        </div>

        {/* Formula Bar & Function Quick Insert */}
        <div className="mt-4 pt-4 border-t border-stone-800">
          <form onSubmit={handleFormulaSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            
            {/* Active Cell Address Pill */}
            <div className="flex items-center gap-2 bg-stone-950 border border-stone-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-amber-400 min-w-[70px] justify-center">
              <span>{activeCellCoord}</span>
            </div>

            {/* Formula Input Box */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-stone-500 font-mono text-xs font-bold">
                fx
              </span>
              <input
                id="spreadsheet-formula-input"
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                placeholder="Enter text, number, or formula (e.g. =SUM(C5:C10) or =C5*D5 or =IF(C5>100, 50, 0))"
                className="w-full bg-stone-950 border border-stone-700 pl-8 pr-4 py-2 rounded-lg text-xs font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold border border-stone-600 transition-colors"
            >
              Apply Cell
            </button>
          </form>

          {/* Quick Formula Helper Buttons - horizontal scroll on mobile */}
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] overflow-x-auto pb-1">
            <span className="text-stone-500 font-medium mr-1 flex items-center gap-1 shrink-0">
              <Calculator className="w-3 h-3 text-amber-500" /> Formulas:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { label: 'SUM()', fn: 'SUM' },
                { label: 'AVERAGE()', fn: 'AVERAGE' },
                { label: 'MULTIPLY (*)', fn: 'MULTIPLY' },
                { label: 'TAX 15%', fn: 'TAX' },
                { label: 'MAX()', fn: 'MAX' },
                { label: 'MIN()', fn: 'MIN' },
                { label: 'IF()', fn: 'IF' }
              ].map((f) => (
                <button
                  key={f.fn}
                  type="button"
                  onClick={() => handleInsertFunction(f.fn)}
                  className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white rounded font-mono text-[11px] transition-colors whitespace-nowrap"
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-stone-400 font-mono text-xs flex items-center gap-1.5 shrink-0 pl-2">
              <span className="text-stone-500 hidden sm:inline">Evaluated:</span>
              <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                {String(activeCellDisplay)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Spreadsheet View (Cards vs Grid) */}
      {viewMode === 'cards' ? (
        <div className="space-y-4">
          {/* Mobile Sheet Info Banner */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-white text-sm">
                  {String(data[0]?.[0] || selectedTemplate.toUpperCase())}
                </span>
              </div>
              {data[1]?.[0] && (
                <p className="text-xs text-stone-400 mt-1">{String(data[1][0])}</p>
              )}
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] text-amber-400 font-mono bg-stone-950 px-2.5 py-1 rounded border border-stone-800">
                {cardRows.length} Line Items
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cardRows.map(({ row, rIdx }) => {
              const isTotalRow = row.some(
                (c) =>
                  String(c).toUpperCase().includes('TOTAL') ||
                  (typeof c === 'string' && c.toUpperCase().includes('SUM')) ||
                  String(c).toUpperCase().includes('AVERAGE')
              );
              const title = String(row[1] || row[0] || `Row #${rIdx + 1}`);

              if (isTotalRow) {
                // Find total amount
                const numericCell = row
                  .map((_, cIdx) => getDisplayValue(rIdx, cIdx))
                  .find((val) => typeof val === 'number' || (!isNaN(parseFloat(String(val))) && String(val).includes('$')));

                return (
                  <div
                    key={rIdx}
                    className="col-span-1 md:col-span-2 bg-gradient-to-r from-amber-500/10 via-stone-900 to-emerald-500/10 border-2 border-amber-500/40 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Sheet Summary & Total</span>
                      <h4 className="text-base font-bold font-industrial text-white mt-0.5">{title}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      {numericCell !== undefined && (
                        <span className="text-2xl font-bold font-mono text-amber-400">
                          {typeof numericCell === 'number' ? `$${numericCell.toFixed(2)}` : String(numericCell)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={rIdx}
                  className={`bg-stone-900 border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all ${
                    activeCell.row === rIdx ? 'border-amber-500/70 shadow-amber-500/5' : 'border-stone-800'
                  }`}
                >
                  <div>
                    {/* Card Title & Row Badge */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-800">
                      <div>
                        <span className="text-[10px] font-mono text-stone-500 bg-stone-950 px-2 py-0.5 rounded border border-stone-800 mr-2">
                          Row {rIdx + 1}
                        </span>
                        <span className="font-bold text-sm text-stone-100">{title}</span>
                      </div>
                    </div>

                    {/* Columns Subgrid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                      {row.map((val, cIdx) => {
                        if (!val && val !== 0) return null;
                        const colLabel = headers[cIdx] || `Col ${indexToColLetter(cIdx)}`;
                        const displayVal = getDisplayValue(rIdx, cIdx);
                        const rawVal = getRawValue(rIdx, cIdx);
                        const hasFormula = typeof rawVal === 'string' && rawVal.startsWith('=');
                        const isCellSelected = activeCell.row === rIdx && activeCell.col === cIdx;

                        return (
                          <div
                            key={cIdx}
                            onClick={() => setActiveCell({ row: rIdx, col: cIdx })}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              isCellSelected
                                ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                                : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                            }`}
                          >
                            <p className="text-[10px] text-stone-500 truncate">{colLabel}</p>
                            <p className={`font-mono font-medium truncate mt-0.5 ${hasFormula ? 'text-emerald-400 font-bold' : 'text-stone-200'}`}>
                              {String(displayVal)}
                            </p>
                            {hasFormula && (
                              <span className="text-[9px] text-stone-500 font-mono block truncate mt-0.5">{rawVal}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-800/80 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveCell({ row: rIdx, col: 0 })}
                      className="px-2.5 py-1 text-[11px] bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                    >
                      Focus Cell
                    </button>
                    {onCreateInvoiceFromCalculation && (
                      <button
                        type="button"
                        onClick={() => {
                          // Find last numeric column or formula column
                          let targetCol = row.length - 1;
                          while (targetCol >= 0) {
                            const disp = getDisplayValue(rIdx, targetCol);
                            const num = typeof disp === 'number' ? disp : parseFloat(String(disp).replace(/[$,]/g, ''));
                            if (!isNaN(num) && num > 0) {
                              onCreateInvoiceFromCalculation(
                                String(row[1] || row[0] || 'Machining & Fabrication'),
                                num,
                                String(getRawValue(rIdx, targetCol))
                              );
                              return;
                            }
                            targetCol--;
                          }
                          setExcelToast({ type: 'error', text: 'No valid numeric calculation found in this row.' });
                          setTimeout(() => setExcelToast(null), 4000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-stone-950 rounded-lg font-bold border border-amber-500/30 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> Push to Invoice
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card View Actions Footer */}
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between text-xs">
            <button
              onClick={() => {
                const newData = [...data, []];
                setData(newData);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Row
            </button>
            {confirmClearSheet ? (
              <div className="flex items-center gap-1.5 bg-rose-950/80 px-2 py-1 rounded-xl border border-rose-600">
                <span className="text-[11px] text-rose-300">Clear sheet?</span>
                <button
                  onClick={() => {
                    setData([['']]);
                    setConfirmClearSheet(false);
                  }}
                  className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setConfirmClearSheet(false)}
                  className="text-[10px] text-stone-400 hover:text-white px-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearSheet(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 rounded-xl text-xs transition-colors border border-red-900/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Sheet
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Spreadsheet Header Info */}
          <div className="px-4 py-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-stone-300">Active Sheet: {selectedTemplate.toUpperCase()}</span>
            </div>
            <span className="text-stone-500 text-[11px]">
              Click any cell to edit &bull; Press Enter or Apply Cell to calculate formulas
            </span>
          </div>

          {/* The Grid Table - Expanded Height for Desktop Computer Monitors */}
          <div className="overflow-x-auto h-[calc(100vh-270px)] min-h-[520px] max-h-[850px] overflow-y-auto">
            <table className="w-full border-collapse text-xs select-none">
              {/* Column Headers (A, B, C...) */}
              <thead className="sticky top-0 z-20 bg-stone-950 shadow">
                <tr>
                  <th className="w-12 py-2 px-2 border-r border-b border-stone-800 bg-stone-950 text-stone-500 font-mono text-center font-semibold">
                    #
                  </th>
                  {Array.from({ length: colCount }).map((_, cIdx) => (
                    <th
                      key={cIdx}
                      className={`min-w-[140px] py-2 px-3 border-r border-b border-stone-800 text-center font-mono text-xs font-bold transition-colors ${
                        activeCell.col === cIdx
                          ? 'bg-amber-500/20 text-amber-400 border-b-amber-500/50'
                          : 'text-stone-400 bg-stone-950'
                      }`}
                    >
                      {indexToColLetter(cIdx)}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Rows & Cells */}
              <tbody className="divide-y divide-stone-800 font-mono">
                {Array.from({ length: rowCount }).map((_, rIdx) => {
                  const isCurrentRow = activeCell.row === rIdx;
                  return (
                    <tr key={rIdx} className="hover:bg-stone-800/40">
                      {/* Row Index Number */}
                      <td
                        className={`py-1.5 px-2 border-r border-stone-800 text-center font-mono text-[11px] font-semibold sticky left-0 z-10 ${
                          isCurrentRow
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-stone-950 text-stone-500'
                        }`}
                      >
                        {rIdx + 1}
                      </td>

                      {/* Data Cells */}
                      {Array.from({ length: colCount }).map((_, cIdx) => {
                        const isSelected = activeCell.row === rIdx && activeCell.col === cIdx;
                        const raw = getRawValue(rIdx, cIdx);
                        const display = getDisplayValue(rIdx, cIdx);
                        const hasFormula = typeof raw === 'string' && raw.startsWith('=');
                        const isHeaderRow = rIdx === 0 || rIdx === 3;

                        return (
                          <td
                            key={cIdx}
                            id={`cell-${indexToColLetter(cIdx)}${rIdx + 1}`}
                            onClick={() => setActiveCell({ row: rIdx, col: cIdx })}
                            className={`py-1.5 px-3 border-r border-stone-800/80 cursor-cell truncate transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 ring-2 ring-amber-400 text-white font-medium z-10'
                                : isHeaderRow && String(display).length > 0
                                ? 'font-semibold text-amber-300 bg-stone-800/40'
                                : hasFormula
                                ? 'text-emerald-300 font-medium bg-emerald-950/10'
                                : 'text-stone-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{String(display)}</span>
                              {hasFormula && !isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Formula Cell"></span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sheet Footer Status */}
          <div className="p-3 bg-stone-950 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-400 gap-2">
            <div className="flex items-center gap-4">
              <span>Cell: <strong className="text-amber-400 font-mono">{activeCellCoord}</strong></span>
              <span>Raw Value: <code className="text-stone-300 font-mono">{String(getRawValue(activeCell.row, activeCell.col)) || '(empty)'}</code></span>
              <span>Formula Calculated: <strong className="text-emerald-400 font-mono">{String(activeCellDisplay)}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newData = [...data, []];
                  setData(newData);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Row
              </button>
              {confirmClearSheet ? (
                <div className="flex items-center gap-1.5 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-600">
                  <span className="text-[10px] text-rose-300">Clear sheet?</span>
                  <button
                    onClick={() => {
                      setData([['']]);
                      setConfirmClearSheet(false);
                    }}
                    className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClearSheet(false)}
                    className="text-[10px] text-stone-400 hover:text-white px-1 cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearSheet(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-950/40 hover:bg-red-900/50 text-red-300 rounded text-xs transition-colors border border-red-900/50 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
