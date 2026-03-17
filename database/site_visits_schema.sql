CREATE TABLE site_visits (
  id INT IDENTITY(1,1) PRIMARY KEY,
  lead_id VARCHAR(255) NOT NULL,
  visit_date DATETIME2 NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'scheduled', -- e.g., scheduled, confirmed, cancelled
  notes NVARCHAR(MAX) NULL,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

ALTER TABLE site_visits
ADD CONSTRAINT fk_lead_id FOREIGN KEY (lead_id) REFERENCES leads(id);
