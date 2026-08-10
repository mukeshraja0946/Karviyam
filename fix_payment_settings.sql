-- run this in Hostinger phpMyAdmin to fix the empty Payment Settings page

CREATE TABLE IF NOT EXISTS `payment_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `razorpay_key_id` varchar(255) DEFAULT NULL,
  `razorpay_secret_key` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `enable_cod` tinyint(1) DEFAULT 1,
  `enable_upi` tinyint(1) DEFAULT 1,
  `enable_nb` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert the initial row so the page isn't empty
INSERT IGNORE INTO `payment_settings` (`id`, `enable_cod`, `enable_upi`, `enable_nb`) VALUES (1, 1, 1, 1);
