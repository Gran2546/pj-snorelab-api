-- Create Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    role_id INT REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(10) CHECK (status IN ('active', 'inactive')) DEFAULT 'active'
);

-- Create Wallets Table
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD'
);

-- Create Histories Table with updated structure
CREATE TABLE histories (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('add', 'deduct')),
    score DECIMAL(10, 2) NOT NULL,
    action TEXT,
    detail JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data for Roles
INSERT INTO roles (role_name) VALUES 
('Admin'),
('User');

-- Sample Data for Users (with hashed passwords)
INSERT INTO users (email, password, firstName, lastName, username, role_id) VALUES 
('admin@example.com', '$2b$10$hashed_admin_password_here', 'Admin', 'User', 'admin', 1),
('johndoe@example.com', '$2b$10$hashed_user_password_here', 'John', 'Doe', 'johndoe', 2);

-- Sample Data for Records (adjust according to your needs)
CREATE TABLE records (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    name VARCHAR(255) UNIQUE NOT NULL,
    record_data JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);