DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `createLabourInvoice`(IN inv_no_ varchar(100),inv_cus_ varchar(100),
inv_cus_addres_ varchar(100),inv_pho_ varchar(100),inv_cus_gstin_ varchar(100),inv_inv_date_ date,inv_type_ varchar(100),
inv_job_card_no_ varchar(100),inv_jcard_date_ date,inv_repair_typ_ varchar(100),inv_km_ varchar(100),in_registr_ varchar(100),
inv_chassis_ varchar(100),in_engine_ varchar(100),inv_modl_ varchar(100),inv_sale_date_ varchar(100),inv_taxpay_ varchar(100),
inv_advisername_ varchar(100),inv_mechna_ varchar(100),inv_branch_ varchar(100),inv_disc_total_ varchar(100),inv_taxtotal_ varchar(100),
inv_sgstotal_ varchar(100),inv_gsttotal_ varchar(100),inv_total_ varchar(100),insurance_id_ int,insurance_serveyor_ varchar(100),
status_ int,ready_status_ int,inv_cesstotal_ varchar(100),items_ json)
BEGIN
declare inv_id_ int;
SET inv_id_ = 0 ;
IF inv_no_ != '' THEN
    SET inv_id_ = (SELECT inv_id
                   FROM tbl_readyfor_labour
                   WHERE inv_no = inv_no_
                   LIMIT 1);
    IF inv_id_ IS NOT NULL AND inv_id_ > 0 THEN
        SET inv_id_ = -2;
    ELSE
        SET inv_id_ = (SELECT inv_id
                       FROM tbl_invoice_labour
                       WHERE inv_no = inv_no_
                       LIMIT 1);
        IF inv_id_ IS NOT NULL AND inv_id_ > 0 THEN
            SET inv_id_ = -2;
        END IF;
    END IF;
END IF;

IF inv_job_card_no_ != '' THEN
    SET inv_id_ = (SELECT inv_id
                   FROM tbl_readyfor_labour
                   WHERE inv_job_card_no = inv_job_card_no_
                   LIMIT 1);

    IF inv_id_ IS NOT NULL AND inv_id_ > 0 THEN
        SET inv_id_ = -3;
    ELSE
        SET inv_id_ = (SELECT inv_id
                       FROM tbl_invoice_labour
                       WHERE inv_job_card_no = inv_job_card_no_
                       LIMIT 1);
        IF inv_id_ IS NOT NULL AND inv_id_ > 0 THEN
            SET inv_id_ =-3;
        END IF;
    END IF;
END IF;

 if inv_id_ is null or inv_id_ = 0 then 
    START TRANSACTION;
    -- Insert into master table
    INSERT INTO tbl_readyfor_labour
    (inv_no,
	inv_cus,inv_cus_addres,inv_pho,inv_cus_gstin,inv_inv_date,inv_type,inv_job_card_no,inv_jcard_date,inv_repair_typ,
	inv_km,in_registr,inv_chassis,in_engine,inv_modl,inv_sale_date,inv_taxpay,inv_advisername,inv_mechna,inv_branch,inv_disc_total,
	inv_taxtotal,inv_sgstotal,inv_gsttotal,inv_total,insurance_id,insurance_serveyor,status,ready_status,inv_cesstotal
    )
    VALUES    
   ('',inv_cus_,inv_cus_addres_,inv_pho_,inv_cus_gstin_,inv_inv_date_,inv_type_,inv_job_card_no_,inv_jcard_date_,
inv_repair_typ_,inv_km_,in_registr_,inv_chassis_,in_engine_,inv_modl_,inv_sale_date_,inv_taxpay_,inv_advisername_,
inv_mechna_,inv_branch_,inv_disc_total_,inv_taxtotal_,inv_sgstotal_,inv_gsttotal_,inv_total_,insurance_id_,insurance_serveyor_,
status_,ready_status_,inv_cesstotal_
    );
    -- Get generated ID
    SET inv_id_ = LAST_INSERT_ID();
    -- Insert all detail rows from JSON
    INSERT INTO tbl_readyfor_bill(ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
	lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount,lc_cess)
    SELECT inv_id_,jt.ic_labour_code,jt.ic_type,ic_particular,jt.ic_hsn,jt.ic_rate,jt.ic_disc_per,jt.ic_disc,jt.ic_taxable_amt,
    jt.ic_sgst_p,jt.ic_sgst_amt,jt.ic_cgst_p,jt.ic_cgst_amt,jt.ic_total,jt.ic_cess
    FROM JSON_TABLE
    (
        items_,
        '$[*]'
        COLUMNS
        (
            ic_labour_code varchar(100) PATH '$.ic_labour_code',
            ic_type varchar(100) PATH '$.ic_type',
            ic_particular varchar(100) PATH '$.ic_particular',            
             ic_hsn varchar(100) PATH '$.ic_hsn',
            ic_rate varchar(100) PATH '$.ic_rate',
            ic_disc_per varchar(100) PATH '$.ic_disc_per',
             ic_disc varchar(100) PATH '$.ic_disc',
            ic_taxable_amt varchar(100) PATH '$.ic_taxable_amt',
            ic_sgst_p varchar(100) PATH '$.ic_sgst_p',            
             ic_sgst_amt varchar(100) PATH '$.ic_sgst_amt',
            ic_cgst_p varchar(100) PATH '$.ic_cgst_p',
            ic_cgst_amt varchar(100) PATH '$.ic_cgst_amt',
             ic_total varchar(100) PATH '$.ic_total',
             ic_cess varchar(100) PATH '$.ic_cess' DEFAULT '0' ON EMPTY
        )
    ) jt;
    COMMIT;   
	end if;
    -- Return generated master ID (optional)
    SELECT inv_id_ AS inv_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `getFilterOptions`()
