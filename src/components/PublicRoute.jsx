// src/components/PublicRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSession } from '../Context/sessionContext'; // FIX: correct casing

export function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useSession();

  if (loading) {
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
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    const dashboardPath = user?.role === 'operator'
      ? '/operator/dashboard'
      : '/enterprise/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}
