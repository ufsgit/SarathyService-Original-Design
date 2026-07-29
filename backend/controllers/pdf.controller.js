const pool = require('../config/db');

// Get invoice data for frontend PDF generation
exports.getInvoicePdfData = async (req, res) => {
    const conn = await pool.getConnection();
    let connectionReleased = false;
    try {
        const [invoices] = await conn.query(
            `SELECT i.*, b.branch_name, b.branch_address, b.branch_ph, a.e_first_name AS adv_name, m.e_first_name AS mech_name, c.icompany_gst AS inv_insurance_gstin, c.icompany_address AS inv_insurance_address, lm.logo_url AS branch_logo_url  
             FROM tbl_invoice_labour i 
             INNER JOIN tbl_branch b ON b.b_id = i.inv_branch 
             LEFT JOIN logo_master lm ON b.logo = lm.logo_id
             LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
             LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
             LEFT JOIN tbl_insurance_company c ON i.insurance_id = c.com_id
             WHERE i.inv_id = ?`,
            [req.params.id]
        );

        if (invoices.length === 0) {
            conn.release();
            connectionReleased = true;
            return res.status(404).json({ message: 'Not found' });
        }

        let invoice = invoices[0];
        invoice.inv_advisername = invoice.adv_name || invoice.inv_advisername;
        invoice.inv_mechna = invoice.mech_name || invoice.inv_mechna;

        const [items] = await conn.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [req.params.id]);

        // Fetch active brand
        const [brandConfig] = await conn.query('SELECT * FROM tbl_brand_config WHERE brand_status = 1 LIMIT 1');
        if (brandConfig.length > 0) {
            invoice.active_brand = brandConfig[0].brand_name;
            invoice.active_brand_title = brandConfig[0].brand_title;
            invoice.active_brand_address = brandConfig[0].brand_address;
            invoice.active_brand_state = brandConfig[0].brand_state_code;
            invoice.active_brand_gstin = brandConfig[0].brand_gstin;
        } else {
            invoice.active_brand = '';
        }

        conn.release();
        connectionReleased = true;

        res.json({ invoice, items });
    } catch (err) {
        console.error('getInvoicePdfData error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        if (!connectionReleased) {
            conn.release();
        }
    }
};
