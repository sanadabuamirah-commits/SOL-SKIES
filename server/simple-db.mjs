// server/simple-db.mjs
// JSON-based database — no SQLite required
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'db.json');

// ─── Schema defaults ──────────────────────────────────────────────────────────
const EMPTY_DB = {
  operators: [],
  enterprises: [],
  missions: [],
  applications: [],
  contracts: [],
  messages: [],
  conversations: [],      // FIX: was missing → all conversation endpoints crashed
  conv_messages: [],      // FIX: was missing
  audit_logs: []          // NEW: audit trail
};

// ─── IO — in-memory cache so disk is only read once per process ───────────────
let _cache = null;

const readDB = () => {
  if (_cache) return _cache;
  try {
    const raw = fs.readFileSync(dbFile, 'utf8');
    // Spread ensures old db.json files without new collections get defaults
    _cache = { ...EMPTY_DB, ...JSON.parse(raw) };
    // Ensure new collections exist even if db.json pre-dates them
    if (!_cache.conversations) _cache.conversations = [];
    if (!_cache.conv_messages) _cache.conv_messages = [];
  } catch {
    _cache = { ...EMPTY_DB };
  }
  return _cache;
};

// Debounced write — flush to disk at most once per 150 ms
let _writeTimer = null;
const writeDB = (data) => {
  _cache = data;
  if (_writeTimer) clearTimeout(_writeTimer);
  _writeTimer = setTimeout(() => {
    try { fs.writeFileSync(dbFile, JSON.stringify(data, null, 2)); }
    catch (e) { console.error('writeDB error:', e); }
    _writeTimer = null;
  }, 150);
};

