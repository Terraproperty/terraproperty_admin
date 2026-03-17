-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS estate_central_db;

-- Use the database
USE estate_central_db;

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    projectOfInterest VARCHAR(255),
    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
    id VARCHAR(255) PRIMARY KEY,
    fileName VARCHAR(255) NOT NULL,
    storagePathOrUrl VARCHAR(1024), -- Store path to file or URL
    uploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Renamed from createdAt for consistency with frontend
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    managerId VARCHAR(255), -- Self-referencing foreign key for hierarchy
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (managerId) REFERENCES employees(id) ON DELETE SET NULL -- Optional: Set manager to NULL if manager is deleted
);

-- Properties Table (Renamed from Projects for clarity)
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(255) PRIMARY KEY,
    propertyName VARCHAR(255) NOT NULL,
    address VARCHAR(512) NOT NULL,
    price DECIMAL(15, 2) NOT NULL, -- Using DECIMAL for currency
    description TEXT,
    contactNumber VARCHAR(50),
    email VARCHAR(255),
    status ENUM('pending', 'approved', 'declined', 'sold') DEFAULT 'pending', -- Added 'sold' status
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Example Seed Data (Optional)

-- Seed Employees (CEO first, then VPs, then managers, then agents)
INSERT INTO employees (id, name, position, managerId) VALUES
('ceo', 'Alice Wonderland', 'CEO', NULL),
('vp1', 'Bob The Builder', 'VP of Sales', 'ceo'),
('vp2', 'Harry Potter', 'VP of Marketing', 'ceo'),
('vp3', 'Kara Danvers', 'VP of Operations', 'ceo'),
('mgr1', 'Charlie Chaplin', 'Sales Manager (East)', 'vp1'),
('mgr2', 'Fiona Shrek', 'Sales Manager (West)', 'vp1'),
('agent1', 'Diana Prince', 'Sales Agent', 'mgr1'),
('agent2', 'Ethan Hunt', 'Sales Agent', 'mgr1'),
('agent3', 'George Jetson', 'Sales Agent', 'mgr2'),
('mkt1', 'Ivy Poison', 'Marketing Specialist', 'vp2'),
('mkt2', 'Jack Sparrow', 'Digital Marketer', 'vp2');


-- Seed Leads
INSERT INTO leads (id, name, email, phone, projectOfInterest, status) VALUES
('lead1', 'John Doe', 'john.doe@example.com', '555-123-4567', 'Downtown Apartments', 'pending'),
('lead2', 'Jane Smith', 'jane.smith@example.com', '555-987-6543', 'Luxury Homes', 'pending'),
('lead3', 'Peter Jones', 'peter.jones@sample.net', '555-111-2222', 'Suburban Houses', 'approved');

-- Seed Properties
INSERT INTO properties (id, propertyName, address, price, description, contactNumber, email, status) VALUES
('prop1', 'Spacious Villa', '123 Main St, Anytown', 500000.00, 'A beautiful villa with a large garden.', '+15551234567', 'agent@example.com', 'approved'),
('prop2', 'Downtown Condo', '456 Central Ave, Metro City', 350000.00, 'Modern condo in the heart of the city.', '+15559876543', 'sales@example.com', 'pending'),
('prop3', 'Lakefront Cabin', '789 Lakeside Dr, Peaceful Town', 750000.00, 'Cozy cabin with stunning lake views.', '+15551112222', 'info@example.com', 'sold');

-- Seed Blogs
INSERT INTO blogs (id, fileName, storagePathOrUrl, uploadDate) VALUES
('blog1', 'Market_Trends_Q1.pdf', '/path/to/uploads/Market_Trends_Q1.pdf', '2024-01-15 10:00:00'),
('blog2', 'Guide_to_Buying_First_Home.pdf', 'https://example.com/blogs/Guide_to_Buying_First_Home.pdf', '2024-02-20 14:30:00');
