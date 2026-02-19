// Script to create rooms for existing hostels
const BASE_URL = 'http://localhost:3000';

async function getHostels() {
    try {
        const response = await fetch(`${BASE_URL}/api/hostels`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching hostels:', error);
        return [];
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
        if (response.ok && data.success) {
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
    console.log('🚀 Starting to create rooms...\n');

    // Get existing hostels
    console.log('📋 Fetching hostels...');
    const hostels = await getHostels();
    console.log(`Found ${hostels.length} hostels\n`);

    if (hostels.length === 0) {
        console.log('❌ No hostels found. Please create hostels first.');
        return;
    }

    // Create rooms for each hostel
    console.log('🚪 Creating rooms...');
    let totalRooms = 0;
    for (const hostel of hostels) {
        if (!hostel || !hostel.id) continue;
        
        console.log(`\nCreating rooms for: ${hostel.name}`);
        
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
    console.log('🎉 Room creation completed!');
}

// Run the script
main().catch(console.error);



