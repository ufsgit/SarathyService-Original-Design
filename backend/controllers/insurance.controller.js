const pool = require('../config/db');

// Get all insurance companies
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_insurance_company ORDER BY com_id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get single insurance company
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_insurance_company WHERE com_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create insurance company
exports.create = async (req, res) => {
    try {
        const { icompany_name, icompany_address, icompany_gst } = req.body;
        if (!icompany_name) return res.status(400).json({ message: 'Company Name is required' });
        if (!icompany_gst) return res.status(400).json({ message: 'GSTIN is required' });
        if (!icompany_address) return res.status(400).json({ message: 'Address is required' });

        const [result] = await pool.query(
            'INSERT INTO tbl_insurance_company (icompany_name, icompany_address, icompany_gst) VALUES (?, ?, ?)',
            [icompany_name, icompany_address || null, icompany_gst]
        );
        res.status(201).json({ message: 'Insurance company created', id: result.insertId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update insurance company
exports.update = async (req, res) => {
    try {
        const { icompany_name, icompany_address, icompany_gst } = req.body;
        await pool.query(
            'UPDATE tbl_insurance_company SET icompany_name = ?, icompany_address = ?, icompany_gst = ? WHERE com_id = ?',
            [icompany_name, icompany_address, icompany_gst, req.params.id]
        );
        res.json({ message: 'Insurance company updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete insurance company
exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM tbl_insurance_company WHERE com_id = ?', [req.params.id]);
        res.json({ message: 'Insurance company deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get paginated insurance companies
exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        let query = 'SELECT * FROM tbl_insurance_company';
        let countQuery = 'SELECT COUNT(*) as total FROM tbl_insurance_company';
        let params = [];
        
        if (search) {
            query += ' WHERE icompany_name LIKE ? OR icompany_gst LIKE ?';
            countQuery += ' WHERE icompany_name LIKE ? OR icompany_gst LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        query += ' ORDER BY com_id DESC LIMIT ? OFFSET ?';
        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, params.slice(0, search ? 2 : 0));
        
        res.json({
            data: rows,
            total: countResult[0].total,
            page: page,
            limit: limit
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
