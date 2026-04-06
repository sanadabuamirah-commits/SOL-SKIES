// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SolanaWalletProvider } from './Context/WalletContext';
import { SessionProvider } from './Context/sessionContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import OperatorDashboard from './pages/operator/dashboard';
import EnterpriseDashboard from './pages/EnterpriseDashboard';
import Admin from './pages/Admin';
import OperatorProfile from './pages/OperatorProfile';
import EnterpriseProfile from './pages/EnterpriseProfile';
import MissionDetails from './pages/MissionDetails';

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <SolanaWalletProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Admin — no auth required for demo */}
            <Route path="/admin" element={<Admin />} />

            {/* Public profile pages */}
            <Route path="/operator/:username" element={<OperatorProfile />} />
            <Route path="/enterprise/:companySlug" element={<EnterpriseProfile />} />
            <Route path="/missions/:id" element={<MissionDetails />} />

            {/* Protected: Operator */}
            <Route path="/operator/dashboard" element={
              <ProtectedRoute requiredRole="operator">
                <OperatorDashboard />
              </ProtectedRoute>
            } />

            {/* Protected: Enterprise */}
            <Route path="/enterprise/dashboard" element={
              <ProtectedRoute requiredRole="enterprise">
                <EnterpriseDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </SolanaWalletProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
