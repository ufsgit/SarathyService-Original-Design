const pool = require('../config/db');

// Job Card Summary
exports.getJobCardSummary = async (req, res) => {
    try {
        const { from_date, to_date, branch, mechanic, advisor, repair_types, insurance_companies, service_type, page = 1, pageSize = 10 } = req.body;
        const offset = (page - 1) * pageSize;

        // Base Filter
        let whereClause = 'WHERE i.inv_inv_date >= ? AND i.inv_inv_date <= ?';
        const params = [`${from_date} 00:00:00`, `${to_date} 23:59:59`];

        if (branch && branch.length > 0) {
            whereClause += ' AND i.inv_branch IN (?)';
            params.push(branch);
        }
        if (mechanic && mechanic.length > 0) {
            whereClause += ' AND (i.inv_mechna IN (?) OR i.inv_mechna IN (SELECT e_first_name FROM tbl_employee WHERE emp_id IN (?)))';
            params.push(mechanic, mechanic);
        }
        if (advisor && advisor.length > 0) {
            whereClause += ' AND (i.inv_advisername IN (?) OR i.inv_advisername IN (SELECT e_first_name FROM tbl_employee WHERE emp_id IN (?)))';
            params.push(advisor, advisor);
        }
        if (repair_types && repair_types.length > 0) { whereClause += ' AND i.inv_repair_typ IN (?)'; params.push(repair_types); }
        if (insurance_companies && insurance_companies.length > 0) { whereClause += ' AND i.insurance_id IN (?)'; params.push(insurance_companies); }

        if (service_type && service_type !== 'ALL') {
            if (service_type === 'Paid Service') {
                whereClause += " AND EXISTS (SELECT 1 FROM tbl_invoice_labour_cost lc WHERE lc.ic_inv_id = i.inv_id AND (lc.lc_type = 'Paid Service' OR lc.lc_type = 'Cash'))";
            } else if (service_type === 'Free Service') {
                whereClause += " AND EXISTS (SELECT 1 FROM tbl_invoice_labour_cost lc WHERE lc.ic_inv_id = i.inv_id AND (lc.lc_type = 'Free Service' OR lc.lc_type = 'Free'))";
            } else if (service_type === 'Expense') {
                whereClause += " AND EXISTS (SELECT 1 FROM tbl_invoice_labour_cost lc WHERE lc.ic_inv_id = i.inv_id AND (lc.lc_type = 'Expense' OR lc.lc_type = 'expense'))";
            } else {
                whereClause += " AND EXISTS (SELECT 1 FROM tbl_invoice_labour_cost lc WHERE lc.ic_inv_id = i.inv_id AND lc.lc_type = ?)";
                params.push(service_type);
            }
        }

        // SQL Queries
        const totalsQuery = `
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(CASE WHEN i.inv_repair_typ LIKE '%Free%' THEN 1 ELSE 0 END), 0) as total_free_service,
                COALESCE(SUM(CASE WHEN i.inv_repair_typ NOT LIKE '%Free%' THEN 1 ELSE 0 END), 0) as total_paid_service
            FROM tbl_invoice_labour i
            ${whereClause}
        `;

        const detailedTotalsQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN lc.lc_type = 'labour' THEN CAST(NULLIF(lc.lc_tax_amunt, '') AS DECIMAL(12,2)) ELSE 0 END), 0) as labour_taxable,
                COALESCE(SUM(CASE WHEN lc.lc_type = 'spare' OR lc.lc_type = 'parts' THEN CAST(NULLIF(lc.lc_tax_amunt, '') AS DECIMAL(12,2)) ELSE 0 END), 0) as parts_taxable,
                COALESCE(SUM(CASE WHEN lc.lc_type = 'labour' THEN (CAST(NULLIF(lc.lc_sgst_a, '') AS DECIMAL(12,2)) + CAST(NULLIF(lc.lc_cgst_a, '') AS DECIMAL(12,2))) ELSE 0 END), 0) as labour_gst,
                COALESCE(SUM(CASE WHEN lc.lc_type = 'spare' OR lc.lc_type = 'parts' THEN (CAST(NULLIF(lc.lc_sgst_a, '') AS DECIMAL(12,2)) + CAST(NULLIF(lc.lc_cgst_a, '') AS DECIMAL(12,2))) ELSE 0 END), 0) as parts_gst,
                COALESCE(SUM(CAST(NULLIF(lc.lc_tax_amunt, '') AS DECIMAL(12,2))), 0) as total_taxable,
                COALESCE(SUM(CAST(NULLIF(lc.lc_disc, '') AS DECIMAL(12,2))), 0) as total_discount,
                COALESCE(SUM(CAST(NULLIF(lc.lc_sgst_a, '') AS DECIMAL(12,2))), 0) as total_sgst,
                COALESCE(SUM(CAST(NULLIF(lc.lc_cgst_a, '') AS DECIMAL(12,2))), 0) as total_cgst,
                COALESCE(SUM(CAST(NULLIF(lc.lc_cess, '') AS DECIMAL(12,2))), 0) as total_kfc,
                COALESCE(SUM(CAST(NULLIF(lc.lc_amount, '') AS DECIMAL(12,2))), 0) as grand_total
            FROM tbl_invoice_labour_cost lc
            JOIN tbl_invoice_labour i ON i.inv_id = lc.ic_inv_id
            ${whereClause}
        `;

        const mainQuery = `
            SELECT i.*, b.branch_name, COALESCE(e.e_first_name, i.inv_mechna) as mechanic_name, COALESCE(a.e_first_name, i.inv_advisername) as advisor_name, ic.icompany_name
            FROM tbl_invoice_labour i
            LEFT JOIN tbl_branch b ON i.inv_branch = b.b_id
            LEFT JOIN tbl_employee e ON i.inv_mechna = e.emp_id
            LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
            LEFT JOIN tbl_insurance_company ic ON i.insurance_id = ic.com_id
            ${whereClause}
            ORDER BY i.inv_inv_date DESC, i.inv_id DESC
            LIMIT ? OFFSET ?
        `;

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
            total_discount: parseFloat(detailed.total_discount || 0),
            total_taxable: parseFloat(detailed.total_taxable || 0),
            total_sgst: parseFloat(detailed.total_sgst || 0),
            total_cgst: parseFloat(detailed.total_cgst || 0),
            total_kfc: parseFloat(detailed.total_kfc || 0),
            grand_total: parseFloat(detailed.grand_total || 0),
            labour_taxable: parseFloat(detailed.labour_taxable || 0),
            parts_taxable: parseFloat(detailed.parts_taxable || 0),
            labour_amount: parseFloat(detailed.labour_taxable || 0) + parseFloat(detailed.labour_gst || 0),
            parts_amount: parseFloat(detailed.parts_taxable || 0) + parseFloat(detailed.parts_gst || 0),
            total_gst: parseFloat(detailed.total_sgst || 0) + parseFloat(detailed.total_cgst || 0)
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
        let whereClause = 'WHERE i.inv_inv_date >= ? AND i.inv_inv_date <= ?';
        const params = [`${from_date} 00:00:00`, `${to_date} 23:59:59`];

        if (branch && branch.length > 0) {
            whereClause += ' AND i.inv_branch IN (?)';
            params.push(branch);
        }
        if (mechanic && mechanic.length > 0) {
            whereClause += ' AND (i.inv_mechna IN (?) OR i.inv_mechna IN (SELECT e_first_name FROM tbl_employee WHERE emp_id IN (?)))';
            params.push(mechanic, mechanic);
        }
        if (advisor && advisor.length > 0) {
            whereClause += ' AND (i.inv_advisername IN (?) OR i.inv_advisername IN (SELECT e_first_name FROM tbl_employee WHERE emp_id IN (?)))';
            params.push(advisor, advisor);
        }
        if (repair_types && repair_types.length > 0) { whereClause += ' AND i.inv_repair_typ IN (?)'; params.push(repair_types); }
        if (insurance_companies && insurance_companies.length > 0) { whereClause += ' AND i.insurance_id IN (?)'; params.push(insurance_companies); }

        if (labour_codes && labour_codes.length > 0) {
            whereClause += ' AND i.inv_id IN (SELECT ic_inv_id FROM tbl_invoice_labour_cost WHERE lc_lab_code IN (?))';
            params.push(labour_codes);
        }

        if (service_type && service_type !== 'ALL') {
            if (service_type === 'Paid Service') {
                whereClause += " AND EXISTS (SELECT 1 FROM tbl_invoice_labour_cost lc WHERE lc.ic_inv_id = i.inv_id AND (lc.lc_type = 'Paid Service' OR lc.lc_type = 'Cash'))";
            } else if (service_type === 'Free Service') {
                whereClause += " AND EXISTS (SELECT 1 FROM tbl_invoice_labour_cost lc WHERE lc.ic_inv_id = i.inv_id AND (lc.lc_type = 'Free Service' OR lc.lc_type = 'Free'))";
            } else if (service_type === 'Expense') {
                whereClause += " AND EXISTS (SELECT 1 FROM tbl_invoice_labour_cost lc WHERE lc.ic_inv_id = i.inv_id AND (lc.lc_type = 'Expense' OR lc.lc_type = 'expense'))";
            } else {
                whereClause += " AND EXISTS (SELECT 1 FROM tbl_invoice_labour_cost lc WHERE lc.ic_inv_id = i.inv_id AND lc.lc_type = ?)";
                params.push(service_type);
            }
        }

        let totalsParams = [...params];
        let itemConditions = '';

        if (labour_codes && labour_codes.length > 0) {
            itemConditions += ' AND lc.lc_lab_code IN (?)';
            totalsParams.push(labour_codes);
        }

        if (service_type && service_type !== 'ALL') {
            if (service_type === 'Paid Service') {
                itemConditions += " AND (lc.lc_type = 'Paid Service' OR lc.lc_type = 'Cash')";
            } else if (service_type === 'Free Service') {
                itemConditions += " AND (lc.lc_type = 'Free Service' OR lc.lc_type = 'Free')";
            } else if (service_type === 'Expense') {
                itemConditions += " AND (lc.lc_type = 'Expense' OR lc.lc_type = 'expense')";
            } else {
                itemConditions += " AND lc.lc_type = ?";
                totalsParams.push(service_type);
            }
        }

        // SQL Queries
        const totalsQuery = `
            SELECT 
                COUNT(DISTINCT i.inv_id) as total_count,
                COUNT(lc.ic_inv_id) as total_labour_codes,
                COALESCE(SUM(CAST(NULLIF(lc.lc_tax_amunt, '') AS DECIMAL(12,2))), 0) as total_taxable,
                COALESCE(SUM(CAST(NULLIF(lc.lc_disc, '') AS DECIMAL(12,2))), 0) as total_discount,
                COALESCE(SUM(CAST(NULLIF(lc.lc_cess, '') AS DECIMAL(12,2))), 0) as total_kfc,
                COALESCE(SUM(CAST(NULLIF(lc.lc_amount, '') AS DECIMAL(12,2))), 0) as grand_total
            FROM tbl_invoice_labour i
            LEFT JOIN tbl_invoice_labour_cost lc ON i.inv_id = lc.ic_inv_id
            ${whereClause}
            ${itemConditions}
        `;

        const mainQuery = `
            SELECT i.*, b.branch_name, COALESCE(e.e_first_name, i.inv_mechna) as mechanic_name, COALESCE(a.e_first_name, i.inv_advisername) as advisor_name, ic.icompany_name
            FROM tbl_invoice_labour i
            LEFT JOIN tbl_branch b ON i.inv_branch = b.b_id
            LEFT JOIN tbl_employee e ON i.inv_mechna = e.emp_id
            LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
            LEFT JOIN tbl_insurance_company ic ON i.insurance_id = ic.com_id
            ${whereClause}
            ORDER BY i.inv_inv_date DESC, i.inv_id DESC
            LIMIT ? OFFSET ?
        `;

        // Execute queries in parallel
        const [
            [totalsRows],
            [rows]
        ] = await Promise.all([
            pool.query(totalsQuery, totalsParams),
            pool.query(mainQuery, [...params, parseInt(pageSize), parseInt(offset)])
        ]);

        const totalsResult = totalsRows[0];
        const totalCount = totalsResult.total_count || 0;

        const totals = {
            total_taxable: parseFloat(totalsResult.total_taxable || 0),
            total_discount: parseFloat(totalsResult.total_discount || 0),
            total_kfc: parseFloat(totalsResult.total_kfc || 0),
            grand_total: parseFloat(totalsResult.grand_total || 0),
            total_labour_codes: totalsResult.total_labour_codes || 0
        };

        let flattenedRows = [];
        // 3. Attach labour items to the paginated rows efficiently
        if (rows.length > 0) {
            const invIds = rows.map(r => r.inv_id);
            const [allItems] = await pool.query(
                'SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id IN (?)',
                [invIds]
            );

            // Map items back to invoices and flatten
            for (let inv of rows) {
                let items = allItems.filter(it => it.ic_inv_id === inv.inv_id);

                // If the user specifically filtered by labour codes, only show those items
                if (labour_codes && labour_codes.length > 0) {
                    items = items.filter(it => labour_codes.includes(it.lc_lab_code));
                }

                // Filter items to only match the selected service type
                if (service_type && service_type !== 'ALL') {
                    if (service_type === 'Paid Service') {
                        items = items.filter(it => it.lc_type === 'Paid Service' || it.lc_type === 'Cash');
                    } else if (service_type === 'Free Service') {
                        items = items.filter(it => it.lc_type === 'Free Service' || it.lc_type === 'Free');
                    } else if (service_type === 'Expense') {
                        items = items.filter(it => it.lc_type === 'Expense' || it.lc_type === 'expense');
                    } else {
                        items = items.filter(it => it.lc_type === service_type);
                    }
                }

                if (items.length > 0) {
                    for (let it of items) {
                        flattenedRows.push({
                            ...inv,
                            labour_code: `${it.lc_lb_name}(${it.lc_lab_code})`,
                            inv_type: it.lc_type || inv.inv_type,
                            inv_rate: it.lc_rate,
                            inv_total: it.lc_amount,
                            inv_disc_total: it.lc_disc,
                            inv_taxtotal: it.lc_tax_amunt,
                            inv_cesstotal: it.lc_cess
                        });
                    }
                } else {
                    inv.labour_code = '';
                    flattenedRows.push(inv);
                }
            }
        }

        res.json({ data: flattenedRows, total: totalCount, totals, page: parseInt(page), pageSize: parseInt(pageSize) });
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
        const search = String(req.query.search || '').trim();
        const branchId = req.query.branchId;
        const offset = (page - 1) * pageSize;

        let whereClause = "WHERE ((status = 0) OR (status = 1 AND (insurance_id IS NULL OR insurance_id = 0) AND inv_repair_typ != 'Accidental Repair')) AND ready_status = 0";
        const params = [];

        if (branchId) {
            whereClause += " AND inv_branch = ?";
            params.push(branchId);
        }

        if (search) {
            whereClause += " AND (in_registr LIKE ? OR inv_cus LIKE ? OR inv_pho LIKE ? OR inv_no LIKE ? OR inv_job_card_no LIKE ?)";
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        // Count total records
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM tbl_invoice_labour ${whereClause}`, params);
        const total = countResult[0].total;

        // Fetch paginated data (Deferred Join Optimization)
        const [idRows] = await pool.query(
            `SELECT inv_id FROM tbl_invoice_labour ${whereClause} ORDER BY inv_id DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        let rows = [];
        if (idRows.length > 0) {
            const ids = idRows.map(r => r.inv_id);
            const [fullRows] = await pool.query(
                `SELECT tbl_invoice_labour.*, tbl_branch.branch_name 
                 FROM tbl_invoice_labour 
                 LEFT JOIN tbl_branch ON tbl_invoice_labour.inv_branch = tbl_branch.b_id 
                 WHERE tbl_invoice_labour.inv_id IN (?)
                 ORDER BY tbl_invoice_labour.inv_id DESC`,
                [ids]
            );
            rows = fullRows;
        }

        res.json({ data: rows, total, page, pageSize });
    } catch (err) {
        console.log("getPreviousLabourBills error:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Previous Insurance Bills (with Pagination)
exports.getPreviousInsuranceBills = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = String(req.query.search || '').trim();
        const branchId = req.query.branchId;
        const offset = (page - 1) * pageSize;

        let whereClause = "WHERE (status = 1 AND (insurance_id > 0 OR inv_repair_typ = 'Accidental Repair')) AND ready_status = 0";
        const params = [];

        if (branchId) {
            whereClause += " AND inv_branch = ?";
            params.push(branchId);
        }

        if (search) {
            whereClause += " AND (in_registr LIKE ? OR inv_cus LIKE ? OR inv_pho LIKE ? OR inv_no LIKE ? OR inv_job_card_no LIKE ?)";
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        // Count total records
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM tbl_invoice_labour ${whereClause}`, params);
        const total = countResult[0].total;

        // Fetch paginated data (Deferred Join Optimization)
        const [idRows] = await pool.query(
            `SELECT inv_id FROM tbl_invoice_labour ${whereClause} ORDER BY inv_id DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        let rows = [];
        if (idRows.length > 0) {
            const ids = idRows.map(r => r.inv_id);
            const [fullRows] = await pool.query(
                `SELECT tbl_invoice_labour.*, tbl_branch.branch_name 
                 FROM tbl_invoice_labour 
                 LEFT JOIN tbl_branch ON tbl_invoice_labour.inv_branch = tbl_branch.b_id 
                 WHERE tbl_invoice_labour.inv_id IN (?)
                 ORDER BY tbl_invoice_labour.inv_id DESC`,
                [ids]
            );
            rows = fullRows;
        }

        res.json({ data: rows, total, page, pageSize });
    } catch (err) {
        console.log("getPreviousInsuranceBills error:", err);
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
        console.log("getFilterOptions error:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
