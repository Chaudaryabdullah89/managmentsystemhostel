const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function (err, list) {
        if (err) return callback(err);
        let pending = list.length;
        if (!pending) return callback(null);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        if (!--pending) callback(null);
                    });
                } else {
                    if (file.match(/\.(jsx|js|ts|tsx)$/) && !file.includes('node_modules') && !file.includes('.next')) {
                        let content = fs.readFileSync(file, 'utf8');

                        let newContent = content
                            .replace(/GreenView Hostels/g, 'Mubarak Group of Hostels')
                            .replace(/GreenView Hostel/g, 'Mubarak Group of Hostels')
                            .replace(/GreenView Central/g, 'MGH Central')
                            .replace(/GreenView/g, 'MGH')
                            .replace(/Portal HMS Hostel/g, 'Mubarak Group of Hostels')
                            .replace(/Portal HMS/g, 'MGH');

                        if (content !== newContent) {
                            fs.writeFileSync(file, newContent);
                            console.log('Updated:', file);
                        }
                    }
                    if (!--pending) callback(null);
                }
            });
        });
    });
}

walk('/Users/macbook/Documents/Abdullah/Hostel-app/mangmentsystem/my-app/app', (err) => {
    if (err) console.error(err);
    else console.log('Done scanning apps directory');
});

walk('/Users/macbook/Documents/Abdullah/Hostel-app/mangmentsystem/my-app/components', (err) => {
    if (err) console.error(err);
    else console.log('Done scanning components directory');
});
