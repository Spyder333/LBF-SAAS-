import * as XLSX from 'xlsx';
import { Customer, Invoice } from '../types';

/**
 * Export Invoices to Excel with formatted headers and auto-calculations
 */
export function exportInvoicesToExcel(invoices: Invoice[], fileName: string = 'LBF_Solutions_Invoices.xlsx') {
  const rows: any[] = [];

  invoices.forEach((inv) => {
    inv.items.forEach((item, idx) => {
      rows.push({
        'Invoice #': inv.invoiceNumber,
        'Date': inv.date,
        'Due Date': inv.dueDate,
        'Customer': inv.customerName,
        'Equipment': inv.equipmentInfo || 'N/A',
        'Service Type': inv.serviceCategory,
        'Item #': idx + 1,
        'Description': item.description,
        'Quantity': item.quantity,
        'Unit': item.unit,
        'Unit Price ($)': item.unitPrice,
        'Formula Used': item.formulaUsed || '',
        'Line Total ($)': item.total,
        'Subtotal ($)': idx === 0 ? inv.subtotal : '',
        'Tax 15% ($)': idx === 0 ? inv.taxAmount : '',
        'Discount ($)': idx === 0 ? inv.discountAmount : '',
        'Invoice Total ($)': idx === 0 ? inv.total : '',
        'Paid ($)': idx === 0 ? inv.depositPaid : '',
        'Balance Due ($)': idx === 0 ? inv.balanceDue : '',
        'Status': inv.status.toUpperCase()
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LBF Invoices');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Single Detailed Invoice with Line Items and Formulas to Excel
 */
export function exportSingleInvoiceToExcel(invoice: Invoice) {
  const wsData: any[][] = [
    ['LINE BORING FABRICATION (LBF) SOLUTIONS - TAX INVOICE'],
    ['Engineering, Line Boring, Bucket Rebuilds & Heavy Gearbox Reclamation'],
    [''],
    ['Invoice Number:', invoice.invoiceNumber, '', 'Date:', invoice.date],
    ['Due Date:', invoice.dueDate, '', 'Status:', invoice.status.toUpperCase()],
    ['Customer:', invoice.customerName, '', 'VAT / Tax No:', invoice.customerTaxNumber || 'N/A'],
    ['Address:', invoice.customerAddress, '', 'Email:', invoice.customerEmail],
    ['Equipment:', invoice.equipmentInfo || 'Standard Equipment'],
    [''],
    ['ITEM #', 'DESCRIPTION', 'QTY', 'UNIT', 'RATE ($)', 'FORMULA APPLIED', 'TOTAL ($)']
  ];

  invoice.items.forEach((it, i) => {
    wsData.push([
      i + 1,
      it.description,
      it.quantity,
      it.unit,
      it.unitPrice,
      it.formulaUsed || 'Direct Rate',
      it.total
    ]);
  });

  wsData.push(
    [''],
    ['', '', '', '', 'Subtotal:', '', invoice.subtotal],
    ['', '', '', '', `Discount (${(invoice.discountRate * 100).toFixed(0)}%):`, '', -invoice.discountAmount],
    ['', '', '', '', `Tax / VAT (${(invoice.taxRate * 100).toFixed(0)}%):`, '', invoice.taxAmount],
    ['', '', '', '', 'Grand Total:', '', invoice.total],
    ['', '', '', '', 'Deposit Paid:', '', invoice.depositPaid],
    ['', '', '', '', 'BALANCE DUE:', '', invoice.balanceDue],
    [''],
    ['Payment Terms:', invoice.terms || 'Strictly 14 days from completion.'],
    ['Notes:', invoice.notes || 'All line boring and welding inspected to standard tolerances.']
  );

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, invoice.invoiceNumber);
  XLSX.writeFile(wb, `${invoice.invoiceNumber}_LBF_Invoice.xlsx`);
}

/**
 * Export Customer Database to Excel
 */
export function exportCustomersToExcel(customers: Customer[], fileName: string = 'LBF_Customer_Fleet_Database.xlsx') {
  const rows = customers.map((c) => ({
    'Customer ID': c.id,
    'Company Name': c.companyName,
    'Contact Person': c.contactPerson,
    'Email': c.email,
    'Phone': c.phone,
    'Address': c.address,
    'City': c.city,
    'Tax Number': c.taxNumber || 'N/A',
    'Total Fleet Units': c.equipmentFleet.length,
    'Fleet Machines': c.equipmentFleet.map((e) => `${e.make} ${e.model} (${e.type})`).join('; '),
    'Outstanding Balance ($)': c.balanceDue,
    'Customer Notes': c.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers & Fleets');
  XLSX.writeFile(wb, fileName);
}

/**
 * Export 2D Matrix Grid to Excel
 */
export function exportMatrixToExcel(data: (string | number)[][], fileName: string = 'LBF_Spreadsheet_Export.xlsx') {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, fileName);
}

/**
 * Parse uploaded Excel or CSV file into 2D array
 */
export async function parseExcelFile(file: File): Promise<{ sheetNames: string[]; data: (string | number)[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as (string | number)[][];

        resolve({
          sheetNames: workbook.SheetNames,
          data: jsonData
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
