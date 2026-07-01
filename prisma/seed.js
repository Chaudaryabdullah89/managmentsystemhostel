const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Database Reset and Seeding with Rich Realistic Data...');

    // 1. Clear all data
    console.log('🗑️  Clearing existing data...');
    // Break circular references first to avoid foreign key issues during deletion
    try {
        await prisma.hostel.updateMany({ data: { managerId: null } });
        await prisma.user.updateMany({ data: { hostelId: null } });
        console.log('      ✓ Nullified circular foreign keys (managerId & hostelId)');
    } catch (e) {
        console.warn('      ⚠ Warning nullifying circular foreign keys:', e.message);
    }

    const tablenames = [
        'WardenPayment',
        'RefundRequest',
        'Payment',
        'Booking',
        'Expense',
        'ComplaintComment',
        'Complaint',
        'TaskComment',
        'StaffTask',
        'Maintenance',
        'CleaningLog',
        'LaundryLog',
        'Room',
        'Salary',
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
    console.log('👤 Creating Super Admin...');
    const admin = await prisma.user.create({
        data: {
            id: randomUUID(),
            name: 'Abdullah Chaudary',
            email: '1@gmail.com',
            password: defaultPassword,
            role: 'ADMIN',
            phone: '0300-4567890',
            isActive: true,
            updatedAt: new Date()
        }
    });
    console.log('✅ Admin created.');

    // 3. Create Hostels
    console.log('🏠 Creating Hostels...');
    const hostelData = [
        {
            name: 'GreenView Executive Boys Hostel',
            type: 'BOYS',
            address: 'Block H3, Johar Town, Near UMT',
            city: 'Lahore',
            state: 'Punjab',
            country: 'Pakistan',
            floors: 4,
            rooms: 15,
            monthlyRent: 16000,
            perNightRent: 600,
            description: 'Premium executive residence featuring high-speed 100Mbps fiber-optic WiFi, laundry facilities, study room, and 24/7 electricity backup.',
            status: 'ACTIVE',
            phone: '042-35123456',
            email: 'greenview.johartown@gmail.com',
            laundryAvailable: true,
            messAvailable: true,
            completeAddress: 'Block H3, Johar Town, Near UMT, Lahore, Punjab, Pakistan',
            updatedAt: new Date()
        },
        {
            name: 'Rosewood Premium Girls Hostel',
            type: 'GIRLS',
            address: 'Street 4, Sector F-11/1',
            city: 'Islamabad',
            state: 'Punjab',
            country: 'Pakistan',
            floors: 3,
            rooms: 12,
            monthlyRent: 22000,
            perNightRent: 800,
            description: 'Highly secure, premium residence for girls. Features dedicated security guards, CCTV coverage, indoor gym, study lounge, and air-conditioned rooms.',
            status: 'ACTIVE',
            phone: '051-2212345',
            email: 'rosewood.f11@outlook.com',
            laundryAvailable: true,
            messAvailable: true,
            completeAddress: 'Street 4, Sector F-11/1, Islamabad, Capital, Pakistan',
            updatedAt: new Date()
        },
        {
            name: 'Gulshan Palace Mixed Wing Hostel',
            type: 'MIXED',
            address: 'Block 4, Gulshan-e-Iqbal, Near KU',
            city: 'Karachi',
            state: 'Sindh',
            country: 'Pakistan',
            floors: 4,
            rooms: 10,
            monthlyRent: 14000,
            perNightRent: 500,
            description: 'Spacious accommodation with separate boys and girls wings, 24/7 security check posts, mess facility, and close proximity to Karachi University.',
            status: 'ACTIVE',
            phone: '021-34987654',
            email: 'gulshanpalace@gmail.com',
            laundryAvailable: false,
            messAvailable: true,
            completeAddress: 'Block 4, Gulshan-e-Iqbal, Near Karachi University, Karachi, Sindh, Pakistan',
            updatedAt: new Date()
        }
    ];

    const hostels = [];
    for (const data of hostelData) {
        const hostel = await prisma.hostel.create({
            data: {
                id: randomUUID(),
                name: data.name,
                type: data.type,
                address: data.address,
                city: data.city,
                state: data.state,
                country: data.country,
                phone: data.phone,
                email: data.email,
                description: data.description,
                floors: data.floors,
                montlyrent: data.monthlyRent,
                pernightrent: data.perNightRent,
                status: data.status,
                completeaddress: data.completeAddress,
                laundaryavailable: data.laundryAvailable,
                messavailable: data.messAvailable,
                totalRooms: data.rooms,
                amenities: ['CCTV', 'WiFi', 'Generator', 'Mess', 'Laundry', 'Air Conditioner'],
                images: [],
                updatedAt: data.updatedAt,
            },
        });
        hostels.push(hostel);
    }
    console.log('✅ Hostels created.');

    // 4. Create Wardens
    console.log('🛡️ Creating Wardens...');
    const wardenNames = ['Asim Mahmood', 'Shagufta Yasmin', 'Khurram Shehzad'];
    const wardens = [];
    for (let i = 0; i < hostels.length; i++) {
        const warden = await prisma.user.create({
            data: {
                id: randomUUID(),
                name: wardenNames[i],
                email: `warden${i + 1}@hostel.com`,
                password: defaultPassword,
                role: 'WARDEN',
                phone: `0311-${9876540 + i}`,
                hostelId: hostels[i].id,
                isActive: true,
                updatedAt: new Date()
            }
        });

        // Assign warden as manager of the hostel
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
        for (let i = 1; i <= hostel.totalRooms; i++) {
            const rType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
            const capacity = roomTypes.indexOf(rType) + 1;
            const monthlyRent = (hostel.montlyrent || 15000) * (1 + (capacity - 1) * 0.4);

            const room = await prisma.room.create({
                data: {
                    id: randomUUID(),
                    hostelId: hostel.id,
                    roomNumber: `${Math.floor((i - 1) / 5) + 1}0${(i - 1) % 5 + 1}`,
                    floor: Math.floor((i - 1) / 5) + 1,
                    type: rType,
                    capacity: capacity,
                    price: Math.round(monthlyRent / 500) * 500, // round to nearest 500
                    status: 'AVAILABLE',
                    amenities: ['WiFi', 'Cabinet', 'Study Desk', 'Fan', 'Attached Bath'],
                    images: [],
                    updatedAt: new Date()
                }
            });
            rooms.push(room);
        }
    }
    console.log('✅ Rooms created.');

    // 6. Create Residents & Bookings (Rich Real Pakistani Names & Profiles)
    console.log('👥 Creating Residents & Profiles...');
    const realResidents = [
        { name: 'Muhammad Ali', email: 'ali.khan@gmail.com', phone: '0302-4567111', cnic: '35202-1234567-1', gName: 'Tariq Khan', gPhone: '0333-4567111', city: 'Peshawar', univ: 'NUST', occupation: 'Student' },
        { name: 'Zainab Bibi', email: 'zainab.bibi@yahoo.com', phone: '0321-9876222', cnic: '42101-9876543-2', gName: 'Sohail Ahmad', gPhone: '0345-9876222', city: 'Multan', univ: 'FAST-NUCES', occupation: 'Student' },
        { name: 'Umer Farooq', email: 'umer.farooq@gmail.com', phone: '0300-8877333', cnic: '34201-4433221-3', gName: 'Muhammad Farooq', gPhone: '0313-8877333', city: 'Faisalabad', univ: 'LUMS', occupation: 'Student' },
        { name: 'Sara Ahmed', email: 'sara.ahmed@gmail.com', phone: '0331-5544444', cnic: '37405-1122334-4', gName: 'Ahmed Ali', gPhone: '0332-5544444', city: 'Rawalpindi', univ: 'COMSATS', occupation: 'Student' },
        { name: 'Bilal Shah', email: 'bilal.shah@outlook.com', phone: '0312-3322555', cnic: '35201-9988776-5', gName: 'Syed Yousaf Shah', gPhone: '0321-3322555', city: 'Lahore', univ: 'Punjab University', occupation: 'Student' },
        { name: 'Hira Mani', email: 'hira.mani@gmail.com', phone: '0324-6655666', cnic: '35202-8877665-6', gName: 'Mian Altaf', gPhone: '0300-6655666', city: 'Sialkot', univ: 'Iqra University', occupation: 'Student' },
        { name: 'Usman Butt', email: 'usman.butt@gmail.com', phone: '0306-1122777', cnic: '35201-5566778-7', gName: 'Nadeem Butt', gPhone: '0316-1122777', city: 'Gujranwala', univ: 'UET Lahore', occupation: 'Student' },
        { name: 'Maham Tariq', email: 'maham.tariq@gmail.com', phone: '0345-2233888', cnic: '42201-1122334-8', gName: 'Tariq Mahmood', gPhone: '0336-2233888', city: 'Karachi', univ: 'NED University', occupation: 'Student' },
        { name: 'Hamza Ali', email: 'hamza.ali@outlook.com', phone: '0300-5566999', cnic: '38403-9988112-9', gName: 'Ali Asif', gPhone: '0301-5566999', city: 'Sargodha', univ: 'GIKI', occupation: 'Student' },
        { name: 'Dua Fatima', email: 'dua.fatima@gmail.com', phone: '0315-7788000', cnic: '35202-7766554-0', gName: 'Amjad Ali', gPhone: '0325-7788000', city: 'Bahawalpur', univ: 'SZABIST', occupation: 'Student' },
        { name: 'Talha Sheikh', email: 'talha.sheikh@gmail.com', phone: '0301-1234001', cnic: '35201-1234001-1', gName: 'Sheikh Pervez', gPhone: '0331-1234001', city: 'Lahore', univ: 'LUMS', occupation: 'Student' },
        { name: 'Ayesha Khan', email: 'ayesha.khan@yahoo.com', phone: '0302-1234002', cnic: '35202-1234002-2', gName: 'Riaz Khan', gPhone: '0332-1234002', city: 'Peshawar', univ: 'NUST', occupation: 'Student' },
        { name: 'Saad Siddiqui', email: 'saad.siddiqui@gmail.com', phone: '0303-1234003', cnic: '42101-1234003-3', gName: 'Asif Siddiqui', gPhone: '0333-1234003', city: 'Karachi', univ: 'Karachi University', occupation: 'Student' },
        { name: 'Sajal Ali', email: 'sajal.ali@gmail.com', phone: '0304-1234004', cnic: '37405-1234004-4', gName: 'Fouad Ali', gPhone: '0334-1234004', city: 'Islamabad', univ: 'SZABIST', occupation: 'Student' },
        { name: 'Daniyal Zafar', email: 'daniyal.zafar@gmail.com', phone: '0305-1234005', cnic: '35201-1234005-5', gName: 'Zafar Ali', gPhone: '0335-1234005', city: 'Lahore', univ: 'Punjab University', occupation: 'Student' }
    ];

    const residents = [];
    for (let i = 0; i < realResidents.length; i++) {
        const item = realResidents[i];
        const hostel = hostels[i % hostels.length];
        const room = rooms.find(r => r.hostelId === hostel.id && r.status === 'AVAILABLE');

        if (!room) continue;

        const user = await prisma.user.create({
            data: {
                id: randomUUID(),
                name: item.name,
                email: item.email,
                password: defaultPassword,
                role: 'RESIDENT',
                phone: item.phone,
                cnic: item.cnic,
                address: `House ${i + 12}, Street 3, Sector A`,
                city: item.city,
                hostelId: hostel.id,
                isActive: true,
                updatedAt: new Date(),
                ResidentProfile: {
                    create: {
                        id: randomUUID(),
                        guardianName: item.gName,
                        guardianPhone: item.gPhone,
                        emergencyContact: item.gPhone,
                        address: `House ${i + 12}, Street 3, Sector A, ${item.city}`,
                        city: item.city,
                        currentHostelId: hostel.id,
                        currentRoomId: room.id,
                        documents: {
                            currentResidence: 'Valid CNIC copy uploaded',
                            galleryImages: [],
                            dob: new Date(2000 + (i % 5), i % 12, (i * 7) % 28 + 1),
                            institution: item.univ,
                            occupation: item.occupation,
                            bloodGroup: ['A+', 'O+', 'B+', 'AB+'][i % 4],
                        }
                    }
                }
            }
        });

        // Set room status to occupied or semi-occupied
        await prisma.room.update({
            where: { id: room.id },
            data: { status: 'OCCUPIED' }
        });

        // Create Booking history
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() - 90); // 90 days ago

        const booking = await prisma.booking.create({
            data: {
                id: randomUUID(),
                userId: user.id,
                roomId: room.id,
                checkIn: checkIn,
                status: 'CHECKED_IN',
                totalAmount: room.price,
                securityDeposit: 5000,
                updatedAt: new Date()
            }
        });

        // Seed 3 months of historical payments (April, May, June 2026)
        const paymentMonths = [
            { name: 'April 2026', date: new Date('2026-04-05'), status: 'PAID' },
            { name: 'May 2026', date: new Date('2026-05-05'), status: 'PAID' },
            { name: 'June 2026', date: new Date('2026-06-05'), status: i % 3 === 0 ? 'PENDING' : 'PAID' }
        ];

        for (const m of paymentMonths) {
            await prisma.payment.create({
                data: {
                    id: randomUUID(),
                    userId: user.id,
                    bookingId: booking.id,
                    amount: room.price,
                    status: m.status,
                    method: m.status === 'PAID' ? 'BANK_TRANSFER' : 'CASH',
                    type: 'MONTHLY_RENT',
                    date: m.date,
                    dueDate: new Date(m.date.getTime() + 5 * 86400000), // 5 days due date
                    notes: `Rent payment invoice for ${m.name}`,
                    updatedAt: new Date()
                }
            });
        }

        residents.push(user);
    }
    console.log('✅ Residents, Bookings, and Payments created.');

    // 7. Create Staff
    console.log('👷 Creating Staff...');
    const realStaff = [
        { name: 'Arshad Mehmood', designation: 'Senior Security Guard', salary: 28000, shift: 'Night' },
        { name: 'Maryum Bibi', designation: 'Mess Housekeeper', salary: 22000, shift: 'Day' },
        { name: 'Amjad Ali', designation: 'Chief Chef', salary: 35000, shift: 'Day' },
        { name: 'Sajid Khan', designation: 'General Electrician', salary: 30000, shift: 'On Call' }
    ];

    for (let i = 0; i < realStaff.length; i++) {
        const hostel = hostels[i % hostels.length];
        const staffUser = await prisma.user.create({
            data: {
                id: randomUUID(),
                name: realStaff[i].name,
                email: `staff${i + 1}@hostel.com`,
                password: defaultPassword,
                role: 'STAFF',
                hostelId: hostel.id,
                isActive: true,
                updatedAt: new Date(),
                StaffProfile: {
                    create: {
                        id: randomUUID(),
                        designation: realStaff[i].designation,
                        department: 'Operations',
                        shift: realStaff[i].shift,
                        basicSalary: realStaff[i].salary,
                        joiningDate: new Date('2025-01-15')
                    }
                }
            }
        });

        // Create some Salaries
        await prisma.salary.create({
            data: {
                id: randomUUID(),
                staffProfileId: staffUser.id, // linked via staff user ID
                month: 'June 2026',
                amount: realStaff[i].salary,
                basicSalary: realStaff[i].salary,
                status: 'PAID',
                paymentDate: new Date('2026-06-30')
            }
        });
    }
    console.log('✅ Staff & Salaries created.');

    // 8. Create Realistic Complaints (With Discussion Threads)
    console.log('💸 Creating Complaints & Comments...');
    const complaintTemplates = [
        {
            title: 'High-speed WiFi Connection Dropping',
            category: 'MAINTENANCE',
            priority: 'HIGH',
            desc: 'The fiber-optic WiFi connection is showing high latency and drops every 10 minutes in Room 204. We cannot attend online university lectures.',
            comments: [
                { role: 'RESIDENT', name: 'Muhammad Ali', msg: 'Please resolve this urgently, my exams are starting from Monday.' },
                { role: 'WARDEN', name: 'Asim Mahmood', msg: 'I have contacted the PTCL support team. They are verifying the optical line configuration.' },
                { role: 'WARDEN', name: 'Asim Mahmood', msg: 'The fiber router has been rebooted and connection is stable now.' }
            ]
        },
        {
            title: 'Common Washroom Water Geyser Leaking',
            category: 'MAINTENANCE',
            priority: 'URGENT',
            desc: 'The main electric geyser on the second floor is leaking from the pressure valve and water is accumulating on the floor. High risk of short circuit.',
            comments: [
                { role: 'RESIDENT', name: 'Zainab Bibi', msg: 'Water has flooded the bathroom floor. Please send an electrician.' },
                { role: 'WARDEN', name: 'Shagufta Yasmin', msg: 'Emergency ticket forwarded to plumber. Plumber is on site.' }
            ]
        },
        {
            title: 'Ceiling Fan Clicking Noise',
            category: 'MAINTENANCE',
            priority: 'MEDIUM',
            desc: 'The ceiling fan in Room 105 makes a loud clicking sound when run at speed 3 or higher. It is impossible to sleep at night.',
            comments: [
                { role: 'RESIDENT', name: 'Umer Farooq', msg: 'Please adjust the fan regulator or replace the bearing.' }
            ]
        },
        {
            title: 'Mess Lunch Food Quality Issue',
            category: 'CLEANLINESS',
            priority: 'HIGH',
            desc: 'The lunch served today had undercooked rice and the chicken curry tasted stale. Multiple residents have reported stomach ache.',
            comments: [
                { role: 'RESIDENT', name: 'Sara Ahmed', msg: 'We request the warden to inspect the kitchen store area.' },
                { role: 'WARDEN', name: 'Shagufta Yasmin', msg: 'I have personally audited the kitchen stores and issued a strict warning to Chef Amjad.' }
            ]
        }
    ];

    for (let i = 0; i < complaintTemplates.length; i++) {
        const t = complaintTemplates[i];
        const resident = residents.find(r => r.hostelId === hostels[i % hostels.length].id) || residents[0];
        const warden = wardens.find(w => w.hostelId === resident.hostelId) || wardens[0];

        const complaint = await prisma.complaint.create({
            data: {
                id: randomUUID(),
                userId: resident.id,
                hostelId: resident.hostelId,
                roomNumber: '204',
                title: t.title,
                description: t.desc,
                category: t.category,
                priority: t.priority,
                status: i % 2 === 0 ? 'IN_PROGRESS' : 'PENDING',
                assignedToId: warden.id,
                createdAt: new Date(Date.now() - i * 86400000)
            }
        });

        // Add Comments
        for (const c of t.comments) {
            const author = c.role === 'RESIDENT' ? resident : warden;
            await prisma.complaintComment.create({
                data: {
                    id: randomUUID(),
                    complaintId: complaint.id,
                    userId: author.id,
                    message: c.msg,
                    createdAt: new Date()
                }
            });
        }
    }
    console.log('✅ Complaints and comment discussions seeded.');

    // 9. Create Expenses
    console.log('💸 Creating Expenses...');
    const expenseTemplates = [
        { title: 'LESCO Commercial Power Bill - June 2026', amount: 45000, category: 'UTILITY_BILL', desc: 'Electricity consumption bill for Johar Town campus.' },
        { title: 'Sui Northern Gas Bill - June 2026', amount: 15000, category: 'UTILITY_BILL', desc: 'Gas bill for the main mess kitchens.' },
        { title: 'Groceries Purchase Metro Cash & Carry', amount: 62000, category: 'MESS_EXPENSE', desc: 'Weekly bulk shopping of rice, cooking oil, chicken, and spices.' },
        { title: 'Second Floor Geyser Repair & Plumbing', amount: 8000, category: 'REPAIR_MAINTENANCE', desc: 'Replacement of pressure release valve and input pipe joints.' }
    ];

    for (let i = 0; i < expenseTemplates.length; i++) {
        const ext = expenseTemplates[i];
        const hostel = hostels[i % hostels.length];
        await prisma.expense.create({
            data: {
                id: randomUUID(),
                hostelId: hostel.id,
                submittedById: admin.id,
                title: ext.title,
                amount: ext.amount,
                category: ext.category,
                status: i === 3 ? 'PENDING' : 'APPROVED',
                description: ext.desc,
                date: new Date(),
                updatedAt: new Date()
            }
        });
    }
    console.log('✅ Expenses created.');

    // 10. Create Mess Menu
    console.log('🍴 Creating Mess Menu...');
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const menuDetails = [
        { breakfast: 'Aloo Paratha, Omelette, Tea', lunch: 'Daal Chawal, Shami Kabab, Salad', dinner: 'Chicken Biryani, Raita, Soft Drink' },
        { breakfast: 'Halwa Puri, Chana Curry, Lassi', lunch: 'Mix Vegetable Sabzi, Roti, Yogurt', dinner: 'Korma, Naan, Salad' },
        { breakfast: 'Boiled Eggs, Toast, Butter, Tea', lunch: 'Aloo Palak, Roti, Mint Raita', dinner: 'Beef Pulao, Salad, Cold Drink' },
        { breakfast: 'French Toast, Fried Eggs, Coffee', lunch: 'Kari Pakora, White Rice', dinner: 'Chicken Jalfrezi, Roti, Kheer' },
        { breakfast: 'Aloo Paratha, Yogurt, Tea', lunch: 'Lobya Curry, Roti, Raita', dinner: 'Chicken Karahi, Roghni Naan' },
        { breakfast: 'Omelette, Bread Slices, Tea', lunch: 'Chicken Pulao, Salad, Yogurt', dinner: 'Daal Mash, Roti, Halwa' },
        { breakfast: 'Pancake, Honey, Fruit Cup, Tea', lunch: 'Vegetable Pulao, Salad', dinner: 'Mutton Korma, Roghni Naan' }
    ];

    for (const hostel of hostels) {
        for (let idx = 0; idx < days.length; idx++) {
            const day = days[idx];
            const menu = menuDetails[idx];
            await prisma.messMenu.create({
                data: {
                    id: randomUUID(),
                    hostelId: hostel.id,
                    dayOfWeek: day,
                    breakfast: menu.breakfast,
                    lunch: menu.lunch,
                    dinner: menu.dinner,
                    breakfastTime: '07:30 AM',
                    lunchTime: '01:30 PM',
                    dinnerTime: '08:30 PM'
                }
            });
        }
    }
    console.log('✅ Mess Menu created.');

    // 11. Create Notices
    console.log('📢 Creating Notices...');
    const noticeTemplates = [
        { title: 'Bi-Monthly General Maintenance', content: 'Dear Residents, the electric generators and water tanks will undergo general cleaning and maintenance this Sunday from 10:00 AM to 02:00 PM. Water supply might be temporarily restricted.', roles: ['GUEST', 'WARDEN', 'STAFF'] },
        { title: 'Mess Fee Invoices Generated', content: 'All monthly hostel and mess dues for July 2026 have been generated. Please submit payments through bank transfer and upload deposit receipts on the portal before the 10th of July.', roles: ['GUEST'] },
        { title: 'Staff Meeting notice', content: 'A mandatory meeting for all cleaning and kitchen staff is scheduled for tomorrow at 04:00 PM in the Warden Office.', roles: ['STAFF'] }
    ];

    for (let i = 0; i < noticeTemplates.length; i++) {
        const nt = noticeTemplates[i];
        const hostel = hostels[i % hostels.length];
        await prisma.notice.create({
            data: {
                id: randomUUID(),
                title: nt.title,
                content: nt.content,
                targetRoles: nt.roles,
                hostelId: hostel.id,
                authorId: admin.id
            }
        });
    }
    console.log('✅ Notices created.');

    console.log('\n✨ Rich Seeding Completed Successfully! ✨');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
