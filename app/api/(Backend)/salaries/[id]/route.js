import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/utils/sendmail";
import { format } from "date-fns";

export async function PATCH(request, context) {
    try {
        const { id } = await context.params;
        const data = await request.json();

        // Calculate total amount if salary components change
        const currentSalary = await prisma.salary.findUnique({
            where: { id },
            include: {
                StaffProfile: {
                    include: { User: true }
                }
            }
        });

        if (!currentSalary) {
            return NextResponse.json({ success: false, error: "Salary record not found" }, { status: 404 });
        }

        const basicSalary = data.basicSalary ?? currentSalary.basicSalary;
        const allowances = data.allowances ?? currentSalary.allowances;
        const bonuses = data.bonuses ?? currentSalary.bonuses;
        const deductions = data.deductions ?? currentSalary.deductions;
        const totalAmount = basicSalary + allowances + bonuses - deductions;

        const updatedSalary = await prisma.salary.update({
            where: { id },
            data: {
                ...data,
                amount: totalAmount,
                updatedAt: new Date()
            },
            include: {
                StaffProfile: {
                    include: {
                        User: true
                    }
                }
            }
        });

        // Trigger email if status is updated to PAID
        if (data.status === 'PAID') {
            const userName = updatedSalary.StaffProfile.User.name;
            const userEmail = updatedSalary.StaffProfile.User.email;
            const month = updatedSalary.month;
            const designation = updatedSalary.StaffProfile.designation;
            const paymentDate = format(new Date(updatedSalary.paymentDate || new Date()), 'PPP');
            const paymentMethod = updatedSalary.paymentMethod || 'BANK_TRANSFER';

            const html = `
                <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 40px auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);">
                    <div style="background: #000; padding: 48px; border-bottom: 8px solid #10b981;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: -0.025em;">GreenView Hostels</h1>
                        <p style="margin: 8px 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #10b981;">Institutional Hub • Payroll Node</p>
                    </div>
                    
                    <div style="padding: 48px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 48px;">
                            <div style="flex: 1;">
                                <div style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; display: inline-block;">Personnel Node</div>
                                <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">${userName}</h2>
                                <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #64748b;">${designation}</p>
                            </div>
                            <div style="flex: 1; text-align: right;">
                                <div style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; display: inline-block;">Fiscal ID</div>
                                <p style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">#SLR-${updatedSalary.id.slice(-8).toUpperCase()}</p>
                                <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #64748b;">Cycle: ${month}</p>
                            </div>
                        </div>
                        
                        <div style="border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; margin-bottom: 48px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr style="background: #f8fafc;">
                                    <th style="padding: 16px 24px; text-align: left; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Disbursement Component</th>
                                    <th style="padding: 16px 24px; text-align: right; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Magnitude (PKR)</th>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 24px; color: #334155; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Base Retainer Agreement</td>
                                    <td style="padding: 16px 24px; text-align: right; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${updatedSalary.basicSalary.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 24px; color: #334155; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Institutional Allowances</td>
                                    <td style="padding: 16px 24px; text-align: right; font-weight: 700; color: #10b981; border-bottom: 1px solid #f1f5f9;">+${updatedSalary.allowances.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 24px; color: #334155; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Performance Incentives</td>
                                    <td style="padding: 16px 24px; text-align: right; font-weight: 700; color: #10b981; border-bottom: 1px solid #f1f5f9;">+${updatedSalary.bonuses.toLocaleString()}</td>
                                </tr>
                                <tr style="background: #fff5f5;">
                                    <td style="padding: 16px 24px; color: #e53e3e; font-size: 13px; font-weight: 600;">Operational Deductions</td>
                                    <td style="padding: 16px 24px; text-align: right; font-weight: 700; color: #e53e3e;">-${updatedSalary.deductions.toLocaleString()}</td>
                                </tr>
                                <tr style="background: #000;">
                                    <td style="padding: 24px; color: #fff; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Net Capital Ingress</td>
                                    <td style="padding: 24px; text-align: right; font-weight: 900; color: #fff; font-size: 24px;">PKR ${updatedSalary.amount.toLocaleString()}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="border-left: 2px solid #e2e8f0; padding-left: 20px; margin-bottom: 32px;">
                            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600;">Settlement Protocol: ${paymentMethod.replace('_', ' ')}</p>
                            <p style="margin: 4px 0 0; font-size: 11px; color: #64748b; font-weight: 600;">Authorization Timestamp: ${paymentDate}</p>
                        </div>

                        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 32px;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 600; line-height: 1.6;"> This digital manifest is an official record of GreenView Hostels Node Management. Please archive this transmission for fiscal auditing purposes. </p>
                        </div>
                    </div>
                </div>
            `;

            try {
                await sendEmail({
                    to: userEmail,
                    subject: `Fiscal Settlement: ${month} Payroll - GreenView Hostels`,
                    html
                });
            } catch (emailError) {
                console.error("Delayed Notification Failed:", emailError);
                // We don't return error here to ensure the transaction is still considered successful in DB
            }
        }

        return NextResponse.json({
            success: true,
            salary: updatedSalary
        });
    } catch (error) {
        console.error("Salary Update Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { id } = await context.params;
        await prisma.salary.delete({ where: { id } });
        return NextResponse.json({ success: true, message: "Salary record deleted" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
