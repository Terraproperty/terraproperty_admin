IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'jobs')
BEGIN
CREATE TABLE jobs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    jd_pdf_url VARCHAR(1024) NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE()
);
END
