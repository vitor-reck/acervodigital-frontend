import { Navigate, Route, Routes, Link as RouterLink, useLocation } from 'react-router-dom';
import { Button, Card } from '@mui/material';
import { useAuth } from './auth/AuthContext';
import AppLayout from './components/AppLayout';
import { EmptyState } from './components/ui';
import { LoginPage, RegisterPage } from './modules/auth';
import { ROUTES } from './routes';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function PublicOnly({ children }) {
  return useAuth().user ? <Navigate to="/" replace /> : children;
}

function RoleGuard({ roles, children }) {
  const { user } = useAuth();
  if (!roles || roles.includes(user.role)) return children;
  return <Card><EmptyState title="Acesso restrito" text="Esta área não está disponível para o seu perfil." action={<Button component={RouterLink} to="/">Ir para o dashboard</Button>} /></Card>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/cadastro" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        {ROUTES.map(({ path, element, roles }) => (
          <Route key={path} path={path} element={<RoleGuard roles={roles}>{element}</RoleGuard>} />
        ))}
        <Route path="*" element={<Card><EmptyState title="Página não encontrada" text="O endereço informado não existe." action={<Button component={RouterLink} to="/">Voltar ao início</Button>} /></Card>} />
      </Route>
    </Routes>
  );
}
