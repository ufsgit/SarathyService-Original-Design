DELIMITER //

DROP PROCEDURE IF EXISTS `sp_getReadyInsuranceBills`//

CREATE PROCEDURE `sp_getReadyInsuranceBills`(
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
END //

DELIMITER ;
