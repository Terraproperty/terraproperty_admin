IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='associate_leads' AND xtype='U')
BEGIN
CREATE TABLE associate_leads (
  id INT IDENTITY(1,1) PRIMARY KEY,
  full_name NVARCHAR(255) NOT NULL,
  email_address NVARCHAR(255) NOT NULL,
  phone_number NVARCHAR(20) NOT NULL,
  property_type NVARCHAR(100) NOT NULL,
  preferred_location NVARCHAR(255) NOT NULL,
  budget_range NVARCHAR(100) NOT NULL,
  additional_notes NVARCHAR(MAX) NULL,
  per_deal_commission DECIMAL(10, 2) DEFAULT 0.00,
  total_commission DECIMAL(10, 2) DEFAULT 0.00,
  pending_commission DECIMAL(10, 2) DEFAULT 0.00,
  status NVARCHAR(20) NOT NULL DEFAULT 'new',
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

ALTER TABLE associate_leads
ADD CONSTRAINT chk_status CHECK (status IN ('new', 'contacted', 'not_contacted', 'closed'));
END
