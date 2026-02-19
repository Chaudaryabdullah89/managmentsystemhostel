// Using Node.js built-in fetch (available in Node 18+)
const BASE_URL = 'http://localhost:3000';

// Sample users data
const users = [
    {
        name: "Ahmed Ali",
        email: "ahmed.ali@example.com",
        password: "password123",
        phone: "+923001234567",
        role: "ADMIN"
    },
    {
        name: "Fatima Khan",
        email: "fatima.khan@example.com",
        password: "password123",
        phone: "+923001234568",
        role: "WARDEN"
    },
    {
        name: "Hassan Malik",
        email: "hassan.malik@example.com",
        password: "password123",
        phone: "+923001234569",
        role: "WARDEN"
    },
    {
        name: "Ayesha Sheikh",
        email: "ayesha.sheikh@example.com",
        password: "password123",
        phone: "+923001234570",
        role: "STAFF"
    },
    {
        name: "Bilal Ahmed",
        email: "bilal.ahmed@example.com",
        password: "password123",
        phone: "+923001234571",
        role: "RESIDENT"
    }
];

// Sample hostels data
const hostels = [
    {
        hostelname: "GreenView Boys Hostel",
        type: "BOYS",
        montlypayment: "15000",
        pricePerNight: "500",
        contact: "+923001111111",
        email: "greenview.boys@hostel.com",
        floors: "3",
        rooms: "30",
        status: "ACTIVE",
        laundry: "yes",
        mess: "yes",
        street: "123 Main Street",
        city: "Lahore",
        state: "Punjab",
        country: "Pakistan",
        zip: "54000",
        completeAddress: "123 Main Street, Lahore, Punjab, Pakistan",
        description: "A modern boys hostel with all amenities"
    },
    {
        hostelname: "Rosewood Girls Hostel",
        type: "GIRLS",
        montlypayment: "18000",
        pricePerNight: "600",
        contact: "+923002222222",
        email: "rosewood.girls@hostel.com",
        floors: "4",
        rooms: "40",
        status: "ACTIVE",
        laundry: "yes",
        mess: "yes",
        street: "456 Park Avenue",
        city: "Karachi",
        state: "Sindh",
        country: "Pakistan",
        zip: "75500",
        completeAddress: "456 Park Avenue, Karachi, Sindh, Pakistan",
        description: "Comfortable girls hostel with security"
    },
    {
        hostelname: "Sunset Hostel",
        type: "BOYS",
        montlypayment: "12000",
        pricePerNight: "400",
        contact: "+923003333333",
        email: "sunset@hostel.com",
        floors: "2",
        rooms: "20",
        status: "ACTIVE",
        laundry: "no",
        mess: "yes",
        street: "789 University Road",
        city: "Islamabad",
        state: "Punjab",
        country: "Pakistan",
        zip: "44000",
        completeAddress: "789 University Road, Islamabad, Punjab, Pakistan",
        description: "Affordable hostel near university"
    },
    {
        hostelname: "Elite Mixed Hostel",
        type: "MIXED",
        montlypayment: "20000",
        pricePerNight: "700",
        contact: "+923004444444",
        email: "elite.mixed@hostel.com",
        floors: "5",
        rooms: "50",
        status: "ACTIVE",
        laundry: "yes",
        mess: "yes",
        street: "321 Commercial Area",
        city: "Lahore",
        state: "Punjab",
        country: "Pakistan",
        zip: "54000",
        completeAddress: "321 Commercial Area, Lahore, Punjab, Pakistan",
        description: "Premium mixed hostel with modern facilities"
    },
    {
        hostelname: "City Center Hostel",
        type: "BOYS",
        montlypayment: "14000",
        pricePerNight: "450",
        contact: "+923005555555",
        email: "citycenter@hostel.com",
        floors: "3",
        rooms: "35",
        status: "ACTIVE",
        laundry: "yes",
        mess: "no",
        street: "555 Downtown Street",
        city: "Faisalabad",
        state: "Punjab",
        country: "Pakistan",
        zip: "38000",
        completeAddress: "555 Downtown Street, Faisalabad, Punjab, Pakistan",
        description: "Central location hostel with easy access"
    }
];

async function createUser(userData) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ User created: ${userData.name} (${userData.email})`);
            return data;
        } else {
            console.error(`❌ Failed to create user ${userData.name}:`, data);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error creating user ${userData.name}:`, error.message);
        return null;
    }
}

async function createHostel(hostelData) {
    try {
        const response = await fetch(`${BASE_URL}/api/hostels/createhostel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(hostelData)
        });
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Hostel created: ${hostelData.hostelname}`);
            return data;
        } else {
            console.error(`❌ Failed to create hostel ${hostelData.hostelname}:`, data);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error creating hostel ${hostelData.hostelname}:`, error.message);
        return null;
    }
}

async function createRoom(roomData) {
    try {
        const response = await fetch(`${BASE_URL}/api/rooms/createroom`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roomData)
        });
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Room created: ${roomData.roomNumber} in hostel ${roomData.hostelId}`);
            return data;
        } else {
            console.error(`❌ Failed to create room ${roomData.roomNumber}:`, data);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error creating room ${roomData.roomNumber}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting to create sample data...\n');

    // Step 1: Create users
    console.log('📝 Creating users...');
    const createdUsers = [];
    for (const user of users) {
        const result = await createUser(user);
        if (result) {
            createdUsers.push(result);
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between requests
    }
    console.log(`\n✅ Created ${createdUsers.length} users\n`);

    // Step 2: Create hostels
    console.log('🏠 Creating hostels...');
    const createdHostels = [];
    for (const hostel of hostels) {
        const result = await createHostel(hostel);
        if (result && result.data && result.data.id) {
            createdHostels.push(result.data);
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between requests
    }
    console.log(`\n✅ Created ${createdHostels.length} hostels\n`);

    // Step 3: Create rooms for each hostel
    console.log('🚪 Creating rooms...');
    let totalRooms = 0;
    for (const hostel of createdHostels) {
        if (!hostel || !hostel.id) continue;
        
        // Create 4-5 rooms per hostel
        const roomsPerHostel = 5;
        for (let i = 1; i <= roomsPerHostel; i++) {
            const roomData = {
                hostelId: hostel.id,
                roomNumber: `${i}01`,
                floor: Math.floor((i - 1) / 2) + 1,
                type: i % 2 === 0 ? "DOUBLE" : "TRIPLE",
                capacity: i % 2 === 0 ? 2 : 3,
                price: 15000 + (i * 1000),
                pricepernight: 500 + (i * 50),
                monthlyrent: 15000 + (i * 1000),
                status: "AVAILABLE",
                amenities: ["WiFi", "AC", "Attached Bathroom"],
                images: []
            };
            
            const result = await createRoom(roomData);
            if (result) {
                totalRooms++;
            }
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms between requests
        }
    }
    console.log(`\n✅ Created ${totalRooms} rooms\n`);

    console.log('🎉 Sample data creation completed!');
    console.log(`\nSummary:`);
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Hostels: ${createdHostels.length}`);
    console.log(`- Rooms: ${totalRooms}`);
}

// Run the script
main().catch(console.error);

