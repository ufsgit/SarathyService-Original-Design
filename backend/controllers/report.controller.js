const pool = require('../config/db');

// Job Card Summary
exports.getJobCardSummary = async (req, res) => {
    try {
        const { from_date, to_date, branch, mechanic, advisor, repair_types, insurance_companies, service_type } = req.body;
        
        // Base Query joining with necessary tables
        let query = `
            SELECT i.*, 
                   b.branch_name, b.branch_id,
                   e1.e_first_name as advisor_name,
                   e2.e_first_name as mechanic_name,
                   ic.icompany_name, ic.icompany_gst, ic.icompany_address
            FROM tbl_invoice_labour i
            LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch
            LEFT JOIN tbl_employee e1 ON e1.emp_id = i.inv_advisername
            LEFT JOIN tbl_employee e2 ON e2.emp_id = i.inv_mechna
            LEFT JOIN tbl_insurance_company ic ON ic.com_id = i.insurance_id
            WHERE i.inv_jcard_date BETWEEN ? AND ?
        `;
        const params = [from_date, to_date];

        if (branch) { query += ' AND i.inv_branch = ?'; params.push(branch); }
        if (mechanic && mechanic.length > 0) { query += ' AND i.inv_mechna IN (?)'; params.push(mechanic); }
        if (advisor && advisor.length > 0) { query += ' AND i.inv_advisername IN (?)'; params.push(advisor); }
        if (repair_types && repair_types.length > 0) { query += ' AND i.inv_repair_typ IN (?)'; params.push(repair_types); }
        if (insurance_companies && insurance_companies.length > 0) { query += ' AND i.insurance_id IN (?)'; params.push(insurance_companies); }
        
        // Service type mapping (Legacy mapping: Paid Service -> Cash)
        if (service_type) {
            if (service_type === 'Paid Service') {
                query += " AND (i.inv_type = 'Paid Service' OR i.inv_type = 'Cash')";
            } else if (service_type === 'Free Service') {
                query += " AND (i.inv_type = 'Free Service' OR i.inv_type = 'Free')";
            } else {
                query += ' AND i.inv_type = ?';
                params.push(service_type);
            }
        }

        query += ' ORDER BY i.inv_jcard_date DESC';

        const [rows] = await pool.query(query, params);

        // Fetch detailed items for all these invoices to calculate Labour vs Parts totals
        const invoiceIds = rows.map(r => r.inv_id);
        let labourTaxable = 0;
        let partsTaxable = 0;
        let labourGst = 0;
        let partsGst = 0;

        if (invoiceIds.length > 0) {
            const [items] = await pool.query(
                'SELECT lc_sacode, lc_tax_amunt, lc_sgst_a, lc_cgst_a FROM tbl_invoice_labour_cost WHERE ic_inv_id IN (?)',
                [invoiceIds]
            );
            
            const parse = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);

            items.forEach(item => {
                const taxable = parse(item.lc_tax_amunt);
                const gst = parse(item.lc_sgst_a) + parse(item.lc_cgst_a);
                
                // Typical HSN for Labour starts with 9987 (Services related to motor vehicles)
                if (item.lc_sacode && item.lc_sacode.startsWith('9987')) {
                    labourTaxable += taxable;
                    labourGst += gst;
                } else {
                    partsTaxable += taxable;
                    partsGst += gst;
                }
            });
        }

        // Calculate Overall Totals Safely
        const parse = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);

        const totals = rows.reduce((acc, r) => {
            acc.total_paid_service += (r.inv_type === 'Paid Service' || r.inv_type === 'Cash') ? parse(r.inv_total) : 0;
            acc.total_free_service += (r.inv_type === 'Free Service' || r.inv_type === 'Free') ? parse(r.inv_total) : 0;
            acc.total_expense += (r.inv_type === 'Expense') ? parse(r.inv_total) : 0;
            acc.total_discount += parse(r.inv_disc_total);
            acc.total_taxable += parse(r.inv_taxtotal);
            acc.total_sgst += parse(r.inv_sgstotal);
            acc.total_cgst += parse(r.inv_gsttotal);
            acc.total_kfc += parse(r.inv_cesstotal);
            acc.grand_total += parse(r.inv_total);
            return acc;
        }, {
            total_paid_service: 0, total_free_service: 0, total_expense: 0,
            total_discount: 0, total_taxable: 0, total_sgst: 0,
            total_cgst: 0, total_kfc: 0, grand_total: 0
        });

        // Add detailed totals
        totals.labour_taxable = labourTaxable;
        totals.parts_taxable = partsTaxable;
        totals.labour_amount = labourTaxable + labourGst;
        totals.parts_amount = partsTaxable + partsGst;
        totals.total_gst = totals.total_sgst + totals.total_cgst;

        res.json({ data: rows, totals });
    } catch (err) {
        console.error('getJobCardSummary error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Job Card Statement (flat table with same filters as Summary)
exports.getJobCardStatement = async (req, res) => {
    try {
        const { from_date, to_date, branch, service_type, mechanic, advisor,
                repair_types, insurance_companies } = req.body;

        let query = `
            SELECT i.*,
                   b.branch_name, b.branch_id,
                   e1.e_first_name as advisor_name,
                   e2.e_first_name as mechanic_name,
                   ic.icompany_name
            FROM tbl_invoice_labour i
            LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch
            LEFT JOIN tbl_employee e1 ON e1.emp_id = i.inv_advisername
            LEFT JOIN tbl_employee e2 ON e2.emp_id = i.inv_mechna
            LEFT JOIN tbl_insurance_company ic ON ic.com_id = i.insurance_id
            WHERE i.inv_jcard_date BETWEEN ? AND ?
        `;
        const params = [from_date, to_date];

        if (branch) { query += ' AND i.inv_branch = ?'; params.push(branch); }
        if (mechanic && mechanic.length > 0) { query += ' AND i.inv_mechna IN (?)'; params.push(mechanic); }
        if (advisor && advisor.length > 0) { query += ' AND i.inv_advisername IN (?)'; params.push(advisor); }
        if (repair_types && repair_types.length > 0) { query += ' AND i.inv_repair_typ IN (?)'; params.push(repair_types); }
        if (insurance_companies && insurance_companies.length > 0) { query += ' AND i.insurance_id IN (?)'; params.push(insurance_companies); }

        if (service_type) {
            if (service_type === 'Paid Service') {
                query += " AND (i.inv_type = 'Paid Service' OR i.inv_type = 'Cash')";
            } else if (service_type === 'Free Service') {
                query += " AND (i.inv_type = 'Free Service' OR i.inv_type = 'Free')";
            } else {
                query += ' AND i.inv_type = ?'; params.push(service_type);
            }
        }

        query += ' ORDER BY i.inv_jcard_date DESC';

        const [rows] = await pool.query(query, params);

        // Attach labour items to each invoice
        for (let inv of rows) {
            const [items] = await pool.query(
                'SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?',
                [inv.inv_id]
            );
            inv.items = items;
        }

        // Build totals
        const parse = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);
        const totals = rows.reduce((acc, r) => {
            acc.total_taxable  += parse(r.inv_taxtotal);
            acc.total_discount += parse(r.inv_disc_total);
            acc.total_kfc      += parse(r.inv_cesstotal);
            acc.grand_total    += parse(r.inv_total);
            return acc;
        }, { total_taxable: 0, total_discount: 0, total_kfc: 0, grand_total: 0 });

        res.json({ data: rows, totals });
    } catch (err) {
        console.error('getJobCardStatement error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


// Previous Labour Bills
exports.getPreviousLabourBills = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM tbl_invoice_labour WHERE status = 1 ORDER BY inv_id DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Previous Insurance Bills
exports.getPreviousInsuranceBills = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM tbl_invoice_labour WHERE status = 2 ORDER BY inv_id DESC'
        );
        res.json(rows);
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
