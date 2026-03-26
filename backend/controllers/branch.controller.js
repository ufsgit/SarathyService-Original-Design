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
        if (!branch_id) return res.status(400).json({ message: 'Branch ID is required' });
        if (!branch_name) return res.status(400).json({ message: 'Branch Name is required' });

        const [existing] = await pool.query(
            'SELECT b_id FROM tbl_branch WHERE branch_id = ? OR branch_name = ?',
            [branch_id, branch_name]
        );
        if (existing.length > 0) return res.status(409).json({ message: 'Branch ID or Branch Name already exists' });

        const [result] = await pool.query(
            'INSERT INTO tbl_branch (branch_name, branch_address, branch_ph, branch_id) VALUES (?, ?, ?, ?)',
            [branch_name, branch_address || '', branch_ph || '', branch_id]
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

// Get paginated branches with search
exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * pageSize;

        let where = '';
        const params = [];
        if (search) {
            where = ' WHERE branch_name LIKE ? OR branch_id LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM tbl_branch${where}`, params);
        const [rows] = await pool.query(`SELECT * FROM tbl_branch${where} ORDER BY b_id DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset]);

        res.json({ data: rows, total, page, pageSize });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