// Prime cache on startup
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ ...EMPTY_DB }, null, 2));
  _cache = { ...EMPTY_DB };
} else {
  readDB();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const dbHelpers = {

  // ── Operators ──────────────────────────────────────────────────────────────
  createOperator(data) {
    const db = readDB();
    const id = randomUUID();
    const now = Date.now();
    const operator = {
      id,
      wallet_address: data.wallet_address,
      full_name: data.full_name,
      username: data.username,
      region: data.region || null,
      drone_model: data.drone_model || null,
      drone_image: data.drone_image || null,
      flight_stack: data.flight_stack || null,
      autopilot_hardware: data.autopilot_hardware || null,
      vehicle_type: data.vehicle_type || null,
      firmware_version: data.firmware_version || null,
      communication_protocol: data.communication_protocol || 'mavlink',
      experience: data.experience || null,
      certifications: data.certifications || [],
      certification_files: data.certification_files || [],
      profile_image: null,
      rating: null,           // null until first rated completion
      total_missions: 0,
      completed_missions: 0,
      total_earned: 0,        // FIX: was missing → earnings system broken
      positive_feedback: 100,
      member_since: now,      // stored in milliseconds — do NOT multiply by 1000 on display
      created_at: now,
      license_status: 'none',        // 'none' | 'pending' | 'verified' | 'rejected'
      license_document_url: null,
      bio: data.bio || null,
      flight_hours: data.flight_hours || 0,
      drone_fleet: data.drone_fleet || []   // array of {model, image, specs}
    };
    db.operators.push(operator);
    writeDB(db);
    return operator;
  },

  getOperatorByWallet(wallet) {
    return readDB().operators.find(op => op.wallet_address === wallet) || null;
  },

  getOperatorById(id) {
    return readDB().operators.find(op => op.id === id) || null;
  },

  updateOperator(id, updates) {
    const db = readDB();
    const idx = db.operators.findIndex(op => op.id === id);
    if (idx === -1) return null;
    db.operators[idx] = { ...db.operators[idx], ...updates };
    writeDB(db);
    return db.operators[idx];
  },

  deleteOperator(id) {
    const db = readDB();
    db.operators = db.operators.filter(op => op.id !== id);
    db.applications = (db.applications || []).filter(a => a.operator_id !== id);
    writeDB(db);
    return true;
  },

  deleteOperatorByWallet(wallet) {
    const db = readDB();
    db.operators = db.operators.filter(op => op.wallet_address !== wallet);
    writeDB(db);
    return true;
  },

  getAllOperators() {
    return readDB().operators;
  },

  // ── Operator Dashboard ─────────────────────────────────────────────────────
  getOperatorDashboard(operatorId) {
    const db = readDB();
    const operator = db.operators.find(op => op.id === operatorId);
    if (!operator) return null;

    const allContracts = db.contracts || [];
    const allMissions = db.missions || [];
    const allEnterprises = db.enterprises || [];

    const contracts = allContracts
      .filter(c => c.operator_id === operatorId)
      .map(c => {
        const mission = allMissions.find(m => m.id === c.mission_id) || {};
        const enterprise = allEnterprises.find(e => e.id === (c.enterprise_id || mission.enterprise_id)) || {};
        return {
          ...c,
          title: c.title || mission.title || 'Mission',
          client_name: enterprise.company_name || 'Enterprise',
          enterprise_id: c.enterprise_id || mission.enterprise_id,
          region: c.region || mission.region || null,
          // FIX: standardize to amount_sol — reward field from missions mapped here
          amount_sol: c.amount_sol || mission.reward || 0,
          industry: enterprise.industry || null
        };
      });

    return {
      ...operator,
      license_status: operator.license_status || 'none',
      bio: operator.bio || null,
      flight_hours: operator.flight_hours || 0,
      contracts
    };
  },

  // ── Enterprises ────────────────────────────────────────────────────────────
  createEnterprise(data) {
    const db = readDB();
    const id = randomUUID();
    const now = Date.now();
    const enterprise = {
      id,
      wallet_address: data.wallet_address,
      company_name: data.company_name,
      business_type: data.business_type || null,
      year_established: data.year_established || null,
      industry: data.industry || null,
      operating_regions: data.operating_regions || null,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone || null,
      website: data.website || null,
      description: data.description || null,
      usdc_balance: 1000,
      created_at: now,
      business_verified: data.business_certificate_url ? false : false, // admin verifies
      business_document_url: data.business_certificate_url || null,
      business_certificate_url: data.business_certificate_url || null,
      bio: data.bio || null,
      logo_url: null,
      total_missions_posted: 0,
      total_missions_completed: 0
    };
    db.enterprises.push(enterprise);
    writeDB(db);
    return enterprise;
  },

  getEnterpriseByWallet(wallet) {
    return readDB().enterprises.find(e => e.wallet_address === wallet) || null;
  },

  getEnterpriseById(id) {
    return readDB().enterprises.find(e => e.id === id) || null;
  },

  updateEnterprise(id, updates) {
    const db = readDB();
    const idx = db.enterprises.findIndex(e => e.id === id);
    if (idx === -1) return null;
    db.enterprises[idx] = { ...db.enterprises[idx], ...updates };
    writeDB(db);
    return db.enterprises[idx];
  },

  deleteEnterpriseByWallet(wallet) {
    const db = readDB();
    db.enterprises = db.enterprises.filter(e => e.wallet_address !== wallet);
    writeDB(db);
    return true;
  },

  getAllEnterprises() {
    return readDB().enterprises;
  },

  // ── Availability ───────────────────────────────────────────────────────────
  checkUsername(username) {
    return !readDB().operators.some(op => op.username?.toLowerCase() === username?.toLowerCase());
  },

  checkCompanyName(name) {
    return !readDB().enterprises.some(e => e.company_name?.toLowerCase() === name?.toLowerCase());
  },

  checkWallet(wallet) {
    const db = readDB();
    return !db.operators.some(op => op.wallet_address === wallet) &&
           !db.enterprises.some(e => e.wallet_address === wallet);
  },

  findUserByWallet(wallet) {
    const db = readDB();
    const op = db.operators.find(o => o.wallet_address === wallet);
    if (op) {
      return { id: op.id, fullName: op.full_name, username: op.username, walletAddress: wallet, role: 'operator' };
    }
    const ent = db.enterprises.find(e => e.wallet_address === wallet);
    if (ent) {
      return { id: ent.id, fullName: ent.contact_name, companyName: ent.company_name, walletAddress: wallet, role: 'enterprise' };
    }
    return null;
  },

  // ── Missions ───────────────────────────────────────────────────────────────
  createMission(data) {
    const db = readDB();
    const id = randomUUID();
    const mission = {
      id,
      enterprise_id: data.enterprise_id,
      enterprise_name: data.enterprise_name || null,
      title: data.title,
      mission_type: data.missionType || data.mission_type || 'inspection',
      region: data.region,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      description: data.description || null,
      reward: data.reward,
      status: data.status || 'open',
      escrow: data.escrow || data.reward,   // funds locked in simulated escrow
      requirements: data.requirements || {},
      operators_needed: data.operators_needed || 1,
      subtasks: data.subtasks || [],    // array of { id, name, description, sol_reward, status, claimed_by, claimed_by_name, claimed_at }
      completed_at: null,
      created_at: Date.now(),
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget_usdc: data.budget_usdc || data.reward || 0,
      address: data.address || null,
      weather_cache: null,
      attachments: data.attachments || [],
      draft: data.draft || false,
      escrow_tx: data.escrow_tx || null,
      escrow_deposited_lamports: data.escrow_deposited_lamports || null,
      escrow_status: data.escrow_status || 'pending'
    };
    db.missions.push(mission);
    writeDB(db);
    return mission;
  },

  getMissions(filters = {}) {
    const db = readDB();
    let missions = [...db.missions];
    if (filters.enterprise_id) missions = missions.filter(m => m.enterprise_id === filters.enterprise_id);
    if (filters.status) missions = missions.filter(m => m.status === filters.status);
    if (filters.region) missions = missions.filter(m => m.region?.toLowerCase().includes(filters.region.toLowerCase()));
    return missions.sort((a, b) => b.created_at - a.created_at);
  },

  getMissionById(id) {
    return readDB().missions.find(m => m.id === id) || null;
  },

  updateMission(id, updates) {
    const db = readDB();
    const idx = db.missions.findIndex(m => m.id === id);
    if (idx === -1) return null;
    db.missions[idx] = { ...db.missions[idx], ...updates };
    writeDB(db);
    return db.missions[idx];
  },

  // ── Applications ───────────────────────────────────────────────────────────
  createApplication(data) {
    const db = readDB();
    const id = randomUUID();
    const application = {
      id,
      mission_id: data.mission_id,
      operator_id: data.operator_id,
      operator_name: data.operator_name || null,
      operator_username: data.operator_username || null,
      status: 'pending',
      message: data.message || null,
      created_at: Date.now()
    };
    db.applications = db.applications || [];
    db.applications.push(application);
    writeDB(db);
    return application;
  },

  getApplicationsByMission(missionId) {
    const db = readDB();
    return (db.applications || [])
      .filter(a => a.mission_id === missionId)
      .map(app => {
        const op = db.operators.find(o => o.id === app.operator_id) || {};
        return {
          ...app,
          operator_name: op.full_name || app.operator_name,
          operator_username: op.username || app.operator_username,
          operator_region: op.region,
          operator_experience: op.experience,
          operator_certifications: op.certifications || [],
          operator_drone_model: op.drone_model,
          operator_rating: op.rating || null,
          operator_completed_missions: op.completed_missions || 0
        };
      });
  },

  getApplicationsByOperator(operatorId) {
    const db = readDB();
    return (db.applications || [])
      .filter(a => a.operator_id === operatorId)
      .map(app => {
        const mission = db.missions.find(m => m.id === app.mission_id) || {};
        const enterprise = db.enterprises.find(e => e.id === mission.enterprise_id) || {};
        return {
          ...app,
          mission_title: mission.title,
          mission_region: mission.region,
          mission_reward: mission.reward,
          enterprise_name: enterprise.company_name
        };
      });
  },

  updateApplication(id, updates) {
    const db = readDB();
    db.applications = db.applications || [];
    const idx = db.applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    db.applications[idx] = { ...db.applications[idx], ...updates };
    writeDB(db);
    return db.applications[idx];
  },

  hasApplied(missionId, operatorId) {
    return (readDB().applications || []).some(
      a => a.mission_id === missionId && a.operator_id === operatorId
    );
  },

  // ── Contracts ──────────────────────────────────────────────────────────────
  createContract(data) {
    const db = readDB();
    const id = randomUUID();
    const contract = {
      id,
      mission_id: data.mission_id || null,
      enterprise_id: data.enterprise_id,
      operator_id: data.operator_id,
      operator_name: data.operator_name || null,
      operator_username: data.operator_username || null,
      title: data.title,
      description: data.description || null,
      region: data.region || null,
      amount_sol: data.amount_sol || 0,   // FIX: standardized field name
      status: data.status || 'active',
      progress: 0,
      rating: null,                        // FIX: was missing → rating system broken
      comment: null,                       // FIX: was missing
      completed_at: null,                  // FIX: was missing
      created_at: Date.now()
    };
    db.contracts = db.contracts || [];
    db.contracts.push(contract);
    writeDB(db);
    return contract;
  },

  getContractById(id) {
    const db = readDB();
    return (db.contracts || []).find(c => c.id === id) || null;
  },

  getContracts(filters = {}) {
    const db = readDB();
    let contracts = db.contracts || [];
    if (filters.enterprise_id) contracts = contracts.filter(c => c.enterprise_id === filters.enterprise_id);
    if (filters.operator_id) contracts = contracts.filter(c => c.operator_id === filters.operator_id);
    if (filters.status) contracts = contracts.filter(c => c.status === filters.status);
    return contracts.sort((a, b) => b.created_at - a.created_at);
  },

  updateContract(id, updates) {
    const db = readDB();
    db.contracts = db.contracts || [];
    const idx = db.contracts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    db.contracts[idx] = { ...db.contracts[idx], ...updates };
    writeDB(db);
    return db.contracts[idx];
  },

  // ─────────────────────────────────────────────────────────────────────────
  // completeContract — marks contract done, saves rating, updates operator stats
  //
  // Called by: POST /api/contracts/:id/complete
  //
  // Logic:
  //   1. Find and validate contract
  //   2. Mark contract completed with rating + comment
  //   3. Update operator: completed_missions++, total_earned += amount_sol,
  //      rating = rolling weighted average, total_missions++
  //   4. Mark parent mission as completed
  //
  // The rating is a running average:
  //   new_avg = (old_avg * old_count + new_rating) / (old_count + 1)
  //   Using completed_missions as the count (before incrementing).
  // ─────────────────────────────────────────────────────────────────────────
  completeContract(contractId, rating, comment = null) {
    const db = readDB();
    db.contracts = db.contracts || [];
    const contractIdx = db.contracts.findIndex(c => c.id === contractId);
    if (contractIdx === -1) return null;

    const contract = db.contracts[contractIdx];
    if (contract.status === 'completed') {
      // Already completed — idempotent return
      return { contract, operator: db.operators.find(o => o.id === contract.operator_id) };
    }

    const now = Date.now();

    // 1. Complete the contract
    db.contracts[contractIdx] = {
      ...contract,
      status: 'completed',
      rating: parseFloat(rating),
      comment: comment || null,
      completed_at: now,
      progress: 100
    };

    // 2. Update operator stats
    const opIdx = db.operators.findIndex(o => o.id === contract.operator_id);
    if (opIdx !== -1) {
      const op = db.operators[opIdx];
      const prevCompleted = op.completed_missions || 0;
      const prevRating = op.rating || null;
      const newRating = prevRating === null
        ? parseFloat(rating)
        : parseFloat(((prevRating * prevCompleted + parseFloat(rating)) / (prevCompleted + 1)).toFixed(2));

      db.operators[opIdx] = {
        ...op,
        completed_missions: prevCompleted + 1,
        total_missions: (op.total_missions || 0) + 1,
        total_earned: (op.total_earned || 0) + (contract.amount_sol || 0),
        rating: newRating
      };
    }

    // 3. Mark parent mission completed
    if (contract.mission_id) {
      const missionIdx = db.missions.findIndex(m => m.id === contract.mission_id);
      if (missionIdx !== -1) {
        db.missions[missionIdx] = {
          ...db.missions[missionIdx],
          status: 'completed',
          completed_at: now
        };
      }
    }

    writeDB(db);

    return {
      contract: db.contracts[contractIdx],
      operator: opIdx !== -1 ? db.operators[opIdx] : null
    };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // withdrawEarnings — deducts from operator total_earned
  // Returns { operator, withdrawn } on success, { error } on failure.
  // ─────────────────────────────────────────────────────────────────────────
  withdrawEarnings(operatorId, amount) {
    const db = readDB();
    const idx = db.operators.findIndex(o => o.id === operatorId);
    if (idx === -1) return null;

    const op = db.operators[idx];
    const available = op.total_earned || 0;

    if (amount > available) {
      return { error: `Insufficient earnings. Available: ${available} SOL` };
    }

    db.operators[idx] = {
      ...op,
      total_earned: parseFloat((available - amount).toFixed(4))
    };

    writeDB(db);
    return { operator: db.operators[idx], withdrawn: amount };
  },

  // ── Messages (legacy per-contract) ─────────────────────────────────────────
  createMessage(data) {
    const db = readDB();
    const id = randomUUID();
    const message = {
      id,
      contract_id: data.contract_id,
      sender_type: data.sender_type,
      sender_id: data.sender_id,
      text: data.text,
      timestamp: Date.now(),
      read: false
    };
    db.messages = db.messages || [];
    db.messages.push(message);
    writeDB(db);
    return message;
  },

  getMessages(contractId) {
    return (readDB().messages || [])
      .filter(m => m.contract_id === contractId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  markMessagesRead(contractId, readerType) {
    const db = readDB();
    db.messages = (db.messages || []).map(m =>
      m.contract_id === contractId && m.sender_type !== readerType
        ? { ...m, read: true }
        : m
    );
    writeDB(db);
  },

  // ── Conversations (new threaded messaging) ─────────────────────────────────
  // FIX: All helpers below were missing — every conversation endpoint crashed

  getOrCreateConversation(operatorId, enterpriseId, contractId = null) {
    const db = readDB();
    db.conversations = db.conversations || [];

    // Find existing conversation for this pair (and optional contract)
    let conv = contractId
      ? db.conversations.find(c => c.operator_id === operatorId && c.enterprise_id === enterpriseId && c.contract_id === contractId)
      : db.conversations.find(c => c.operator_id === operatorId && c.enterprise_id === enterpriseId);

    if (conv) return conv;

    // Create new conversation
    conv = {
      id: randomUUID(),
      operator_id: operatorId,
      enterprise_id: enterpriseId,
      contract_id: contractId || null,
      created_at: Date.now()
    };
    db.conversations.push(conv);
    writeDB(db);
    return conv;
  },

  getConversationById(id) {
    return (readDB().conversations || []).find(c => c.id === id) || null;
  },

  getConversationsByUser(userId, role) {
    const db = readDB();
    const convs = (db.conversations || []).filter(c =>
      role === 'operator' ? c.operator_id === userId : c.enterprise_id === userId
    );

    // Enrich with last message + unread count
    return convs.map(conv => {
      const msgs = (db.conv_messages || []).filter(m => m.conversation_id === conv.id);
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      const unread = msgs.filter(m => !m.read && m.sender_id !== userId).length;

      // Enrich with the other party's name
      const otherParty = role === 'operator'
        ? db.enterprises.find(e => e.id === conv.enterprise_id)
        : db.operators.find(o => o.id === conv.operator_id);

      return {
        ...conv,
        other_name: role === 'operator'
          ? (otherParty?.company_name || 'Enterprise')
          : (otherParty?.full_name || 'Operator'),
        other_username: role === 'enterprise' ? (otherParty?.username || null) : null,
        last_message: lastMsg?.content || null,
        last_message_time: lastMsg?.timestamp || conv.created_at,
        unread_count: unread
      };
    }).sort((a, b) => b.last_message_time - a.last_message_time);
  },

  getConvMessages(conversationId) {
    return (readDB().conv_messages || [])
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  createConvMessage(data) {
    const db = readDB();
    const msg = {
      id: randomUUID(),
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      sender_role: data.sender_role,
      content: data.content,
      timestamp: Date.now(),
      read: false
    };
    db.conv_messages = db.conv_messages || [];
    db.conv_messages.push(msg);
    writeDB(db);
    return msg;
  },

  markConvMessagesRead(conversationId, readerId) {
    const db = readDB();
    db.conv_messages = (db.conv_messages || []).map(m =>
      m.conversation_id === conversationId && m.sender_id !== readerId
        ? { ...m, read: true }
        : m
    );
    writeDB(db);
  },

  // ── Profiles (public views) ────────────────────────────────────────────────
  getOperatorProfile(operatorId) {
    const db = readDB();
    const op = db.operators.find(o => o.id === operatorId);
    if (!op) return null;
    // Return public fields only (no wallet address in public profile)
    return {
      id: op.id,
      full_name: op.full_name,
      username: op.username,
      region: op.region,
      drone_model: op.drone_model,
      vehicle_type: op.vehicle_type,
      experience: op.experience,
      certifications: op.certifications || [],
      profile_image: op.profile_image,
      rating: op.rating,
      total_missions: op.total_missions,
      completed_missions: op.completed_missions,
      member_since: op.member_since
    };
  },

  getEnterpriseProfile(enterpriseId) {
    const db = readDB();
    const ent = db.enterprises.find(e => e.id === enterpriseId);
    if (!ent) return null;
    return {
      id: ent.id,
      company_name: ent.company_name,
      industry: ent.industry,
      description: ent.description,
      website: ent.website,
      operating_regions: ent.operating_regions,
      created_at: ent.created_at
    };
  },

  // ── Settings / Profile Updates ─────────────────────────────────────────────
  updateOperatorProfile(operatorId, updates) {
    const db = readDB();
    const idx = db.operators.findIndex(o => o.id === operatorId);
    if (idx === -1) return null;
    // Only allow safe profile fields to be updated (not id, wallet, rating, earnings)
    const allowed = ['full_name', 'username', 'region', 'drone_model', 'vehicle_type',
      'experience', 'certifications', 'profile_image', 'drone_image', 'flight_stack',
      'autopilot_hardware', 'firmware_version', 'communication_protocol', 'contact_email'];
    const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
    db.operators[idx] = { ...db.operators[idx], ...safe };
    writeDB(db);
    return db.operators[idx];
  },

  updateEnterpriseProfile(enterpriseId, updates) {
    const db = readDB();
    const idx = db.enterprises.findIndex(e => e.id === enterpriseId);
    if (idx === -1) return null;
    const allowed = ['company_name', 'contact_name', 'contact_email', 'contact_phone',
      'industry', 'description', 'website', 'operating_regions', 'business_type'];
    const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
    db.enterprises[idx] = { ...db.enterprises[idx], ...safe };
    writeDB(db);
    return db.enterprises[idx];
  },

  // ── Audit logging ─────────────────────────────────────────────────────────
  addAuditLog(action, userId, details = {}) {
    const db = readDB();
    db.audit_logs = db.audit_logs || [];
    db.audit_logs.push({ id: randomUUID(), action, userId, details, timestamp: Date.now() });
    writeDB(db);
  },

  // ── Public profiles (by username/company slug) ────────────────────────────
  getOperatorByUsername(username) {
    return readDB().operators.find(op => op.username?.toLowerCase() === username?.toLowerCase()) || null;
  },

  getEnterpriseByName(name) {
    const db = readDB();
    return db.enterprises.find(e =>
      e.company_name?.toLowerCase().replace(/\s+/g, '-') === name?.toLowerCase()
    ) || null;
  },

  // ── Enhanced profile fetches ───────────────────────────────────────────────
  getOperatorProfile(operatorId) {
    const db = readDB();
    const op = db.operators.find(o => o.id === operatorId);
    if (!op) return null;
    return {
      id: op.id,
      full_name: op.full_name,
      username: op.username,
      region: op.region,
      bio: op.bio || null,
      drone_model: op.drone_model,
      vehicle_type: op.vehicle_type,
      experience: op.experience,
      certifications: op.certifications || [],
      profile_image: op.profile_image,
      rating: op.rating,
      total_missions: op.total_missions || 0,
      completed_missions: op.completed_missions || 0,
      total_earned: op.total_earned || 0,
      member_since: op.member_since,
      flight_hours: op.flight_hours || 0,
      drone_fleet: op.drone_fleet || [],
      license_status: op.license_status || 'none'
    };
  },

  getEnterpriseProfile(enterpriseId) {
    const db = readDB();
    const ent = db.enterprises.find(e => e.id === enterpriseId);
    if (!ent) return null;
    const missions = db.missions.filter(m => m.enterprise_id === enterpriseId);
    return {
      id: ent.id,
      company_name: ent.company_name,
      industry: ent.industry,
      bio: ent.bio || null,
      description: ent.description,
      website: ent.website,
      logo_url: ent.logo_url || null,
      operating_regions: ent.operating_regions,
      business_verified: ent.business_verified || false,
      created_at: ent.created_at,
      total_missions_posted: missions.length,
      total_missions_completed: missions.filter(m => m.status === 'completed').length
    };
  },

  // ── Enhanced operator profile update (includes new fields) ────────────────
  updateOperatorProfile(operatorId, updates) {
    const db = readDB();
    const idx = db.operators.findIndex(o => o.id === operatorId);
    if (idx === -1) return null;
    const allowed = ['full_name', 'username', 'region', 'drone_model', 'vehicle_type',
      'experience', 'certifications', 'profile_image', 'drone_image', 'flight_stack',
      'autopilot_hardware', 'firmware_version', 'communication_protocol', 'contact_email',
      'bio', 'flight_hours', 'drone_fleet', 'license_document_url', 'license_status'];
    const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
    db.operators[idx] = { ...db.operators[idx], ...safe };
    writeDB(db);
    return db.operators[idx];
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  clearAll() {
    writeDB({ ...EMPTY_DB });
    return true;
  }
};

// Legacy shim — keeps any stray db.prepare() calls from crashing at import
export const db = {
  prepare: () => ({ get: () => null, all: () => [], run: () => ({ changes: 0 }) })
};
