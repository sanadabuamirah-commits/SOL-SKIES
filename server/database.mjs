// server/database.mjs
// To:
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create/connect to database file
// Then use this pattern:
const db = await open({
  filename: path.join(__dirname, 'solskies.db'),
  driver: sqlite3.Database
});

// Initialize tables (same as before)
db.exec(`
  CREATE TABLE IF NOT EXISTS enterprises (
    id TEXT PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    business_type TEXT,
    year_established INTEGER,
    industry TEXT,
    operating_regions TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    description TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS operators (
    id TEXT PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    region TEXT,
    drone_model TEXT,
    drone_image TEXT,
    flight_stack TEXT,
    autopilot_hardware TEXT,
    vehicle_type TEXT,
    firmware_version TEXT,
    communication_protocol TEXT DEFAULT 'mavlink',
    experience TEXT,
    certifications TEXT,
    rating REAL DEFAULT 0,
    total_missions INTEGER DEFAULT 0,
    completed_missions INTEGER DEFAULT 0,
    positive_feedback INTEGER DEFAULT 0,
    member_since INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    operator_id TEXT NOT NULL,
    cert_type TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT,
    verified BOOLEAN DEFAULT 0,
    FOREIGN KEY(operator_id) REFERENCES operators(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    contract_address TEXT,
    title TEXT NOT NULL,
    description TEXT,
    enterprise_id TEXT NOT NULL,
    enterprise_wallet TEXT NOT NULL,
    operator_id TEXT,
    operator_wallet TEXT,
    amount_sol REAL NOT NULL,
    amount_usdc REAL,
    status TEXT DEFAULT 'open',
    region TEXT,
    region_hash TEXT,
    description_hash TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    assigned_at INTEGER,
    completed_at INTEGER,
    progress INTEGER DEFAULT 0,
    FOREIGN KEY(enterprise_id) REFERENCES enterprises(id),
    FOREIGN KEY(operator_id) REFERENCES operators(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    sender_wallet TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp INTEGER DEFAULT (unixepoch()),
    read BOOLEAN DEFAULT 0,
    FOREIGN KEY(contract_id) REFERENCES contracts(id)
  );
`);

// Helper functions
const dbHelpers = {
  createEnterprise: (data) => {
    const stmt = db.prepare(`
      INSERT INTO enterprises (
        id, wallet_address, company_name, business_type, 
        year_established, industry, operating_regions, 
        contact_name, contact_email, contact_phone, website, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = randomUUID();
    stmt.run(
      id, 
      data.wallet_address, 
      data.company_name, 
      data.business_type,
      data.year_established, 
      data.industry, 
      data.operating_regions,
      data.contact_name, 
      data.contact_email, 
      data.contact_phone || null,
      data.website || null, 
      data.description || null
    );
    return { id, ...data };
  },

  createOperator: (data) => {
    const stmt = db.prepare(`
      INSERT INTO operators (
        id, wallet_address, full_name, username, region,
        drone_model, drone_image, flight_stack, autopilot_hardware,
        vehicle_type, firmware_version, communication_protocol,
        experience, certifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = randomUUID();
    const certificationsJson = JSON.stringify(data.certifications || []);
    
    stmt.run(
      id,
      data.wallet_address,
      data.full_name,
      data.username,
      data.region,
      data.drone_model,
      data.drone_image || null,
      data.flight_stack,
      data.autopilot_hardware,
      data.vehicle_type,
      data.firmware_version || null,
      data.communication_protocol || 'mavlink',
      data.experience || null,
      certificationsJson
    );
    return { id, ...data };
  },

  getOperatorByWallet: (walletAddress) => {
    const stmt = db.prepare('SELECT * FROM operators WHERE wallet_address = ?');
    const operator = stmt.get(walletAddress);
    if (operator && operator.certifications) {
      operator.certifications = JSON.parse(operator.certifications);
    }
    return operator;
  },

  getEnterpriseByWallet: (walletAddress) => {
    const stmt = db.prepare('SELECT * FROM enterprises WHERE wallet_address = ?');
    return stmt.get(walletAddress);
  },

  getContracts: (filters = {}) => {
    let query = `
      SELECT c.*, 
             e.company_name, e.contact_name,
             o.full_name as operator_name, o.username as operator_username
      FROM contracts c
      LEFT JOIN enterprises e ON c.enterprise_id = e.id
      LEFT JOIN operators o ON c.operator_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ` AND c.status = ?`;
      params.push(filters.status);
    }
    if (filters.region) {
      query += ` AND c.region LIKE ?`;
      params.push(`%${filters.region}%`);
    }

    query += ` ORDER BY c.created_at DESC`;
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  getOperatorDashboard: (operatorId) => {
    const operator = db.prepare('SELECT * FROM operators WHERE id = ?').get(operatorId);
    if (!operator) return null;

    const contracts = db.prepare(`
      SELECT * FROM contracts 
      WHERE operator_wallet = ? 
      ORDER BY created_at DESC
    `).all(operator.wallet_address);

    const certs = db.prepare(`
      SELECT * FROM certifications 
      WHERE operator_id = ?
    `).all(operatorId);

    return {
      ...operator,
      certifications: operator.certifications ? JSON.parse(operator.certifications) : [],
      certification_files: certs,
      contracts
    };
  },

  createContract: (data) => {
    const stmt = db.prepare(`
      INSERT INTO contracts (
        id, title, description, enterprise_id, enterprise_wallet,
        amount_sol, amount_usdc, region, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = randomUUID();
    stmt.run(
      id, 
      data.title, 
      data.description, 
      data.enterprise_id,
      data.enterprise_wallet, 
      data.amount_sol, 
      data.amount_usdc || null,
      data.region, 
      data.status || 'open'
    );
    return { id, ...data };
  }
};

export { db, dbHelpers };