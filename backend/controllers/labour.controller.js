const pool = require('../config/db');

// Get all labours
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                labour_id as l_id, 
                labour_code as l_code,
                labour_title as l_name, 
                discription as l_descr,
                repair_type as l_repair_type,
                sale_price as l_amount, 
                18 as l_gst 
            FROM tbl_labour_code 
            ORDER BY labour_id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('get all labour error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single labour
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                labour_id as l_id, 
                labour_code as l_code,
                labour_title as l_name, 
                discription as l_descr,
                repair_type as l_repair_type,
                sale_price as l_amount, 
                18 as l_gst 
            FROM tbl_labour_code 
            WHERE labour_id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Labour not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Create labour
exports.create = async (req, res) => {
    try {
        const d = req.body;
        if (!d.l_code) return res.status(400).json({ message: 'Labour Code is required' });
        if (!d.l_name) return res.status(400).json({ message: 'Labour Name is required' });

        const [existing] = await pool.query(
            'SELECT labour_id FROM tbl_labour_code WHERE labour_code = ?',
            [d.l_code]
        );
        if (existing.length > 0) return res.status(409).json({ message: 'Labour Code already exists' });

        const [result] = await pool.query(
            'INSERT INTO tbl_labour_code (labour_title, labour_code, sale_price, discription, repair_type) VALUES (?, ?, ?, ?, ?)',
            [d.l_name, d.l_code, d.l_amount || 0, d.l_descr || '', d.l_repair_type || 'Paid Service']
        );
        res.status(201).json({ message: 'Labour created successfully', id: result.insertId });
    } catch (error) {
        console.error('create labour error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update labour
exports.update = async (req, res) => {
    try {
        const d = req.body;
        const [result] = await pool.query(
            'UPDATE tbl_labour_code SET labour_title=?, labour_code=?, sale_price=?, discription=?, repair_type=? WHERE labour_id=?',
            [d.l_name, d.l_code, d.l_amount, d.l_descr || '', d.l_repair_type || 'Paid Service', req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Labour not found' });
        res.json({ message: 'Labour updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete labour
exports.remove = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM tbl_labour_code WHERE labour_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Labour not found' });
        res.json({ message: 'Labour deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get paginated labour codes with search
exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * pageSize;

        let where = '';
        const params = [];
        if (search) {
            where = ' WHERE labour_title LIKE ? OR labour_code LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM tbl_labour_code${where}`, params);
        const [rows] = await pool.query(
            `SELECT labour_id as l_id, labour_code as l_code, labour_title as l_name, discription as l_descr, repair_type as l_repair_type, sale_price as l_amount FROM tbl_labour_code${where} ORDER BY labour_id DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        res.json({ data: rows, total, page, pageSize });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
