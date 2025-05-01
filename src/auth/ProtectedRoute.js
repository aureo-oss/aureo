import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="full-page-loader">⏳ Loading...</div>;
  if (!currentUser?.emailVerified) return <Navigate to="/login" replace />;
  return children;
}