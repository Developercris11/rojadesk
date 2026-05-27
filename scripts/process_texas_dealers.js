const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\csmar\\Downloads\\Motor Vehicle Dealer-2026-Mar-02-05-30-04.xls';
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'texas_dealers.json');

try {
    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} total rows.`);

    const dealersMap = new Map();

    data.forEach(row => {
        // Find matching keys regardless of case/format
        const name = row['BusinessName'] || row['Business Name'] || row['DBA'];
        const phone = row['Phone'] || row['Telephone'];
        const zip = row['Zip'] || row['Zip Code'] || row['ZIP'];

        if (name && phone && zip) {
            const key = `${name.toString().trim()}_${zip.toString().trim()}`;
            if (!dealersMap.has(key)) {
                dealersMap.set(key, {
                    name: name.toString().trim(),
                    phone: phone.toString().trim(),
                    zip: zip.toString().trim(),
                    state: 'Texas',
                    source: 'Texas DMV',
                    category: 'Independent Dealer',
                    score: 'Verified'
                });
            }
        }
    });

    const uniqueDealers = Array.from(dealersMap.values());
    console.log(`Extracted ${uniqueDealers.length} unique dealers after removing duplicates.`);

    // Ensure the lib directory exists
    const libDir = path.dirname(outputPath);
    if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(uniqueDealers, null, 2));
    console.log(`Saved results to ${outputPath}`);

} catch (error) {
    console.error('Error processing Texas dealers:', error.message);
}
