CREATE TABLE IF NOT EXISTS product_extra_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    main_category VARCHAR(100),
    sub_category VARCHAR(100),
    product_type VARCHAR(100),
    attributes JSON,
    about_points JSON,
    additional_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
