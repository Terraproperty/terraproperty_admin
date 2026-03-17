CREATE TABLE referral_details (
    associate_id VARCHAR(255) NOT NULL PRIMARY KEY,
    total_referral INT DEFAULT 0,
    active_referral INT DEFAULT 0,
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    deals INT DEFAULT 0,
    commission DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'inactive',
    FOREIGN KEY (associate_id) REFERENCES registration_forms(associate_id)
);
