import prisma from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcrypt";

export default class BookingServices {
    async getBookings(hostelId) {
        try {
            const whereClause = hostelId ? {
                Room: {
                    hostelId: hostelId
                }
            } : {};

            const bookings = await prisma.booking.findMany({
                where: whereClause,
                include: {
                    User: {
                        include: {
                            ResidentProfile: true
                        }
                    },
                    Room: {
                        include: {
                            Hostel: true
                        }
                    },
                    Payment: {
                        orderBy: {
                            paymentDate: 'desc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return bookings;
        } catch (error) {
            console.error("Error fetching bookings:", error);
            throw new Error("Failed to fetch bookings");
        }
    }

    async getBookingHistoryByUserId(userId) {
        try {
            const bookings = await prisma.booking.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    User: {
                        include: {
                            ResidentProfile: true
                        }
                    },
                    Room: {
                        include: {
                            Hostel: true,
                            laundry: {
                                orderBy: { createdAt: 'desc' },
                                take: 5
                            },
                            maintanance: {
                                orderBy: { createdAt: 'desc' },
                                take: 5
                            },
                            cleaning: {
                                orderBy: { createdAt: 'desc' },
                                take: 5
                            }
                        }
                    },
                    Payment: {
                        orderBy: {
                            paymentDate: 'desc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return bookings;
        } catch (error) {
            console.error("Error fetching booking history:", error);
            throw new Error("Failed to fetch booking history");
        }
    }

    async createBooking(data) {
        try {
            // Strong Algorithm: Check availability
            const room = await prisma.room.findUnique({
                where: { id: data.roomId },
                include: { Booking: true }
            });

            if (!room) throw new Error("Room not found");

            const activeBookings = room.Booking.filter(b => !['CANCELLED', 'CHECKED_OUT'].includes(b.status));
            if (activeBookings.length >= room.capacity) {
                throw new Error("Room capacity exceeded");
            }

            // Create booking inside a transaction
            const result = await prisma.$transaction(async (tx) => {
                let userId = data.userId;
                let isNewUser = false;
                const tempPassword = "password123";

                // Handle user creation or retrieval if no userId provided
                if (!userId) {
                    const existingUser = await tx.user.findUnique({
                        where: { email: data.guestEmail }
                    });

                    if (existingUser) {
                        userId = existingUser.id;
                        await tx.user.update({
                            where: { id: userId },
                            data: {
                                phone: data.guestPhone || undefined,
                                cnic: data.cnic || undefined,
                                address: data.address || undefined,
                                city: data.city || undefined,
                                updatedAt: new Date(),
                                ResidentProfile: {
                                    upsert: {
                                        create: {
                                            guardianName: data.guardianName,
                                            guardianPhone: data.guardianPhone,
                                            emergencyContact: data.emergencyContact,
                                            address: data.address,
                                            city: data.city
                                        },
                                        update: {
                                            guardianName: data.guardianName,
                                            guardianPhone: data.guardianPhone,
                                            emergencyContact: data.emergencyContact,
                                            address: data.address,
                                            city: data.city
                                        }
                                    }
                                }
                            }
                        });
                    } else {
                        const hashedPassword = await bcrypt.hash(tempPassword, 10);
                        const newUser = await tx.user.create({
                            data: {
                                name: data.guestName,
                                email: data.guestEmail,
                                phone: data.guestPhone,
                                password: hashedPassword,
                                role: "GUEST",
                                cnic: data.cnic,
                                updatedAt: new Date(),
                                address: data.address,
                                city: data.city,
                                ResidentProfile: {
                                    create: {
                                        guardianName: data.guardianName,
                                        guardianPhone: data.guardianPhone,
                                        emergencyContact: data.emergencyContact,
                                        address: data.address,
                                        city: data.city
                                    }
                                }
                            }
                        });
                        userId = newUser.id;
                        isNewUser = true;
                    }
                }

                const booking = await tx.booking.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: userId,
                        roomId: data.roomId,
                        checkIn: new Date(data.checkIn),
                        checkOut: data.checkOut ? new Date(data.checkOut) : null,
                        totalAmount: parseFloat(data.totalAmount),
                        securityDeposit: parseFloat(data.securityDeposit || 0),
                        status: data.status || "PENDING",
                        updatedAt: new Date(),
                    },
                    include: {
                        User: true,
                        Room: {
                            include: {
                                Hostel: true
                            }
                        }
                    }
                });

                await tx.payment.create({
                    data: {
                        userId: userId,
                        bookingId: booking.id,
                        amount: parseFloat(data.totalAmount),
                        status: data.paymentStatus || "PENDING",
                        type: "RENT",
                        date: new Date(),
                        dueDate: new Date(data.checkIn),
                        notes: `Initial Booking Payment (Deposit + Advance)`,
                        updatedAt: new Date()
                    }
                });

                const updatedRoom = await tx.room.findUnique({
                    where: { id: data.roomId },
                    include: { Booking: { where: { status: { notIn: ['CANCELLED', 'CHECKED_OUT'] } } } }
                });

                if (updatedRoom.Booking.length >= updatedRoom.capacity) {
                    await tx.room.update({
                        where: { id: data.roomId },
                        data: { status: "OCCUPIED" }
                    });
                }

                return { ...booking, isNewUser, tempPassword };
            }, {
                maxWait: 5000,
                timeout: 15000
            });

            // Handle Email
            try {
                await this.sendBookingConfirmation(result);
            } catch (emailError) {
                console.error("Non-critical: Failed to send booking confirmation email:", emailError);
            }

            return result;
        } catch (error) {
            console.error("Error creating booking:", error);
            throw error;
        }
    }

    async updateBookingStatus(id, status) {
        try {
            const booking = await prisma.booking.update({
                where: { id },
                data: { status },
                include: { Room: true }
            });

            // If checked out or cancelled, free up room
            if (status === 'CANCELLED' || status === 'CHECKED_OUT') {
                const room = await prisma.room.findUnique({
                    where: { id: booking.roomId },
                    include: { Booking: { where: { status: { notIn: ['CANCELLED', 'CHECKED_OUT'] } } } }
                });

                if (room.Booking.length < room.capacity) {
                    await prisma.room.update({
                        where: { id: booking.roomId },
                        data: { status: "AVAILABLE" }
                    });
                }
            }

            return booking;
        } catch (error) {
            console.error("Error updating booking status:", error);
            throw error;
        }
    }

    async getBookingById(id) {
        try {
            const booking = await prisma.booking.findUnique({
                where: { id },
                include: {
                    User: {
                        include: {
                            ResidentProfile: true
                        }
                    },
                    Room: {
                        include: {
                            Hostel: true,
                            laundry: true,
                            maintanance: true,
                            cleaning: true
                        }
                    },
                    Payment: true
                }
            });
            return booking;
        } catch (error) {
            console.error("Error fetching booking by ID:", error);
            throw new Error("Failed to fetch booking");
        }
    }

    async updateBooking(id, data) {
        try {
            // Update Booking, User, and maybe Room?
            // For now, let's focus on Booking fields + User Basic info if needed
            // data should contain formatted fields

            const result = await prisma.$transaction(async (tx) => {
                const booking = await tx.booking.update({
                    where: { id },
                    data: {
                        roomId: data.roomId,
                        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
                        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
                        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
                        securityDeposit: data.securityDeposit ? parseFloat(data.securityDeposit) : undefined,
                        status: data.status,
                    },
                    include: { User: true }
                });

                if (data.roomId) {
                    // Potential room availability check logic could go here if room changed
                    // For simplicity assuming admin knows what they are doing or handled in UI
                }

                // Update User details if provided
                if (data.guestName || data.guestEmail || data.guestPhone || data.cnic || data.address || data.city) {
                    await tx.user.update({
                        where: { id: booking.userId },
                        data: {
                            name: data.guestName,
                            email: data.guestEmail,
                            phone: data.guestPhone,
                            cnic: data.cnic,
                            address: data.address,
                            city: data.city
                        }
                    });
                }

                // Update Resident Profile if provided
                if (data.guardianName || data.guardianPhone || data.emergencyContact || data.address || data.city && booking.User.role !== 'GUEST') {
                    // Check if profile exists first? upsert is better
                    await tx.residentProfile.upsert({
                        where: { userId: booking.userId },
                        create: {
                            userId: booking.userId,
                            guardianName: data.guardianName,
                            guardianPhone: data.guardianPhone,
                            emergencyContact: data.emergencyContact,
                            address: data.address,
                            city: data.city
                        },
                        update: {
                            guardianName: data.guardianName,
                            guardianPhone: data.guardianPhone,
                            emergencyContact: data.emergencyContact,
                            address: data.address,
                            city: data.city
                        }
                    });
                }

                return booking;
            });
            return result;
        } catch (error) {
            console.error("Error updating booking:", error);
            throw error;
        }
    }

    async sendBookingConfirmation(booking) {
        const { sendEmail } = await import("@/lib/utils/sendmail");

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #4f46e5; color: #fff; padding: 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Booking Confirmed</h1>
                    <p style="margin-top: 10px; opacity: 0.8; font-size: 14px;">Welcome to GreenView Hostels</p>
                </div>
                <div style="padding: 40px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #1e293b;">Hello <strong>${booking.User.name}</strong>,</p>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6;">Your booking has been successfully confirmed. Your room is ready for your stay.</p>
                    
                    <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #4f46e5;">
                        <h3 style="margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; color: #4f46e5;">Booking Details</h3>
                        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Hostel:</td>
                                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1e293b;">${booking.Room.Hostel.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Room:</td>
                                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1e293b;">Room ${booking.Room.roomNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Check-In:</td>
                                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1e293b;">${new Date(booking.checkIn).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Total Amount:</td>
                                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #10b981;">PKR ${booking.totalAmount.toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>

                    ${booking.isNewUser ? `
                    <div style="margin-top: 30px; padding: 20px; background-color: #fef2f2; border-radius: 10px; border: 1px dashed #ef4444;">
                        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #ef4444;">Login Credentials</h3>
                        <p style="margin: 5px 0; font-size: 13px; color: #1e293b;"><strong>Email:</strong> ${booking.User.email}</p>
                        <p style="margin: 5px 0; font-size: 13px; color: #1e293b;"><strong>Password:</strong> ${booking.tempPassword}</p>
                        <p style="margin-top: 10px; font-size: 11px; color: #ef4444;">* Please change your password after your first login.</p>
                    </div>
                    ` : ''}

                    <div style="margin-top: 30px; text-align: center;">
                        <p style="font-size: 12px; color: #64748b;">Access your account using your email address and password.</p>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login"
   style="display: inline-block; padding: 15px 30px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin-top: 20px;">
   GO TO DASHBOARD
</a>
                    </div>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 11px;">
                    © 2026 GreenView Hostels<br>
                    This is an automated message.
                </div>
            </div>
        `;

        return await sendEmail({
            to: booking.User.email,
            subject: `Reservation Confirmed - Unit ${booking.Room.roomNumber}`,
            html
        });
    }
}
