
const http = require('http');

http.get('http://localhost:3000/api/bookings/0e01b88f-0cd5-45a9-bbb8-946d3469b8ff', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        console.log(data);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
