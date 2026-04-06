// server/index.mjs
import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';          // FIX: was missing, crashed /api/missions
import { dbHelpers } from './simple-db.mjs';  // FIX: only use real helpers, no db.prepare stub
// Escrow helpers — loaded dynamically so server still boots if @solana/web3.js
// isn't installed yet (run `npm install` to enable on-chain features).
let ESCROW_ADDRESS = 'Dx9ey3aYGcpJn1XWNBknC2BvGBpS9TwGAWpRkFGTFf1m';
let getEscrowBalance = async () => ({ sol: 0, lamports: 0 });
let verifyDeposit    = async () => ({ ok: false, reason: 'escrow module not loaded' });
let payOperator      = async () => ({ ok: false, reason: 'escrow module not loaded' });
let solToLamports    = (sol) => Math.round(parseFloat(sol) * 1e9);
let ensureEscrowFunded = async () => null;

try {
  const escrow = await import('./escrow.mjs');
  ESCROW_ADDRESS     = escrow.ESCROW_ADDRESS;
  getEscrowBalance   = escrow.getEscrowBalance;
  verifyDeposit      = escrow.verifyDeposit;
  payOperator        = escrow.payOperator;
  solToLamports      = escrow.solToLamports;
  ensureEscrowFunded = escrow.ensureEscrowFunded;
  console.log('✅ Escrow module loaded. Address:', ESCROW_ADDRESS);
} catch (e) {
  console.warn('⚠️  Escrow module failed to load — on-chain features disabled.');
  console.warn('    Run `npm install` to enable real Solana devnet escrow.');
  console.warn('    Error:', e.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── File uploads ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads/')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ── File upload ───────────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `http://localhost:3001/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

// FIX: Missing endpoint — Home.jsx calls this to auto-login returning users
app.get('/api/auth/wallet-check', (req, res) => {
  try {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ error: 'wallet required' });
    const user = dbHelpers.findUserByWallet(wallet);
    if (user) return res.json({ exists: true, user });
    res.json({ exists: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FIX: wallet-login now uses real dbHelpers (was using db.prepare stub → always 404)
// NOTE: signature is validated client-side via nacl (SigninMessage.validate).
//       Server trusts that the client signed correctly; full server-side verification
//       would require nacl on the server — acceptable for this demo stage.
app.post('/api/auth/wallet-login', (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

    const user = dbHelpers.findUserByWallet(walletAddress);
    if (user) return res.json({ success: true, user });
    res.status(404).json({ error: 'Wallet not registered' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AVAILABILITY CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

// FIX: was using db.prepare stub → always returned available:true
app.get('/api/check/username', (req, res) => {
  try {
    const { username } = req.query;
    res.json({ available: dbHelpers.checkUsername(username) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/check/company', (req, res) => {
  try {
    const { name } = req.query;
    res.json({ available: dbHelpers.checkCompanyName(name) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/check/wallet', (req, res) => {
  try {
    const { wallet } = req.query;
    res.json({ available: dbHelpers.checkWallet(wallet) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATORS
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/operators', (req, res) => {
  try {
    const operator = dbHelpers.createOperator(req.body);
    res.json(operator);
  } catch (e) {
    console.error('Error creating operator:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/operators/wallet/:wallet', (req, res) => {
  try {
    const operator = dbHelpers.getOperatorByWallet(req.params.wallet);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    res.json(operator);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FIX: was using db.prepare stub → dashboard always returned null
app.get('/api/operators/:id/dashboard', (req, res) => {
  try {
    const dashboard = dbHelpers.getOperatorDashboard(req.params.id);
    if (!dashboard) return res.status(404).json({ error: 'Operator not found' });
    res.json(dashboard);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/operators/:id', (req, res) => {
  try {
    const operator = dbHelpers.getOperatorById(req.params.id);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    res.json(operator);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/operators/:id', (req, res) => {
  try {
    const operator = dbHelpers.updateOperator(req.params.id, req.body);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    res.json({ success: true, operator });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/operators/:id', (req, res) => {
  try {
    dbHelpers.deleteOperator(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISES
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/enterprises', (req, res) => {
  try {
    const enterprise = dbHelpers.createEnterprise(req.body);
    res.json(enterprise);
  } catch (e) {
    console.error('Error creating enterprise:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/enterprises/wallet/:wallet', (req, res) => {
  try {
    const enterprise = dbHelpers.getEnterpriseByWallet(req.params.wallet);
    if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });
    res.json(enterprise);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FIX: was using db.prepare stub → always returned 404
app.get('/api/enterprises/:id', (req, res) => {
  try {
    const enterprise = dbHelpers.getEnterpriseById(req.params.id);
    if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });
    res.json(enterprise);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/enterprises/:id', (req, res) => {
  try {
    const enterprise = dbHelpers.updateEnterprise(req.params.id, req.body);
    if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });
    res.json({ success: true, enterprise });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FIX: deposit now actually persists to db.json
app.post('/api/deposit', (req, res) => {
  try {
    const { enterpriseId, amount } = req.body;
    const enterprise = dbHelpers.getEnterpriseById(enterpriseId);
    if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });
    const newBalance = (enterprise.usdc_balance || 0) + parseFloat(amount);
    dbHelpers.updateEnterprise(enterpriseId, { usdc_balance: newBalance });
    res.json({ success: true, balance: newBalance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MISSIONS
// ═══════════════════════════════════════════════════════════════════════════════

// FIX: was crashing with ReferenceError: randomUUID not defined
app.post('/api/missions', (req, res) => {
  try {
    const mission = dbHelpers.createMission(req.body);

    // Deduct balance from enterprise
    if (mission.enterprise_id && mission.reward) {
      const enterprise = dbHelpers.getEnterpriseById(mission.enterprise_id);
      if (enterprise) {
        const newBalance = Math.max(0, (enterprise.usdc_balance || 0) - mission.reward);
        dbHelpers.updateEnterprise(mission.enterprise_id, { usdc_balance: newBalance });
      }
    }

    res.json(mission);
  } catch (e) {
    console.error('Error creating mission:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/missions', (req, res) => {
  try {
    const filters = {
      enterprise_id: req.query.enterprise_id,
      status: req.query.status,
      region: req.query.region
    };
    const missions = dbHelpers.getMissions(filters);
    res.json(missions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/missions/:id', (req, res) => {
  try {
    const mission = dbHelpers.getMissionById(req.params.id);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    res.json(mission);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/missions/:id', (req, res) => {
  try {
    const mission = dbHelpers.updateMission(req.params.id, req.body);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    res.json(mission);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATIONS (operator applies to mission)
// ═══════════════════════════════════════════════════════════════════════════════

// Operator applies to a mission
app.post('/api/applications', (req, res) => {
  try {
    const { mission_id, operator_id } = req.body;
    if (dbHelpers.hasApplied(mission_id, operator_id)) {
      return res.status(409).json({ error: 'Already applied to this mission' });
    }
    const application = dbHelpers.createApplication(req.body);
    res.json(application);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Enterprise views applicants for their mission
app.get('/api/missions/:id/applications', (req, res) => {
  try {
    const applications = dbHelpers.getApplicationsByMission(req.params.id);
    res.json(applications);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Operator views their own applications
app.get('/api/operators/:id/applications', (req, res) => {
  try {
    const applications = dbHelpers.getApplicationsByOperator(req.params.id);
    res.json(applications);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Enterprise approves or rejects an application
app.patch('/api/applications/:id', (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    const application = dbHelpers.updateApplication(req.params.id, { status });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // If approved, create a real contract
    if (status === 'approved') {
      const mission = dbHelpers.getMissionById(application.mission_id);
      if (mission) {
        // FIX: include operator_name + operator_username so dashboards can display them
        // without a second lookup, and so @username clickable chat links work.
        dbHelpers.createContract({
          mission_id: mission.id,
          enterprise_id: mission.enterprise_id,
          operator_id: application.operator_id,
          operator_name: application.operator_name || null,
          operator_username: application.operator_username || null,
          title: mission.title,
          description: mission.description,
          region: mission.region,
          amount_sol: mission.reward   // standardized field — reward → amount_sol
        });
        // Mark mission as assigned now that an operator is approved
        dbHelpers.updateMission(mission.id, { status: 'assigned' });
      }
    }

    res.json(application);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACTS
// ═══════════════════════════════════════════════════════════════════════════════

// FIX: was crashing — getContracts/createContract didn't exist in old simple-db.mjs
app.get('/api/contracts', (req, res) => {
  try {
    const contracts = dbHelpers.getContracts({
      enterprise_id: req.query.enterprise_id,
      operator_id: req.query.operator_id,
      status: req.query.status
    });
    res.json(contracts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/contracts', (req, res) => {
  try {
    const contract = dbHelpers.createContract(req.body);
    res.json(contract);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/contracts/:id', (req, res) => {
  try {
    const contract = dbHelpers.updateContract(req.params.id, req.body);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES — now persisted to db.json, not localStorage
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/messages/:contractId', (req, res) => {
  try {
    const messages = dbHelpers.getMessages(req.params.contractId);
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const message = dbHelpers.createMessage(req.body);
    res.json(message);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/messages/:contractId/read', (req, res) => {
  try {
    dbHelpers.markMessagesRead(req.params.contractId, req.body.reader_type);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

// FIX: was using db.prepare stub → always returned []
app.get('/api/admin/operators', (req, res) => {
  try {
    res.json(dbHelpers.getAllOperators());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/enterprises', (req, res) => {
  try {
    res.json(dbHelpers.getAllEnterprises());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/operators/:wallet', (req, res) => {
  try {
    dbHelpers.deleteOperatorByWallet(req.params.wallet);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/enterprises/:wallet', (req, res) => {
  try {
    dbHelpers.deleteEnterpriseByWallet(req.params.wallet);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FIX: was using db.prepare stub → no-op
app.post('/api/admin/clear-all', (req, res) => {
  try {
    dbHelpers.clearAll();
    res.json({ success: true, message: 'All data cleared' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Debug — see raw db contents
app.get('/api/debug/db', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATIONS & MESSAGING
// ═══════════════════════════════════════════════════════════════════════════════

// Get or create a conversation thread
app.post('/api/conversations', (req, res) => {
  try {
    const { operator_id, enterprise_id, contract_id } = req.body;
    if (!operator_id || !enterprise_id) return res.status(400).json({ error: 'operator_id and enterprise_id required' });
    const conv = dbHelpers.getOrCreateConversation(operator_id, enterprise_id, contract_id || null);
    res.json(conv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// List conversations for a user
app.get('/api/conversations', (req, res) => {
  try {
    const { user_id, role } = req.query;
    if (!user_id || !role) return res.status(400).json({ error: 'user_id and role required' });
    const convs = dbHelpers.getConversationsByUser(user_id, role);
    res.json(convs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get messages in a conversation
app.get('/api/conversations/:id/messages', (req, res) => {
  try {
    const msgs = dbHelpers.getConvMessages(req.params.id);
    res.json(msgs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Send a message in a conversation
app.post('/api/conversations/:id/messages', (req, res) => {
  try {
    const { sender_id, sender_role, content } = req.body;
    if (!sender_id || !content) return res.status(400).json({ error: 'sender_id and content required' });
    // Verify conversation exists
    const conv = dbHelpers.getConversationById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    const msg = dbHelpers.createConvMessage({
      conversation_id: req.params.id,
      sender_id, sender_role, content
    });
    res.json(msg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mark messages as read
app.post('/api/conversations/:id/read', (req, res) => {
  try {
    dbHelpers.markConvMessagesRead(req.params.id, req.body.reader_id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/profiles/operator/:id', (req, res) => {
  try {
    const profile = dbHelpers.getOperatorProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Operator not found' });
    res.json(profile);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/profiles/enterprise/:id', (req, res) => {
  try {
    const profile = dbHelpers.getEnterpriseProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Enterprise not found' });
    res.json(profile);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS / PROFILE UPDATES
// ═══════════════════════════════════════════════════════════════════════════════

app.patch('/api/settings/operator/:id', (req, res) => {
  try {
    const updated = dbHelpers.updateOperatorProfile(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Operator not found' });
    res.json({ success: true, user: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/settings/enterprise/:id', (req, res) => {
  try {
    const updated = dbHelpers.updateEnterpriseProfile(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Enterprise not found' });
    res.json({ success: true, user: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT COMPLETION + RATING
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/contracts/:id/complete', (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5' });
    const result = dbHelpers.completeContract(req.params.id, parseFloat(rating), comment);
    if (!result) return res.status(404).json({ error: 'Contract not found' });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATOR WITHDRAW
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/operators/:id/withdraw', (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const result = dbHelpers.withdrawEarnings(req.params.id, parseFloat(amount));
    if (!result) return res.status(404).json({ error: 'Operator not found' });
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILES (by username / company slug)
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/profiles/operator/username/:username', (req, res) => {
  try {
    const operator = dbHelpers.getOperatorByUsername(req.params.username);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    const profile = dbHelpers.getOperatorProfile(operator.id);
    res.json(profile);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/profiles/enterprise/name/:name', (req, res) => {
  try {
    const enterprise = dbHelpers.getEnterpriseByName(req.params.name);
    if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });
    const profile = dbHelpers.getEnterpriseProfile(enterprise.id);
    res.json(profile);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEATHER PROXY
// ═══════════════════════════════════════════════════════════════════════════════

function generateMockWeather(lat, lng) {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Wind'];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() + i * 86400000).toISOString().split('T')[0];
    const wind = Math.round(5 + Math.random() * 25);
    const rain = Math.random() > 0.7 ? Math.round(Math.random() * 15) : 0;
    const temp = Math.round(15 + Math.random() * 20);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const flyable = wind < 20 && rain === 0 ? 'good' : wind < 30 && rain < 5 ? 'caution' : 'unsafe';
    return { date, wind_kmh: wind, rain_mm: rain, temp_c: temp, condition, flyable };
  });
}

function parseForecastToDailyMap(list) {
  const byDay = {};
  list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!byDay[date]) byDay[date] = [];
    byDay[date].push(item);
  });
  return Object.entries(byDay).map(([date, items]) => {
    const avgWind = items.reduce((s, i) => s + (i.wind?.speed || 0) * 3.6, 0) / items.length;
    const maxRain = Math.max(...items.map(i => i.rain?.['3h'] || 0));
    const avgTemp = items.reduce((s, i) => s + (i.main?.temp || 20), 0) / items.length;
    const condition = items[Math.floor(items.length / 2)]?.weather?.[0]?.main || 'Clear';
    const wind = Math.round(avgWind);
    const rain = parseFloat(maxRain.toFixed(1));
    const flyable = wind < 20 && rain < 1 ? 'good' : wind < 30 && rain < 5 ? 'caution' : 'unsafe';
    return { date, wind_kmh: wind, rain_mm: rain, temp_c: Math.round(avgTemp), condition, flyable };
  });
}

app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      // Return mock data if no API key configured
      return res.json({ mock: true, daily: generateMockWeather(parseFloat(lat), parseFloat(lng)) });
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=40`;
    const fetchFn = globalThis.fetch || (await import('node-fetch')).default;
    const response = await fetchFn(url);
    const data = await response.json();
    // Parse into daily summaries
    const daily = parseForecastToDailyMap(data.list || []);
    res.json({ daily });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: LICENSE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/admin/pending-verifications', (req, res) => {
  try {
    const pending = dbHelpers.getAllOperators().filter(op => op.license_status === 'pending');
    res.json(pending);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/verify-operator/:id', (req, res) => {
  try {
    const { status } = req.body; // 'verified' | 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be verified or rejected' });
    }
    const operator = dbHelpers.updateOperator(req.params.id, { license_status: status });
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    res.json({ success: true, operator });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION DATES UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

app.patch('/api/missions/:id/dates', (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const mission = dbHelpers.updateMission(req.params.id, { start_date, end_date });
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    res.json(mission);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUBTASK CLAIMING — operator claims a specific subtask on a mission
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/missions/:id/subtasks/:subtaskId/claim
// Body: { operator_id, operator_name }
app.post('/api/missions/:id/subtasks/:subtaskId/claim', (req, res) => {
  try {
    const { operator_id, operator_name } = req.body;
    if (!operator_id) return res.status(400).json({ error: 'operator_id required' });

    const mission = dbHelpers.getMissionById(req.params.id);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });

    const subtasks = mission.subtasks || [];
    const stIdx = subtasks.findIndex(s => s.id === req.params.subtaskId);
    if (stIdx === -1) return res.status(404).json({ error: 'Subtask not found' });

    const sub = subtasks[stIdx];
    if (sub.claimed_by) {
      return res.status(409).json({ error: 'Subtask already claimed by another operator' });
    }

    // Check operator hasn't already claimed another subtask on this mission
    const alreadyClaimed = subtasks.some(s => s.claimed_by === operator_id);
    if (alreadyClaimed) {
      return res.status(409).json({ error: 'You have already claimed a subtask on this mission' });
    }

    subtasks[stIdx] = {
      ...sub,
      claimed_by: operator_id,
      claimed_by_name: operator_name || null,
      claimed_at: Date.now(),
      status: 'claimed',
    };

    const updated = dbHelpers.updateMission(req.params.id, { subtasks });
    res.json({ success: true, subtask: subtasks[stIdx], mission: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/missions/:id/subtasks/:subtaskId/complete
// Body: { operator_id }
app.post('/api/missions/:id/subtasks/:subtaskId/complete', (req, res) => {
  try {
    const { operator_id } = req.body;
    const mission = dbHelpers.getMissionById(req.params.id);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });

    const subtasks = mission.subtasks || [];
    const stIdx = subtasks.findIndex(s => s.id === req.params.subtaskId);
    if (stIdx === -1) return res.status(404).json({ error: 'Subtask not found' });

    if (subtasks[stIdx].claimed_by !== operator_id) {
      return res.status(403).json({ error: 'You do not own this subtask' });
    }

    subtasks[stIdx] = { ...subtasks[stIdx], status: 'completed', completed_at: Date.now() };

    // If all subtasks complete, mark mission complete
    const allDone = subtasks.every(s => s.status === 'completed');
    const missionUpdates = { subtasks };
    if (allDone) missionUpdates.status = 'completed';

    const updated = dbHelpers.updateMission(req.params.id, missionUpdates);
    res.json({ success: true, subtask: subtasks[stIdx], mission: updated, allSubtasksDone: allDone });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEVNET ESCROW — on-chain SOL payments
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/escrow/info — returns escrow address + live devnet balance
app.get('/api/escrow/info', async (req, res) => {
  try {
    const { sol, lamports } = await getEscrowBalance();
    res.json({
      address: ESCROW_ADDRESS,
      network: 'devnet',
      balance_sol: sol,
      balance_lamports: lamports,
      explorerUrl: `https://explorer.solana.com/address/${ESCROW_ADDRESS}?cluster=devnet`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/escrow/airdrop — request devnet airdrop to fund escrow (demo helper)
app.post('/api/escrow/airdrop', async (req, res) => {
  try {
    const balance = await ensureEscrowFunded(0); // always airdrop when called
    res.json({ success: true, balance_sol: (balance || 0) / 1e9 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/escrow/verify-deposit
// Body: { txSignature, fromWallet, missionId, expectedSol }
// Verifies the on-chain tx and stamps the mission with the deposit signature.
app.post('/api/escrow/verify-deposit', async (req, res) => {
  try {
    const { txSignature, fromWallet, missionId, expectedSol } = req.body;
    if (!txSignature || !missionId) {
      return res.status(400).json({ error: 'txSignature and missionId required' });
    }
    const expectedLamports = solToLamports(expectedSol || 0);
    const result = await verifyDeposit(txSignature, fromWallet, expectedLamports);

    if (!result.ok) {
      return res.status(422).json({ error: `Deposit verification failed: ${result.reason}` });
    }

    // Stamp mission with deposit info
    const mission = dbHelpers.updateMission(missionId, {
      escrow_tx: txSignature,
      escrow_deposited_lamports: result.deposited,
      escrow_status: 'funded',
    });

    res.json({
      success: true,
      deposited_sol: result.deposited / 1e9,
      txSignature,
      explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
      mission,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/contracts/:id/release-payment
// Pays operator from escrow when contract is completed.
// Called alongside /complete (which handles rating + DB update).
app.post('/api/contracts/:id/release-payment', async (req, res) => {
  try {
    const contract = dbHelpers.getContractById(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    // Get operator wallet
    const operator = dbHelpers.getOperatorById(contract.operator_id);
    if (!operator?.wallet_address) {
      return res.status(400).json({ error: 'Operator wallet not found' });
    }

    // Get mission to find escrowed amount
    const mission = dbHelpers.getMissionById(contract.mission_id);
    const lamports = mission?.escrow_deposited_lamports || solToLamports(contract.amount_sol || 0);

    if (!lamports || lamports <= 0) {
      return res.status(400).json({ error: 'No escrowed amount found for this contract' });
    }

    const result = await payOperator(operator.wallet_address, lamports);

    if (!result.ok) {
      return res.status(500).json({ error: `Payment failed: ${result.reason}` });
    }

    // Record payout tx on contract
    dbHelpers.updateContract(req.params.id, {
      payout_tx: result.signature,
      payout_status: 'paid',
    });

    if (mission) {
      dbHelpers.updateMission(mission.id, { escrow_status: 'released' });
    }

    res.json({
      success: true,
      paid_sol: lamports / 1e9,
      signature: result.signature,
      explorerUrl: result.explorerUrl,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NASA EONET — Natural Events (fires, storms, floods, etc.)
// Free API, no key required. https://eonet.gsfc.nasa.gov/docs/v3
// ═══════════════════════════════════════════════════════════════════════════════

// Haversine distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// GET /api/eonet?lat=X&lng=Y&radius=500&days=30
// Returns NASA EONET natural events within `radius` km of coordinates
app.get('/api/eonet', async (req, res) => {
  try {
    const { lat, lng, radius = 500, days = 30 } = req.query;
    const fetchFn = globalThis.fetch || (await import('node-fetch')).default;

    const url = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=${days}&limit=100`;
    const resp = await fetchFn(url, { headers: { 'Accept': 'application/json' } });
    const data = await resp.json();

    let events = data.events || [];

    // Filter by proximity if lat/lng provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      events = events.filter(ev => {
        const coords = ev.geometry?.[0]?.coordinates;
        if (!coords) return false;
        // EONET uses [lng, lat] order
        const evLng = Array.isArray(coords[0]) ? coords[0][0] : coords[0];
        const evLat = Array.isArray(coords[0]) ? coords[0][1] : coords[1];
        const dist = haversineKm(userLat, userLng, evLat, evLng);
        ev._distance_km = Math.round(dist);
        return dist <= radiusKm;
      });
    }

    // Shape events for frontend
    const shaped = events.map(ev => {
      const geo = ev.geometry?.[0];
      const coords = geo?.coordinates;
      const evLng = Array.isArray(coords?.[0]) ? coords[0][0] : coords?.[0];
      const evLat = Array.isArray(coords?.[0]) ? coords[0][1] : coords?.[1];
      return {
        id: ev.id,
        title: ev.title,
        category: ev.categories?.[0]?.title || 'Unknown',
        categoryId: ev.categories?.[0]?.id || '',
        date: geo?.date || null,
        lat: evLat,
        lng: evLng,
        distance_km: ev._distance_km || null,
        sources: ev.sources?.map(s => s.url) || [],
      };
    }).sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999));

    res.json({ count: shaped.length, events: shaped });
  } catch (e) {
    console.error('[EONET]', e.message);
    res.status(500).json({ error: e.message, events: [] });
  }
});

// GET /api/weather/current?lat=X&lng=Y — detailed current conditions
// Returns richer data: humidity, pressure, feels_like, UV index via mock or OWM
app.get('/api/weather/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      // Deterministic mock based on coordinates
      const seed = Math.abs(parseFloat(lat) * 100 + parseFloat(lng));
      const temp = Math.round(5 + (seed % 30));
      const wind = Math.round(5 + (seed % 35));
      const humidity = Math.round(30 + (seed % 50));
      const pressure = Math.round(1000 + (seed % 30));
      const conditions = ['Clear', 'Clouds', 'Rain', 'Wind', 'Mist'];
      const condition = conditions[Math.floor(seed % conditions.length)];
      const feelsLike = Math.round(temp - (wind > 20 ? 3 : 0));
      const visibility = condition === 'Mist' ? 2 : condition === 'Rain' ? 5 : 10;
      const flyable = wind < 20 && !['Rain','Thunderstorm'].includes(condition) ? 'good'
                    : wind < 30 ? 'caution' : 'unsafe';
      return res.json({
        mock: true, lat, lng,
        temp_c: temp, feels_like_c: feelsLike,
        wind_kmh: wind, wind_direction: ['N','NE','E','SE','S','SW','W','NW'][Math.floor(seed % 8)],
        humidity_pct: humidity, pressure_hpa: pressure,
        visibility_km: visibility, condition, flyable,
        updated_at: new Date().toISOString(),
      });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    const fetchFn = globalThis.fetch || (await import('node-fetch')).default;
    const response = await fetchFn(url);
    const d = await response.json();
    const wind = Math.round((d.wind?.speed || 0) * 3.6);
    const condition = d.weather?.[0]?.main || 'Clear';
    const flyable = wind < 20 && !['Rain','Thunderstorm','Snow'].includes(condition) ? 'good'
                  : wind < 30 ? 'caution' : 'unsafe';
    res.json({
      temp_c: Math.round(d.main?.temp || 0),
      feels_like_c: Math.round(d.main?.feels_like || 0),
      wind_kmh: wind,
      wind_direction: d.wind?.deg ? ['N','NE','E','SE','S','SW','W','NW'][Math.round(d.wind.deg / 45) % 8] : '—',
      humidity_pct: d.main?.humidity || 0,
      pressure_hpa: d.main?.pressure || 0,
      visibility_km: Math.round((d.visibility || 10000) / 1000),
      condition,
      flyable,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Sol Skies server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔑 Escrow address: ${ESCROW_ADDRESS} (devnet)`);
  // Silently try to fund escrow at startup — non-blocking
  ensureEscrowFunded().catch(() => {});
});
