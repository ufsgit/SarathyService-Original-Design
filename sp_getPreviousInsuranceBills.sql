DELIMITER //

CREATE PROCEDURE sp_getPreviousInsuranceBills(
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

END //

DELIMITER ;
