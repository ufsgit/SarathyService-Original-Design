const pool = require('../config/db');

// Job Card Summary
exports.getJobCardSummary = async (req, res) => {
    try {
        const { from_date, to_date, branch, mechanic, advisor, repair_types, insurance_companies, service_type, page = 1, pageSize = 10 } = req.body;
        const offset = (page - 1) * pageSize;

        // Base Filter
        let whereClause = 'WHERE i.inv_jcard_date BETWEEN ? AND ?';
        const params = [from_date, to_date];

        if (branch) { whereClause += ' AND i.inv_branch = ?'; params.push(branch); }
        if (mechanic && mechanic.length > 0) { whereClause += ' AND i.inv_mechna IN (?)'; params.push(mechanic); }
        if (advisor && advisor.length > 0) { whereClause += ' AND i.inv_advisername IN (?)'; params.push(advisor); }
        if (repair_types && repair_types.length > 0) { whereClause += ' AND i.inv_repair_typ IN (?)'; params.push(repair_types); }
        if (insurance_companies && insurance_companies.length > 0) { whereClause += ' AND i.insurance_id IN (?)'; params.push(insurance_companies); }
        
        if (service_type) {
            if (service_type === 'Paid Service') {
                whereClause += " AND (i.inv_type = 'Paid Service' OR i.inv_type = 'Cash')";
            } else if (service_type === 'Free Service') {
                whereClause += " AND (i.inv_type = 'Free Service' OR i.inv_type = 'Free')";
            } else {
                whereClause += ' AND i.inv_type = ?';
                params.push(service_type);
            }
        }

        // Execute queries in parallel for maximum speed
        const [
            [totalsRows],
            [detailedRows],
            [rows]
        ] = await Promise.all([
            pool.query(totalsQuery, params),
            pool.query(detailedTotalsQuery, params),
            pool.query(mainQuery, [...params, parseInt(pageSize), parseInt(offset)])
        ]);

        const totalsResult = totalsRows[0];
        const detailed = detailedRows[0];
        const totalCount = totalsResult.total_count || 0;

        const totals = {
            total_paid_service: parseFloat(totalsResult.total_paid_service || 0),
            total_free_service: parseFloat(totalsResult.total_free_service || 0),
            total_expense: parseFloat(totalsResult.total_expense || 0),
            total_discount: parseFloat(totalsResult.total_discount || 0),
            total_taxable: parseFloat(totalsResult.total_taxable || 0),
            total_sgst: parseFloat(totalsResult.total_sgst || 0),
            total_cgst: parseFloat(totalsResult.total_cgst || 0),
            total_kfc: parseFloat(totalsResult.total_kfc || 0),
            grand_total: parseFloat(totalsResult.grand_total || 0),
            labour_taxable: parseFloat(detailed.labour_taxable || 0),
            parts_taxable: parseFloat(detailed.parts_taxable || 0),
            labour_amount: parseFloat(detailed.labour_taxable || 0) + parseFloat(detailed.labour_gst || 0),
            parts_amount: parseFloat(detailed.parts_taxable || 0) + parseFloat(detailed.parts_gst || 0),
            total_gst: parseFloat(totalsResult.total_sgst || 0) + parseFloat(totalsResult.total_cgst || 0)
        };

        res.json({ data: rows, total: totalCount, totals, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (err) {
        console.error('getJobCardSummary error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


// Job Card Statement (flat table with same filters as Summary)
exports.getJobCardStatement = async (req, res) => {
    try {
        const { from_date, to_date, branch, service_type, mechanic, advisor,
                repair_types, insurance_companies, labour_codes, page = 1, pageSize = 10 } = req.body;
        const offset = (page - 1) * pageSize;

        // Base Filter
        let whereClause = 'WHERE i.inv_jcard_date BETWEEN ? AND ?';
        const params = [from_date, to_date];

        if (branch) { whereClause += ' AND i.inv_branch = ?'; params.push(branch); }
        if (mechanic && mechanic.length > 0) { whereClause += ' AND i.inv_mechna IN (?)'; params.push(mechanic); }
        if (advisor && advisor.length > 0) { whereClause += ' AND i.inv_advisername IN (?)'; params.push(advisor); }
        if (repair_types && repair_types.length > 0) { whereClause += ' AND i.inv_repair_typ IN (?)'; params.push(repair_types); }
        if (insurance_companies && insurance_companies.length > 0) { whereClause += ' AND i.insurance_id IN (?)'; params.push(insurance_companies); }

        if (labour_codes && labour_codes.length > 0) {
            whereClause += ' AND i.inv_id IN (SELECT ic_inv_id FROM tbl_invoice_labour_cost WHERE lc_sacode IN (?))';
            params.push(labour_codes);
        }

        if (service_type) {
            if (service_type === 'Paid Service') {
                whereClause += " AND (i.inv_type = 'Paid Service' OR i.inv_type = 'Cash')";
            } else if (service_type === 'Free Service') {
                whereClause += " AND (i.inv_type = 'Free Service' OR i.inv_type = 'Free')";
            } else {
                whereClause += ' AND i.inv_type = ?'; params.push(service_type);
            }
        }

        // Execute queries in parallel
        const [
            [totalsRows],
            [labourCountResult],
            [rows]
        ] = await Promise.all([
            pool.query(totalsQuery, params),
            pool.query(`
                SELECT COUNT(*) as total_labour_codes 
                FROM tbl_invoice_labour_cost lc
                JOIN tbl_invoice_labour i ON i.inv_id = lc.ic_inv_id
                ${whereClause}
            `, params),
            pool.query(mainQuery, [...params, parseInt(pageSize), parseInt(offset)])
        ]);

        const totalsResult = totalsRows[0];
        const totalCount = totalsResult.total_count || 0;

        const totals = {
            total_taxable: parseFloat(totalsResult.total_taxable || 0),
            total_discount: parseFloat(totalsResult.total_discount || 0),
            total_kfc: parseFloat(totalsResult.total_kfc || 0),
            grand_total: parseFloat(totalsResult.grand_total || 0),
            total_labour_codes: labourCountResult[0].total_labour_codes || 0
        };

        // 3. Attach labour items to the paginated rows efficiently
        if (rows.length > 0) {
            const invIds = rows.map(r => r.inv_id);
            const [allItems] = await pool.query(
                'SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id IN (?)',
                [invIds]
            );
            
            // Map items back to invoices
            for (let inv of rows) {
                inv.items = allItems.filter(it => it.ic_inv_id === inv.inv_id);
                inv.labour_code = inv.items.map(it => it.lc_sacode).join(', ');
            }
        }

        res.json({ data: rows, total: totalCount, totals, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (err) {
        console.error('getJobCardStatement error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};




// Previous Labour Bills (with Pagination)
exports.getPreviousLabourBills = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * pageSize;

        let whereClause = "WHERE ((status = 0) OR (status = 1 AND (insurance_id IS NULL OR insurance_id = 0) AND inv_repair_typ != 'Accidental Repair')) AND ready_status = 0";
        const params = [];

        if (search) {
            whereClause += " AND (in_registr LIKE ? OR inv_cus LIKE ? OR inv_pho LIKE ? OR inv_no LIKE ? OR inv_job_card_no LIKE ?)";
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        // Count total records
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM tbl_invoice_labour ${whereClause}`, params);
        const total = countResult[0].total;

        // Fetch paginated data
        const [rows] = await pool.query(
            `SELECT * FROM tbl_invoice_labour ${whereClause} ORDER BY inv_id DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        res.json({ data: rows, total, page, pageSize });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Previous Insurance Bills (with Pagination)
exports.getPreviousInsuranceBills = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * pageSize;

        let whereClause = "WHERE (status = 1 AND (insurance_id > 0 OR inv_repair_typ = 'Accidental Repair')) AND ready_status = 0";
        const params = [];

        if (search) {
            whereClause += " AND (in_registr LIKE ? OR inv_cus LIKE ? OR inv_pho LIKE ? OR inv_no LIKE ? OR inv_job_card_no LIKE ?)";
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        // Count total records
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM tbl_invoice_labour ${whereClause}`, params);
        const total = countResult[0].total;

        // Fetch paginated data
        const [rows] = await pool.query(
            `SELECT * FROM tbl_invoice_labour ${whereClause} ORDER BY inv_id DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        res.json({ data: rows, total, page, pageSize });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Filter options (branches, mechanics, advisors, insurance companies)
exports.getFilterOptions = async (req, res) => {
    try {
        const [branches] = await pool.query('SELECT b_id, branch_name, branch_id FROM tbl_branch');
        const [mechanics] = await pool.query("SELECT emp_id, e_first_name, e_code FROM tbl_employee WHERE (e_designation LIKE '%mechanic%' OR e_designation = 'Mechanic') AND status = 'Active'");
        const [advisors] = await pool.query("SELECT emp_id, e_first_name, e_code FROM tbl_employee WHERE (e_designation LIKE '%advisor%' OR e_designation = 'Service Advisor') AND status = 'Active'");
        const [insuranceCompanies] = await pool.query("SELECT com_id, icompany_name FROM tbl_insurance_company");
        
        const repairTypes = [
            "First free service", "Second free service", "Third free service",
            "Paid service", "AMC service", "Accidental Repair",
            "Other Repairs(within warranty)", "Other Repairs(outside warranty)"
        ];

        res.json({ branches, mechanics, advisors, insuranceCompanies, repairTypes });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
