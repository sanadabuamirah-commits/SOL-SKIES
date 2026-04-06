// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';
import logo from '../assets/AdobSOL.png';
import { SigninMessage } from '../utils/SigninMessage';
import { useSession } from '../Context/sessionContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useSession();
  const { publicKey, connected, disconnect, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginAttempted, setLoginAttempted] = useState(false);

  // Check if user is already logged in via session
  useEffect(() => {
    const checkExistingSession = () => {
      const session = localStorage.getItem('solskies_session');
      if (!session) {
        setCheckingSession(false);
        return;
      }

      try {
        const sessionData = JSON.parse(session);
        
        if (Date.now() > sessionData.expiresAt) {
          localStorage.removeItem('solskies_session');
          localStorage.removeItem('solskies_user');
          setCheckingSession(false);
          return;
        }

        const dashboardPath = sessionData.user?.role === 'operator' 
          ? '/operator/dashboard' 
          : '/enterprise/dashboard';
        
        navigate(dashboardPath, { replace: true });
      } catch (err) {
        console.error('Error parsing session:', err);
        localStorage.removeItem('solskies_session');
        localStorage.removeItem('solskies_user');
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [navigate]);

  // Fix wallet auto-login effect - include publicKey dependency
  useEffect(() => {
    if (connected && publicKey && !loading && !loginAttempted) {
      setLoginAttempted(true);
      handleWalletLogin();
    }
  }, [connected, publicKey]);

  // Reset login state when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setLoginAttempted(false);
    }
  }, [connected]);

  const openWalletModal = () => {
    setVisible(true);
  };

  const handleWalletLogin = async () => {
    console.log('1. Starting wallet login...');
    
    if (!connected || !publicKey || !signMessage) {
      setError("Wallet not connected or does not support message signing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nonce = crypto.randomUUID();
      console.log('2. Nonce generated:', nonce);
      
      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: publicKey.toBase58(),
        nonce: nonce,
        statement: 'Sign this message to authenticate with Sol Skies.'
      });

      console.log('3. Message prepared:', message.prepare());
      
      const encodedMessage = new TextEncoder().encode(message.prepare());
      console.log('4. Requesting signature...');
      
      const signature = await signMessage(encodedMessage);
      console.log('5. Signature obtained:', bs58.encode(signature).substring(0, 20) + '...');
      
      console.log('6. Sending to backend...');
      const response = await fetch('http://localhost:3001/api/auth/wallet-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature: bs58.encode(signature),
          message: message.prepare(),
          nonce: nonce
        }),
      });

      console.log('7. Response status:', response.status);
      const data = await response.json();
      console.log('8. Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      console.log('9. Login successful, creating session...');
      const expiresAt = rememberMe 
        ? Date.now() + (30 * 24 * 60 * 60 * 1000)
        : Date.now() + (24 * 60 * 60 * 1000);

      const sessionData = {
        user: data.user,
        walletAddress: publicKey.toBase58(),
        loggedInAt: Date.now(),
        expiresAt: expiresAt,
        rememberMe: rememberMe
      };

      localStorage.setItem('solskies_session', JSON.stringify(sessionData));
      localStorage.setItem('solskies_user', JSON.stringify(data.user));

      // FIX: update SessionContext in-memory state immediately so ProtectedRoute
      // sees isAuthenticated=true before the navigation renders the dashboard.
      login(data.user, rememberMe);

      console.log('10. Session stored, navigating to:', data.user.role === 'operator' ? '/operator/dashboard' : '/enterprise/dashboard');
      const dashboardPath = data.user.role === 'operator' ? '/operator/dashboard' : '/enterprise/dashboard';
      navigate(dashboardPath, { replace: true });

    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || "Authentication failed. Please try again.");
      
      try {
        if (connected) {
          await disconnect();
        }
      } catch (e) {
        console.error('Error disconnecting wallet:', e);
      }
      
      setLoginAttempted(false);
    } finally {
      setLoading(false);
    }
  };

  // Add the disconnectWallet function
  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  if (checkingSession) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px'
      }}>
        Checking session...
      </div>
    );
  }

  // FULL CSS STYLES - INCLUDED HERE
  const styles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background-color: #0a0a0a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    .login-page {
      width: 100%;
      min-height: 100vh;
      background-color: #0a0a0a;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .curved-line-1, .curved-line-2, .curved-line-3 {
      position: fixed;
      z-index: 1;
      pointer-events: none;
    }
    
    .curved-line-1 {
      top: 10%;
      right: -10%;
      width: 600px;
      height: 600px;
      border-radius: 62% 38% 42% 58% / 41% 55% 45% 59%;
      background: linear-gradient(135deg, #c084fc40, #f9a8d440);
      opacity: 0.5;
      filter: blur(60px);
      transform: rotate(15deg);
    }
    
    .curved-line-2 {
      bottom: -20%;
      left: -5%;
      width: 700px;
      height: 700px;
      border-radius: 73% 27% 58% 42% / 33% 64% 36% 67%;
      background: linear-gradient(225deg, #a855f740, #ec489940);
      opacity: 0.5;
      filter: blur(70px);
      transform: rotate(-10deg);
    }
    
    .curved-line-3 {
      top: 40%;
      left: 20%;
      width: 400px;
      height: 400px;
      border-radius: 51% 49% 33% 67% / 56% 59% 41% 44%;
      background: linear-gradient(45deg, #d8b4fe40, #fbcfe840);
      opacity: 0.4;
      filter: blur(80px);
    }

    .login-container {
      background: #111111;
      padding: 40px;
      border-radius: 30px;
      border: 1px solid #333;
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 10;
      box-shadow: 0 20px 40px rgba(147, 51, 234, 0.2);
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .logo {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo img {
      width: 70px;
      height: 70px;
      margin-bottom: 15px;
    }

    .logo h1 {
      font-size: 28px;
      background: linear-gradient(135deg, #fff, #e9d5ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 5px;
    }

    .logo p {
      color: #666;
      font-size: 14px;
    }

    .wallet-card {
      background: #1a1a1a;
      padding: 40px;
      border-radius: 20px;
      margin-bottom: 20px;
      border: 1px solid #333;
      text-align: center;
    }

    .wallet-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .wallet-connected {
      background: #1a1a1a;
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 20px;
      border: 1px solid #22c55e30;
      text-align: center;
    }

    .wallet-address {
      background: #0a0a0a;
      padding: 12px;
      border-radius: 10px;
      font-family: monospace;
      font-size: 14px;
      color: #22c55e;
      margin: 15px 0;
      border: 1px solid #333;
      word-break: break-all;
    }

    .primary-btn {
      background: #9333ea;
      color: white;
      border: none;
      border-radius: 40px;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s ease;
    }

    .primary-btn:hover:not(:disabled) {
      background: #a855f7;
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(147, 51, 234, 0.3);
    }

    .primary-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .secondary-btn {
      background: transparent;
      color: #888;
      border: 1px solid #333;
      border-radius: 40px;
      padding: 12px;
      font-size: 14px;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s ease;
    }

    .secondary-btn:hover:not(:disabled) {
      background: #222;
      border-color: #9333ea;
      color: white;
    }

    .remember-me {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #888;
      font-size: 14px;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: #9333ea;
    }

    .error-message {
      background: #ef444420;
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 14px;
      text-align: center;
    }

    .signup-link {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 20px;
    }

    .signup-link a {
      color: #9333ea;
      text-decoration: none;
      margin-left: 5px;
      font-weight: 500;
    }

    .signup-link a:hover {
      color: #a855f7;
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .login-container {
        padding: 30px 20px;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="login-page">
        <div className="curved-line-1"></div>
        <div className="curved-line-2"></div>
        <div className="curved-line-3"></div>

        <div className="login-container">
          <div className="logo">
            <img src={logo} alt="Sol Skies" />
            <h1>Welcome Back</h1>
            <p>Connect your wallet to continue</p>
          </div>

          {!connected ? (
            <div className="wallet-card">
              <div className="wallet-icon">🔌</div>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>
                Connect Your Wallet
              </h3>
              <p style={{ color: '#888', marginBottom: '30px', fontSize: '14px' }}>
                Connect with Phantom, Solflare, or any Solana wallet
              </p>

              <button
                onClick={openWalletModal}
                disabled={loading}
                className="primary-btn"
              >
                Select Wallet
              </button>

              <div style={{ marginTop: '20px' }}>
                <a
                  href="#"
                  style={{ color: '#9333ea', textDecoration: 'none', fontSize: '14px' }}
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://solana.com/wallets', '_blank');
                  }}
                >
                  What is a Solana wallet?
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div className="wallet-connected">
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>✅</div>
                <h3 style={{ color: 'white', marginBottom: '10px' }}>
                  Wallet Connected
                </h3>
                <div className="wallet-address">
                  {publicKey?.toBase58()}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="remember-me">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  Keep me signed in for 30 days
                </label>
              </div>

              <button
                onClick={handleWalletLogin}
                disabled={loading || loginAttempted}
                className="primary-btn"
                style={{ marginBottom: '15px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <button
                onClick={disconnectWallet}
                disabled={loading}
                className="secondary-btn"
              >
                Use different wallet
              </button>

              <div className="signup-link">
                Don't have an account?
                <Link to="/signup">Create account</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Login;