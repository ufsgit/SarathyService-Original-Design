DELIMITER //

DROP PROCEDURE IF EXISTS `sp_createInsuranceInvoice`//

CREATE PROCEDURE `sp_createInsuranceInvoice`(
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
            p_insurance_id, p_insurance_serveyor, 1, 0, '0'
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
END //

DELIMITER ;

-- ==========================================================
-- OPTIMIZATION: Database Indexes to run (if not already added)
-- These prevent slow full-table scans during the UNION checks
-- ==========================================================
-- ALTER TABLE tbl_readyfor_labour ADD INDEX idx_inv_no (inv_no);
-- ALTER TABLE tbl_readyfor_labour ADD INDEX idx_inv_job_card_no (inv_job_card_no);
-- ALTER TABLE tbl_invoice_labour ADD INDEX idx_inv_no (inv_no);
-- ALTER TABLE tbl_invoice_labour ADD INDEX idx_inv_job_card_no (inv_job_card_no);
