const pool = require('../config/db');

const sanitizeCustomerInput = (payload = {}) => {
    const sanitizedContactNo = String(payload.c_contact_no || '').replace(/\D/g, '').slice(0, 10);
    const sanitizedGstinNo = String(payload.gstin_no || '').replace(/[^0-9a-z]/gi, '').slice(0, 15).toUpperCase();

    return {
        ...payload,
        c_contact_no: sanitizedContactNo,
        gstin_no: sanitizedGstinNo
    };
};

const validateCustomerInput = ({ c_contact_no, gstin_no }) => {
    if (c_contact_no && !/^\d{10}$/.test(c_contact_no)) {
        return 'Contact number must be exactly 10 digits';
    }

    if (gstin_no && !/^[0-9A-Z]{1,15}$/.test(gstin_no)) {
        return 'GSTIN must contain only letters and numbers and be at most 15 characters';
    }

    return null;
};

// Get all customers (optionally filtered by branch)
exports.getAll = async (req, res) => {
    try {
        let query = 'SELECT * FROM customer_details';
        const params = [];
        query += ' ORDER BY c_id DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('getAll Customers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// exports.getAll = async (req, res) => {
//     try {
//         const [result] = await pool.query('CALL sp_get_all_customers()');
//         res.json(result[0]);
//     } catch (error) {
//         console.error('getAll Customers error:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

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

        if (searchValue) {
            const searchConditions = columns.map(col => `${col} LIKE ?`).join(' OR ');
            if (whereClause) {
                whereClause += ` AND (${searchConditions})`;
            } else {
                whereClause = `WHERE ${searchConditions}`;
            }
            columns.forEach(() => params.push(`%${searchValue}%`));
        }

        const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM customer_details');
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

// exports.dataTable = async (req, res) => {
//     try {
//         const { draw, start, length, search, order } = req.body;

//         const searchValue = search?.value || '';
//         const orderColumn = order?.[0]?.column || 0;
//         const orderDir = order?.[0]?.dir || 'ASC';

//         const [result] = await pool.query(
//             'CALL sp_customer_datatable(?, ?, ?, ?, ?)',
//             [
//                 searchValue,
//                 parseInt(start) || 0,
//                 parseInt(length) || 10,
//                 orderColumn,
//                 orderDir
//             ]
//         );

//         res.json({
//             draw: parseInt(draw),
//             recordsTotal: result[0][0].recordsTotal,
//             recordsFiltered: result[1][0].recordsFiltered,
//             data: result[2]
//         });

//     } catch (error) {
//         console.error('DataTable error:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

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

// exports.getById = async (req, res) => {
//     debugger;
//     console.log(req.params.id)
//     try {
//         const customerId = req.params.id;

//         const [result] = await pool.query(
//             "CALL sp_GetCustomerById(?)",
//             [customerId]
//         );
//         if (result[0].length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Customer not found"
//             });
//         }
//         return res.status(200).json({
//             success: true,
//             message: "Customer fetched successfully",
//             data: result[0][0]
//         });

//     } catch (error) {
//         console.error(error);

//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// };

// // Get customer by registration number
exports.getByRegistration = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customer_details WHERE c_reg_no = ?', [req.params.regNo]);
        if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get customer by registration number
// exports.getByRegistration = async (req, res) => {
//     try {
//         const regNo = req.params.regNo;

//         const [result] = await pool.query(
//             "CALL sp_GetCustomerByRegistration(?)",
//             [regNo]
//         );

//         if (result[0].length === 0) {
//             return res.status(404).json({
//                 message: "Customer not found"
//             });
//         }

//         res.json(result[0][0]);

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };


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

// exports.checkRegistration = async (req, res) => {
//     try {
//         const { reg_no } = req.body;

//         const [result] = await pool.query(
//             "CALL sp_CheckRegistration(?)",
//             [reg_no]
//         );

//         res.json({
//             exists: result[0].length > 0
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };


