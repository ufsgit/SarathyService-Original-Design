const pool = require('../config/db');

// Get all branches
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_branch ORDER BY b_id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get single branch
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_branch WHERE b_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Branch not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create branch
exports.create = async (req, res) => {
    try {
        const { branch_name, branch_address, branch_ph, branch_id } = req.body;
        const [result] = await pool.query(
            'INSERT INTO tbl_branch (branch_name, branch_address, branch_ph, branch_id) VALUES (?, ?, ?, ?)',
            [branch_name, branch_address || null, branch_ph || null, branch_id || null]
        );
        res.status(201).json({ message: 'Branch created', id: result.insertId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update branch
exports.update = async (req, res) => {
    try {
        const { branch_name, branch_address, branch_ph, branch_id } = req.body;
        await pool.query(
            'UPDATE tbl_branch SET branch_name = ?, branch_address = ?, branch_ph = ?, branch_id = ? WHERE b_id = ?',
            [branch_name, branch_address, branch_ph, branch_id, req.params.id]
        );
        res.json({ message: 'Branch updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete branch
exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM tbl_branch WHERE b_id = ?', [req.params.id]);
        res.json({ message: 'Branch deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get paginated branches
exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        let query = 'SELECT * FROM tbl_branch';
        let countQuery = 'SELECT COUNT(*) as total FROM tbl_branch';
        let params = [];
        
        if (search) {
            query += ' WHERE branch_name LIKE ? OR branch_id LIKE ?';
            countQuery += ' WHERE branch_name LIKE ? OR branch_id LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        query += ' ORDER BY b_id DESC LIMIT ? OFFSET ?';
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
