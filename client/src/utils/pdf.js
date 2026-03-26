import jsPDF from 'jspdf';

const BRAND_COLOR = [30, 58, 95]; // #1e3a5f
const LIGHT_GRAY = [241, 245, 249];
const DARK_TEXT = [15, 23, 42];
const SUBTLE_TEXT = [100, 116, 139];
const WHITE = [255, 255, 255];

async function loadLogoAsDataURL() {
  try {
    const res = await fetch('/logo.svg');
    const svgText = await res.text();
    // Keep logo white — it sits on the dark brand-color header
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      img.onload = () => {
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 162;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    });
  } catch {
    return null;
  }
}

async function loadImageAsDataURL(path) {
  try {
    const res = await fetch(path);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addHeader(doc, companyName, logoData, title) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Logo
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 14, 8, 50, 13.5);
    } catch (e) {}
  } else {
    doc.setTextColor(...WHITE);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 14, 20);
  }

  // Title right-aligned
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageWidth - 14, 16, { align: 'right' });
  
  // Date
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 24, { align: 'right' });

  return 46; // Y position after header
}

function addFooter(doc, pageNum) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
  doc.setFontSize(7);
  doc.setTextColor(...SUBTLE_TEXT);
  doc.text('PocketLedger — Expense & Mileage Tracker', 14, pageHeight - 10);
  doc.text(`Page ${pageNum}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
}

function checkPageBreak(doc, y, needed, companyName, logoData, title) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 24) {
    addFooter(doc, doc.internal.getNumberOfPages());
    doc.addPage();
    return addHeader(doc, companyName, logoData, title);
  }
  return y;
}

// ── Single Expense Receipt PDF ──
export async function generateSingleExpensePDF(expense, companyName) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoData = await loadLogoAsDataURL();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, companyName, logoData, 'EXPENSE RECEIPT');

  // Category & Amount hero
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, 'F');
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(expense.category_name || 'Expense', 20, y + 12);
  if (expense.amount) {
    doc.setFontSize(20);
    doc.text(`$${parseFloat(expense.amount).toFixed(2)}`, pageWidth - 20, y + 14, { align: 'right' });
  }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SUBTLE_TEXT);
  doc.text(`${expense.purchase_date} at ${expense.purchase_time || ''}`, 20, y + 22);
  y += 36;

  // Detail rows
  const details = [
    expense.description && ['Description', expense.description],
    expense.vehicle_label && ['Vehicle', expense.vehicle_label],
    expense.mileage_reading && ['Mileage Reading', String(expense.mileage_reading)],
    expense.notes && ['Notes', expense.notes],
  ].filter(Boolean);

  if (details.length > 0) {
    doc.setFontSize(10);
    for (const [label, value] of details) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SUBTLE_TEXT);
      doc.text(label, 14, y);
      doc.setTextColor(...DARK_TEXT);
      doc.setFont('helvetica', 'bold');
      
      const lines = doc.splitTextToSize(String(value), pageWidth - 80);
      doc.text(lines, 70, y);
      y += lines.length * 5 + 4;
    }
    y += 4;
  }

  // Receipt photo
  if (expense.receipt_photo) {
    const imgData = await loadImageAsDataURL(expense.receipt_photo);
    if (imgData) {
      y = checkPageBreak(doc, y, 100, companyName, logoData, 'EXPENSE RECEIPT');
      doc.setFontSize(9);
      doc.setTextColor(...SUBTLE_TEXT);
      doc.text('RECEIPT PHOTO', 14, y);
      y += 4;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      
      try {
        const imgProps = doc.getImageProperties(imgData);
        const maxW = pageWidth - 28;
        const maxH = 120;
        let w = imgProps.width;
        let h = imgProps.height;
        const ratio = Math.min(maxW / w, maxH / h);
        w *= ratio;
        h *= ratio;
        
        doc.rect(14, y, w, h);
        doc.addImage(imgData, 'JPEG', 14, y, w, h);
        y += h + 8;
      } catch (e) {
        doc.text('(Unable to embed receipt image)', 14, y + 5);
        y += 12;
      }
    }
  }

  addFooter(doc, 1);
  doc.save(`expense-${expense.purchase_date}-${(expense.category_name || 'receipt').toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ── Expense Report PDF (date range) ──
export async function generateExpenseReportPDF(expenses, companyName, range) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoData = await loadLogoAsDataURL();
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = 'EXPENSE REPORT';
  
  let y = addHeader(doc, companyName, logoData, title);

  // Range info
  doc.setFontSize(9);
  doc.setTextColor(...SUBTLE_TEXT);
  const rangeLabel = range.start && range.end ? `${range.start} — ${range.end}` : range.label || 'All Time';
  doc.text(`Period: ${rangeLabel}`, 14, y);
  y += 6;

  // Summary
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(14, y, pageWidth - 28, 16, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text(`Total: $${total.toFixed(2)}`, 20, y + 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`, 20, y + 13);
  y += 24;

  // Table header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 16, y + 5.5);
  doc.text('Category', 42, y + 5.5);
  doc.text('Description', 80, y + 5.5);
  doc.text('Vehicle', 135, y + 5.5);
  doc.text('Amount', pageWidth - 16, y + 5.5, { align: 'right' });
  y += 10;

  // Table rows
  doc.setFont('helvetica', 'normal');
  let even = false;
  for (const exp of expenses) {
    y = checkPageBreak(doc, y, 8, companyName, logoData, title);
    
    if (even) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 1, pageWidth - 28, 7, 'F');
    }
    even = !even;

    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(7.5);
    doc.text(exp.purchase_date || '', 16, y + 4);
    doc.text(exp.category_name || '', 42, y + 4);
    const desc = doc.splitTextToSize(exp.description || '', 50);
    doc.text(desc[0] || '', 80, y + 4);
    doc.text(exp.vehicle_label || '', 135, y + 4);
    if (exp.amount) {
      doc.setFont('helvetica', 'bold');
      doc.text(`$${parseFloat(exp.amount).toFixed(2)}`, pageWidth - 16, y + 4, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    }
    y += 7;
  }

  // Total line
  y += 2;
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLOR);
  doc.text(`Grand Total: $${total.toFixed(2)}`, pageWidth - 16, y, { align: 'right' });

  addFooter(doc, doc.internal.getNumberOfPages());
  doc.save(`expense-report-${range.start || 'all'}-${range.end || 'time'}.pdf`);
}

// ── Mileage Report PDF ──
export async function generateMileageReportPDF(entries, companyName, range) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoData = await loadLogoAsDataURL();
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = 'MILEAGE LOG';
  
  let y = addHeader(doc, companyName, logoData, title);

  const rangeLabel = range.start && range.end ? `${range.start} — ${range.end}` : range.label || 'All Time';
  doc.setFontSize(9);
  doc.setTextColor(...SUBTLE_TEXT);
  doc.text(`Period: ${rangeLabel}`, 14, y);
  y += 6;

  // Summary
  const totalMiles = entries.reduce((s, m) => {
    if (m.start_mileage && m.end_mileage) return s + (m.end_mileage - m.start_mileage);
    return s;
  }, 0);
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(14, y, pageWidth - 28, 16, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text(`Total Miles: ${totalMiles.toFixed(1)}`, 20, y + 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`, 20, y + 13);
  y += 24;

  // Table header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 16, y + 5.5);
  doc.text('Vehicle', 42, y + 5.5);
  doc.text('Start', 90, y + 5.5);
  doc.text('End', 115, y + 5.5);
  doc.text('Miles', 140, y + 5.5);
  doc.text('Notes', 158, y + 5.5);
  y += 10;

  doc.setFont('helvetica', 'normal');
  let even = false;
  for (const m of entries) {
    y = checkPageBreak(doc, y, 8, companyName, logoData, title);
    
    if (even) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 1, pageWidth - 28, 7, 'F');
    }
    even = !even;

    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(7.5);
    doc.text(m.date || '', 16, y + 4);
    doc.text(m.vehicle_label || '', 42, y + 4);
    doc.text(m.start_mileage != null ? String(m.start_mileage) : '', 90, y + 4);
    doc.text(m.end_mileage != null ? String(m.end_mileage) : '', 115, y + 4);
    
    if (m.start_mileage && m.end_mileage) {
      doc.setFont('helvetica', 'bold');
      doc.text((m.end_mileage - m.start_mileage).toFixed(1), 140, y + 4);
      doc.setFont('helvetica', 'normal');
    }
    
    const notes = doc.splitTextToSize(m.notes || '', 36);
    doc.text(notes[0] || '', 158, y + 4);
    y += 7;
  }

  // Total
  y += 2;
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLOR);
  doc.text(`Total Miles: ${totalMiles.toFixed(1)}`, pageWidth - 16, y, { align: 'right' });

  addFooter(doc, doc.internal.getNumberOfPages());
  doc.save(`mileage-log-${range.start || 'all'}-${range.end || 'time'}.pdf`);
}

