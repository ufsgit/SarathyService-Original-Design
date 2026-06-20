const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (uploads)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Bajaj Services API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/branches', require('./routes/branch.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/labours', require('./routes/labour.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/models', require('./routes/model.routes'));
app.use('/api/insurance-companies', require('./routes/insurance.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/jobcards', require('./routes/jobcard.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/vehicle-history', require('./routes/vehicle-history.routes'));
app.use('/api/brand', require('./routes/brand.routes'));
app.use('/api/logo', require('./routes/logo.routes'));
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Bajaj Services API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
