-- ============================================================
-- Bajaj Services / Sarathy Motors - MySQL Database Schema
-- Migrated from CodeIgniter PHP Application
-- ============================================================

CREATE DATABASE IF NOT EXISTS `sarathy_service`
  CHARACTER SET utf8 COLLATE utf8_general_ci;

USE `sarathy_service`;

-- ============================================================
-- Admin Login Table
-- ============================================================
CREATE TABLE IF NOT EXISTS `admin_info` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_username` varchar(100) NOT NULL,
  `admin_password` varchar(255) NOT NULL,
  `admin_name` varchar(100) DEFAULT NULL,
  `admin_email` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Branch Table
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_branch` (
  `b_id` int(11) NOT NULL AUTO_INCREMENT,
  `branch_name` varchar(200) NOT NULL,
  `branch_address` text DEFAULT NULL,
  `branch_contact` varchar(50) DEFAULT NULL,
  `branch_email` varchar(150) DEFAULT NULL,
  `branch_gst` varchar(50) DEFAULT NULL,
  `branch_code` varchar(50) DEFAULT NULL,
  `branch_state` varchar(100) DEFAULT NULL,
  `branch_state_code` varchar(10) DEFAULT NULL,
  `branch_pan` varchar(50) DEFAULT NULL,
  `branch_cin` varchar(100) DEFAULT NULL,
  `branch_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`b_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Employee Table
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_employee` (
  `emp_id` int(11) NOT NULL AUTO_INCREMENT,
  `e_first_name` varchar(150) NOT NULL,
  `e_last_name` varchar(150) DEFAULT NULL,
  `e_address` text DEFAULT NULL,
  `e_contact` varchar(50) DEFAULT NULL,
  `e_email` varchar(150) DEFAULT NULL,
  `e_designation` varchar(100) DEFAULT NULL,
  `e_branch` int(11) DEFAULT NULL,
  `e_photo` varchar(255) DEFAULT NULL,
  `e_status` tinyint(1) DEFAULT 1,
  `e_id_proof` varchar(255) DEFAULT NULL,
  `e_type` varchar(50) DEFAULT NULL COMMENT 'mechanic, advisor, staff',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`emp_id`),
  KEY `fk_emp_branch` (`e_branch`),
  CONSTRAINT `fk_emp_branch` FOREIGN KEY (`e_branch`) REFERENCES `tbl_branch` (`b_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Login Details Table (Staff Login)
-- ============================================================
CREATE TABLE IF NOT EXISTS `login_details` (
  `lg_id` int(11) NOT NULL AUTO_INCREMENT,
  `login_id` varchar(100) NOT NULL,
  `login_password` varchar(255) NOT NULL,
  `emp_id` int(11) DEFAULT NULL,
  `login_status` tinyint(1) DEFAULT 1,
  `login_type` varchar(50) DEFAULT 'staff',
  `login_branch` int(11) DEFAULT NULL,
  `attempt_count` int(11) DEFAULT 0,
  `blocked` tinyint(1) DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lg_id`),
  KEY `fk_login_emp` (`emp_id`),
  CONSTRAINT `fk_login_emp` FOREIGN KEY (`emp_id`) REFERENCES `tbl_employee` (`emp_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Labour Table
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_labour` (
  `l_id` int(11) NOT NULL AUTO_INCREMENT,
  `l_name` varchar(200) NOT NULL,
  `l_hsn` varchar(100) DEFAULT NULL,
  `l_amount` decimal(10,2) DEFAULT 0.00,
  `l_gst` decimal(5,2) DEFAULT 0.00,
  `l_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`l_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Customer Details Table
-- ============================================================
CREATE TABLE IF NOT EXISTS `customer_details` (
  `c_id` int(11) NOT NULL AUTO_INCREMENT,
  `c_name` varchar(200) NOT NULL,
  `c_address` text DEFAULT NULL,
  `c_reg_no` varchar(100) DEFAULT NULL,
  `c_chassis_no` varchar(100) DEFAULT NULL,
  `c_engine_no` varchar(100) DEFAULT NULL,
  `model_name` varchar(200) DEFAULT NULL,
  `c_contact_no` varchar(50) DEFAULT NULL,
  `gstin_no` varchar(50) DEFAULT NULL,
  `c_sales_date` date DEFAULT NULL,
  `c_email` varchar(150) DEFAULT NULL,
  `c_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`c_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Vehicle Model Table
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_model` (
  `mod_id` int(11) NOT NULL AUTO_INCREMENT,
  `mod_name` varchar(200) NOT NULL,
  `mod_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`mod_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Insurance Company Table
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_insurance_company` (
  `ic_id` int(11) NOT NULL AUTO_INCREMENT,
  `ic_name` varchar(200) NOT NULL,
  `ic_address` text DEFAULT NULL,
  `ic_contact` varchar(50) DEFAULT NULL,
  `ic_email` varchar(150) DEFAULT NULL,
  `ic_gst` varchar(50) DEFAULT NULL,
  `ic_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Invoice Labour Table (Main Invoice)
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_invoice_labour` (
  `inv_id` int(11) NOT NULL AUTO_INCREMENT,
  `inv_no` varchar(100) DEFAULT NULL,
  `inv_job_card_no` varchar(100) DEFAULT NULL,
  `in_registr` varchar(100) DEFAULT NULL,
  `inv_cus` varchar(200) DEFAULT NULL,
  `inv_cus_addres` text DEFAULT NULL,
  `inv_pho` varchar(50) DEFAULT NULL,
  `inv_email` varchar(150) DEFAULT NULL,
  `inv_gstin` varchar(50) DEFAULT NULL,
  `inv_modl` varchar(200) DEFAULT NULL,
  `inv_chassis` varchar(100) DEFAULT NULL,
  `inv_engine` varchar(100) DEFAULT NULL,
  `inv_km_in` varchar(50) DEFAULT NULL,
  `inv_km_out` varchar(50) DEFAULT NULL,
  `inv_jcard_date` date DEFAULT NULL,
  `inv_inv_date` date DEFAULT NULL,
  `inv_total` decimal(12,2) DEFAULT 0.00,
  `inv_discount` decimal(10,2) DEFAULT 0.00,
  `inv_grand_total` decimal(12,2) DEFAULT 0.00,
  `inv_cgst` decimal(10,2) DEFAULT 0.00,
  `inv_sgst` decimal(10,2) DEFAULT 0.00,
  `inv_igst` decimal(10,2) DEFAULT 0.00,
  `inv_net_amount` decimal(12,2) DEFAULT 0.00,
  `inv_round_off` decimal(5,2) DEFAULT 0.00,
  `inv_final_amount` decimal(12,2) DEFAULT 0.00,
  `inv_mechna` int(11) DEFAULT NULL,
  `inv_advisername` int(11) DEFAULT NULL,
  `inv_branch` int(11) DEFAULT NULL,
  `inv_repair_typ` varchar(100) DEFAULT NULL,
  `inv_service_typ` varchar(100) DEFAULT NULL,
  `inv_insurance_company` int(11) DEFAULT NULL,
  `inv_claim_no` varchar(100) DEFAULT NULL,
  `inv_policy_no` varchar(100) DEFAULT NULL,
  `inv_customer_voice` text DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1 COMMENT '1=labour, 2=insurance',
  `ready_status` tinyint(1) DEFAULT 0 COMMENT '0=not ready, 1=ready',
  `bill_status` tinyint(1) DEFAULT 0 COMMENT '0=pending, 1=billed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`inv_id`),
  KEY `fk_inv_branch` (`inv_branch`),
  KEY `fk_inv_mechanic` (`inv_mechna`),
  KEY `fk_inv_advisor` (`inv_advisername`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Invoice Labour Cost Table (Invoice Line Items)
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_invoice_labour_cost` (
  `ic_id` int(11) NOT NULL AUTO_INCREMENT,
  `ic_inv_id` int(11) DEFAULT NULL,
  `ic_particular` varchar(255) DEFAULT NULL,
  `ic_hsn` varchar(100) DEFAULT NULL,
  `ic_qty` int(11) DEFAULT 1,
  `ic_rate` decimal(10,2) DEFAULT 0.00,
  `ic_amount` decimal(10,2) DEFAULT 0.00,
  `ic_gst_per` decimal(5,2) DEFAULT 0.00,
  `ic_gst_amt` decimal(10,2) DEFAULT 0.00,
  `ic_total` decimal(10,2) DEFAULT 0.00,
  `ic_type` varchar(50) DEFAULT NULL COMMENT 'spare, labour',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ic_id`),
  KEY `fk_ic_inv` (`ic_inv_id`),
  CONSTRAINT `fk_ic_inv` FOREIGN KEY (`ic_inv_id`) REFERENCES `tbl_invoice_labour` (`inv_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Notifications Table
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_notification` (
  `n_id` int(11) NOT NULL AUTO_INCREMENT,
  `n_title` varchar(255) DEFAULT NULL,
  `n_message` text DEFAULT NULL,
  `n_image` varchar(255) DEFAULT NULL,
  `n_status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`n_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Insert Default Admin
-- ============================================================
INSERT INTO `admin_info` (`admin_username`, `admin_password`, `admin_name`)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator')
ON DUPLICATE KEY UPDATE `admin_id` = `admin_id`;
-- Default password: 'password' (bcrypt hashed)
