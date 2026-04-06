// src/pages/operator/dashboard.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../Context/sessionContext';
import logo from '../../assets/AdobSOL.png';

// ─── Compact weather flyability badge for mission cards ───────────────────────
function WeatherBadge({ lat, lng }) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (!lat || !lng) return;
    fetch(`http://localhost:3001/api/weather?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(d => { if (d.daily?.[0]) setStatus(d.daily[0]); })
      .catch(() => {});
  }, [lat, lng]);

  if (!lat || !lng || !status) return null;
  const colors = { good: '#22c55e', caution: '#f59e0b', unsafe: '#ef4444' };
  const labels = { good: '✅ Flyable today', caution: '⚠️ Caution today', unsafe: '🚫 Poor conditions' };
  const icons = { Clear: '☀️', Clouds: '🌤️', Rain: '🌧️', Wind: '💨', Snow: '❄️', Thunderstorm: '⛈️' };
  const color = colors[status.flyable] || '#888';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: 8, padding: '6px 10px', marginBottom: 10, fontSize: 12
    }}>
      <span>{icons[status.condition] || '🌡️'}</span>
      <span style={{ color, fontWeight: 600 }}>{labels[status.flyable]}</span>
      <span style={{ color: '#888', marginLeft: 'auto' }}>
        {status.wind_kmh} km/h wind · {status.temp_c}°C
      </span>
    </div>
  );
}

const DASHBOARD_STYLES = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background-color: #0a0a0a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    .dashboard-page {
      display: flex;
      min-height: 100vh;
      background-color: #0a0a0a;
    }

    .sidebar {
      width: 280px;
      background: #111111;
      border-right: 1px solid #222;
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 40px;
      padding: 0 10px;
    }

    .sidebar-logo img {
      width: 40px;
      height: 40px;
      filter: brightness(0) invert(1);
    }

    .sidebar-logo span {
      font-size: 20px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #fff, #e9d5ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .sidebar-nav {
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 12px;
      color: #888;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      font-size: 15px;
    }

    .nav-item:hover {
      background: #1a1a1a;
      color: white;
    }

    .nav-item.active {
      background: #9333ea20;
      color: #9333ea;
      border-left: 3px solid #9333ea;
    }

    .nav-item.danger {
      color: #ef4444;
    }

    .nav-item.danger:hover {
      background: #ef444410;
      color: #ef4444;
    }

    .nav-divider {
      height: 1px;
      background: #222;
      margin: 12px 0;
    }

    .nav-icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
    }

    /* FIX #1: Wallet info sidebar — no empty bar when publicKey is null */
    .wallet-info-sidebar {
      margin-top: 20px;
      padding: 16px;
      background: #1a1a1a;
      border-radius: 12px;
      font-size: 14px;
      border: 1px solid #333;
    }

    .wallet-connected-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #22c55e;
    }

    .dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .wallet-address-small {
      font-family: monospace;
      color: #888;
      word-break: break-all;
      font-size: 12px;
      background: #222;
      padding: 8px;
      border-radius: 6px;
      margin-top: 10px;
    }

    .main-content {
      flex: 1;
      margin-left: 280px;
      padding: 30px;
      background-color: #0a0a0a;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .content-header h1 {
      font-size: 28px;
      background: linear-gradient(135deg, #fff, #e9d5ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-actions {
      display: flex;
      gap: 15px;
    }

    .notification-btn {
      background: #111;
      border: 1px solid #333;
      width: 45px;
      height: 45px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 20px;
      color: white;
    }

    .notification-btn:hover {
      background: #1a1a1a;
      border-color: #9333ea;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-bottom: 30px;
    }

    .card {
      background: #111111;
      border-radius: 24px;
      padding: 25px;
      border: 1px solid #222;
      box-shadow: 0 10px 30px rgba(147, 51, 234, 0.1);
    }

    .profile-header {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      position: relative;
    }

    .profile-image-container {
      position: relative;
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }

    .profile-image {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9333ea, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: white;
      font-weight: 600;
      border: 2px solid #9333ea;
    }

    .profile-image-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #9333ea;
    }

    .profile-upload-label {
      position: absolute;
      bottom: 0;
      right: 0;
      background: #9333ea;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      border: 2px solid #111;
    }

    .profile-upload-label:hover {
      background: #a855f7;
    }

    .profile-info h2 {
      font-size: 22px;
      color: white;
      margin-bottom: 5px;
    }

    .profile-info .username {
      color: #888;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #854d0e20;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      color: #fbbf24;
      border: 1px solid #fbbf2430;
    }

    .feedback-section {
      margin: 20px 0;
    }

    .feedback-label {
      display: flex;
      justify-content: space-between;
      color: #888;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .progress-bar {
      height: 8px;
      background: #222;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 5px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #4ade80);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .feedback-percentage {
      color: #22c55e;
      font-weight: 600;
      font-size: 18px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 20px;
    }

    .stat-item {
      text-align: center;
      padding: 15px;
      background: #1a1a1a;
      border-radius: 16px;
      border: 1px solid #333;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: white;
    }

    .stat-label {
      font-size: 12px;
      color: #888;
      margin-top: 5px;
    }

    .drone-image {
      width: 100%;
      height: 160px;
      border-radius: 16px;
      overflow: hidden;
      margin: 15px 0;
      background: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      border: 1px solid #333;
    }

    .drone-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .drone-specs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }

    .spec-item {
      padding: 12px;
      background: #1a1a1a;
      border-radius: 12px;
      border: 1px solid #333;
    }

    .spec-label {
      font-size: 12px;
      color: #888;
      margin-bottom: 5px;
    }

    .spec-value {
      font-size: 16px;
      font-weight: 600;
      color: white;
    }

    .verify-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #22c55e;
      font-size: 14px;
      margin-top: 15px;
      padding: 10px;
      background: #22c55e10;
      border-radius: 8px;
      border: 1px solid #22c55e30;
    }

    .section-title {
      font-size: 20px;
      color: white;
      margin-bottom: 20px;
    }

    .contracts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .contract-card {
      background: #111111;
      border-radius: 20px;
      padding: 20px;
      border: 1px solid #222;
      transition: all 0.2s ease;
    }

    .contract-card:hover {
      transform: translateY(-2px);
      border-color: #9333ea;
      box-shadow: 0 10px 30px rgba(147, 51, 234, 0.2);
    }

    .contract-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .contract-client {
      font-weight: 600;
      color: white;
      font-size: 16px;
    }

    .contract-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .contract-mission {
      font-size: 18px;
      color: #e9d5ff;
      margin-bottom: 10px;
    }

    .contract-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 15px 0;
    }

    .detail-item {
      font-size: 14px;
    }

    .detail-label {
      color: #888;
      margin-bottom: 3px;
      font-size: 12px;
    }

    .detail-value {
      font-weight: 600;
      color: white;
    }

    .contract-progress {
      margin-top: 15px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #888;
      margin-bottom: 5px;
    }

    .contract-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .action-btn {
      flex: 1;
      padding: 10px;
      border: 1px solid #333;
      background: #1a1a1a;
      border-radius: 10px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .action-btn:hover {
      background: #222;
      border-color: #9333ea;
    }

    .action-btn.primary {
      background: #9333ea;
      color: white;
      border: none;
    }

    .action-btn.primary:hover {
      background: #a855f7;
    }

    .contact-section {
      background: #111111;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #222;
    }

    .filters-section {
      margin-bottom: 20px;
    }

    @media (max-width: 1024px) {
      .sidebar { width: 240px; }
      .main-content { margin-left: 240px; }
      .profile-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { margin-left: 0; }
    }
  `;

function OperatorDashboard() {
  const navigate = useNavigate();
  const { user: sessionUser, isAuthenticated, logout } = useSession();
  const connected = true;
  const publicKey = sessionUser?.walletAddress ? { toBase58: () => sessionUser.walletAddress } : null;
  const [userData, setUserData] = useState(null);
  const [operatorData, setOperatorData] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Chat states
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  // FIX: isWalletReady removed — was creating stuck loading gate. ProtectedRoute handles auth.

  // Withdraw modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // Contract detail modal state
  const [selectedContractDetail, setSelectedContractDetail] = useState(null);

  // Available missions state
  const [availableMissions, setAvailableMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [appliedMissionIds, setAppliedMissionIds] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);

  // Auth guard removed — ProtectedRoute handles this.
  // Internal guard caused freeze: logout set isAuthenticated=false → guard fired
  // navigate('/') → handleLogout also fired window.location.replace → loop → freeze.

  // Dashboard init — fetch by session ID directly, no wallet detection needed
  useEffect(() => {
    if (!isAuthenticated || !sessionUser?.id) return;
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/operators/${sessionUser.id}/dashboard`);
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          setOperatorData(data);
          setContracts(data.contracts || []);
          setFilteredContracts(data.contracts || []);
          setUserData(data);
        } else if (res.status === 404) {
          logout(); window.location.href = '/signup';
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        if (isMounted) setError('Failed to load dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => { isMounted = false; };
  }, [isAuthenticated, sessionUser?.id]); // re-run if auth or user changes

  // Load messages from API whenever selected contact changes
  useEffect(() => {
    if (!selectedContact) return;
    let isMounted = true;
    const contractId = selectedContact.contract_id || selectedContact.id;
    fetch(`http://localhost:3001/api/messages/${contractId}`)
      .then(r => r.json())
      .then(msgs => {
        if (!isMounted) return;
        const mapped = (msgs || []).map(m => ({
          id: m.id,
          contactId: selectedContact.id,
          sender: m.sender_type,
          text: m.text,
          timestamp: new Date(m.timestamp).toISOString(),
          read: m.read
        }));
        setMessages(mapped);
      })
      .catch(err => { if (isMounted) console.error('Load messages error:', err); });
    return () => { isMounted = false; };
  }, [selectedContact]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch missions when switching to contracts tab
  useEffect(() => {
    if (activeTab === 'contracts') fetchMissions();
  }, [activeTab]);

  // Apply filters whenever contracts, searchTerm, statusFilter, or regionFilter change
  useEffect(() => {
    let filtered = [...contracts];

    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.region?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    if (regionFilter !== 'all') {
      filtered = filtered.filter(contract => contract.region === regionFilter);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter, regionFilter]);

  const fetchOperatorDataById = async (userId) => {
    setLoading(true);
    try {
      const dashboardResponse = await fetch(`http://localhost:3001/api/operators/${userId}/dashboard`);
      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json();
        setOperatorData(data);
        setContracts(data.contracts || []);
        setFilteredContracts(data.contracts || []);
        setUserData(data);
      } else if (dashboardResponse.status === 404) {
        // Operator ID in session doesn't exist in DB (e.g. DB was cleared)
        logout(); window.location.href = '/signup';
        return;
      } else {
        throw new Error(`Server error ${dashboardResponse.status}`);
      }
    } catch (error) {
      console.error('Error loading operator data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatorDataByWallet = async () => {
    setLoading(true);
    try {
      // Belt-and-suspenders: if publicKey is still null, fall back to session ID lookup
      if (!publicKey) {
        if (sessionUser?.id) {
          await fetchOperatorDataById(sessionUser.id);
          return;
        }
        throw new Error('No wallet address or user ID in session');
      }

      const walletResponse = await fetch(`http://localhost:3001/api/operators/wallet/${publicKey.toBase58()}`);

      if (!walletResponse.ok) {
        if (walletResponse.status === 404) {
          // Wallet not in DB — try by session ID first
          if (sessionUser?.id) {
            await fetchOperatorDataById(sessionUser.id);
            return;
          }
          // No record at all — clear stale session and send to signup
          logout(); window.location.href = '/signup';
          return;
        }
        throw new Error(`Server error ${walletResponse.status} fetching operator`);
      }

      const operator = await walletResponse.json();
      setUserData(operator);

      // Dashboard endpoint returns operator + contracts in one call
      const dashboardResponse = await fetch(`http://localhost:3001/api/operators/${operator.id}/dashboard`);
      if (!dashboardResponse.ok) throw new Error(`Dashboard fetch failed: ${dashboardResponse.status}`);
      const data = await dashboardResponse.json();

      setOperatorData(data);
      setContracts(data.contracts || []);
      setFilteredContracts(data.contracts || []);
    } catch (error) {
      console.error('Error fetching operator data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePositiveFeedback = () => {
    if (!contracts || contracts.length === 0) return 0;
    const completedContracts = contracts.filter(c => c.status === 'completed');
    if (completedContracts.length === 0) return 0;
    const totalRating = completedContracts.reduce((sum, contract) => sum + (contract.rating || 5), 0);
    const averageRating = totalRating / completedContracts.length;
    return Math.round((averageRating / 5) * 100);
  };

  const handleLogout = () => {
    // logout() in sessionContext handles EVERYTHING:
    //   1. Clears localStorage (session + user)
    //   2. Attempts window.solana.disconnect()
    //   3. window.location.replace('/?loggedOut=1')  ← kills auto-reconnect loop
    // FIX: removed the broken `disconnect()` call (was undefined — not imported from useWallet)
    // FIX: removed localStorage.setItem('justLoggedOut') — URL param ?loggedOut=1 is used instead
    // FIX: removed navigate('/') after logout() — hard redirect beats navigate() and
    //      calling both caused a racing freeze in the previous version.
    logout();
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const available = operatorData?.total_earned || 0;
    if (amount > available) {
      alert(`Cannot withdraw ${amount} USDC — you only have ${available.toFixed(2)} USDC available`);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/api/operators/${operatorData.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) {
        setOperatorData(prev => ({ ...prev, total_earned: data.operator.total_earned }));
        setWithdrawAmount('');
        setShowWithdrawModal(false);
        alert(`✅ Successfully withdrew ${amount} USDC to your wallet.`);
      } else {
        alert(`Withdraw failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      fetch(`http://localhost:3001/api/operators/${userData?.id}`, { method: 'DELETE' })
        .then(() => {
          logout();
        })
        .catch(err => {
          console.error('Delete error:', err);
          alert('Failed to delete account. Please try again.');
        });
    }
  };

  // FIX #3: Profile image upload now saves URL back to the database
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'profile');

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      // Save the new URL back to the database so it persists on refresh
      await fetch(`http://localhost:3001/api/operators/${operatorData?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image: data.url })
      });

      setOperatorData(prev => ({ ...prev, profile_image: data.url }));
      alert('Profile image updated!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch open missions for the operator to browse
  const fetchMissions = async () => {
    setMissionsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/missions?status=open');
      const data = await res.json();
      setAvailableMissions(data || []);
      // Also fetch which ones this operator already applied to
      if (operatorData?.id) {
        const appRes = await fetch(`http://localhost:3001/api/operators/${operatorData.id}/applications`);
        const apps = await appRes.json();
        setAppliedMissionIds(new Set((apps || []).map(a => a.mission_id)));
      }
    } catch (err) {
      console.error('Fetch missions error:', err);
    } finally {
      setMissionsLoading(false);
    }
  };

  const applyToMission = async (mission) => {
    if (!operatorData?.id) return;
    setApplyingId(mission.id);
    try {
      const res = await fetch('http://localhost:3001/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_id: mission.id,
          operator_id: operatorData.id,
          operator_name: operatorData.full_name,
          operator_username: operatorData.username
        })
      });
      if (res.ok || res.status === 409) {
        setAppliedMissionIds(prev => new Set([...prev, mission.id]));
      }
    } catch (err) {
      console.error('Apply error:', err);
    } finally {
      setApplyingId(null);
    }
  };

  // Update contract progress and refresh dashboard
  const updateContractProgress = async (contractId, progress, markComplete = false) => {
    try {
      const updates = { progress: parseInt(progress) };
      if (markComplete) updates.status = 'completed';
      await fetch(`http://localhost:3001/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      // Refresh dashboard data
      if (sessionUser?.id) await fetchOperatorDataById(sessionUser.id);
      else await fetchOperatorDataByWallet();
    } catch (err) {
      console.error('Update contract error:', err);
      alert('Failed to update. Please try again.');
    }
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    const text = newMessage;
    setNewMessage('');
    try {
      const res = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: selectedContact.contract_id || selectedContact.id,
          sender_type: 'operator',
          sender_id: userData?.id || operatorData?.id,
          text
        })
      });
      if (res.ok) {
        const message = await res.json();
        // Map server format to local format
        const mapped = {
          id: message.id,
          contactId: selectedContact.id,
          sender: 'operator',
          text: message.text,
          timestamp: new Date(message.timestamp).toISOString(),
          read: false
        };
        setMessages(prev => [...prev, mapped]);
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const getContactsFromContracts = () => {
    const uniqueContacts = {};

    contracts.forEach(contract => {
      if (contract.client_name && !uniqueContacts[contract.client_name]) {
        const contactMessages = messages.filter(m =>
          m.contactId === contract.enterprise_id || m.contactId === contract.client_name
        );

        const lastMessage = contactMessages.length > 0
          ? contactMessages[contactMessages.length - 1].text
          : contract.status === 'active'
            ? 'Contract in progress'
            : 'Contract completed';

        const unreadCount = contactMessages.filter(m => !m.read && m.sender !== 'operator').length;

        uniqueContacts[contract.client_name] = {
          id: contract.enterprise_id || contract.client_name,
          contract_id: contract.id,
          name: contract.client_name,
          type: 'enterprise',
          lastMessage,
          lastMessageTime: contract.updated_at || contract.created_at,
          unread: unreadCount,
          avatar: contract.industry === 'construction' ? '🏗️'
            : contract.industry === 'agriculture' ? '🌾' : '🏢'
        };
      }
    });

    return Object.values(uniqueContacts);
  };

  const contacts = getContactsFromContracts();

  const getMessagesForContact = (contactId) => {
    return messages.filter(m => m.contactId === contactId).map(m => ({
      ...m,
      isOperator: m.sender === 'operator'
    }));
  };

  const uniqueRegions = [...new Set(contracts.map(c => c.region).filter(Boolean))];

  if (loading) {
    return (
      <div style={{
        background: '#0a0a0a',
        minHeight: '100vh',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        Loading dashboard...
      </div>
    );
  }

  // Unauthenticated — ProtectedRoute handles redirect, this is a safety net
  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div style={{
        background: '#0a0a0a', minHeight: '100vh', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 20, padding: 40, textAlign: 'center'
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ color: '#ef4444', fontSize: 20, fontWeight: 600 }}>{error}</div>
        <div style={{ color: '#666', fontSize: 14, maxWidth: 400 }}>
          This usually means your operator account wasn't found in the database.
          Try signing up again, or check that the server is running on port 3001.
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={() => { setError(''); setLoading(true); fetchOperatorDataByWallet(); }}
            style={{ background: '#9333ea', border: 'none', color: 'white', padding: '12px 24px', borderRadius: 30, cursor: 'pointer', fontWeight: 600 }}>
            ↻ Retry
          </button>
          <button onClick={() => { logout(); window.location.href = '/signup'; }}
            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '12px 24px', borderRadius: 30, cursor: 'pointer' }}>
            Sign up again
          </button>
          <button onClick={() => { logout(); }}
            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '12px 24px', borderRadius: 30, cursor: 'pointer' }}>
            Go home
          </button>
        </div>
      </div>
    );
  }

  const maskWalletAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'completed': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const positiveFeedback = calculatePositiveFeedback();

  const DashboardTab = () => {
    const activeContracts = contracts.filter(c => c.status === 'active' || c.status === 'open');

    return (
      <>
        <div className="profile-grid">
          <div className="card">
            <div className="profile-header">
              <div className="profile-image-container">
                {operatorData?.profile_image ? (
                  <img
                    src={operatorData.profile_image}
                    alt="Profile"
                    className="profile-image-img"
                  />
                ) : (
                  <div className="profile-image">
                    {operatorData?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <label htmlFor="profile-upload" className="profile-upload-label">
                  📷
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              <div className="profile-info">
                <h2>{operatorData?.full_name || 'Operator'}</h2>
                <div className="username">@{operatorData?.username || 'username'}</div>
                <div className="rating-badge">
                  <span>★</span> {operatorData?.rating != null ? operatorData.rating.toFixed(1) : 'No ratings yet'} ({operatorData?.completed_missions || 0} missions)
                </div>
              </div>
            </div>

            <div className="feedback-section">
              <div className="feedback-label">
                <span>Positive Feedback</span>
                <span className="feedback-percentage">{positiveFeedback}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${positiveFeedback}%` }}></div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{operatorData?.completed_missions || 0}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{(operatorData?.total_missions - operatorData?.completed_missions) || 0}</div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{operatorData?.member_since ? new Date(operatorData.member_since).getFullYear() : '2025'}</div>
                <div className="stat-label">Member Since</div>
              </div>
            </div>
          </div>

          {/* ── Earnings Card ─────────────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: 'white', fontSize: 18 }}>💰 Earnings</h2>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!operatorData?.total_earned || operatorData.total_earned <= 0}
                style={{
                  background: operatorData?.total_earned > 0 ? '#9333ea' : '#222',
                  border: 'none', borderRadius: 20, padding: '8px 18px',
                  color: operatorData?.total_earned > 0 ? 'white' : '#555',
                  fontSize: 13, fontWeight: 600,
                  cursor: operatorData?.total_earned > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Withdraw
              </button>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ color: '#22c55e', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                  {(operatorData?.total_earned || 0).toFixed(2)} USDC
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>Total Earned</div>
              </div>
              <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ color: '#a855f7', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                  {operatorData?.completed_missions || 0}
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>Paid Missions</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ color: 'white', marginBottom: '15px' }}>{operatorData?.drone_model || 'Drone Model'}</h2>
            <div className="drone-image">
              {operatorData?.drone_image ? (
                <img src={operatorData.drone_image} alt="Drone" />
              ) : (
                <span>📸 No drone image uploaded</span>
              )}
            </div>

            <div className="drone-specs">
              <div className="spec-item">
                <div className="spec-label">Flight Stack</div>
                <div className="spec-value">{operatorData?.flight_stack || 'ArduPilot'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">Autopilot</div>
                <div className="spec-value">{operatorData?.autopilot_hardware || 'Pixhawk'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">Vehicle Type</div>
                <div className="spec-value">{operatorData?.vehicle_type || 'Multicopter'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">Firmware</div>
                <div className="spec-value">{operatorData?.firmware_version || '4.5.1'}</div>
              </div>
            </div>

            <div className="verify-badge">
              <span>✅</span> Verified on Solana
            </div>
          </div>
        </div>

        <div>
          <h2 className="section-title">Active Contracts</h2>
          {activeContracts.length > 0 ? (
            <div className="contracts-grid">
              {activeContracts.map(contract => (
                <div key={contract.id} className="contract-card">
                  <div className="contract-header">
                    <span className="contract-client">{contract.client_name || 'Client'}</span>
                    <span className="contract-status" style={{
                      background: `${getStatusColor(contract.status)}20`,
                      color: getStatusColor(contract.status),
                      border: `1px solid ${getStatusColor(contract.status)}30`
                    }}>
                      {contract.status}
                    </span>
                  </div>
                  <div className="contract-mission">{contract.title || 'Mission'}</div>
                  <div className="contract-details">
                    <div className="detail-item">
                      <div className="detail-label">Zone</div>
                      <div className="detail-value">{contract.region || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Value</div>
                      <div className="detail-value">{contract.amount_sol || 0} SOL</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Date</div>
                      <div className="detail-value">{contract.created_at ? new Date(contract.created_at > 1e12 ? contract.created_at : contract.created_at * 1000).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                  <div className="contract-progress">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span>{contract.progress || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${contract.progress || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="contract-actions">
                    <button className="action-btn" onClick={() => setSelectedContractDetail(contract)}>View Details</button>
                    <button className="action-btn primary" onClick={() => {
                      const p = prompt(`Update progress for "${contract.title}" (current: ${contract.progress || 0}%):`, contract.progress || 0);
                      if (p !== null && !isNaN(parseInt(p))) {
                        const val = Math.min(100, Math.max(0, parseInt(p)));
                        updateContractProgress(contract.id, val, val === 100);
                      }
                    }}>Update Status</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#111111',
              borderRadius: '20px',
              padding: '60px',
              textAlign: 'center',
              border: '1px solid #222'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>No Active Contracts</h3>
              <p style={{ color: '#888', fontSize: '16px', marginBottom: '20px' }}>
                You don't have any active contracts yet.<br />
                Apply to open missions to get started.
              </p>
              <button
                onClick={fetchMissions}
                style={{ background: '#9333ea', border: 'none', color: 'white', padding: '12px 28px', borderRadius: '30px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
              >
                Load Available Missions →
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  const ContractsTab = () => (
    <div>
      {/* ── Section A: Your Contracts ── */}
      <div className="filters-section">
        <h2 className="section-title">Your Contracts</h2>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 2,
              minWidth: '250px',
              padding: '12px 16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '12px 16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '12px 16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px'
            }}
          >
            <option value="all">All Regions</option>
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredContracts.length > 0 ? (
        <div className="contracts-grid">
          {filteredContracts.map(contract => (
            <div key={contract.id} className="contract-card">
              <div className="contract-header">
                <span className="contract-client">{contract.client_name || 'Client'}</span>
                <span className="contract-status" style={{
                  background: `${getStatusColor(contract.status)}20`,
                  color: getStatusColor(contract.status),
                  border: `1px solid ${getStatusColor(contract.status)}30`
                }}>
                  {contract.status}
                </span>
              </div>
              <div className="contract-mission">{contract.title || 'Mission'}</div>
              <div className="contract-details">
                <div className="detail-item">
                  <div className="detail-label">Zone</div>
                  <div className="detail-value">{contract.region || 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Value</div>
                  <div className="detail-value">{contract.amount_sol || 0} SOL</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Date</div>
                  <div className="detail-value">{contract.created_at ? new Date(contract.created_at > 1e12 ? contract.created_at : contract.created_at * 1000).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
              {contract.status === 'active' && (
                <div className="contract-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{contract.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${contract.progress || 0}%` }}></div>
                  </div>
                </div>
              )}
              <div className="contract-actions">
                <button className="action-btn" onClick={() => setSelectedContractDetail(contract)}>View Details</button>
                {contract.status === 'active' && (
                  <button className="action-btn primary" onClick={() => {
                    const p = prompt(`Update progress for "${contract.title}" (current: ${contract.progress || 0}%):`, contract.progress || 0);
                    if (p !== null && !isNaN(parseInt(p))) {
                      const val = Math.min(100, Math.max(0, parseInt(p)));
                      updateContractProgress(contract.id, val, val === 100);
                    }
                  }}>Update Progress</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: '#111111',
          borderRadius: '20px',
          padding: '60px',
          textAlign: 'center',
          border: '1px solid #222'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
          <h3 style={{ color: 'white', marginBottom: '10px' }}>No Contracts Found</h3>
          <p style={{ color: '#888', fontSize: '16px' }}>
            {searchTerm || statusFilter !== 'all' || regionFilter !== 'all'
              ? 'No contracts match your filters. Try adjusting your search.'
              : "You haven't been assigned any contracts yet."}
          </p>
        </div>
      )}

      {/* ── Section B: Open Missions to Apply To ── */}
      <div style={{ marginTop: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Open Missions</h2>
          <button onClick={fetchMissions} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
            ↻ Refresh
          </button>
        </div>
        {missionsLoading ? (
          <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading missions...</div>
        ) : availableMissions.length === 0 ? (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 20, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
            <h3 style={{ color: 'white', marginBottom: 8 }}>No Open Missions</h3>
            <p style={{ color: '#888', fontSize: 14 }}>Check back later — enterprises post new missions regularly.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {availableMissions.map(mission => {
              const alreadyApplied = appliedMissionIds.has(mission.id);
              const reqs = mission.requirements || {};

              // ── Requirements check ───────────────────────────────────────────
              // Hard-logic: compute which requirements the operator fails.
              // This is informational only — operators can still apply. Enterprise
              // sees this info and decides to approve/reject.
              const failedReqs = [];
              if (reqs.licenseRequired && !(operatorData?.certifications?.length > 0)) {
                failedReqs.push('License required');
              }
              if (reqs.certificationsRequired?.length > 0) {
                const opCerts = operatorData?.certifications || [];
                const missing = reqs.certificationsRequired.filter(c => !opCerts.includes(c));
                if (missing.length > 0) failedReqs.push(`Missing certs: ${missing.join(', ')}`);
              }
              const meetsRequirements = failedReqs.length === 0;

              return (
                <div key={mission.id}
                  style={{ background: '#111', border: '1px solid #222', borderRadius: 20, padding: 22, transition: 'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#9333ea'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{mission.title}</div>
                      <div style={{ color: '#9333ea', fontSize: 13 }}>{mission.mission_type || mission.missionType}</div>
                    </div>
                    <div style={{ background: '#22c55e15', border: '1px solid #22c55e30', color: '#22c55e', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 10 }}>
                      {mission.reward} USDC
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {[
                      ['📍 Region', mission.region || 'Any'],
                      ['⏰ Min Hours', reqs.minFlightHours ? `${reqs.minFlightHours}h` : 'None'],
                      ['🚁 Drone', reqs.droneType || 'Any'],
                      ['📋 License', reqs.licenseRequired ? 'Required' : 'Not required'],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: '#1a1a1a', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ color: '#666', fontSize: 11, marginBottom: 2 }}>{label}</div>
                        <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {mission.description && (
                    <p style={{ color: '#888', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
                      {mission.description.length > 120 ? mission.description.slice(0, 120) + '…' : mission.description}
                    </p>
                  )}
                  {reqs.certificationsRequired?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      {reqs.certificationsRequired.map(c => (
                        <span key={c} style={{ background: '#9333ea15', border: '1px solid #9333ea30', color: '#c084fc', borderRadius: 20, padding: '2px 10px', fontSize: 11, marginRight: 6 }}>{c}</span>
                      ))}
                    </div>
                  )}
                  {/* Weather flyability badge — only when mission has coordinates */}
                  <WeatherBadge lat={mission.latitude} lng={mission.longitude} />

                  {/* Subtasks — operators pick one to claim */}
                  {mission.subtasks?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>
                        📋 {mission.subtasks.filter(s => s.status === 'open').length} of {mission.subtasks.length} subtasks available
                      </div>
                      {mission.subtasks.map(sub => {
                        const isClaimed = sub.status !== 'open';
                        const isMineClaimed = sub.claimed_by === operatorData?.id;
                        return (
                          <div key={sub.id} style={{
                            background: isClaimed ? '#0a0a0a' : '#0d0d1a',
                            border: `1px solid ${isMineClaimed ? '#22c55e40' : isClaimed ? '#333' : '#9333ea30'}`,
                            borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: isClaimed ? '#555' : 'white', fontSize: 13, fontWeight: 600 }}>{sub.name}</div>
                              {sub.description && <div style={{ color: '#666', fontSize: 11 }}>{sub.description}</div>}
                              {sub.claimed_by_name && <div style={{ color: '#888', fontSize: 11 }}>Claimed by {sub.claimed_by_name}</div>}
                            </div>
                            <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>{sub.sol_reward} SOL</div>
                            {!isClaimed && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`http://localhost:3001/api/missions/${mission.id}/subtasks/${sub.id}/claim`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ operator_id: operatorData?.id, operator_name: operatorData?.full_name }),
                                    });
                                    const d = await res.json();
                                    if (res.ok) {
                                      setAvailableMissions(prev => prev.map(m => m.id === mission.id ? d.mission : m));
                                    } else { alert(d.error); }
                                  } catch { alert('Network error'); }
                                }}
                                style={{ background: '#9333ea', border: 'none', color: 'white', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                              >
                                Claim →
                              </button>
                            )}
                            {isMineClaimed && <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>✅ Yours</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Requirements warning */}
                  {!meetsRequirements && !alreadyApplied && (
                    <div style={{
                      background: '#f59e0b10', border: '1px solid #f59e0b30',
                      borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#f59e0b'
                    }}>
                      ⚠️ {failedReqs[0]}{failedReqs.length > 1 ? ` (+${failedReqs.length - 1} more)` : ''}
                    </div>
                  )}
                  <button
                    disabled={alreadyApplied || applyingId === mission.id}
                    onClick={() => applyToMission(mission)}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
                      background: alreadyApplied ? '#1a1a1a' : meetsRequirements ? '#9333ea' : '#7c3aed',
                      color: alreadyApplied ? '#666' : 'white',
                      fontWeight: 600, fontSize: 14,
                      cursor: alreadyApplied ? 'default' : 'pointer',
                      transition: 'all .2s',
                      opacity: alreadyApplied ? 0.6 : 1
                    }}
                  >
                    {applyingId === mission.id ? 'Applying…' : alreadyApplied ? '✓ Applied' : meetsRequirements ? 'Apply Now' : 'Apply Anyway'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ─── Weather & Hazards Tab ───────────────────────────────────────────────────
  const WeatherTab = ({ operatorData }) => {
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [locationLabel, setLocationLabel] = useState('');
    const [current, setCurrent] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [eonetEvents, setEonetEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [radiusKm, setRadiusKm] = useState(500);
    const [autoDetecting, setAutoDetecting] = useState(false);

    const ICONS = { Clear:'☀️', Clouds:'🌤️', Rain:'🌧️', Drizzle:'🌦️', Wind:'💨', Snow:'❄️', Thunderstorm:'⛈️', Mist:'🌫️' };
    const EONET_ICONS = {
      'Wildfires': '🔥', 'Severe Storms': '⛈️', 'Floods': '🌊',
      'Earthquakes': '🌍', 'Volcanoes': '🌋', 'Landslides': '⛰️',
      'Sea and Lake Ice': '🧊', 'Drought': '☀️', 'Dust and Haze': '💨',
      'Snow': '❄️', 'Temperature Extremes': '🌡️', 'Manmade': '🏭',
    };
    const flyableColors = { good: '#22c55e', caution: '#f59e0b', unsafe: '#ef4444' };
    const flyableLabels = { good: '✅ Good to fly', caution: '⚠️ Fly with caution', unsafe: '🚫 Unsafe to fly' };

    const fetchWeather = async (latitude, longitude) => {
      setLoading(true); setError('');
      try {
        const [curRes, foreRes, eoRes] = await Promise.all([
          fetch(`http://localhost:3001/api/weather/current?lat=${latitude}&lng=${longitude}`),
          fetch(`http://localhost:3001/api/weather?lat=${latitude}&lng=${longitude}`),
          fetch(`http://localhost:3001/api/eonet?lat=${latitude}&lng=${longitude}&radius=${radiusKm}&days=14`),
        ]);
        if (curRes.ok) setCurrent(await curRes.json());
        if (foreRes.ok) { const d = await foreRes.json(); setForecast(d.daily || []); }
        if (eoRes.ok) { const d = await eoRes.json(); setEonetEvents(d.events || []); }
      } catch (e) { setError('Failed to load weather. Is the server running?'); }
      finally { setLoading(false); }
    };

    const autoDetect = () => {
      setAutoDetecting(true);
      navigator.geolocation?.getCurrentPosition(
        pos => {
          const la = pos.coords.latitude.toFixed(5);
          const lo = pos.coords.longitude.toFixed(5);
          setLat(la); setLng(lo);
          setLocationLabel('Your location');
          fetchWeather(la, lo);
          setAutoDetecting(false);
        },
        () => { setAutoDetecting(false); setError('Location access denied — enter coordinates manually.'); }
      );
    };

    const handleSearch = () => {
      if (!lat || !lng) { setError('Enter latitude and longitude first'); return; }
      fetchWeather(lat, lng);
    };

    const panelCard = (label, value, sub = '') => (
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: '14px 18px', flex: '1 1 130px' }}>
        <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 700 }}>{value}</div>
        {sub && <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{sub}</div>}
      </div>
    );

    return (
      <div style={{ maxWidth: 900, paddingBottom: 40 }}>
        {/* Location controls */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Latitude</div>
              <input value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 40.7128"
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14 }} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Longitude</div>
              <input value={lng} onChange={e => setLng(e.target.value)} placeholder="e.g. -74.006"
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14 }} />
            </div>
            <div style={{ flex: '0 1 110px' }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Hazard radius (km)</div>
              <input type="number" value={radiusKm} onChange={e => setRadiusKm(e.target.value)} min={50} max={2000}
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14 }} />
            </div>
            <button onClick={handleSearch} style={{ background: '#9333ea', border: 'none', color: 'white', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              {loading ? '⏳' : '🔍 Check'}
            </button>
            <button onClick={autoDetect} disabled={autoDetecting} style={{ background: '#1a1a2a', border: '1px solid #9333ea', color: '#c084fc', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontSize: 13 }}>
              {autoDetecting ? '📡 Detecting…' : '📍 My Location'}
            </button>
          </div>
          {locationLabel && <div style={{ color: '#9333ea', fontSize: 12, marginTop: 8 }}>📌 {locationLabel}</div>}
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>

        {/* Current conditions */}
        {current && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 40 }}>{ICONS[current.condition] || '🌡️'}</span>
              <div>
                <div style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>{current.temp_c}°C</div>
                <div style={{ color: flyableColors[current.flyable] || '#888', fontWeight: 600, fontSize: 15 }}>{flyableLabels[current.flyable] || current.condition}</div>
              </div>
              <div style={{ marginLeft: 'auto', background: `${flyableColors[current.flyable]}20`, border: `1px solid ${flyableColors[current.flyable]}`, borderRadius: 10, padding: '6px 14px', color: flyableColors[current.flyable], fontSize: 13, fontWeight: 700 }}>
                {current.condition}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {panelCard('🌡️ Feels Like', `${current.feels_like_c}°C`)}
              {panelCard('💨 Wind', `${current.wind_kmh} km/h`, current.wind_direction)}
              {panelCard('💧 Humidity', `${current.humidity_pct}%`)}
              {panelCard('🔵 Pressure', `${current.pressure_hpa} hPa`)}
              {panelCard('👁️ Visibility', `${current.visibility_km} km`)}
            </div>
            {current.mock && <div style={{ color: '#666', fontSize: 11, marginTop: 8 }}>* Mock data — set WEATHER_API_KEY for live conditions</div>}
          </div>
        )}

        {/* 7-day forecast */}
        {forecast.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#ccc', marginBottom: 12, fontSize: 15 }}>📅 7-Day Forecast</h3>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
              {forecast.slice(0, 7).map((day, i) => {
                const c = flyableColors[day.flyable] || '#888';
                return (
                  <div key={i} style={{ flex: '0 0 110px', background: '#111', border: `1px solid ${c}40`, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{new Date(day.date).toLocaleDateString('en',{weekday:'short', month:'short', day:'numeric'})}</div>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{ICONS[day.condition] || '🌡️'}</div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{day.temp_c}°C</div>
                    <div style={{ color: '#888', fontSize: 11, margin: '4px 0' }}>{day.wind_kmh} km/h</div>
                    <div style={{ color: c, fontSize: 10, fontWeight: 600, marginTop: 4 }}>{day.flyable?.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NASA EONET hazard events */}
        <div>
          <h3 style={{ color: '#ccc', marginBottom: 4, fontSize: 15 }}>
            🛰️ NASA EONET — Active Natural Hazards
            {eonetEvents.length > 0 && <span style={{ color: '#ef4444', marginLeft: 8, fontSize: 13 }}>({eonetEvents.length} within {radiusKm} km)</span>}
          </h3>
          <p style={{ color: '#555', fontSize: 12, marginBottom: 12 }}>Data from NASA Earth Observatory Natural Event Tracker (EONET). Updated live.</p>

          {!lat && !lng && (
            <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 30 }}>
              Enter your location above and click Check to load hazard events.
            </div>
          )}

          {lat && lng && eonetEvents.length === 0 && !loading && (
            <div style={{ background: '#0d1a0d', border: '1px solid #22c55e30', borderRadius: 12, padding: '14px 18px', color: '#22c55e', fontSize: 14 }}>
              ✅ No active natural hazard events detected within {radiusKm} km of your location.
            </div>
          )}

          {eonetEvents.map(ev => (
            <div key={ev.id} style={{ background: '#1a0d0d', border: '1px solid #ef444430', borderRadius: 12, padding: '14px 18px', marginBottom: 10, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{EONET_ICONS[ev.category] || '⚠️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>{ev.title}</div>
                <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{ev.category}</div>
                {ev.date && <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>📅 {new Date(ev.date).toLocaleDateString()}</div>}
                {ev.lat && ev.lng && (
                  <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                    📍 {parseFloat(ev.lat).toFixed(2)}, {parseFloat(ev.lng).toFixed(2)}
                    {ev.distance_km && <span style={{ marginLeft: 8, color: '#9333ea' }}>{ev.distance_km} km away</span>}
                  </div>
                )}
                {ev.sources?.[0] && (
                  <a href={ev.sources[0]} target="_blank" rel="noopener noreferrer" style={{ color: '#9333ea', fontSize: 11, marginTop: 4, display: 'inline-block' }}>
                    View source →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ContactTab = () => (
    <div className="contact-section" style={{ display: 'flex', height: 'calc(100vh - 200px)' }}>
      {/* Contacts List */}
      <div style={{ width: '300px', borderRight: '1px solid #333', overflowY: 'auto' }}>
        <h3 style={{ padding: '20px', color: 'white', borderBottom: '1px solid #333' }}>
          Conversations ({contacts.length})
        </h3>
        {contacts.length > 0 ? (
          contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #222',
                cursor: 'pointer',
                background: selectedContact?.id === contact.id ? '#1a1a1a' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
              onMouseLeave={(e) => {
                if (selectedContact?.id !== contact.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '32px' }}>{contact.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 600 }}>{contact.name}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '14px' }}>
                      {contact.lastMessage.length > 30
                        ? contact.lastMessage.substring(0, 30) + '...'
                        : contact.lastMessage}
                    </span>
                    {contact.unread > 0 && (
                      <span style={{
                        background: '#9333ea',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', lineHeight: 1.8 }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>💬</div>
            No conversations yet.<br />
            Contacts appear automatically once you have active contracts.
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedContact ? (
          <>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px' }}>{selectedContact.avatar}</div>
              <div>
                <h3 style={{ color: 'white', marginBottom: '4px' }}>{selectedContact.name}</h3>
                <span style={{ color: '#22c55e', fontSize: '12px' }}>● Online</span>
              </div>
            </div>

            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {getMessagesForContact(selectedContact.id).map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.isOperator ? 'flex-end' : 'flex-start',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    background: msg.isOperator ? '#9333ea' : '#1a1a1a',
                    color: 'white',
                    padding: '10px 15px',
                    borderRadius: msg.isOperator ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                    border: msg.isOperator ? 'none' : '1px solid #333'
                  }}>
                    <p style={{ marginBottom: '5px' }}>{msg.text}</p>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #333',
              display: 'flex',
              gap: '10px'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={handleMessageChange}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '30px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  background: '#9333ea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#a855f7'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#9333ea'}
              >
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '18px'
          }}>
            Select a contact to start messaging
          </div>
        )}
      </div>
    </div>
  );


  return (
    <>
      <style>{DASHBOARD_STYLES}</style>
      <div className="dashboard-page">
        <div className="sidebar">
          <div className="sidebar-logo">
            <img src={logo} alt="Sol Skies" />
            <span>Sol Skies</span>
          </div>

          <div className="sidebar-nav">
            <div
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'contracts' ? 'active' : ''}`}
              onClick={() => setActiveTab('contracts')}
            >
              <span className="nav-icon">📝</span>
              <span>Contracts</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <span className="nav-icon">📞</span>
              <span>Contact</span>
            </div>
            <div className={`nav-item ${activeTab === 'weather' ? 'active' : ''}`} onClick={() => setActiveTab('weather')}>
              <span className="nav-icon">🌤️</span>
              <span>Weather</span>
            </div>
            <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <span className="nav-icon">⚙️</span>
              <span>Settings</span>
            </div>

            {/* FIX #2: Home, Logout, and Delete Account buttons */}
            <div className="nav-divider" />

            <div className="nav-item" onClick={() => { window.location.href = '/'; }}>
              <span className="nav-icon">🏠</span>
              <span>Home</span>
            </div>

            <div className="nav-item" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span>Logout</span>
            </div>

            <div className="nav-item danger" onClick={handleDeleteAccount}>
              <span className="nav-icon">🗑️</span>
              <span>Delete Account</span>
            </div>
          </div>

          {/* FIX #1: Only render wallet address div when publicKey actually exists */}
          <div className="wallet-info-sidebar">
            <div className="wallet-connected-indicator">
              <span className="dot"></span>
              <span>{connected ? 'Wallet Connected' : 'Session Active'}</span>
            </div>
            {publicKey && (
              <div className="wallet-address-small">
                {maskWalletAddress(publicKey.toBase58())}
              </div>
            )}
          </div>
        </div>

        <div className="main-content">
          <div className="content-header">
            <h1>
              {activeTab === 'dashboard' && 'Operator Dashboard'}
              {activeTab === 'contracts' && 'Contracts & Missions'}
              {activeTab === 'contact' && 'Messages'}
              {activeTab === 'weather' && '🌤️ Weather & Hazards'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <div className="header-actions">
              <button className="notification-btn">🔔</button>
            </div>
          </div>

          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'contracts' && <ContractsTab />}
          {activeTab === 'contact' && <ContactTab />}
          {activeTab === 'weather' && <WeatherTab operatorData={operatorData} />}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: 20, padding: 30, marginBottom: 20 }}>
                <h3 style={{ color: 'white', marginBottom: 20 }}>Account</h3>
                <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Wallet Address</div>
                <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '10px 16px', fontFamily: 'monospace', color: '#22c55e', fontSize: 13, wordBreak: 'break-all', marginBottom: 20 }}>
                  {publicKey?.toBase58() || 'Not connected'}
                </div>
                <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Name</div>
                <div style={{ color: 'white', marginBottom: 20 }}>{operatorData?.full_name || '—'}</div>
                <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Username</div>
                <div style={{ color: 'white', marginBottom: 20 }}>@{operatorData?.username || '—'}</div>
                <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Region</div>
                <div style={{ color: 'white', marginBottom: 20 }}>{operatorData?.region || '—'}</div>
              </div>
              <div style={{ background: '#111', border: '1px solid #ef444430', borderRadius: 20, padding: 30 }}>
                <h3 style={{ color: '#ef4444', marginBottom: 10 }}>Danger Zone</h3>
                <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>Deleting your account is permanent and cannot be undone.</p>
                <button
                  onClick={handleDeleteAccount}
                  style={{ background: '#ef444415', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Contract Detail Modal */}
      {selectedContractDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedContractDetail(null)}>
          <div style={{
            background: '#111', border: '1px solid #333', borderRadius: 24,
            padding: 36, maxWidth: 520, width: '90%', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedContractDetail(null)} style={{
              position: 'absolute', top: 16, right: 20, background: 'none',
              border: 'none', color: '#666', fontSize: 22, cursor: 'pointer'
            }}>✕</button>
            <h2 style={{ color: 'white', marginBottom: 6, fontSize: 22 }}>{selectedContractDetail.title}</h2>
            <div style={{ color: '#9333ea', marginBottom: 20, fontSize: 14 }}>{selectedContractDetail.client_name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                ['Status', selectedContractDetail.status],
                ['Region', selectedContractDetail.region || 'N/A'],
                ['Value', `${selectedContractDetail.amount_sol || 0} SOL`],
                ['Progress', `${selectedContractDetail.progress || 0}%`],
                ['Date', selectedContractDetail.created_at ? new Date(selectedContractDetail.created_at).toLocaleDateString() : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 14 }}>
                  <div style={{ color: '#888', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                  <div style={{ color: 'white', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
            {selectedContractDetail.description && (
              <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>DESCRIPTION</div>
                <div style={{ color: '#ccc', lineHeight: 1.6 }}>{selectedContractDetail.description}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              {selectedContractDetail.status === 'active' && (
                <button onClick={() => {
                  const p = prompt(`Update progress (current: ${selectedContractDetail.progress || 0}%):`, selectedContractDetail.progress || 0);
                  if (p !== null && !isNaN(parseInt(p))) {
                    const val = Math.min(100, Math.max(0, parseInt(p)));
                    updateContractProgress(selectedContractDetail.id, val, val === 100);
                    setSelectedContractDetail(prev => ({ ...prev, progress: val, status: val === 100 ? 'completed' : 'active' }));
                  }
                }} style={{ flex: 1, background: '#9333ea', border: 'none', borderRadius: 12, padding: '12px 0', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                  Update Progress
                </button>
              )}
              <button onClick={() => {
                setActiveTab('contact');
                setSelectedContractDetail(null);
              }} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: '12px 0', color: 'white', cursor: 'pointer', fontSize: 14 }}>
                Open Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Withdraw Modal ──────────────────────────────────────────────────── */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20
        }} onClick={() => setShowWithdrawModal(false)}>
          <div style={{
            background: '#111', border: '1px solid #333', borderRadius: 24,
            padding: 36, maxWidth: 420, width: '100%'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: 'white', fontSize: 20 }}>💸 Withdraw Earnings</h2>
              <button onClick={() => setShowWithdrawModal(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Available Balance</div>
              <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 24 }}>
                {(operatorData?.total_earned || 0).toFixed(2)} USDC
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>Amount to withdraw</div>
              <input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                max={operatorData?.total_earned || 0}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: '#1a1a1a', border: '1px solid #333',
                  borderRadius: 10, color: 'white', fontSize: 16,
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {[25, 50, 75, 100].map(pct => (
                  <button key={pct}
                    onClick={() => setWithdrawAmount(((operatorData?.total_earned || 0) * pct / 100).toFixed(2))}
                    style={{
                      flex: 1, padding: '6px 0', background: '#1a1a1a',
                      border: '1px solid #333', borderRadius: 8,
                      color: '#888', fontSize: 12, cursor: 'pointer'
                    }}
                  >{pct}%</button>
                ))}
              </div>
            </div>

            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 12, marginBottom: 20, fontSize: 13, color: '#888' }}>
              💡 Funds will be sent to wallet: <span style={{ color: '#9333ea', fontFamily: 'monospace' }}>
                {sessionUser?.walletAddress
                  ? `${sessionUser.walletAddress.slice(0,4)}...${sessionUser.walletAddress.slice(-4)}`
                  : '—'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowWithdrawModal(false)} style={{
                flex: 1, padding: '13px 0', background: 'transparent',
                border: '1px solid #333', borderRadius: 12, color: '#888', cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={handleWithdraw} style={{
                flex: 2, padding: '13px 0',
                background: 'linear-gradient(135deg,#9333ea,#a855f7)',
                border: 'none', borderRadius: 12, color: 'white',
                fontWeight: 700, fontSize: 15, cursor: 'pointer'
              }}>Withdraw</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OperatorDashboard;
