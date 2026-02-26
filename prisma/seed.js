const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Database Reset and Seeding...');

    // 1. Clear all data
    console.log('🗑️  Clearing existing data...');

    // Ordered deletion to handle foreign keys
    const tablenames = [
        'Booking',
        'ComplaintComment',
        'Complaint',
        'TaskComment',
        'StaffTask',
        'maintanance',
        'CleaningLog',
        'LaundryLog',
        'Room',
        'Payment',
        'Expense',
        'RefundRequest',
        'Salary',
        'WardenPayment',
        'StaffAttendance',
        'StaffProfile',
        'ResidentProfile',
        'Session',
        'OtpVerification',
        'resetPassword',
        'MessMenu',
        'Notice',
        'User',
        'Hostel',
    ];

    for (const tablename of tablenames) {
        try {
            await prisma[tablename.charAt(0).toLowerCase() + tablename.slice(1)].deleteMany();
            console.log(`      ✓ Cleared ${tablename}`);
        } catch (e) {
            console.error(`      ✗ Error clearing ${tablename}:`, e.message);
        }
    }

    console.log('✅ Base data cleared.\n');

    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);

    // 2. Create Admin
    console.log('👤 Creating Admin...');
    const admin = await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: '1@gmail.com',
            password: defaultPassword,
            role: 'ADMIN',
            phone: '0300-1111111',
            isActive: true,
            updatedAt: new Date()
        }
    });
    console.log('✅ Admin created.');

    // 3. Create Hostels
    console.log('🏠 Creating Hostels...');
    const hostelData = [
        {
            name: 'GreenView Boys Hostel',
            type: 'BOYS',
            address: '123 Main St, Lahore',
            city: 'Lahore',
            state: 'Punjab',
            country: 'Pakistan',
            floors: 4,
            rooms: 40,
            monthlyRent: 15000,
            perNightRent: 500,
            description: 'Modern boys hostel with high-speed internet and attached bathrooms.',
            status: 'ACTIVE',
            phone: '0300-2222222',
            email: 'greenview@hostel.com',
            laundryAvailable: true,
            messAvailable: true,
            completeAddress: '123 Main St, Lahore, Punjab, Pakistan',
            updatedAt: new Date()
        },
        {
            name: 'Rosewood Girls Hostel',
            type: 'GIRLS',
            address: '456 Park Avenue, Karachi',
            city: 'Karachi',
            state: 'Sindh',
            country: 'Pakistan',
            floors: 5,
            rooms: 50,
            monthlyRent: 18000,
            perNightRent: 600,
            description: 'Safe and secure girls hostel with 24/7 power backup and security.',
            status: 'ACTIVE',
            phone: '0300-3333333',
            email: 'rosewood@hostel.com',
            laundryAvailable: true,
            messAvailable: true,
            completeAddress: '456 Park Avenue, Karachi, Sindh, Pakistan',
            updatedAt: new Date()
        },
        {
            name: 'Elite Mixed Hostel',
            type: 'MIXED',
            address: '789 Commercial Rd, Islamabad',
            city: 'Islamabad',
            state: 'Punjab',
            country: 'Pakistan',
            floors: 3,
            rooms: 30,
            monthlyRent: 20000,
            perNightRent: 800,
            description: 'Premium mixed hostel with separate wings and luxury amenities.',
            status: 'ACTIVE',
            phone: '0300-4444444',
            email: 'elite@hostel.com',
            laundryAvailable: false,
            messAvailable: true,
            completeAddress: '789 Commercial Rd, Islamabad, Punjab, Pakistan',
            updatedAt: new Date()
        }
    ];

    const hostels = [];
    for (const data of hostelData) {
        const hostel = await prisma.hostel.create({ data });
        hostels.push(hostel);
    }
    console.log('✅ Hostels created.');

    // 4. Create Wardens
    console.log('🛡️ Creating Wardens...');
    const wardens = [];
    for (let i = 0; i < hostels.length; i++) {
        const warden = await prisma.user.create({
            data: {
                name: `Warden ${hostels[i].name.split(' ')[0]}`,
                email: `warden${i + 1}@hostel.com`,
                password: defaultPassword,
                role: 'WARDEN',
                phone: `0311-000000${i + 1}`,
                hostelId: hostels[i].id,
                isActive: true,
                updatedAt: new Date()
            }
        });

        // Assign warden to hostel
        await prisma.hostel.update({
            where: { id: hostels[i].id },
            data: { managerId: warden.id }
        });

        wardens.push(warden);
    }
    console.log('✅ Wardens created and assigned.');

    // 5. Create Rooms
    console.log('🚪 Creating Rooms...');
    const roomTypes = ['SINGLE', 'DOUBLE', 'TRIPLE'];
    const rooms = [];
    for (const hostel of hostels) {
        for (let i = 1; i <= 10; i++) { // 10 rooms per hostel for seeding
            const rType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
            const capacity = roomTypes.indexOf(rType) + 1;
            const monthlyRent = (hostel.montlyrent || 15000) * (1 + (capacity - 1) * 0.5);

            const room = await prisma.room.create({
                data: {
                    hostelId: hostel.id,
                    roomNumber: `${Math.floor((i - 1) / 5) + 1}0${(i - 1) % 5 + 1}`,
                    floor: Math.floor((i - 1) / 5) + 1,
                    type: rType,
                    capacity: capacity,
                    price: monthlyRent,
                    monthlyrent: monthlyRent,
                    pricepernight: monthlyRent / 30, // Approximate daily rate
                    status: 'AVAILABLE',
                    amenities: ['WiFi', 'Cabinet', 'Bed', 'Fan'],
                    updatedAt: new Date()
                }
            });
            rooms.push(room);
        }
    }
    console.log('✅ Rooms created.');

    // 6. Create Residents & Bookings
    console.log('👥 Creating Residents & Bookings...');
    const residentNames = [
        'Ali Khan', 'Zainab Bibi', 'Umer Farooq', 'Sara Ahmed', 'Bilal Shah',
        'Hira Mani', 'Usman Butt', 'Maham Tariq', 'Hamza Ali', 'Dua Fatima'
    ];

    for (let i = 0; i < residentNames.length; i++) {
        const hostel = hostels[i % hostels.length];
        const room = rooms.find(r => r.hostelId === hostel.id && r.occupied < r.capacity);

        if (!room) continue;

        const resident = await prisma.user.create({
            data: {
                name: residentNames[i],
                email: `resident${i + 1}@example.com`,
                password: defaultPassword,
                role: 'RESIDENT',
                phone: `0322-111111${i + 1}`,
                hostelId: hostel.id,
                isActive: true,
                updatedAt: new Date(),
                ResidentProfile: {
                    create: {
                        guardianName: 'Guardian Name',
                        guardianPhone: '0333-0000000',
                        bloodGroup: 'B+',
                        emergencyContact: '0333-9999999'
                    }
                }
            }
        });

        // Create Booking
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() - 30); // 30 days ago

        await prisma.booking.create({
            data: {
                userId: resident.id,
                roomId: room.id,
                hostelId: hostel.id,
                checkIn: checkIn,
                status: 'CONFIRMED',
                totalAmount: room.monthlyrent,
                securityDeposit: 5000,
                updatedAt: new Date()
            }
        });

        // Update room occupancy
        await prisma.room.update({
            where: { id: room.id },
            data: { occupied: { increment: 1 }, status: room.occupied + 1 === room.capacity ? 'OCCUPIED' : 'AVAILABLE' }
        });

        // Add Payment
        await prisma.payment.create({
            data: {
                userId: resident.id,
                hostelId: hostel.id,
                amount: room.monthlyrent,
                status: 'PAID',
                method: 'CASH',
                month: 'March 2026',
                type: 'MONTHLY_RENT',
                paymentDate: new Date(),
                updatedAt: new Date()
            }
        });
    }
    console.log('✅ Residents, Bookings, and Payments created.');

    // 7. Create Staff
    console.log('👷 Creating Staff...');
    const staffRoles = [
        { name: 'John Guard', designation: 'Security Guard', salary: 25000 },
        { name: 'Mary Clean', designation: 'Cleanup Staff', salary: 20000 },
        { name: 'Dave Cook', designation: 'Chef', salary: 30000 }
    ];

    for (let i = 0; i < staffRoles.length; i++) {
        const hostel = hostels[i % hostels.length];
        await prisma.user.create({
            data: {
                name: staffRoles[i].name,
                email: `staff${i + 1}@hostel.com`,
                password: defaultPassword,
                role: 'STAFF',
                hostelId: hostel.id,
                StaffProfile: {
                    create: {
                        designation: staffRoles[i].designation,
                        department: 'Operations',
                        basicSalary: staffRoles[i].salary,
                        joiningDate: new Date()
                    }
                }
            }
        });
    }
    console.log('✅ Staff created.');

    // 8. Create Expenses
    console.log('💸 Creating Expenses...');
    for (const hostel of hostels) {
        await prisma.expense.create({
            data: {
                hostelId: hostel.id,
                submittedById: admin.id,
                title: 'Electricity Bill',
                amount: 12000,
                category: 'Utilities',
                status: 'APPROVED',
                description: 'Monthly electricity bill for the hostel.',
                date: new Date()
            }
        });
    }
    console.log('✅ Expenses created.');

    // 9. Create Mess Menu
    console.log('🍴 Creating Mess Menu...');
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    for (const hostel of hostels) {
        for (const day of days) {
            await prisma.messMenu.create({
                data: {
                    hostelId: hostel.id,
                    dayOfWeek: day,
                    breakfast: 'Eggs, Bread, Tea',
                    lunch: 'Rice and Dal',
                    dinner: 'Chicken Curry and Naan',
                    breakfastTime: '08:00 AM',
                    lunchTime: '01:30 PM',
                    dinnerTime: '08:30 PM'
                }
            });
        }
    }
    console.log('✅ Mess Menu created.');

    // 10. Create Notices
    console.log('📢 Creating Notices...');
    for (const hostel of hostels) {
        await prisma.notice.create({
            data: {
                title: 'Monthly Maintenance',
                content: 'The hostel will undergo monthly maintenance this Sunday.',
                targetRoles: ['GUEST', 'WARDEN', 'STAFF'],
                hostelId: hostel.id,
                authorId: admin.id
            }
        });
    }
    console.log('✅ Notices created.');

    console.log('\n✨ Seeding Completed Successfully! ✨');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
