const { getFinancialYearPrefix, generateNextJobCardNo } = require('./utils/jobCardHelper');

async function test() {
    console.log("Testing FY Prefix Logic:");
    const date1 = new Date('2024-03-31'); // Should be FY 23
    console.log(`Date: ${date1.toISOString().split('T')[0]} -> Prefix: ${getFinancialYearPrefix(date1)}`);

    const date2 = new Date('2024-04-01'); // Should be FY 24
    console.log(`Date: ${date2.toISOString().split('T')[0]} -> Prefix: ${getFinancialYearPrefix(date2)}`);

    const date3 = new Date('2025-03-31'); // Should be FY 24
    console.log(`Date: ${date3.toISOString().split('T')[0]} -> Prefix: ${getFinancialYearPrefix(date3)}`);

    const date4 = new Date('2025-04-01'); // Should be FY 25
    console.log(`Date: ${date4.toISOString().split('T')[0]} -> Prefix: ${getFinancialYearPrefix(date4)}`);

    console.log("\nTesting generateNextJobCardNo (Requires DB connection):");
    try {
        const nextNo1 = await generateNextJobCardNo(date1);
        console.log(`Next Job Card No for ${date1.toISOString().split('T')[0]}: ${nextNo1}`);
        const nextNo2 = await generateNextJobCardNo(date4);
        console.log(`Next Job Card No for ${date4.toISOString().split('T')[0]}: ${nextNo2}`);
    } catch (e) {
        console.error("DB error:", e.message);
    }
    process.exit(0);
}

test();
