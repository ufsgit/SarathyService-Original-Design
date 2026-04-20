const pool = require('../config/db');

/**
 * Calculates the financial year prefix for a given date.
 * Financial year starts on April 1st.
 * @param {Date|string} date
 * @returns {string} 2-digit year prefix (e.g., '25' for FY starting 2025)
 */
function getFinancialYearPrefix(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // getMonth is 0-indexed

    // If month is April (4) or later, it's the current year's FY
    // If month is Jan-Mar (1-3), it's the previous year's FY
    const fyYear = month >= 4 ? year : year - 1;
    return String(fyYear).slice(-2);
}

/**
 * Generates the next available job card number for a given date.
 * Format: YY + sequence (minimum 5 digits)
 * @param {Date|string} date
 * @returns {Promise<string>} Next job card number
 */
async function generateNextJobCardNo(date) {
    const prefix = getFinancialYearPrefix(date);
    
    // Find the max sequence number for this prefix
    // Prefix is the first 2 digits
    // Order by length first, then by value, to ensure proper numeric sorting
    const [rows] = await pool.query(
        'SELECT inv_job_card_no FROM tbl_invoice_labour WHERE inv_job_card_no LIKE ? ORDER BY LENGTH(inv_job_card_no) DESC, inv_job_card_no DESC LIMIT 1',
        [`${prefix}%`]
    );

    let nextSequence = 1;
    if (rows.length > 0) {
        const lastNo = rows[0].inv_job_card_no;
        // Extract the sequence part (everything after the first 2 digits)
        const lastSequence = parseInt(lastNo.substring(2));
        if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
        }
    }

    // Pad sequence to 5 digits
    return prefix + String(nextSequence).padStart(5, '0');
}

module.exports = {
    getFinancialYearPrefix,
    generateNextJobCardNo
};
