CREATE DATABASE IF NOT EXISTS lead_management_system;
USE lead_management_system;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    centre VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad_name VARCHAR(255) NOT NULL,
    keyword VARCHAR(255) UNIQUE,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50),
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_recovery_at DATETIME NULL,
    INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    whatsapp_id VARCHAR(255),
    phone VARCHAR(50),
    name VARCHAR(255),
    unique_key VARCHAR(255),
    ad_id INT NULL,
    UNIQUE KEY unique_account_contact (account_id, unique_key),
    INDEX idx_account_id (account_id),
    INDEX idx_ad_id (ad_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT,
    account_id INT,
    whatsapp_message_id VARCHAR(255) UNIQUE,
    message TEXT,
    direction VARCHAR(20),
    is_group BOOLEAN DEFAULT FALSE,
    group_name VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_id (contact_id),
    INDEX idx_account_id (account_id)
);