// ── Combined Report PDF ──
export async function generateCombinedReportPDF(expenses, mileageEntries, companyName, range) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoData = await loadLogoAsDataURL();
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = 'COMBINED REPORT';
  
  let y = addHeader(doc, companyName, logoData, title);

  const rangeLabel = range.start && range.end ? `${range.start} — ${range.end}` : range.label || 'All Time';
  doc.setFontSize(9);
  doc.setTextColor(...SUBTLE_TEXT);
  doc.text(`Period: ${rangeLabel}`, 14, y);
  y += 8;

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalMiles = mileageEntries.reduce((s, m) => {
    if (m.start_mileage && m.end_mileage) return s + (m.end_mileage - m.start_mileage);
    return s;
  }, 0);

  // Summary boxes
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(14, y, (pageWidth - 32) / 2, 20, 3, 3, 'F');
  doc.roundedRect(14 + (pageWidth - 32) / 2 + 4, y, (pageWidth - 32) / 2, 20, 3, 3, 'F');
  
  doc.setTextColor(...BRAND_COLOR);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${totalExpenses.toFixed(2)}`, 20, y + 9);
  doc.text(`${totalMiles.toFixed(1)} mi`, 20 + (pageWidth - 32) / 2 + 4, y + 9);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SUBTLE_TEXT);
  doc.text(`${expenses.length} Expenses`, 20, y + 16);
  doc.text(`${mileageEntries.length} Mileage Entries`, 20 + (pageWidth - 32) / 2 + 4, y + 16);
  y += 28;

  // ── Expenses Section ──
  if (expenses.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text('EXPENSES', 14, y);
    y += 6;

    doc.setFillColor(...BRAND_COLOR);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.text('Date', 16, y + 5.5);
    doc.text('Category', 42, y + 5.5);
    doc.text('Description', 80, y + 5.5);
    doc.text('Amount', pageWidth - 16, y + 5.5, { align: 'right' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    let even = false;
    for (const exp of expenses) {
      y = checkPageBreak(doc, y, 8, companyName, logoData, title);
      if (even) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 1, pageWidth - 28, 7, 'F');
      }
      even = !even;
      doc.setTextColor(...DARK_TEXT);
      doc.setFontSize(7.5);
      doc.text(exp.purchase_date || '', 16, y + 4);
      doc.text(exp.category_name || '', 42, y + 4);
      doc.text((exp.description || '').substring(0, 40), 80, y + 4);
      if (exp.amount) {
        doc.setFont('helvetica', 'bold');
        doc.text(`$${parseFloat(exp.amount).toFixed(2)}`, pageWidth - 16, y + 4, { align: 'right' });
        doc.setFont('helvetica', 'normal');
      }
      y += 7;
    }
    y += 4;
  }

  // ── Mileage Section ──
  if (mileageEntries.length > 0) {
    y = checkPageBreak(doc, y, 30, companyName, logoData, title);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text('MILEAGE LOG', 14, y);
    y += 6;

    doc.setFillColor(...BRAND_COLOR);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 16, y + 5.5);
    doc.text('Vehicle', 42, y + 5.5);
    doc.text('Start', 95, y + 5.5);
    doc.text('End', 120, y + 5.5);
    doc.text('Miles', 145, y + 5.5);
    doc.text('Notes', 162, y + 5.5);
    y += 10;

    doc.setFont('helvetica', 'normal');
    let even = false;
    for (const m of mileageEntries) {
      y = checkPageBreak(doc, y, 8, companyName, logoData, title);
      if (even) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 1, pageWidth - 28, 7, 'F');
      }
      even = !even;
      doc.setTextColor(...DARK_TEXT);
      doc.setFontSize(7.5);
      doc.text(m.date || '', 16, y + 4);
      doc.text(m.vehicle_label || '', 42, y + 4);
      doc.text(m.start_mileage != null ? String(m.start_mileage) : '', 95, y + 4);
      doc.text(m.end_mileage != null ? String(m.end_mileage) : '', 120, y + 4);
      if (m.start_mileage && m.end_mileage) {
        doc.setFont('helvetica', 'bold');
        doc.text((m.end_mileage - m.start_mileage).toFixed(1), 145, y + 4);
        doc.setFont('helvetica', 'normal');
      }
      const notes = doc.splitTextToSize(m.notes || '', 32);
      doc.text(notes[0] || '', 162, y + 4);
      y += 7;
    }
  }

  addFooter(doc, doc.internal.getNumberOfPages());
  doc.save(`combined-report-${range.start || 'all'}-${range.end || 'time'}.pdf`);
}
