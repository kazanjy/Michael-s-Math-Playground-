import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/Login';
import { GymnasiumHomePage } from './pages/GymnasiumHome';
import { GymnasiumPracticePage } from './pages/GymnasiumPractice';
import { GymnasiumSummaryPage } from './pages/GymnasiumSummary';

// Force logout by clearing all storage and redirecting
function forceLogout() {
  // Clear all auth-related storage
  localStorage.removeItem('math_playground_demo_profile');
  localStorage.removeItem('math_playground_demo_children');
  localStorage.removeItem('math_playground_demo_current_child');
  sessionStorage.clear();
  // Force full page reload to login
  window.location.href = '/login';
}

// Logout route component
function LogoutRoute() {
  useEffect(() => {
    forceLogout();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white text-xl">Logging out...</div>
    </div>
  );
}

// Handle ?logout query parameter
function LogoutQueryHandler({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.has('logout')) {
      forceLogout();
    }
  }, [searchParams]);

  if (searchParams.has('logout')) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Logging out...</div>
      </div>
    );
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <LogoutQueryHandler>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/logout" element={<LogoutRoute />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <GymnasiumHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <GymnasiumPracticePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <GymnasiumSummaryPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LogoutQueryHandler>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
