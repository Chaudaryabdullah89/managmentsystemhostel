export const generateInvoice = (payment, booking) => {
    const invoiceWindow = window.open('', '_blank', 'width=800,height=900');

    const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${payment.id.toUpperCase().slice(0, 8)}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                    padding: 40px;
                    color: #1a1a1a;
                    line-height: 1.5;
                }
                
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 30px;
                    margin-bottom: 40px;
                }
                
                .brand {
                    flex: 1;
                }
                
                .brand h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    text-transform: uppercase;
                }
                
                .brand p {
                    margin: 5px 0 0 0;
                    font-size: 12px;
                    font-weight: 600;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                
                .invoice-meta {
                    text-align: right;
                }
                
                .invoice-meta h2 {
                    margin: 0;
                    font-size: 32px;
                    font-weight: 800;
                    color: #000;
                }
                
                .invoice-meta p {
                    margin: 5px 0 0 0;
                    font-size: 12px;
                    font-weight: 700;
                    color: #999;
                }
                
                .details-grid {
                    display: grid;
                    grid-template-cols: 1fr 1fr;
                    gap: 40px;
                    margin-bottom: 50px;
                }
                
                .details-block h3 {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #999;
                    margin-bottom: 15px;
                    border-bottom: 1px solid #f0f0f0;
                    padding-bottom: 5px;
                }
                
                .details-block p {
                    margin: 4px 0;
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 40px;
                }
                
                .table th {
                    text-align: left;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #999;
                    padding: 12px 0;
                    border-bottom: 2px solid #000;
                }
                
                .table td {
                    padding: 20px 0;
                    border-bottom: 1px solid #f0f0f0;
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .amount-col {
                    text-align: right;
                }
                
                .summary {
                    display: flex;
                    justify-content: flex-end;
                }
                
                .summary-table {
                    width: 300px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                }
                
                .summary-row.total {
                    margin-top: 10px;
                    padding: 20px 0;
                    border-top: 2px solid #000;
                    font-size: 20px;
                    font-weight: 800;
                }
                
                .summary-row span:first-child {
                    font-size: 12px;
                    font-weight: 700;
                    color: #999;
                    text-transform: uppercase;
                }
                
                .footer {
                    margin-top: 100px;
                    padding-top: 30px;
                    border-top: 1px solid #f0f0f0;
                    text-align: center;
                }
                
                .footer p {
                    font-size: 10px;
                    font-weight: 700;
                    color: #999;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                .badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    background: #f0f0f0;
                }
                
                .badge.paid {
                    background: #e6fffa;
                    color: #2c7a7b;
                }

                @media print {
                    .no-print {
                        display: none;
                    }
                    body {
                        padding: 0;
                    }
                }
                
                .print-button {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background: #000;
                    color: #fff;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    cursor: pointer;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    font-family: 'Inter', sans-serif;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <button class="print-button no-print" onclick="window.print()">Download as PDF / Print</button>
            <div class="invoice-container">
                <div class="header">
                    <div class="brand">
                        <h1>GreenView Hostels</h1>
                        <p>Advanced Housing Solutions</p>
                    </div>
                    <div class="invoice-meta">
                        <h2>INVOICE</h2>
                        <p>#${payment.id.toUpperCase().slice(0, 8)}</p>
                        <p>DATE: ${new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div class="details-grid">
                    <div class="details-block">
                        <h3>FROM</h3>
                        <p>GreenView Management Office</p>
                        <p>Sector D, Phase 2, Islamabad</p>
                        <p>Contact: +92 300 1234567</p>
                    </div>
                    <div class="details-block">
                        <h3>BILL TO</h3>
                        <p>${booking.User.name}</p>
                        <p>${booking.Room.Hostel.name} - Room ${booking.Room.roomNumber}</p>
                        <p>${booking.User.email}</p>
                    </div>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th class="amount-col">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div>${payment.type.replace('_', ' ')} PAYMENT</div>
                                <div style="font-size: 10px; color: #999; margin-top: 5px;">${payment.notes || 'Monthly service fee settlement.'}</div>
                            </td>
                            <td>${payment.method.replace('_', ' ')}</td>
                            <td><span class="badge ${payment.status === 'PAID' ? 'paid' : ''}">${payment.status}</span></td>
                            <td class="amount-col">PKR ${Number(payment.amount).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="summary">
                    <div class="summary-table">
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>PKR ${Number(payment.amount).toLocaleString()}</span>
                        </div>
                        <div class="summary-row">
                            <span>Tax (0%)</span>
                            <span>PKR 0</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total Settlement</span>
                            <span>PKR ${Number(payment.amount).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Thank you for choosing GreenView Hostels. For any queries, contact support@greenview.io</p>
                    <p style="margin-top: 10px;">THIS IS A SYSTEM GENERATED FISCAL DOCUMENT AND DOES NOT REQUIRE A SIGNATURE.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
};
