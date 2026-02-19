const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const saltRounds = 10;

    // Define users to create
    const users = [
        {
            name: "Admin Master",
            email: "master.admin@hostel.com",
            password: "password123",
            phone: "0300-1111111",
            role: "ADMIN",
            isActive: true,
        },
        {
            name: "Warden West",
            email: "warden.west@hostel.com",
            password: "password123",
            phone: "0300-2222222",
            role: "WARDEN",
            isActive: true,
        },
        {
            name: "Staff Member A",
            email: "staff.a@hostel.com",
            password: "password123",
            phone: "0300-3333333",
            role: "STAFF",
            isActive: true,
            staff: {
                designation: "Manager",
                department: "Administration",
                basicSalary: 45000,
                allowances: 5000
            }
        },
        {
            name: "Staff Member B",
            email: "staff.b@hostel.com",
            password: "password123",
            phone: "0300-4444444",
            role: "STAFF",
            isActive: true,
            staff: {
                designation: "Receptionist",
                department: "Front Office",
                basicSalary: 30000,
                allowances: 3000
            }
        },
        {
            name: "Resident X",
            email: "resident.x@email.com",
            password: "password123",
            phone: "0300-5555555",
            role: "RESIDENT",
            isActive: true,
        }
    ];

    console.log("Seeding users...");

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, saltRounds);

        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { email: u.email }
        });

        if (existing) {
            console.log(`User ${u.email} already exists, skipping...`);
            continue;
        }

        const createdUser = await prisma.user.create({
            data: {
                name: u.name,
                email: u.email,
                password: hashedPassword,
                phone: u.phone,
                role: u.role,
                isActive: u.isActive,
                updatedAt: new Date(),
                ...(u.role === 'STAFF' && u.staff ? {
                    StaffProfile: {
                        create: {
                            designation: u.staff.designation,
                            department: u.staff.department,
                            basicSalary: u.staff.basicSalary,
                            allowances: u.staff.allowances,
                            joiningDate: new Date()
                        }
                    }
                } : {})
            }
        });

        console.log(`Created user: ${createdUser.email} with role ${createdUser.role}`);
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
