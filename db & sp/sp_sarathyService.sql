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

    CREATE TABLE IF NOT EXISTS tbl_brand_config (
        brand_id         INT          NOT NULL AUTO_INCREMENT,
        brand_name       VARCHAR(100) NOT NULL,
        brand_title      VARCHAR(200) NULL,
        brand_address    VARCHAR(500) NULL,
        brand_state_code VARCHAR(100) NULL,
        brand_color      VARCHAR(10)  NOT NULL DEFAULT '#3e424b' COMMENT 'Hex color code e.g. #f36f21',
        brand_status     TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
        PRIMARY KEY (brand_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    INSERT IGNORE INTO tbl_brand_config
    (
        brand_id,
        brand_name,
        brand_title,
        brand_address,
        brand_state_code,
        brand_color,
        brand_status
    )
    VALUES
    (
        1,
        'KTM',
        'SARATHY BIKES PVT LTD',
        'Sarathy Bajaj Pallimukku Kollam Kerala State',
        'Code: 32 Kerala [State Code : 32]',
        '#ff5a00',
        1
    );

    INSERT IGNORE INTO tbl_brand_config
    (
        brand_id,
        brand_name,
        brand_title,
        brand_address,
        brand_state_code,
        brand_color,
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
        0
    );

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
