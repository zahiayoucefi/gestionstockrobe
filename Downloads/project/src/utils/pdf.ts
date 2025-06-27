// utils/pdf.ts
import jsPDF from 'jspdf';

export interface ReceiptData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    isRental: boolean;
    rentalDays?: number;
  }>;
  total: number;
  date: Date;
  agentName: string;
  receiptNumber?: string;
}

export function generateReceiptPDF(data: ReceiptData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let y = 30;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HaliStock Boutique', pageWidth / 2, y, { align: 'center' });

  y += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Système de Gestion de Vêtements', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.text('1200 logts', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.text('Tél: +213668979699', pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REÇU D\'ANNULATION DE LOCATION', pageWidth / 2, y, { align: 'center' });

  y += 10;
  const receiptNumber = data.receiptNumber || `REC-${Date.now()}`;
  doc.setFontSize(10);
  doc.text(`N° Reçu: ${receiptNumber}`, margin, y);
  doc.text(`Date: ${data.date.toLocaleDateString('fr-FR')} ${data.date.toLocaleTimeString('fr-FR')}`, pageWidth - margin, y, { align: 'right' });

  y += 10;
  doc.text(`Client: ${data.customerName}`, margin, y);
  y += 5;
  doc.text(`Téléphone: ${data.customerPhone}`, margin, y);
  if (data.customerEmail) {
    y += 5;
    doc.text(`Email: ${data.customerEmail}`, margin, y);
  }

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Détails de l\'annulation:', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');

  data.items.forEach((item, index) => {
    const label = item.isRental
      ? `${item.name} - ${item.rentalDays} jour(s) x ${item.unitPrice.toLocaleString('fr-FR')} DA`
      : `${item.name} x${item.quantity} @ ${item.unitPrice.toLocaleString('fr-FR')} DA`;

    doc.text(`• ${label}`, margin, y);
    y += 6;
  });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${data.total.toLocaleString('fr-FR')} DA`, margin, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`Agent: ${data.agentName}`, margin, y);

  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Merci d\'avoir utilisé notre service. Ce reçu confirme l\'annulation de votre location.', pageWidth / 2, y, { align: 'center' });

  doc.save(`${receiptNumber}.pdf`);
}
