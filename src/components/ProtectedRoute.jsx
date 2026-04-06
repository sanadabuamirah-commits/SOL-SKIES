// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from '../Context/sessionContext';

export function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useSession();
  const { publicKey } = useWallet();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'white', fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // SECURITY FIX: Defense-in-depth — prevent direct URL access with mismatched wallet
  if (user && publicKey && user.walletAddress && user.walletAddress !== publicKey.toBase58()) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    const path = user.role === 'operator' ? '/operator/dashboard' : '/enterprise/dashboard';
    return <Navigate to={path} replace />;
  }

  return children;
}
