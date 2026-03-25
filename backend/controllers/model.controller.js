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
        if (!mod_name) return res.status(400).json({ message: 'Model Name is required' });
        if (!mod_code) return res.status(400).json({ message: 'Model Code is required' });

        const [existing] = await pool.query(
            'SELECT model_id FROM tbl_model WHERE mod_code = ?',
            [mod_code]
        );
        if (existing.length > 0) return res.status(409).json({ message: 'Model Code already exists' });

        const [result] = await pool.query('INSERT INTO tbl_model (mod_name, mod_code) VALUES (?, ?)', [mod_name, mod_code]);
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
