// src/pages/ChooseRole.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/AdobSOL.png';

function ChooseRole() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState('');

  // Get the intended role from URL if coming from homepage buttons
  const params = new URLSearchParams(location.search);
  const defaultRole = params.get('type');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === 'operator') {
      navigate('/operator/dashboard');
    } else if (selectedRole === 'enterprise') {
      navigate('/enterprise/dashboard');
    }
  };

  const styles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background-color: #0a0a0a;
    }

    .choose-role-page {
      width: 100%;
      min-height: 100vh;
      background-color: #0a0a0a;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .choose-role-container {
      background: white;
      padding: 40px;
      border-radius: 30px;
      box-shadow: 0 20px 40px rgba(147, 51, 234, 0.2);
      width: 100%;
      max-width: 600px;
      position: relative;
      z-index: 10;
      text-align: center;
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
    
    h1 {
      color: #333;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
      font-size: 14px;
      margin-bottom: 40px;
    }
    
    .role-cards {
      display: flex;
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .role-card {
      flex: 1;
      padding: 40px 20px;
      border: 2px solid #eee;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }
    
    .role-card:hover {
      border-color: #9333ea;
      transform: translateY(-2px);
    }
    
    .role-card.selected {
      border-color: #9333ea;
      background: #f3f0ff;
    }
    
    .role-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .role-card h3 {
      color: #333;
      margin-bottom: 10px;
      font-size: 20px;
    }
    
    .role-card p {
      color: #666;
      font-size: 14px;
      margin-bottom: 0;
    }
    
    .primary-btn {
      background: #9333ea;
      border: none;
      color: white;
      padding: 14px 32px;
      border-radius: 40px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
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
    
    .back-link {
      margin-top: 20px;
    }
    
    .back-link a {
      color: #666;
      text-decoration: none;
      font-size: 14px;
    }
    
    .back-link a:hover {
      color: #9333ea;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="choose-role-page">
        <div className="curved-line-1"></div>
        <div className="curved-line-2"></div>
        <div className="curved-line-3"></div>

        <div className="choose-role-container">
          <img 
            src={logo} 
            alt="Sol Skies" 
            style={{ width: '100px', marginBottom: '20px' }}
          />
          <h1>Choose Your Account Type</h1>
          <p>This determines what features you'll see and cannot be changed later</p>

          <div className="role-cards">
            <div 
              className={`role-card ${selectedRole === 'operator' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('operator')}
            >
              <div className="role-icon">🚁</div>
              <h3>Drone Operator</h3>
              <p>I fly drones and accept missions</p>
            </div>

            <div 
              className={`role-card ${selectedRole === 'enterprise' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('enterprise')}
            >
              <div className="role-icon">🏢</div>
              <h3>Enterprise</h3>
              <p>I need drone services for my business</p>
            </div>
          </div>

          <button 
            className="primary-btn" 
            onClick={handleContinue}
            disabled={!selectedRole}
          >
            Continue to Dashboard
          </button>

          <div className="back-link">
            <a href="/signup">← Back to Sign Up</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChooseRole;