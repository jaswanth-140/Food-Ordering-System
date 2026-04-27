import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  // Authenticated users go to browse (location overlay handles permission there)
  // Unauthenticated users see the landing page first
  return isAuthenticated ? <Navigate to="/browse" replace /> : <Navigate to="/landing" replace />;
};

export default Index;
