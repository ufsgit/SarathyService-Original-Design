const pool = require('../config/db');
//const storedProcedure=require('../helpers/stored-procedure');

// Get all branches
// exports.getAll = async (req, res) => {
//     try {
//         const [rows] = await pool.query('SELECT * FROM tbl_branch ORDER BY b_id DESC');
//         res.json(rows);
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

exports.getAll = async (req, res) => {
    debugger;
    try {
        const [result] = await pool.query('CALL sp_get_all_branches()');
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get single branch
// exports.getById = async (req, res) => {
//     try {
//         const [rows] = await pool.query('SELECT * FROM tbl_branch WHERE b_id = ?', [req.params.id]);
//         if (rows.length === 0) return res.status(404).json({ message: 'Branch not found' });
//         res.json(rows[0]);
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };
exports.getById = async (req, res) => {
    try {
        const [result] = await pool.query(
            'CALL sp_get_branch_by_id(?)',
            [req.params.id]
        );

        if (result[0].length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.json(result[0][0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create branch
// exports.create = async (req, res) => {
//     try {
//         const { branch_name, branch_address, branch_ph, branch_id, logo } = req.body;
//         if (!branch_id) return res.status(400).json({ message: 'Branch ID is required' });
//         if (!branch_name) return res.status(400).json({ message: 'Branch Name is required' });

//         const [existing] = await pool.query(
//             'SELECT b_id FROM tbl_branch WHERE branch_id = ? OR branch_name = ?',
//             [branch_id, branch_name]
//         );
//         if (existing.length > 0) return res.status(409).json({ message: 'Branch ID or Branch Name already exists' });

//         const [result] = await pool.query(
//             'INSERT INTO tbl_branch (branch_name, branch_address, branch_ph, branch_id, logo) VALUES (?, ?, ?, ?, ?)',
//             [branch_name, branch_address || '', branch_ph || '', branch_id, logo || null]
//         );
//         res.status(201).json({ message: 'Branch created', id: result.insertId });
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

exports.create = async (req, res) => {
    try {
        const { branch_name, branch_address, branch_ph, branch_id, logo } = req.body;
        if (!branch_id) {
            return res.status(400).json({ message: 'Branch ID is required' });
        }
        if (!branch_name) {
            return res.status(400).json({ message: 'Branch Name is required' });
        }
        const [result] = await pool.query(
            'CALL sp_create_branch(?, ?, ?, ?, ?)',
            [
                branch_name,
                branch_address || '',
                branch_ph || '',
                branch_id,
                logo || null
            ]
        );
        res.status(201).json({
            message: 'Branch created'
        });
    } catch (err) {
        if (err.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(409).json({ message: err.sqlMessage });
        }
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};


// Update branch
// exports.update = async (req, res) => {
//     try {
//         const { branch_name, branch_address, branch_ph, branch_id, logo } = req.body;
//         const id = req.params.id;

//         if (!branch_id) return res.status(400).json({ message: 'Branch ID is required' });
//         if (!branch_name) return res.status(400).json({ message: 'Branch Name is required' });

//         const [existing] = await pool.query(
//             'SELECT b_id FROM tbl_branch WHERE (branch_id = ? OR branch_name = ?) AND b_id != ?',
//             [branch_id, branch_name, id]
//         );

//         if (existing.length > 0) {
//             return res.status(409).json({ message: 'Branch ID or Branch Name already exists' });
//         }

//         await pool.query(
//             'UPDATE tbl_branch SET branch_name = ?, branch_address = ?, branch_ph = ?, branch_id = ?, logo = ? WHERE b_id = ?',
//             [branch_name, branch_address || '', branch_ph || '', branch_id, logo || null, id]
//         );
//         res.json({ message: 'Branch updated' });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };
exports.update = async (req, res) => {
    try {
        const {
            b_id,
            branch_id,
            branch_name,
            branch_address,
            branch_ph,
            logo
        } = req.body;

        const [result] = await pool.query(
            'CALL sp_create_branch(?, ?, ?, ?, ?, ?)',
            [
                b_id || 0,
                branch_id,
                branch_name,
                branch_address,
                branch_ph,
                logo
            ]
        );

        res.json({
            success: true,
            message: (b_id && b_id > 0) ? 'Branch updated' : 'Branch created',
            b_id: result[0][0].b_id_
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};



// Delete branch
// exports.remove = async (req, res) => {
//     try {
//         await pool.query('DELETE FROM tbl_branch WHERE b_id = ?', [req.params.id]);
//         res.json({ message: 'Branch deleted' });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

exports.remove = async (req, res) => {
    try {
        const [result] = await pool.query(
            'CALL sp_delete_branch(?)',
            [req.params.id]
        );

        if (result[0][0].affected_rows === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.json({ message: 'Branch deleted' });

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};

// Get paginated branches with search
// exports.getPaginated = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const pageSize = parseInt(req.query.pageSize) || 10;
//         const search = req.query.search || '';
//         const offset = (page - 1) * pageSize;

//         let where = '';
//         const params = [];
//         if (search) {
//             where = ' WHERE branch_name LIKE ? OR branch_id LIKE ?';
//             params.push(`%${search}%`, `%${search}%`);
//         }

//         const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM tbl_branch${where}`, params);
//         const [rows] = await pool.query(`SELECT * FROM tbl_branch${where} ORDER BY b_id DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset]);

//         res.json({ data: rows, total, page, pageSize });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';

        const [result] = await pool.query(
            'CALL sp_get_branch_paginated(?, ?, ?)',
            [search, page, pageSize]
        );

        res.json({
            data: result[1],
            total: result[0][0].total,
            page,
            pageSize
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};

