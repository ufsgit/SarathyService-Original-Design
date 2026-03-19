const pool = require('../config/db');

// Get all customers (optionally filtered by branch)
exports.getAll = async (req, res) => {
    try {
        let query = 'SELECT * FROM customer_details';
        const params = [];
        if (req.query.branchId) {
            query += ' WHERE c_branch = ?';
            params.push(req.query.branchId);
        }
        query += ' ORDER BY c_id DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('getAll Customers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Server-side DataTable
exports.dataTable = async (req, res) => {
    try {
        const { draw, start, length, search, order } = req.body;
        const searchValue = search?.value || '';
        const orderColumn = order?.[0]?.column || 0;
        const orderDir = order?.[0]?.dir || 'ASC';

        const columns = ['c_id', 'c_name', 'c_address', 'c_reg_no', 'c_chassis_no', 'c_engine_no', 'model_name', 'c_contact_no', 'gstin_no', 'c_sales_date', 'c_email'];
        const orderBy = columns[orderColumn] || 'c_id';

        let whereClause = '';
        let params = [];
        const { branchId } = req.query;

        if (branchId) {
            whereClause = 'WHERE c_branch = ?';
            params.push(branchId);
        }

        if (searchValue) {
            const searchConditions = columns.map(col => `${col} LIKE ?`).join(' OR ');
            if (whereClause) {
                whereClause += ` AND (${searchConditions})`;
            } else {
                whereClause = `WHERE ${searchConditions}`;
            }
            columns.forEach(() => params.push(`%${searchValue}%`));
        }

        const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM customer_details' + (branchId ? ' WHERE c_branch = ?' : ''), branchId ? [branchId] : []);
        const [filteredRows] = await pool.query(`SELECT COUNT(*) as total FROM customer_details ${whereClause}`, params);
        const [data] = await pool.query(
            `SELECT * FROM customer_details ${whereClause} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`,
            [...params, parseInt(length) || 10, parseInt(start) || 0]
        );

        res.json({
            draw: parseInt(draw),
            recordsTotal: totalRows[0].total,
            recordsFiltered: filteredRows[0].total,
            data
        });
    } catch (error) {
        console.error('DataTable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single customer
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customer_details WHERE c_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get customer by registration number
exports.getByRegistration = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customer_details WHERE c_reg_no = ?', [req.params.regNo]);
        if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if registration is unique
exports.checkRegistration = async (req, res) => {
    try {
        const { reg_no } = req.body;
        const [rows] = await pool.query('SELECT c_id FROM customer_details WHERE c_reg_no = ?', [reg_no]);
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Create customer
exports.create = async (req, res) => {
    try {
        const { c_name, c_address, c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no, gstin_no, c_sales_date, c_email, c_branch } = req.body;
        if (!c_name || !c_reg_no || !c_chassis_no || !c_engine_no) {
            return res.status(400).json({ message: 'Name, Registration No, Chassis No, and Engine No are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO customer_details (c_name, c_address, c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no, gstin_no, c_sales_date, c_email, c_branch)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [c_name, c_address, c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no, gstin_no, c_sales_date, c_email, c_branch || null]
        );
        res.status(201).json({ message: 'Customer created successfully', id: result.insertId });
    } catch (error) {
        console.error('Create Customer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update customer
exports.update = async (req, res) => {
    try {
        const { c_name, c_address, c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no, gstin_no, c_sales_date, c_email, c_branch } = req.body;
        const [result] = await pool.query(
            `UPDATE customer_details SET c_name=?, c_address=?, c_reg_no=?, c_chassis_no=?, c_engine_no=?, model_name=?, c_contact_no=?, gstin_no=?, c_sales_date=?, c_email=?, c_branch=? WHERE c_id=?`,
            [c_name, c_address, c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no, gstin_no, c_sales_date, c_email, c_branch, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Update Customer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete customer
exports.remove = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM customer_details WHERE c_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Search customers (autocomplete)
exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        const [rows] = await pool.query(
            'SELECT c_id, c_name, c_reg_no, c_contact_no, model_name FROM customer_details WHERE c_name LIKE ? OR c_reg_no LIKE ? LIMIT 20',
            [`%${q}%`, `%${q}%`]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
