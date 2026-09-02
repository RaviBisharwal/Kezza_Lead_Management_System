const mysql = require("mysql2/promise");

const poolConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "123Neh@123",
    database: process.env.DB_NAME || "lead_management_system",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT, 10) : 10
};

// Enable SSL if running against cloud databases (e.g. Aiven, TiDB, PlanetScale)
if (process.env.DB_SSL === "true" || process.env.DB_SSL === "1") {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;