/**
 * generateInvoicePDF
 * Produces a clean, voucher-style PDF receipt for a payment or booking record.
 * Uses jsPDF which is already a dependency on the project.
 */
export async function generateInvoicePDF({ payment, booking, hostel, user }) {
    // Dynamic import to keep this server-safe / avoid SSR issues
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // ─── Header Background ───────────────────────────────
    doc.setFillColor(15, 15, 25); // near-black
    doc.rect(0, 0, pageW, 60, 'F');

    // Logo / brand text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('HOSTEL', 20, 25);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 170);
    doc.setFont('helvetica', 'normal');
    doc.text('MANAGEMENT SYSTEM', 20, 32);

    // Receipt label (right side)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PAYMENT RECEIPT', pageW - 20, 22, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 140, 170);
    doc.text(`REF: ${payment?.id?.slice(-10)?.toUpperCase() || 'N/A'}`, pageW - 20, 30, { align: 'right' });

    // Status indicator
    const isPaid = payment?.status === 'PAID';
    doc.setFillColor(isPaid ? 16 : 239, isPaid ? 185 : 68, isPaid ? 129 : 68);
    doc.roundedRect(pageW - 50, 36, 30, 10, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(payment?.status || 'PENDING', pageW - 35, 42.5, { align: 'center' });

    // ─── Resident / Hostel Info ─────────────────────────
    doc.setTextColor(30, 30, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RESIDENT', 20, 80);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 80);
    doc.text(user?.name || booking?.User?.name || 'N/A', 20, 88);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 160);
    doc.text(user?.email || booking?.User?.email || '', 20, 94);
    doc.text(`CNIC: ${user?.cnic || booking?.User?.cnic || 'N/A'}`, 20, 100);
    doc.text(`Phone: ${user?.phone || booking?.User?.phone || 'N/A'}`, 20, 106);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 50);
    doc.text('PROPERTY', pageW / 2, 80);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 80);
    doc.text(hostel?.name || booking?.Room?.Hostel?.name || 'N/A', pageW / 2, 88);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 160);
    doc.text(`Room: ${booking?.Room?.roomNumber || 'N/A'}`, pageW / 2, 94);
    doc.text(hostel?.address || booking?.Room?.Hostel?.address || '', pageW / 2, 100);

    // ─── Divider ─────────────────────────────────────────
    doc.setDrawColor(220, 220, 235);
    doc.setLineWidth(0.5);
    doc.line(20, 115, pageW - 20, 115);

    // ─── Payment Breakdown Table ──────────────────────────
    const tableRows = [
        ['Booking Amount', `PKR ${(booking?.totalAmount || 0).toLocaleString()}`],
        ['Security Deposit', `PKR ${(booking?.securityDeposit || 0).toLocaleString()}`],
        ['Amount Paid', `PKR ${(payment?.amount || 0).toLocaleString()}`],
        ['Payment Method', payment?.method || 'Cash'],
        ['Payment Date', payment?.date ? new Date(payment.date).toLocaleDateString('en-PK', { dateStyle: 'long' }) : 'N/A'],
        ['Check-In Date', booking?.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-PK', { dateStyle: 'long' }) : 'N/A'],
    ];

    autoTable(doc, {
        startY: 122,
        head: [['Description', 'Details']],
        body: tableRows,
        theme: 'plain',
        headStyles: {
            fillColor: [245, 245, 252],
            textColor: [80, 80, 120],
            fontStyle: 'bold',
            fontSize: 8,
            lineWidth: 0,
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [40, 40, 70],
            lineWidth: 0.1,
            lineColor: [230, 230, 240],
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 90, cellPadding: 5 },
            1: { halign: 'right', cellPadding: 5 },
        },
        margin: { left: 20, right: 20 },
    });

    // ─── Total Paid (highlighted) ─────────────────────────
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(59, 130, 246); // blue-500
    doc.roundedRect(20, finalY, pageW - 40, 18, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('AMOUNT PAID', 30, finalY + 11);
    doc.setFontSize(13);
    doc.text(`PKR ${(payment?.amount || 0).toLocaleString()}`, pageW - 30, finalY + 11, { align: 'right' });

    // ─── Footer ──────────────────────────────────────────
    const footerY = finalY + 38;
    doc.setTextColor(160, 160, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('This receipt is computer-generated and does not require a signature.', pageW / 2, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-PK')} · Hostel Management System`, pageW / 2, footerY + 6, { align: 'center' });

    // ─── Save ─────────────────────────────────────────────
    const fileName = `Receipt_${(user?.name || booking?.User?.name || 'Resident').replace(/\s+/g, '_')}_${payment?.id?.slice(-6)?.toUpperCase() || 'INV'}.pdf`;
    doc.save(fileName);
}