BEGIN
    -- Branches
    SELECT
        b_id,
        branch_name,
        branch_id
    FROM tbl_branch;
    -- Mechanics
    SELECT
        emp_id,
        e_first_name,
        e_code
    FROM tbl_employee
    WHERE (e_designation LIKE 'mechanic%'
           OR e_designation = 'Mechanic')
      AND status = 'Active';
    -- Advisors
    SELECT
        emp_id,
        e_first_name,
        e_code
    FROM tbl_employee
    WHERE (e_designation LIKE 'advisor%'
           OR e_designation = 'Service Advisor')
      AND status = 'Active';
    -- Insurance Companies
    SELECT
        com_id,
        icompany_name
    FROM tbl_insurance_company;
    -- Repair Types
    -- Since tbl_repair_type does not exist, we return the hardcoded list
    SELECT 'First free service' AS repair_type
    UNION ALL SELECT 'Second free service'
    UNION ALL SELECT 'Third free service'
    UNION ALL SELECT 'Paid service'
    UNION ALL SELECT 'AMC service'
    UNION ALL SELECT 'Accidental Repair'
    UNION ALL SELECT 'Other Repairs(within warranty)'
    UNION ALL SELECT 'Other Repairs(outside warranty)';
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `getInvoice`(IN p_inv_id INT)
BEGIN

    IF EXISTS (
        SELECT 1
        FROM tbl_readyfor_labour
        WHERE inv_id = p_inv_id
        AND ready_status = 1
    ) THEN

        SELECT
            i.*,
            b.branch_name,
            i.in_engine AS inv_engine,
            i.in_registr AS in_registr,
            a.e_first_name AS adv_name,
            m.e_first_name AS mech_name,
            c.c_email
        FROM tbl_readyfor_labour i
        LEFT JOIN tbl_branch b
            ON b.b_id = i.inv_branch
        LEFT JOIN tbl_employee a
            ON a.emp_id = i.inv_advisername
        LEFT JOIN tbl_employee m
            ON m.emp_id = i.inv_mechna
        LEFT JOIN customer_details c
            ON c.c_reg_no = i.in_registr
        WHERE i.inv_id = p_inv_id
        AND i.ready_status = 1;

        SELECT *
        FROM tbl_readyfor_bill
        WHERE ic_inv_id = p_inv_id;

    ELSEIF EXISTS (
        SELECT 1
        FROM tbl_invoice_labour
        WHERE inv_id = p_inv_id
    ) THEN

        SELECT
            i.*,
            b.branch_name,
            i.in_engine AS inv_engine,
            i.in_registr AS in_registr,
            a.e_first_name AS adv_name,
            m.e_first_name AS mech_name,
            c.c_email
        FROM tbl_invoice_labour i
        LEFT JOIN tbl_branch b
            ON b.b_id = i.inv_branch
        LEFT JOIN tbl_employee a
            ON a.emp_id = i.inv_advisername
        LEFT JOIN tbl_employee m
            ON m.emp_id = i.inv_mechna
        LEFT JOIN customer_details c
            ON c.c_reg_no = i.in_registr
        WHERE i.inv_id = p_inv_id;

        SELECT *
        FROM tbl_invoice_labour_cost
        WHERE ic_inv_id = p_inv_id;

    ELSE

        SELECT
            i.*,
            b.branch_name,
            i.in_engine AS inv_engine,
            i.in_registr AS in_registr,
            a.e_first_name AS adv_name,
            m.e_first_name AS mech_name,
            c.c_email
        FROM tbl_readyfor_labour i
        LEFT JOIN tbl_branch b
            ON b.b_id = i.inv_branch
        LEFT JOIN tbl_employee a
            ON a.emp_id = i.inv_advisername
        LEFT JOIN tbl_employee m
            ON m.emp_id = i.inv_mechna
        LEFT JOIN customer_details c
            ON c.c_reg_no = i.in_registr
        WHERE i.inv_id = p_inv_id;

        SELECT *
        FROM tbl_readyfor_bill
        WHERE ic_inv_id = p_inv_id;

    END IF;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `getPreviousLabourBills`(
    IN p_page INT,
    IN p_pageSize INT,
    IN p_search VARCHAR(100),
    IN p_branchId INT
)
BEGIN
    DECLARE v_offset INT;

    SET v_offset = (p_page - 1) * p_pageSize;

    -- Total Count
    SELECT COUNT(*) AS total
    FROM tbl_invoice_labour
    WHERE
        (
            status = 0
            OR (
                status = 1
                AND (insurance_id IS NULL OR insurance_id = 0)
                AND inv_repair_typ <> 'Accidental Repair'
            )
        )
        AND ready_status = 0
        AND (p_branchId IS NULL OR inv_branch = p_branchId)
        AND (
            p_search = ''
            OR in_registr LIKE CONCAT('%', p_search, '%')
            OR inv_cus LIKE CONCAT('%', p_search, '%')
            OR inv_pho LIKE CONCAT('%', p_search, '%')
            OR inv_no LIKE CONCAT('%', p_search, '%')
            OR inv_job_card_no LIKE CONCAT('%', p_search, '%')
        );

    -- Paginated Data
    SELECT
        l.inv_id,
        l.in_registr,
        l.inv_cus,
        l.inv_cus_addres,
        l.inv_pho,
        l.inv_branch,
        b.branch_name,
        l.inv_job_card_no,
        l.inv_no,
        l.inv_jcard_date,
        l.inv_repair_typ,
        l.inv_modl,
        l.inv_total
    FROM tbl_invoice_labour l
    LEFT JOIN tbl_branch b
        ON l.inv_branch = b.b_id
    WHERE
        (
            l.status = 0
            OR (
                l.status = 1
                AND (l.insurance_id IS NULL OR l.insurance_id = 0)
                AND l.inv_repair_typ <> 'Accidental Repair'
            )
        )
        AND l.ready_status = 0
        AND (p_branchId IS NULL OR l.inv_branch = p_branchId)
        AND (
            p_search = ''
            OR l.in_registr LIKE CONCAT('%', p_search, '%')
            OR l.inv_cus LIKE CONCAT('%', p_search, '%')
            OR l.inv_pho LIKE CONCAT('%', p_search, '%')
            OR l.inv_no LIKE CONCAT('%', p_search, '%')
            OR l.inv_job_card_no LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY l.inv_id DESC
    LIMIT p_pageSize OFFSET v_offset;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `getReadyLabourBills`(
    IN page_no INT,
    IN page_size INT,
    IN search_text VARCHAR(100),
    IN branch_id INT
)
BEGIN

    DECLARE offset_val INT;

    SET offset_val = (page_no - 1) * page_size;

    -- Total count
    SELECT COUNT(*) AS total
    FROM tbl_readyfor_labour i
    WHERE i.status = 0
    AND i.ready_status = 1
    AND (branch_id IS NULL OR i.inv_branch = branch_id)
    AND (
        search_text = ''
        OR i.in_registr LIKE CONCAT('%', search_text, '%')
        OR i.inv_cus LIKE CONCAT('%', search_text, '%')
        OR i.inv_job_card_no LIKE CONCAT('%', search_text, '%')
        OR i.inv_no LIKE CONCAT('%', search_text, '%')
    );


    -- Data
    SELECT 
        i.inv_id,
        i.in_registr,
        i.inv_cus,
        i.inv_pho,
        i.inv_cus_addres,
        b.branch_name,
        i.inv_branch,
        i.inv_job_card_no,
        i.inv_no,
        i.in_engine,
        i.in_engine AS inv_engine,
        i.inv_jcard_date,
        i.inv_repair_typ,
        i.inv_modl,
        i.inv_total
    FROM tbl_readyfor_labour i
    INNER JOIN tbl_branch b 
        ON b.b_id = i.inv_branch
    WHERE i.status = 0
    AND i.ready_status = 1
    AND (branch_id IS NULL OR i.inv_branch = branch_id)
    AND (
        search_text = ''
        OR i.in_registr LIKE CONCAT('%', search_text, '%')
        OR i.inv_cus LIKE CONCAT('%', search_text, '%')
        OR i.inv_job_card_no LIKE CONCAT('%', search_text, '%')
        OR i.inv_no LIKE CONCAT('%', search_text, '%')
    )
    ORDER BY i.inv_id DESC
    LIMIT page_size OFFSET offset_val;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `markReady`(IN inv_id_ INT)
BEGIN

    DECLARE affected_ INT DEFAULT 0;

    -- First try tbl_readyfor_labour
    UPDATE tbl_readyfor_labour
    SET ready_status = 1
    WHERE inv_id = inv_id_;

    SET affected_ = ROW_COUNT();

    -- If not found, try tbl_invoice_labour
    IF affected_ = 0 THEN

        UPDATE tbl_invoice_labour
        SET ready_status = 1
        WHERE inv_id = inv_id_;

        SET affected_ = ROW_COUNT();

    END IF;


    IF affected_ > 0 THEN
        SELECT 1 AS status, 'Marked as ready' AS message;
    ELSE
        SELECT 0 AS status, 'Invoice not found' AS message;
    END IF;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `ResetAllPasswordsTo123`()
BEGIN
    UPDATE tbl_login 
    SET pwd = '$2y$10$TP/nfpJShU.iPAXrvgmI2eY4wjR5RXxsvo6vNKfFRKtoJinqSOhB6'
    WHERE login_id > 0;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp1_create_brand_config`()
BEGIN

    -- 1. Completely delete the existing table to start fresh
    DROP TABLE IF EXISTS tbl_brand_config;

    -- 2. Recreate the table with brand_gstin and brand_dealer_code included, brand_status at the end
    CREATE TABLE tbl_brand_config (
        brand_id          INT          NOT NULL AUTO_INCREMENT,
        brand_name        VARCHAR(100) NOT NULL,
        brand_title       VARCHAR(200) NULL,
        brand_address     VARCHAR(500) NULL,
        brand_state_code  VARCHAR(100) NULL,
        brand_color       VARCHAR(10)  NOT NULL DEFAULT '#3e424b' COMMENT 'Hex color code e.g. #f36f21',
        brand_gstin       VARCHAR(15)  NULL,
        brand_dealer_code VARCHAR(50)  NULL,
        brand_status      TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
        PRIMARY KEY (brand_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- 3. Insert KTM Configuration
    INSERT INTO tbl_brand_config
    (
        brand_id,
        brand_name,
        brand_title,
        brand_address,
        brand_state_code,
        brand_color,
        brand_gstin,
        brand_dealer_code,
        brand_status
    )
    VALUES
    (
        1,
        'KTM',
        'SARATHY BIKES PVT LTD',
        'Kollam KTM Thattamala P O',
        'Code: 32 Kerala [State Code : 32]',
        '#ff5a00',
        '32ABECS8915L1Z0',
        '13177',
        1
    );

    -- 4. Insert BAJAJ Configuration
    INSERT INTO tbl_brand_config
    (
        brand_id,
        brand_name,
        brand_title,
        brand_address,
        brand_state_code,
        brand_color,
        brand_gstin,
        brand_dealer_code,
        brand_status
    )
    VALUES
    (
        2,
        'BAJAJ',
        'SARATHY MOTORS',
        'Sarathy Bajaj Pallimukku Kollam Kerala State',
        'Code: 32 Kerala [State Code : 32]',
        '#0b5ed7',
        '32ABQFS6676M1ZA',
        '11207',
        0
    );

    -- 5. Return the newly created config
    SELECT * FROM tbl_brand_config;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp2_create_logo_master`()
BEGIN
    CREATE TABLE IF NOT EXISTS `logo_master` (
      `logo_id` int NOT NULL AUTO_INCREMENT,
      `logo_title` varchar(255) NOT NULL,
      `logo_url` varchar(500) NOT NULL,
      `is_active` tinyint(1) DEFAULT '1',
      `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`logo_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    -- Add logo column to tbl_branch if it doesn't already exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tbl_branch' 
        AND COLUMN_NAME = 'logo'
    ) THEN
        ALTER TABLE `tbl_branch` ADD COLUMN `logo` int DEFAULT NULL;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CheckRegistration`(
    IN p_reg_no VARCHAR(100)
)
BEGIN
    SELECT c_id
    FROM customer_details
    WHERE c_reg_no = p_reg_no;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CreateCustomer`(
    IN p_c_name VARCHAR(255),
    IN p_c_address TEXT,
    IN p_c_reg_no VARCHAR(100),
    IN p_c_chassis_no VARCHAR(100),
    IN p_c_engine_no VARCHAR(100),
    IN p_model_name VARCHAR(255),
    IN p_c_contact_no VARCHAR(20),
    IN p_gstin_no VARCHAR(50),
    IN p_c_sales_date DATE,
    IN p_c_email VARCHAR(255)
)
BEGIN
    INSERT INTO customer_details
    (
        c_name,
        c_address,
        c_reg_no,
        c_chassis_no,
        c_engine_no,
        model_name,
        c_contact_no,
        gstin_no,
        c_sales_date,
        c_email
    )
    VALUES
    (
        p_c_name,
        p_c_address,
        p_c_reg_no,
        p_c_chassis_no,
        p_c_engine_no,
        p_model_name,
        p_c_contact_no,
        p_gstin_no,
        p_c_sales_date,
        p_c_email
    );

    SELECT LAST_INSERT_ID() AS insertId;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createInsuranceInvoice`(
    IN p_inv_no VARCHAR(500),
    IN p_inv_cus VARCHAR(100),
    IN p_inv_cus_addres VARCHAR(100),
    IN p_inv_pho VARCHAR(100),
    IN p_inv_cus_gstin VARCHAR(100),
    IN p_inv_inv_date DATE,
    IN p_inv_type VARCHAR(100),
    IN p_inv_job_card_no VARCHAR(100),
    IN p_inv_jcard_date DATE,
    IN p_inv_repair_typ VARCHAR(100),
    IN p_inv_km VARCHAR(100),
    IN p_in_registr VARCHAR(100),
    IN p_inv_chassis VARCHAR(100),
    IN p_in_engine VARCHAR(100),
    IN p_inv_modl VARCHAR(100),
    IN p_inv_sale_date VARCHAR(100),
    IN p_inv_taxpay VARCHAR(100),
    IN p_inv_advisername VARCHAR(100),
    IN p_inv_mechna VARCHAR(100),
    IN p_inv_branch VARCHAR(100),
    IN p_inv_disc_total VARCHAR(100),
    IN p_inv_taxtotal VARCHAR(100),
    IN p_inv_sgstotal VARCHAR(100),
    IN p_inv_gsttotal VARCHAR(100),
    IN p_inv_total VARCHAR(100),
    IN p_insurance_id INT,
    IN p_insurance_serveyor VARCHAR(100),
    IN p_status int,
    IN p_ready_status int,
    IN p_items JSON
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE p_invId INT DEFAULT 0;
    DECLARE p_message VARCHAR(255) DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_invId = 0;
        SET p_message = 'Database error occurred during execution';
        SELECT p_invId AS invId, p_message AS message;
    END;

    -- Check if inv_no already exists
    IF p_inv_no IS NOT NULL AND p_inv_no != '' THEN
        SELECT COUNT(*) INTO v_exists FROM (
            SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = p_inv_no
            UNION 
            SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = p_inv_no
        ) AS t;
        
        IF v_exists > 0 THEN
            SET p_message = CONCAT('Invoice number already exists (', p_inv_no, ')');
        END IF;
    END IF;

    IF p_message IS NULL AND p_inv_job_card_no IS NOT NULL AND p_inv_job_card_no != '' THEN
        SELECT COUNT(*) INTO v_exists FROM (
            SELECT inv_id FROM tbl_readyfor_labour WHERE inv_job_card_no = p_inv_job_card_no
            UNION 
            SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = p_inv_job_card_no
        ) AS t;
        
        IF v_exists > 0 THEN
            SET p_message = CONCAT('Jobcard number already exists (', p_inv_job_card_no, ')');
        END IF;
    END IF;

    IF p_message IS NULL THEN
        START TRANSACTION;
        
        -- Insert main record
        INSERT INTO tbl_readyfor_labour (
            inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type,
            inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl,
            inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, 
            inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total,
            insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
        ) VALUES (
            p_inv_no, p_inv_cus, p_inv_cus_addres, p_inv_pho, p_inv_cus_gstin, p_inv_inv_date, p_inv_type,
            p_inv_job_card_no, p_inv_jcard_date, p_inv_repair_typ, p_inv_km, p_in_registr, p_inv_chassis, p_in_engine, p_inv_modl,
            p_inv_sale_date, p_inv_taxpay, p_inv_advisername, p_inv_mechna, p_inv_branch, 
            p_inv_disc_total, p_inv_taxtotal, p_inv_sgstotal, p_inv_gsttotal, p_inv_total,
            p_insurance_id, p_insurance_serveyor, p_status, p_ready_status, '0'
        );

        SET p_invId = LAST_INSERT_ID();

        -- Bulk insert items if items JSON is provided
        IF p_items IS NOT NULL AND JSON_LENGTH(p_items) > 0 THEN
            INSERT INTO tbl_readyfor_bill (
                ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
                lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess
            )
            SELECT 
                p_invId,
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_labour_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_lab_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_code')), ''), ''),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_type')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_type')), ''), 'spare'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_particular')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_lb_name')), ''), ''),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_hsn')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sacode')), ''), '998729'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_rate')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_rate')), ''), '0'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_disc_per')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_disc_p')), ''), '0'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_disc')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_disc')), ''), '0'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_taxable_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_tax_amunt')), ''), '0'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_sgst_p')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sgst_p')), ''), '9'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_sgst_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sgst_a')), ''), '0'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_cgst_p')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cgst_p')), ''), '9'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_cgst_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cgst_a')), ''), '0'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_total')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_amount')), ''), '0'),
                COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cess')), ''), '0')
            FROM JSON_TABLE(
                p_items,
                '$[*]' COLUMNS (
                    item JSON PATH '$'
                )
            ) AS jt;
        END IF;

        COMMIT;
        SET p_message = 'Success';
    END IF;

    SELECT p_invId AS invId, p_message AS message;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_branch`(in b_id_ int,branch_id_ int,branch_name_ varchar(500),
branch_address_ varchar(1000),branch_ph_ varchar(50),logo_ int)
BEGIN
if b_id_>0 then
update tbl_branch set branch_id=branch_id_,branch_name=branch_name_,branch_address=branch_address_,branch_ph=branch_ph_,logo=logo_
where b_id=b_id_;
else
insert into tbl_branch values(b_id_,branch_id_,branch_name_,branch_address_,branch_ph_,logo_);
  SET b_id_ = LAST_INSERT_ID();
  end if;
select b_id_;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_datatable`(
    IN p_search VARCHAR(255),
    IN p_start INT,
    IN p_length INT,
    IN p_orderColumn INT,
    IN p_orderDir VARCHAR(4)
)
BEGIN
    DECLARE v_orderBy VARCHAR(50);

    SET v_orderBy =
    CASE p_orderColumn
        WHEN 0 THEN 'c_id'
        WHEN 1 THEN 'c_name'
        WHEN 2 THEN 'c_address'
        WHEN 3 THEN 'c_reg_no'
        WHEN 4 THEN 'c_chassis_no'
        WHEN 5 THEN 'c_engine_no'
        WHEN 6 THEN 'model_name'
        WHEN 7 THEN 'c_contact_no'
        WHEN 8 THEN 'gstin_no'
        WHEN 9 THEN 'c_sales_date'
        WHEN 10 THEN 'c_email'
        ELSE 'c_id'
    END;

    -- Total Records
    SELECT COUNT(*) AS recordsTotal
    FROM customer_details;

    -- Filtered Records
    SELECT COUNT(*) AS recordsFiltered
    FROM customer_details
    WHERE
        p_search = ''
        OR c_name LIKE CONCAT('%', p_search, '%')
        OR c_address LIKE CONCAT('%', p_search, '%')
        OR c_reg_no LIKE CONCAT('%', p_search, '%')
        OR c_chassis_no LIKE CONCAT('%', p_search, '%')
        OR c_engine_no LIKE CONCAT('%', p_search, '%')
        OR model_name LIKE CONCAT('%', p_search, '%')
        OR c_contact_no LIKE CONCAT('%', p_search, '%')
        OR gstin_no LIKE CONCAT('%', p_search, '%')
        OR c_email LIKE CONCAT('%', p_search, '%');

    SET @sql = CONCAT(
        'SELECT * FROM customer_details
         WHERE (? = ''''
            OR c_name LIKE CONCAT(''%'', ?, ''%'')
            OR c_address LIKE CONCAT(''%'', ?, ''%'')
            OR c_reg_no LIKE CONCAT(''%'', ?, ''%'')
            OR c_chassis_no LIKE CONCAT(''%'', ?, ''%'')
            OR c_engine_no LIKE CONCAT(''%'', ?, ''%'')
            OR model_name LIKE CONCAT(''%'', ?, ''%'')
            OR c_contact_no LIKE CONCAT(''%'', ?, ''%'')
            OR gstin_no LIKE CONCAT(''%'', ?, ''%'')
            OR c_email LIKE CONCAT(''%'', ?, ''%''))
         ORDER BY ', v_orderBy, ' ', p_orderDir,
        ' LIMIT ?, ?'
    );

    PREPARE stmt FROM @sql;

    SET @search = p_search;
    SET @start = p_start;
    SET @length = p_length;

    EXECUTE stmt USING
        @search,@search,@search,@search,@search,@search,
        @search,@search,@search,@search,
        @start,@length;

    DEALLOCATE PREPARE stmt;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_DeleteCustomer`(
    IN p_c_id INT
)
BEGIN
    DELETE FROM customer_details
    WHERE c_id = p_c_id;

    SELECT ROW_COUNT() AS affectedRows;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_delete_branch`(in b_id_ int)
BEGIN
DELETE FROM tbl_branch WHERE b_id = b_id_;
select b_id_;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finalizeBill`(
    IN p_inv_id INT,
    IN p_inv_no VARCHAR(500),
    IN p_inv_cus VARCHAR(100),
    IN p_inv_cus_addres VARCHAR(100),
    IN p_inv_pho VARCHAR(100),
    IN p_inv_cus_gstin VARCHAR(100),
    IN p_inv_inv_date DATE,
    IN p_inv_type VARCHAR(100),
    IN p_inv_job_card_no VARCHAR(100),
    IN p_inv_jcard_date DATE,
    IN p_inv_repair_typ VARCHAR(100),
    IN p_inv_km VARCHAR(100),
    IN p_in_registr VARCHAR(100),
    IN p_inv_chassis VARCHAR(100),
    IN p_in_engine VARCHAR(100),
    IN p_inv_modl VARCHAR(100),
    IN p_inv_sale_date VARCHAR(100),
    IN p_inv_taxpay VARCHAR(100),
    IN p_inv_advisername VARCHAR(100),
    IN p_inv_mechna VARCHAR(100),
    IN p_inv_branch VARCHAR(100),
    IN p_inv_disc_total VARCHAR(100),
    IN p_inv_taxtotal VARCHAR(100),
    IN p_inv_sgstotal VARCHAR(100),
    IN p_inv_gsttotal VARCHAR(100),
    IN p_inv_total VARCHAR(100),
    IN p_insurance_id INT,
    IN p_insurance_serveyor VARCHAR(100),
    IN p_status int,
    IN p_ready_status int,
    IN p_items JSON
)
BEGIN
    DECLARE v_new_inv_id INT;
    DECLARE v_generated_inv_no VARCHAR(100);
    DECLARE v_year INT;
    DECLARE v_month INT;
    DECLARE v_targetFY VARCHAR(4);
    DECLARE v_lastInvoice VARCHAR(100);
    DECLARE v_lastFY VARCHAR(4);
    DECLARE v_prefix VARCHAR(2) DEFAULT 'CI';
    DECLARE v_branchCode VARCHAR(5) DEFAULT '11207';
    DECLARE v_lastSequenceStr VARCHAR(10) DEFAULT '00000';
    DECLARE v_newSequenceNum INT;
    DECLARE v_newSequenceStr VARCHAR(10);
    
    -- Variables for reading from tbl_readyfor_labour
    DECLARE r_inv_no VARCHAR(500);
    DECLARE r_inv_cus VARCHAR(100);
    DECLARE r_inv_cus_addres VARCHAR(100);
    DECLARE r_inv_pho VARCHAR(100);
    DECLARE r_inv_cus_gstin VARCHAR(100);
    DECLARE r_inv_inv_date DATE;
    DECLARE r_inv_type VARCHAR(100);
    DECLARE r_inv_job_card_no VARCHAR(100);
    DECLARE r_inv_jcard_date DATE;
    DECLARE r_inv_repair_typ VARCHAR(100);
    DECLARE r_inv_km VARCHAR(100);
    DECLARE r_in_registr VARCHAR(100);
    DECLARE r_inv_chassis VARCHAR(100);
    DECLARE r_in_engine VARCHAR(100);
    DECLARE r_inv_modl VARCHAR(100);
    DECLARE r_inv_sale_date VARCHAR(100);
    DECLARE r_inv_taxpay VARCHAR(100);
    DECLARE r_inv_advisername VARCHAR(100);
    DECLARE r_inv_mechna VARCHAR(100);
    DECLARE r_inv_branch VARCHAR(100);
    DECLARE r_inv_disc_total VARCHAR(100);
    DECLARE r_inv_taxtotal VARCHAR(100);
    DECLARE r_inv_sgstotal VARCHAR(100);
    DECLARE r_inv_gsttotal VARCHAR(100);
    DECLARE r_inv_total VARCHAR(100);
    DECLARE r_insurance_id INT;
    DECLARE r_insurance_serveyor VARCHAR(100);
    DECLARE r_status INT;
    DECLARE r_inv_cesstotal VARCHAR(100);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 AS invId, 'Database error occurred during execution' AS message;
    END;
    START TRANSACTION;
    -- ==========================================
    -- 1. Generate Invoice Number natively
    -- ==========================================
    -- Assuming invoice date is today if it's a new bill, or we can use NOW()
    SET v_year = YEAR(NOW());
    SET v_month = MONTH(NOW());
    IF v_month < 4 THEN
        SET v_targetFY = CAST((v_year - 1) AS CHAR);
    ELSE
        SET v_targetFY = CAST(v_year AS CHAR);
    END IF;
    -- Get last invoice number
    SELECT inv_no INTO v_lastInvoice 
    FROM tbl_invoice_labour 
    ORDER BY inv_id DESC LIMIT 1 FOR UPDATE;
    IF v_lastInvoice IS NOT NULL AND CHAR_LENGTH(v_lastInvoice) >= 16 THEN
        SET v_prefix = SUBSTRING(v_lastInvoice, 1, 2);
        SET v_lastFY = SUBSTRING(v_lastInvoice, 3, 4);
        SET v_branchCode = SUBSTRING(v_lastInvoice, 7, 5);
        SET v_lastSequenceStr = SUBSTRING(v_lastInvoice, 12);
    ELSE
        SET v_lastFY = '';
    END IF;
    IF v_targetFY = v_lastFY THEN
        SET v_newSequenceNum = CAST(v_lastSequenceStr AS UNSIGNED) + 1;
    ELSE
        SET v_newSequenceNum = 1;
    END IF;
    SET v_newSequenceStr = LPAD(v_newSequenceNum, 5, '0');
    SET v_generated_inv_no = CONCAT(v_prefix, v_targetFY, v_branchCode, v_newSequenceStr);
    -- ==========================================
    -- 2. Handle tbl_readyfor_labour
    -- ==========================================
    IF p_inv_id IS NOT NULL AND p_inv_id > 0 THEN
        -- CASE 2: Update existing ready for bill with new parameters and set ready_status = 0
        UPDATE tbl_readyfor_labour SET
            inv_cus = p_inv_cus,
            inv_cus_addres = p_inv_cus_addres,
            inv_pho = p_inv_pho,
            inv_cus_gstin = p_inv_cus_gstin,
            inv_inv_date = p_inv_inv_date,
            inv_type = p_inv_type,
            inv_job_card_no = p_inv_job_card_no,
            inv_jcard_date = p_inv_jcard_date,
            inv_repair_typ = p_inv_repair_typ,
            inv_km = p_inv_km,
            in_registr = p_in_registr,
            inv_chassis = p_inv_chassis,
            in_engine = p_in_engine,
            inv_modl = p_inv_modl,
            inv_sale_date = p_inv_sale_date,
            inv_taxpay = p_inv_taxpay,
            inv_advisername = p_inv_advisername,
            inv_mechna = p_inv_mechna,
            inv_branch = p_inv_branch,
            inv_disc_total = p_inv_disc_total,
            inv_taxtotal = p_inv_taxtotal,
            inv_sgstotal = p_inv_sgstotal,
            inv_gsttotal = p_inv_gsttotal,
            inv_total = p_inv_total,
            insurance_id = p_insurance_id,
            insurance_serveyor = p_insurance_serveyor,
            status = p_status,
            ready_status = 0
        WHERE inv_id = p_inv_id;
        -- Delete old items
        DELETE FROM tbl_readyfor_bill WHERE ic_inv_id = p_inv_id;
        
        SET v_new_inv_id = p_inv_id; -- Temporary use to insert into ready items
    ELSE
        -- CASE 1: Insert into tbl_readyfor_labour with ready_status = 0
        INSERT INTO tbl_readyfor_labour (
            inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type, inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl, inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total, insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
        ) VALUES (
            p_inv_no, p_inv_cus, p_inv_cus_addres, p_inv_pho, p_inv_cus_gstin, p_inv_inv_date, p_inv_type, p_inv_job_card_no, p_inv_jcard_date, p_inv_repair_typ, p_inv_km, p_in_registr, p_inv_chassis, p_in_engine, p_inv_modl, p_inv_sale_date, p_inv_taxpay, p_inv_advisername, p_inv_mechna, p_inv_branch, p_inv_disc_total, p_inv_taxtotal, p_inv_sgstotal, p_inv_gsttotal, p_inv_total, p_insurance_id, p_insurance_serveyor, p_status, 0, '0'
        );
        SET v_new_inv_id = LAST_INSERT_ID();
    END IF;
    -- Insert updated/new items into tbl_readyfor_bill
    IF p_items IS NOT NULL AND JSON_LENGTH(p_items) > 0 THEN
        INSERT INTO tbl_readyfor_bill (
            ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess
        )
        SELECT 
            v_new_inv_id,
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_labour_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_lab_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_code')), ''), ''),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_type')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_type')), ''), 'spare'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_particular')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_lb_name')), ''), ''),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_hsn')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sacode')), ''), '998729'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_rate')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_rate')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_disc_per')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_disc_p')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_disc')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_disc')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_taxable_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_tax_amunt')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_sgst_p')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sgst_p')), ''), '9'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_sgst_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sgst_a')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_cgst_p')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cgst_p')), ''), '9'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_cgst_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cgst_a')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_total')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_amount')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cess')), ''), '0')
        FROM JSON_TABLE(
            p_items,
            '$[*]' COLUMNS (
                item JSON PATH '$'
            )
        ) AS jt;
    END IF;
    -- ==========================================
    -- 3. Insert into Final Invoice Tables
    -- ==========================================
    INSERT INTO tbl_invoice_labour (
        inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type, inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl, inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total, insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
    ) VALUES (
        v_generated_inv_no, p_inv_cus, p_inv_cus_addres, p_inv_pho, p_inv_cus_gstin, p_inv_inv_date, p_inv_type, p_inv_job_card_no, p_inv_jcard_date, p_inv_repair_typ, p_inv_km, p_in_registr, p_inv_chassis, p_in_engine, p_inv_modl, p_inv_sale_date, p_inv_taxpay, p_inv_advisername, p_inv_mechna, p_inv_branch, p_inv_disc_total, p_inv_taxtotal, p_inv_sgstotal, p_inv_gsttotal, p_inv_total, p_insurance_id, p_insurance_serveyor, p_status, 0, '0'
    );
    SET v_new_inv_id = LAST_INSERT_ID();
    -- Insert items into tbl_invoice_labour_cost
    IF p_items IS NOT NULL AND JSON_LENGTH(p_items) > 0 THEN
        INSERT INTO tbl_invoice_labour_cost (
            ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess
        )
        SELECT 
            v_new_inv_id,
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_labour_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_lab_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_code')), ''), ''),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_type')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_type')), ''), 'spare'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_particular')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_lb_name')), ''), ''),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_hsn')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sacode')), ''), '998729'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_rate')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_rate')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_disc_per')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_disc_p')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_disc')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_disc')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_taxable_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_tax_amunt')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_sgst_p')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sgst_p')), ''), '9'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_sgst_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_sgst_a')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_cgst_p')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cgst_p')), ''), '9'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_cgst_amt')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cgst_a')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.ic_total')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_amount')), ''), '0'),
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(item, '$.lc_cess')), ''), '0')
        FROM JSON_TABLE(
            p_items,
            '$[*]' COLUMNS (
                item JSON PATH '$'
            )
        ) AS jt;
    END IF;
    COMMIT;
    SELECT v_new_inv_id AS invId, 'Success' AS message;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetCustomerById`(IN p_c_id INT)
BEGIN
    SELECT * 
    FROM customer_details
    WHERE c_id = p_c_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetCustomerByRegistration`(
    IN p_reg_no VARCHAR(100)
)
BEGIN
    SELECT *
    FROM customer_details
    WHERE c_reg_no = p_reg_no;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetCustomerPaginated`(
    IN p_page INT,
    IN p_page_size INT,
    IN p_search VARCHAR(255)
)
BEGIN
    DECLARE p_offset INT;

    SET p_offset = (p_page - 1) * p_page_size;

    IF p_search IS NULL OR p_search = '' THEN

        SELECT COUNT(*) AS total
        FROM customer_details;

        SELECT *
        FROM customer_details
        ORDER BY c_id DESC
        LIMIT p_page_size OFFSET p_offset;

    ELSE

        SELECT COUNT(*) AS total
        FROM customer_details
        WHERE 
            c_name LIKE CONCAT('%', p_search, '%')
            OR c_reg_no LIKE CONCAT('%', p_search, '%')
            OR c_contact_no LIKE CONCAT('%', p_search, '%')
            OR model_name LIKE CONCAT('%', p_search, '%')
            OR c_chassis_no LIKE CONCAT('%', p_search, '%');

        SELECT *
        FROM customer_details
        WHERE 
            c_name LIKE CONCAT('%', p_search, '%')
            OR c_reg_no LIKE CONCAT('%', p_search, '%')
            OR c_contact_no LIKE CONCAT('%', p_search, '%')
            OR model_name LIKE CONCAT('%', p_search, '%')
            OR c_chassis_no LIKE CONCAT('%', p_search, '%')
        ORDER BY c_id DESC
        LIMIT p_page_size OFFSET p_offset;

    END IF;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getPreviousInsuranceBills`(
    IN p_branchId INT,
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    -- Base where clause
    SET @sql_where = "WHERE (status = 1 AND (insurance_id > 0 OR inv_repair_typ = 'Accidental Repair')) AND ready_status = 0";
    
    -- Filter by branch if provided
    IF p_branchId IS NOT NULL THEN
        SET @sql_where = CONCAT(@sql_where, " AND inv_branch = ", p_branchId);
    END IF;
    
    -- Filter by search query (Prefix Search Optimization)
    IF p_search IS NOT NULL AND p_search != '' THEN
        -- Safely escape the search string for prefix search
        SET @search_val = CONCAT(QUOTE(CONCAT(p_search, '%')));
        SET @sql_where = CONCAT(@sql_where, " AND (in_registr LIKE ", @search_val, 
                                            " OR inv_cus LIKE ", @search_val, 
                                            " OR inv_pho LIKE ", @search_val, 
                                            " OR inv_no LIKE ", @search_val, 
                                            " OR inv_job_card_no LIKE ", @search_val, ")");
    END IF;

    -- 1. Query for Total Count
    SET @count_query = CONCAT("SELECT COUNT(*) as total FROM tbl_invoice_labour ", @sql_where);
    PREPARE count_stmt FROM @count_query;
    EXECUTE count_stmt;
    DEALLOCATE PREPARE count_stmt;
    
    -- 2. Query for Paginated Results
    -- Optimization: Using INNER JOIN instead of LEFT JOIN for branch since branch always exists
    -- Optimization: Deferred join on tbl_invoice_labour using nested query for ids
    SET @limit_clause = CONCAT(" LIMIT ", p_limit, " OFFSET ", p_offset);
    
    SET @data_query = CONCAT(
        "SELECT t.inv_id, t.in_registr, t.inv_cus, t.inv_cus_addres, t.inv_pho, t.inv_branch, b.branch_name, t.inv_job_card_no, t.inv_no, t.inv_jcard_date, t.inv_repair_typ, t.inv_modl, t.inv_total ",
        "FROM (SELECT inv_id FROM tbl_invoice_labour ", @sql_where, " ORDER BY inv_id DESC", @limit_clause, ") as paged_ids ",
        "INNER JOIN tbl_invoice_labour t ON paged_ids.inv_id = t.inv_id ",
        "INNER JOIN tbl_branch b ON t.inv_branch = b.b_id ",
        "ORDER BY t.inv_id DESC"
    );
    
    PREPARE data_stmt FROM @data_query;
    EXECUTE data_stmt;
    DEALLOCATE PREPARE data_stmt;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getReadyInsuranceBills`(
    IN p_branchId VARCHAR(100),
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    -- 1. Get total count
    SELECT COUNT(*) AS total 
    FROM tbl_readyfor_labour i
    WHERE i.status = 1 AND i.ready_status = 1
      AND (p_branchId IS NULL OR p_branchId = '' OR i.inv_branch = p_branchId)
      AND (p_search IS NULL OR p_search = '' OR 
           i.in_registr LIKE CONCAT(p_search, '%') OR 
           i.inv_cus LIKE CONCAT(p_search, '%') OR 
           i.inv_job_card_no LIKE CONCAT(p_search, '%') OR 
           i.inv_no LIKE CONCAT(p_search, '%'));

    -- 2. Get paginated data
    SELECT i.inv_id, i.in_registr, i.inv_cus, i.inv_pho, i.inv_cus_addres, 
           b.branch_name, i.inv_branch, i.inv_job_card_no, i.inv_no, 
           i.in_engine, i.in_engine AS inv_engine, i.inv_jcard_date, 
           i.inv_repair_typ, i.inv_modl, i.inv_total 
    FROM tbl_readyfor_labour i 
    INNER JOIN tbl_branch b ON b.b_id = i.inv_branch 
    WHERE i.status = 1 AND i.ready_status = 1
      AND (p_branchId IS NULL OR p_branchId = '' OR i.inv_branch = p_branchId)
      AND (p_search IS NULL OR p_search = '' OR 
           i.in_registr LIKE CONCAT(p_search, '%') OR 
           i.inv_cus LIKE CONCAT(p_search, '%') OR 
           i.inv_job_card_no LIKE CONCAT(p_search, '%') OR 
           i.inv_no LIKE CONCAT(p_search, '%'))
    ORDER BY i.inv_id DESC 
    LIMIT p_limit OFFSET p_offset;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_all_branches`()
BEGIN
SELECT * FROM tbl_branch ORDER BY b_id DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_all_customers`()
BEGIN
    SELECT *
    FROM customer_details
    ORDER BY c_id DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_branch_by_id`(in b_id_ int)
BEGIN
SELECT * FROM tbl_branch WHERE b_id = b_id_;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_branch_paginated`(
    IN p_search VARCHAR(500),
    IN p_page INT,
    IN p_pageSize INT
)
BEGIN
    DECLARE v_offset INT;

    SET v_offset = (p_page - 1) * p_pageSize;

    SELECT COUNT(*) AS total
    FROM tbl_branch
    WHERE p_search = ''
       OR branch_name LIKE CONCAT('%', p_search, '%')
       OR branch_id LIKE CONCAT('%', p_search, '%');

    SELECT *
    FROM tbl_branch
    WHERE p_search = ''
       OR branch_name LIKE CONCAT('%', p_search, '%')
       OR branch_id LIKE CONCAT('%', p_search, '%')
    ORDER BY b_id DESC
    LIMIT p_pageSize OFFSET v_offset;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_SearchCustomer`(
    IN p_search VARCHAR(255)
)
BEGIN
    IF p_search IS NULL OR p_search = '' THEN

        SELECT 
            c_id,
            c_name,
            c_reg_no,
            c_contact_no,
            model_name
        FROM customer_details
        LIMIT 20;

    ELSE

        SELECT 
            c_id,
            c_name,
            c_reg_no,
            c_contact_no,
            model_name
        FROM customer_details
        WHERE 
            c_name LIKE CONCAT('%', p_search, '%')
            OR c_reg_no LIKE CONCAT('%', p_search, '%')
            OR c_chassis_no LIKE CONCAT('%', p_search, '%')
        LIMIT 20;

    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `updateInvoice`(IN inv_id_ int,inv_no_ varchar(100),inv_cus_ varchar(100),
inv_cus_addres_ varchar(100),inv_pho_ varchar(100),inv_cus_gstin_ varchar(100),inv_inv_date_ date,inv_type_ varchar(100),
inv_job_card_no_ varchar(100),inv_jcard_date_ date,inv_repair_typ_ varchar(100),inv_km_ varchar(100),in_registr_ varchar(100),
inv_chassis_ varchar(100),in_engine_ varchar(100),inv_modl_ varchar(100),inv_sale_date_ varchar(100),inv_taxpay_ varchar(100),
inv_advisername_ varchar(100),inv_mechna_ varchar(100),inv_branch_ varchar(100),inv_disc_total_ varchar(100),inv_taxtotal_ varchar(100),
inv_sgstotal_ varchar(100),inv_gsttotal_ varchar(100),inv_total_ varchar(100),insurance_id_ int,insurance_serveyor_ varchar(100),
inv_cesstotal_ varchar(100),items_ json,isFinalized_ tinyint)
BEGIN
    declare currentInvNo_ varchar(100);
    declare jobcardno_ varchar(100);
    declare status_ int;
    declare ready_status_ int;
    declare duplicate_id_ int; -- NEW VARIABLE FOR DUPLICATE CHECKS
    declare has_duplicate_ boolean default false;
    if insurance_id_ is not null and insurance_id_ > 0 then
        set status_ = 1;
    else
        set status_ = 0;
    end if;
    if isFinalized_ = 1 then
        set ready_status_ = 0;
    else
        set ready_status_ = 1;
    end if;
    -- INVOICE NUMBER DUPLICATE CHECK
    IF inv_no_ != '' THEN
        if isFinalized_ = 1 then
            set currentInvNo_ = (SELECT inv_no FROM tbl_invoice_labour WHERE inv_id = inv_id_);
        else
            set currentInvNo_ = (SELECT inv_no FROM tbl_readyfor_labour WHERE inv_id = inv_id_);
        end if;
        
        if currentInvNo_ != inv_no_ then
            if isFinalized_ = 1 then
                SET duplicate_id_ = (SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = inv_no_ LIMIT 1);
                IF duplicate_id_ IS NOT NULL AND duplicate_id_ > 0 THEN
                    SET inv_id_ = -2;
                    SET has_duplicate_ = true;
                ELSE
                    SET duplicate_id_ = (SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = inv_no_ LIMIT 1);
                    IF duplicate_id_ IS NOT NULL AND duplicate_id_ > 0 THEN
                        SET inv_id_ = -2;
                        SET has_duplicate_ = true;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    -- JOBCARD NUMBER DUPLICATE CHECK (only run if no invoice duplicate was found yet)
    IF inv_job_card_no_ != '' AND has_duplicate_ = false THEN
        if isFinalized_ = 1 then
            set jobcardno_ = (SELECT inv_job_card_no FROM tbl_invoice_labour WHERE inv_id = inv_id_);
        else
            set jobcardno_ = (SELECT inv_job_card_no FROM tbl_readyfor_labour WHERE inv_id = inv_id_);
        end if;
        
        if jobcardno_ != inv_job_card_no_ then
            if isFinalized_ = 1 then
                SET duplicate_id_ = (SELECT inv_id FROM tbl_readyfor_labour WHERE inv_job_card_no = inv_job_card_no_ LIMIT 1);
                IF duplicate_id_ IS NOT NULL AND duplicate_id_ > 0 THEN
                    SET inv_id_ = -3;
                    SET has_duplicate_ = true;
                ELSE
                    SET duplicate_id_ = (SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = inv_job_card_no_ LIMIT 1);
                    IF duplicate_id_ IS NOT NULL AND duplicate_id_ > 0 THEN
                        SET inv_id_ = -3;
                        SET has_duplicate_ = true;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    -- PERFORM UPDATE ONLY IF VALID (NOT A DUPLICATE)
    if inv_id_ is not null and inv_id_ > 0 then
        if isFinalized_ = 1 then
            START TRANSACTION;
            
            UPDATE tbl_invoice_labour SET
                inv_cus=inv_cus_, inv_cus_addres=inv_cus_addres_, inv_pho=inv_pho_, inv_cus_gstin=inv_cus_gstin_,
                inv_job_card_no=inv_job_card_no_, inv_jcard_date=inv_jcard_date_, inv_inv_date=inv_inv_date_,
                inv_repair_typ=inv_repair_typ_, inv_km=inv_km_,in_registr=in_registr_,inv_chassis=inv_chassis_,
                in_engine=in_engine_, inv_modl=inv_modl_,inv_advisername=inv_advisername_, inv_mechna=inv_mechna_, 
                inv_branch=inv_branch_, inv_disc_total=inv_disc_total_, inv_taxtotal=inv_taxtotal_, 
                inv_sgstotal=inv_sgstotal_, inv_gsttotal=inv_gsttotal_, inv_total=inv_total_,
                insurance_id=insurance_id_, insurance_serveyor=insurance_serveyor_, inv_sale_date=inv_sale_date_, 
                inv_type=inv_type_,inv_cesstotal=inv_cesstotal_
            WHERE inv_id=inv_id_;
            
            delete from tbl_invoice_labour_cost where ic_inv_id = inv_id_;        
            
            INSERT INTO tbl_invoice_labour_cost(ic_inv_id,lc_lab_code,lc_type,lc_lb_name,lc_sacode,lc_rate,lc_disc_p,lc_disc,lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount)
            SELECT inv_id_,jt.ic_labour_code,jt.ic_type,ic_particular,jt.ic_hsn,jt.ic_rate,jt.ic_disc_per,jt.ic_disc,jt.ic_taxable_amt,
            jt.ic_sgst_p,jt.ic_sgst_amt,jt.ic_cgst_p,jt.ic_cgst_amt,jt.ic_total
            FROM JSON_TABLE(
                items_,
                '$[*]' COLUMNS (
                    ic_labour_code varchar(100) PATH '$.ic_labour_code',
                    ic_type varchar(100) PATH '$.ic_type',
                    ic_particular varchar(100) PATH '$.ic_particular',            
                    ic_hsn varchar(100) PATH '$.ic_hsn',
                    ic_rate varchar(100) PATH '$.ic_rate',
                    ic_disc_per varchar(100) PATH '$.ic_disc_per',
                    ic_disc varchar(100) PATH '$.ic_disc',
                    ic_taxable_amt varchar(100) PATH '$.ic_taxable_amt',
                    ic_sgst_p varchar(100) PATH '$.ic_sgst_p',            
                    ic_sgst_amt varchar(100) PATH '$.ic_sgst_amt',
                    ic_cgst_p varchar(100) PATH '$.ic_cgst_p',
                    ic_cgst_amt varchar(100) PATH '$.ic_cgst_amt',
                    ic_total varchar(100) PATH '$.ic_total'
                )
            ) jt;
            
            COMMIT;
        else
            START TRANSACTION;
            
            UPDATE tbl_readyfor_labour SET
                inv_cus=inv_cus_, inv_cus_addres=inv_cus_addres_, inv_pho=inv_pho_, inv_cus_gstin=inv_cus_gstin_,
                inv_job_card_no=inv_job_card_no_, inv_jcard_date=inv_jcard_date_, inv_inv_date=inv_inv_date_,
                inv_repair_typ=inv_repair_typ_, inv_km=inv_km_, in_registr=in_registr_, inv_chassis=inv_chassis_,
                in_engine=in_engine_, inv_modl=inv_modl_,inv_advisername=inv_advisername_, inv_mechna=inv_mechna_,
                inv_branch=inv_branch_,inv_disc_total=inv_disc_total_, inv_taxtotal=inv_taxtotal_, 
                inv_sgstotal=inv_sgstotal_, inv_gsttotal=inv_gsttotal_, inv_total=inv_total_,
                insurance_id=insurance_id_, insurance_serveyor=insurance_serveyor_, inv_sale_date=inv_sale_date_, 
                inv_type=inv_type_, inv_cesstotal=inv_cesstotal_
            WHERE inv_id=inv_id_;
            
            delete from tbl_readyfor_bill where ic_inv_id = inv_id_;
            
            INSERT INTO tbl_readyfor_bill (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
                lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
            SELECT inv_id_,jt.ic_labour_code,jt.ic_type,ic_particular,jt.ic_hsn,jt.ic_rate,jt.ic_disc_per,jt.ic_disc,jt.ic_taxable_amt,
            jt.ic_sgst_p,jt.ic_sgst_amt,jt.ic_cgst_p,jt.ic_cgst_amt,jt.ic_total,jt.ic_cess
            FROM JSON_TABLE(
                items_,
                '$[*]' COLUMNS (
                    ic_labour_code varchar(100) PATH '$.ic_labour_code',
                    ic_type varchar(100) PATH '$.ic_type',
                    ic_particular varchar(100) PATH '$.ic_particular',            
                    ic_hsn varchar(100) PATH '$.ic_hsn',
                    ic_rate varchar(100) PATH '$.ic_rate',
                    ic_disc_per varchar(100) PATH '$.ic_disc_per',
                    ic_disc varchar(100) PATH '$.ic_disc',
                    ic_taxable_amt varchar(100) PATH '$.ic_taxable_amt',
                    ic_sgst_p varchar(100) PATH '$.ic_sgst_p',            
                    ic_sgst_amt varchar(100) PATH '$.ic_sgst_amt',
                    ic_cgst_p varchar(100) PATH '$.ic_cgst_p',
                    ic_cgst_amt varchar(100) PATH '$.ic_cgst_amt',
                    ic_total varchar(100) PATH '$.ic_total',
                    ic_cess varchar(100) PATH '$.ic_cess' DEFAULT '0' ON EMPTY
                )
            ) jt;
            
            COMMIT;  
        end if;
    end if;
    
    -- Return generated master ID (optional)
    SELECT inv_id_ AS inv_id;
END$$
DELIMITER ;
