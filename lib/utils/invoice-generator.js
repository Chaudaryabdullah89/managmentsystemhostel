export const generateInvoice = (payment, booking, branding = { companyName: 'Hostel Management', companyShortName: 'HMS' }) => {
    const invoiceWindow = window.open('', '_blank', 'width=800,height=900');

    // Shared Design Metadata from UnifiedReceipt
    const rd = {
        title: "Official Receipt",
        id: `TXN-${payment.id?.slice(-8).toUpperCase()}`,
        date: payment.date || new Date(),
        status: payment.status || 'PENDING',
        brand: `${branding.companyName} (${branding.companyShortName})`,
        customerName: booking.User?.name || 'Customer',
        customerDetail: booking.User?.email || '',
        contextLabel: "Reference",
        contextValue: `${booking.Room?.Hostel?.name} - Unit ${booking.Room?.roomNumber}`,
        colorClass: payment.status === 'PAID' ? "emerald" : "indigo",
        totalLabel: "Amount Paid",
        totalAmount: payment.amount || 0,
        footerNote: "This is a system-generated electronic receipt."
    };

    const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${rd.title} - ${rd.id}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
                
                body { 
                    font-family: 'Outfit', sans-serif; 
                    padding: 40px; 
                    color: #1e293b; 
                    background: #f8fafc; 
                    margin: 0; 
                    -webkit-print-color-adjust: exact;
                }
                
                .receipt { 
                    max-width: 500px; 
                    margin: 0 auto; 
                    background: white; 
                    padding: 40px; 
                    border-radius: 24px; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.05); 
                }
                
                .header { 
                    text-align: center; 
                    border-bottom: 2px dashed #f1f5f9; 
                    padding-bottom: 24px; 
                    margin-bottom: 24px; 
                }
                
                .brand { 
                    font-size: 14px; 
                    font-weight: 800; 
                    text-transform: uppercase; 
                    letter-spacing: 0.1em; 
                    color: #64748b; 
                    margin-bottom: 4px; 
                }
                
                .title { 
                    font-size: 20px; 
                    font-weight: 800; 
                    color: #0f172a; 
                    margin: 0; 
                }
                
                .meta { 
                    font-size: 10px; 
                    font-weight: 700; 
                    color: #94a3b8; 
                    text-transform: uppercase; 
                    margin-top: 8px; 
                }
                
                .section { margin-bottom: 24px; }
                .label { 
                    font-size: 10px; 
                    font-weight: 800; 
                    text-transform: uppercase; 
                    color: #94a3b8; 
                    letter-spacing: 0.05em; 
                    margin-bottom: 4px; 
                }
                
                .value { font-size: 13px; font-weight: 700; color: #1e293b; }
                
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                
                .items-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
                .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
                .item-label { font-size: 12px; font-weight: 600; color: #64748b; }
                .item-value { font-size: 12px; font-weight: 700; color: #1e293b; }
                
                .total-box { 
                    background: #f8fafc; 
                    border-radius: 16px; 
                    padding: 20px; 
                    text-align: center; 
                    margin-top: 24px; 
                    border: 1px solid #f1f5f9; 
                }
                
                .total-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
                .total-amount { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px; }
                
                .footer { 
                    text-align: center; 
                    font-size: 10px; 
                    color: #cbd5e1; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    margin-top: 40px; 
                }
                
                .status { 
                    display: inline-block; 
                    padding: 4px 12px; 
                    border-radius: 99px; 
                    background: #f1f5f9; 
                    font-size: 10px; 
                    font-weight: 800; 
                    margin-top: 12px; 
                    color: #64748b; 
                }

                @media print { 
                    body { padding: 0; background: white; } 
                    .receipt { border: none; box-shadow: none; max-width: 100%; } 
                    .no-print { display: none; } 
                }
                
                .print-btn { 
                    position: fixed; 
                    bottom: 30px; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    background: #000; 
                    color: white; 
                    border: none; 
                    padding: 12px 24px; 
                    border-radius: 12px; 
                    font-weight: 800; 
                    cursor: pointer; 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1); 
                }
            </style>
        </head>
        <body>
            <button class="print-btn no-print" onclick="window.print()">Download Receipt</button>
            <div class="receipt">
                <div class="header">
                    <div class="brand">${rd.brand}</div>
                    <h1 class="title">${rd.title}</h1>
                    <div class="meta">${rd.id} • ${new Date(rd.date).toLocaleDateString()}</div>
                    <div class="status">${rd.status}</div>
                </div>

                <div class="grid section">
                    <div>
                        <div class="label">Recipient</div>
                        <div class="value">${rd.customerName}</div>
                        <div style="font-size: 10px; color: #94a3b8;">${rd.customerDetail}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">${rd.contextLabel}</div>
                        <div class="value">${rd.contextValue}</div>
                    </div>
                </div>

                <div style="border-top: 1px solid #f1f5f9; padding-top: 16px;">
                    <div class="label">Summary Details</div>
                    <div class="items-table">
                        <div class="item-row">
                            <span class="item-label">${payment.type.replace('_', ' ')} Payment</span>
                            <span class="item-value">PKR ${Number(payment.amount).toLocaleString()}</span>
                        </div>
                        ${payment.notes ? `
                        <div class="item-row" style="border: none;">
                            <span class="item-label" style="font-style: italic; font-size: 10px;">${payment.notes}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="total-box">
                    <div class="total-label">Total Amount Paid</div>
                    <div class="total-amount">PKR ${Number(rd.totalAmount).toLocaleString()}</div>
                </div>

                <div class="footer">
                    <p>${rd.footerNote}</p>
                    <p>Verified Digital Ledger Record • ${branding.companyShortName}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();

    // Auto-trigger print after a short delay to ensure rendering
    invoiceWindow.onload = () => {
        invoiceWindow.print();
    };
    // Fallback
    setTimeout(() => {
        if (invoiceWindow) invoiceWindow.print();
    }, 500);
};
