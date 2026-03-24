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
        if (!d.l_name) return res.status(400).json({ message: 'Labour name is required' });

        const [result] = await pool.query(
            'INSERT INTO tbl_labour_code (labour_title, labour_code, sale_price, discription, repair_type) VALUES (?, ?, ?, ?, ?)',
            [d.l_name, d.l_code || '', d.l_amount || 0, d.l_descr || '', d.l_repair_type || 'Paid Service']
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

// Get paginated labours
exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        let query = `
            SELECT 
                labour_id as l_id, 
                labour_code as l_code,
                labour_title as l_name, 
                discription as l_descr,
                repair_type as l_repair_type,
                sale_price as l_amount, 
                18 as l_gst 
            FROM tbl_labour_code
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM tbl_labour_code';
        let params = [];
        
        if (search) {
            query += ' WHERE labour_code LIKE ? OR labour_title LIKE ?';
            countQuery += ' WHERE labour_code LIKE ? OR labour_title LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        query += ' ORDER BY labour_id DESC LIMIT ? OFFSET ?';
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
    } catch (error) {
        console.error('getPaginated labour error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
