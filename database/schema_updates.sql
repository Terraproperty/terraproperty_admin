-- Create rent_properties table similar to properties table with extended fields
CREATE TABLE rent_properties (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    propertyName VARCHAR(255) NOT NULL,
    address VARCHAR(512) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    description TEXT,
    contactNumber VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(50),
    propertyType VARCHAR(255),
    propertyCategory VARCHAR(255),
    projectName VARCHAR(255),
    location VARCHAR(255),
    coordinates_lat DOUBLE,
    coordinates_lng DOUBLE,
    details TEXT,
    features TEXT,
    idealFor TEXT,
    additionalServices TEXT,
    images TEXT,
    createdAt DATETIME,
    updatedAt DATETIME
);
