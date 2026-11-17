import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useAuth } from '../../auth/AuthContext';
import { useForm } from '../../hooks/useForm';
import AuthShell from './AuthShell';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { form, field } = useForm({ email: state?.email ?? '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await login(form.email.trim(), form.password);
      navigate(state?.from ?? '/', { replace: true });
    } catch (failure) {
      setError(failure.message);
      setSending(false);
    }
  };

  return (
    <AuthShell title="Entrar" subtitle="Acesse com o e-mail e a senha cadastrados.">
      <Stack component="form" spacing={2} onSubmit={submit}>
        {state?.registered && <Alert severity="success">Conta criada! Entre com seu e-mail e senha.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="E-mail" type="email" autoComplete="username" required {...field('email')} />
        <TextField label="Senha" type="password" autoComplete="current-password" required {...field('password')} />
        <Button type="submit" variant="contained" size="large" disabled={sending}>{sending ? 'Entrando...' : 'Entrar'}</Button>
        <Button component={RouterLink} to="/cadastro">Criar conta</Button>
      </Stack>
    </AuthShell>
  );
}