// Create customer
exports.create = async (req, res) => {
    try {
        const { c_name, c_address, c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no, gstin_no, c_sales_date, c_email } = sanitizeCustomerInput(req.body);

        if (!c_name || !c_reg_no || !c_chassis_no || !c_engine_no || !model_name) {
            return res.status(400).json({ message: 'Customer Name, Registration No, Chassis No, Engine No, and Model Name are required' });
        }

        const validationError = validateCustomerInput({ c_contact_no, gstin_no });
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const [existing] = await pool.query(
            'SELECT * FROM customer_details WHERE c_reg_no = ?',
            [c_reg_no]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Customer already exists with this Registration Number' });
        }

        const [result] = await pool.query(
            `INSERT INTO customer_details (c_name, c_address, c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no, gstin_no, c_sales_date, c_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [c_name, c_address || '', c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no || '', gstin_no || '', c_sales_date || null, c_email || '']
        );
        res.status(201).json({ message: 'Customer created successfully', id: result.insertId });
    } catch (error) {
        console.error('Create Customer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// exports.create = async (req, res) => {
//     try {
//         const {
//             c_name,
//             c_address,
//             c_reg_no,
//             c_chassis_no,
//             c_engine_no,
//             model_name,
//             c_contact_no,
//             gstin_no,
//             c_sales_date,
//             c_email
//         } = sanitizeCustomerInput(req.body);

//         if (!c_name || !c_reg_no || !c_chassis_no || !c_engine_no || !model_name) {
//             return res.status(400).json({
//                 message: "Customer Name, Registration No, Chassis No, Engine No, and Model Name are required"
//             });
//         }

//         const validationError = validateCustomerInput({ c_contact_no, gstin_no });

//         if (validationError) {
//             return res.status(400).json({ message: validationError });
//         }

//         const [existing] = await pool.query(
//             "SELECT c_id FROM customer_details WHERE c_reg_no = ?",
//             [c_reg_no]
//         );

//         if (existing.length > 0) {
//             return res.status(400).json({
//                 message: "Customer already exists with this Registration Number"
//             });
//         }

//         const [result] = await pool.query(
//             "CALL sp_CreateCustomer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
//             [
//                 c_name,
//                 c_address || "",
//                 c_reg_no,
//                 c_chassis_no,
//                 c_engine_no,
//                 model_name,
//                 c_contact_no || "",
//                 gstin_no || "",
//                 c_sales_date || null,
//                 c_email || ""
//             ]
//         );

//         res.status(201).json({
//             message: "Customer created successfully",
//             id: result[0][0].insertId
//         });

//     } catch (error) {
//         console.error("Create Customer error:", error);
//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };


// Update customer
exports.update = async (req, res) => {
    try {
        const { c_name, c_address, c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no, gstin_no, c_sales_date, c_email } = sanitizeCustomerInput(req.body);
        const id = req.params.id;

        if (!c_name || !c_reg_no || !c_chassis_no || !c_engine_no || !model_name) {
            return res.status(400).json({ message: 'Customer Name, Registration No, Chassis No, Engine No, and Model Name are required' });
        }
     
        const [existing] = await pool.query(
            'SELECT * FROM customer_details WHERE c_reg_no = ? AND c_id != ?',
            [c_reg_no, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Another customer already exists with this Registration Number' });
        }

        const validationError = validateCustomerInput({ c_contact_no, gstin_no });
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const [result] = await pool.query(
            `UPDATE customer_details SET c_name=?, c_address=?, c_reg_no=?, c_chassis_no=?, c_engine_no=?, model_name=?, c_contact_no=?, gstin_no=?, c_sales_date=?, c_email=? WHERE c_id=?`,
            [c_name, c_address || '', c_reg_no, c_chassis_no, c_engine_no, model_name, c_contact_no || '', gstin_no || '', c_sales_date || null, c_email || '', id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Update Customer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// exports.update = async (req, res) => {
//     try {
//         const {
//             c_name,
//             c_address,
//             c_reg_no,
//             c_chassis_no,
//             c_engine_no,
//             model_name,
//             c_contact_no,
//             gstin_no,
//             c_sales_date,
//             c_email
//         } = sanitizeCustomerInput(req.body);

//         const id = req.params.id;

//         if (!c_name || !c_reg_no || !c_chassis_no || !c_engine_no || !model_name) {
//             return res.status(400).json({
//                 message: "Customer Name, Registration No, Chassis No, Engine No, and Model Name are required"
//             });
//         }

//         const [existing] = await pool.query(
//             "SELECT c_id FROM customer_details WHERE c_reg_no = ? AND c_id != ?",
//             [c_reg_no, id]
//         );

//         if (existing.length > 0) {
//             return res.status(409).json({
//                 message: "Another customer already exists with this Registration Number"
//             });
//         }

//         const validationError = validateCustomerInput({
//             c_contact_no,
//             gstin_no
//         });

//         if (validationError) {
//             return res.status(400).json({
//                 message: validationError
//             });
//         }

//         const [result] = await pool.query(
//             "CALL sp_UpdateCustomer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
//             [
//                 id,
//                 c_name,
//                 c_address || "",
//                 c_reg_no,
//                 c_chassis_no,
//                 c_engine_no,
//                 model_name,
//                 c_contact_no || "",
//                 gstin_no || "",
//                 c_sales_date || null,
//                 c_email || ""
//             ]
//         );

//         if (result[0][0].affectedRows === 0) {
//             return res.status(404).json({
//                 message: "Customer not found"
//             });
//         }

//         res.json({
//             message: "Customer updated successfully"
//         });

//     } catch (error) {
//         console.error("Update Customer error:", error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };

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

// exports.remove = async (req, res) => {
//     try {
//         const id = req.params.id;

//         const [result] = await pool.query(
//             "CALL sp_DeleteCustomer(?)",
//             [id]
//         );

//         if (result[0][0].affectedRows === 0) {
//             return res.status(404).json({
//                 message: "Customer not found"
//             });
//         }

//         res.json({
//             message: "Customer deleted successfully"
//         });

//     } catch (error) {
//         console.error("Delete Customer error:", error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };

// Search customers (autocomplete)
exports.search = async (req, res) => {
    try {
        const search = (req.query.q || '').trim();
        let query = 'SELECT c_id, c_name, c_reg_no, c_contact_no, model_name FROM customer_details';
        const params = [];
        
        if (search) {
            const terms = search.split(/\s+/);
            const conditions = terms.map(() => '(c_name LIKE ? OR c_reg_no LIKE ? OR c_chassis_no LIKE ?)');
            query += ' WHERE ' + conditions.join(' AND ');
            terms.forEach(t => {
                const s = `%${t}%`;
                params.push(s, s, s);
            });
        }
        query += ' LIMIT 20';
        
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// exports.search = async (req, res) => {
//     try {
//         const search = (req.query.q || '').trim();

//         const [result] = await pool.query(
//             "CALL sp_SearchCustomer(?)",
//             [search]
//         );

//         res.json(result[0]);

//     } catch (error) {
//         console.error("Search Customer error:", error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };


exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = (req.query.search || '').trim();
        const offset = (page - 1) * pageSize;

        let where = '';
        const params = [];
        if (search) {
            const terms = search.split(/\s+/);
            const conditions = terms.map(() => '(c_name LIKE ? OR c_reg_no LIKE ? OR c_contact_no LIKE ? OR model_name LIKE ? OR c_chassis_no LIKE ?)');
            where = ' WHERE ' + conditions.join(' AND ');
            terms.forEach(t => {
                const s = `%${t}%`;
                params.push(s, s, s, s, s);
            });
        }

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM customer_details${where}`, params);
        const [rows] = await pool.query(`SELECT * FROM customer_details${where} ORDER BY c_id DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset]);

        res.json({ data: rows, total, page, pageSize });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// exports.getPaginated = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const pageSize = parseInt(req.query.pageSize) || 10;
//         const search = (req.query.search || '').trim();

//         const [result] = await pool.query(
//             "CALL sp_GetCustomerPaginated(?, ?, ?)",
//             [
//                 page,
//                 pageSize,
//                 search
//             ]
//         );

//         const total = result[0][0].total;
//         const rows = result[1];

//         res.json({
//             data: rows,
//             total,
//             page,
//             pageSize
//         });

//     } catch (err) {
//         console.error("Pagination error:", err);

//         res.status(500).json({
//             message: "Server error",
//             error: err.message
//         });
//     }
// };
