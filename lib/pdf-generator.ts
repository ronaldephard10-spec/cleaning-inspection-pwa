import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditFormData, InspectionItem } from './types';

export interface GeneratedPdfResult {
  doc: jsPDF;
  blob: Blob;
  base64: string; // Pure base64 without data URI prefix
  dataUri: string; // Full data:application/pdf;base64,...
  filename: string;
}

export async function generateInspectionPdf(data: AuditFormData): Promise<GeneratedPdfResult> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Calculate score
  const totalItems = data.items.length;
  const earnedScore = data.items.reduce((acc, item) => acc + item.score, 0);
  const percentage = Math.round((earnedScore / (totalItems || 1)) * 100);
  const isCompliant = percentage >= 85;

  // --- 1. CORPORATE HEADER BANNER ---
  doc.setFillColor(15, 23, 42); // slate-900 / dark navy
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative accent line
  doc.setFillColor(isCompliant ? 16 : 239, isCompliant ? 185 : 68, isCompliant ? 129 : 68); // emerald or rose
  doc.rect(0, 41, pageWidth, 1.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COMMERCIAL CLEANING AUDIT REPORT', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Executive Facility Quality Inspection & Compliance Certification', margin, 25);
  doc.text(`Official Inspection Record • Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, margin, 32);

  // Score Badge in Header (Right Side)
  const badgeWidth = 48;
  const badgeHeight = 24;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = 9;

  doc.setFillColor(isCompliant ? 6 : 153, isCompliant ? 95 : 27, isCompliant ? 70 : 27); // dark tinted badge
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'F');

  doc.setDrawColor(isCompliant ? 16 : 244, isCompliant ? 185 : 63, isCompliant ? 129 : 94);
  doc.setLineWidth(0.6);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'S');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${percentage}%`, badgeX + badgeWidth / 2, badgeY + 10, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(isCompliant ? 110 : 252, isCompliant ? 231 : 165, isCompliant ? 183 : 165);
  doc.text(isCompliant ? 'PASSED - COMPLIANT' : 'ACTION REQUIRED', badgeX + badgeWidth / 2, badgeY + 18, { align: 'center' });

  // --- 2. FACILITY & AUDIT METADATA CARD ---
  let currentY = 48;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 2, 2, 'S');

  // Metadata Columns
  const col1X = margin + 5;
  const col2X = margin + (pageWidth - margin * 2) * 0.52;

  // Left Column: Facility Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('FACILITY TARGET:', col1X, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(data.facilityName || 'N/A', col1X, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Manager Email: ${data.facilityEmail || 'N/A'}`, col1X, currentY + 20);
  doc.text(`Inspection Time: ${data.inspectionDateTime || new Date().toLocaleString()}`, col1X, currentY + 25);

  // Right Column: Inspector Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('AUDITING SUPERVISOR:', col2X, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(data.supervisorName || 'N/A', col2X, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Supervisor Email: ${data.supervisorEmail || 'N/A'}`, col2X, currentY + 20);
  doc.text(`Audit Status: ${isCompliant ? 'Verified Standard Achieved (>=85%)' : 'Deficiencies Logged (<85%)'}`, col2X, currentY + 25);

  currentY += 34;

  // --- 3. 10-POINT INSPECTION TABLE ---
  const tableRows = data.items.map((item) => {
    let statusText = 'PASS (1.0)';
    let scoreDisplay = '1.0 / 1.0';
    if (item.status === 'needs_attention') {
      statusText = 'NEEDS ATTENTION (0.5)';
      scoreDisplay = '0.5 / 1.0';
    } else if (item.status === 'fail') {
      statusText = 'FAIL (0.0)';
      scoreDisplay = '0.0 / 1.0';
    }

    const hasPhoto = !!item.photoUrl;
    const photoNotice = hasPhoto ? ' [Attached Photo]' : '';
    const notesText = item.notes?.trim() ? `${item.notes}${photoNotice}` : (hasPhoto ? 'Visual photo captured.' : 'Satisfactory. No deficiencies noted.');

    return [
      `#${item.number}`,
      `${item.title}\n${item.description || ''}`,
      statusText,
      scoreDisplay,
      notesText,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['#', 'Inspection Area & Protocol Scope', 'Status', 'Points', 'Deficiency Notes & Observations']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 62 },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 'auto' },
    },
    didParseCell: (dataCell) => {
      // Color-code status column
      if (dataCell.section === 'body' && dataCell.column.index === 2) {
        const text = String(dataCell.cell.raw || '');
        if (text.includes('PASS')) {
          dataCell.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (text.includes('NEEDS ATTENTION')) {
          dataCell.cell.styles.textColor = [217, 119, 6]; // amber-600
        } else if (text.includes('FAIL')) {
          dataCell.cell.styles.textColor = [220, 38, 38]; // rose-600
        }
      }
    },
  });

  // Position after table
  const lastTableY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || currentY + 120;
  currentY = lastTableY + 8;

  // --- 4. EMBEDDED DEFICIENCY / AUDIT PHOTOS ---
  const itemsWithPhotos = data.items.filter((item) => !!item.photoUrl);

  if (itemsWithPhotos.length > 0) {
    // Check if we need a new page for photos
    if (currentY > pageHeight - 75) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('VISUAL INSPECTION EVIDENCE & FIELD PHOTOS', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Captured timestamped on-site photographic proof of audited facilities.', margin, currentY + 5);

    currentY += 10;

    const imgWidth = 55;
    const imgHeight = 40;
    const gap = 8;
    let col = 0;
    let rowY = currentY;

    for (let i = 0; i < itemsWithPhotos.length; i++) {
      const item = itemsWithPhotos[i];
      if (!item.photoUrl) continue;

      // Wrap to next line or page
      if (col >= 3) {
        col = 0;
        rowY += imgHeight + 16;
      }

      if (rowY + imgHeight + 16 > pageHeight - 35) {
        doc.addPage();
        rowY = 20;
        col = 0;
      }

      const photoX = margin + col * (imgWidth + gap);

      try {
        doc.addImage(item.photoUrl, 'JPEG', photoX, rowY, imgWidth, imgHeight, undefined, 'FAST');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(photoX, rowY, imgWidth, imgHeight, 'S');

        // Photo Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text(`#${item.number}: ${item.title.substring(0, 24)}`, photoX, rowY + imgHeight + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(item.status === 'pass' ? 5 : item.status === 'fail' ? 220 : 217, item.status === 'pass' ? 150 : item.status === 'fail' ? 38 : 119, item.status === 'pass' ? 105 : 38);
        doc.text(`Status: ${item.status.toUpperCase()}`, photoX, rowY + imgHeight + 8);
      } catch (err) {
        console.warn('Could not render image to PDF:', err);
      }

      col++;
    }

    currentY = rowY + imgHeight + 16;
  }

  // --- 5. SUPERVISOR SIGNATURE & AUDIT CERTIFICATION ---
  // Ensure enough room for signature block (needs ~45mm)
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 44, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 44, 2, 2, 'S');

  // Certification declaration text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SUPERVISOR AUDIT SIGN-OFF & CERTIFICATION', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const declarationText =
    'I hereby certify that I have conducted an on-site physical inspection of the aforementioned commercial premises in accordance with OSHA, ISSA, and standard commercial cleaning quality protocols. The recorded evaluations, deficiencies, and scores truthfully represent the facility condition at the time of inspection.';
  const splitDeclaration = doc.splitTextToSize(declarationText, (pageWidth - margin * 2) * 0.58);
  doc.text(splitDeclaration, margin + 6, currentY + 14);

  // Inspector signature box on right
  const sigBoxX = margin + (pageWidth - margin * 2) * 0.62;
  const sigBoxY = currentY + 6;
  const sigBoxWidth = (pageWidth - margin * 2) * 0.35;
  const sigBoxHeight = 32;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(sigBoxX, sigBoxY, sigBoxWidth, sigBoxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(sigBoxX, sigBoxY, sigBoxWidth, sigBoxHeight, 2, 2, 'S');

  // Render signature image if present
  if (data.supervisorSignature && data.supervisorSignature.startsWith('data:image')) {
    try {
      doc.addImage(
        data.supervisorSignature,
        'PNG',
        sigBoxX + 2,
        sigBoxY + 2,
        sigBoxWidth - 4,
        sigBoxHeight - 12,
        undefined,
        'FAST'
      );
    } catch (e) {
      console.warn('Error embedding signature into PDF:', e);
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('[Digitally Signed on File]', sigBoxX + sigBoxWidth / 2, sigBoxY + 12, { align: 'center' });
  }

  // Signature line and label
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(sigBoxX + 4, sigBoxY + sigBoxHeight - 7, sigBoxX + sigBoxWidth - 4, sigBoxY + sigBoxHeight - 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Authorized Inspector: ${data.supervisorName || 'Inspector'}`, sigBoxX + 4, sigBoxY + sigBoxHeight - 2);

  // Verification stamp info
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Audit ID: CCA-${Date.now().toString(36).toUpperCase()}`, margin + 6, currentY + 36);
  doc.text(`Timestamp: ${new Date().toISOString()}`, margin + 6, currentY + 40);

  // --- FOOTERS ON ALL PAGES ---
  const totalPages = doc.internal.pages.length - 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Commercial Cleaning Quality Management System • Confidential Audit Record', margin, pageHeight - 6);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  const cleanFacilityName = (data.facilityName || 'Facility').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Audit_${cleanFacilityName}_${dateStr}.pdf`;

  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1] || '';

  return {
    doc,
    blob,
    base64,
    dataUri,
    filename,
  };
}
