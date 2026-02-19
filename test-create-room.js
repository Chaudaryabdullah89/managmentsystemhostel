// Simple test to create a room via API
// Replace HOSTEL_ID with an actual hostel ID from your database

const HOSTEL_ID = "cmjcoy58f000011l65hgen291"; // Your hostel ID

async function testRoomCreation() {
    const roomData = {
        hostelId: HOSTEL_ID,
        roomNumber: "101",
        floor: 1,
        type: "SINGLE",
        capacity: 1,
        price: 5000,
        pricepernight: 500,
        monthlyrent: 15000,
        status: "AVAILABLE",
        amenities: ["AC", "WiFi", "Attached Bathroom"],
        images: [],
        frequency: "DAILY",
        time: "10:00 AM",
        lastCleaned: new Date().toISOString()
    };

    console.log("📤 Sending request to create room...");
    console.log("Room Data:", JSON.stringify(roomData, null, 2));

    try {
        const response = await fetch("http://localhost:3000/api/rooms/createroom", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(roomData)
        });

        const result = await response.json();
        console.log("\n📥 Response:", JSON.stringify(result, null, 2));

        if (result.success) {
            console.log("\n✅ Room created successfully!");
            console.log("Room ID:", result.data.id);
            console.log("Room Number:", result.data.roomNumber);
            console.log("Floor:", result.data.floor);
            console.log("Type:", result.data.type);
            console.log("Monthly Rent:", result.data.monthlyrent);
            console.log("Price Per Night:", result.data.pricepernight);
        } else {
            console.log("\n❌ Error:", result.error);
        }
    } catch (error) {
        console.error("\n❌ Request failed:", error.message);
    }
}

testRoomCreation();
