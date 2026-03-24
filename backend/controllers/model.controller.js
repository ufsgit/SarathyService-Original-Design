const pool = require('../config/db');

// Get all models
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_model ORDER BY model_id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get single model
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_model WHERE model_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create model
exports.create = async (req, res) => {
    try {
        const { mod_name, mod_code } = req.body;
        const [result] = await pool.query('INSERT INTO tbl_model (mod_name, mod_code) VALUES (?, ?)', [mod_name, mod_code || null]);
        res.status(201).json({ message: 'Model created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update model
exports.update = async (req, res) => {
    try {
        const { mod_name, mod_code } = req.body;
        await pool.query('UPDATE tbl_model SET mod_name = ?, mod_code = ? WHERE model_id = ?', [mod_name, mod_code, req.params.id]);
        res.json({ message: 'Model updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete model
exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM tbl_model WHERE model_id = ?', [req.params.id]);
        res.json({ message: 'Model deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get paginated models
exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        let query = 'SELECT * FROM tbl_model';
        let countQuery = 'SELECT COUNT(*) as total FROM tbl_model';
        let params = [];
        
        if (search) {
            query += ' WHERE mod_name LIKE ? OR mod_code LIKE ?';
            countQuery += ' WHERE mod_name LIKE ? OR mod_code LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        query += ' ORDER BY model_id DESC LIMIT ? OFFSET ?';
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
