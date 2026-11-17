import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { authApi } from '../../api';
import { useForm } from '../../hooks/useForm';
import AuthShell from './AuthShell';

function validate({ name, email, password, confirm }) {
  if (!name.trim() || !email.trim()) return 'Preencha nome e e-mail.';
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (password !== confirm) return 'As senhas não conferem.';
  return '';
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { form, field } = useForm({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const invalid = validate(form);
    if (invalid) return setError(invalid);
    setSending(true);
    try {
      const email = form.email.trim().toLowerCase();
      await authApi.register({ name: form.name.trim(), email, password: form.password });
      navigate('/login', { state: { registered: true, email } });
    } catch (failure) {
      setError(failure.message);
      setSending(false);
    }
  };

  return (
    <AuthShell title="Criar conta" subtitle="Cadastre-se como leitor para reservar livros.">
      <Stack component="form" spacing={2} onSubmit={submit} noValidate>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nome completo" autoComplete="name" required {...field('name')} />
        <TextField label="E-mail" type="email" autoComplete="email" required {...field('email')} />
        <TextField label="Senha" type="password" autoComplete="new-password" helperText="Mínimo de 8 caracteres." required {...field('password')} />
        <TextField label="Confirmar senha" type="password" autoComplete="new-password" required {...field('confirm')} />
        <Button type="submit" variant="contained" size="large" disabled={sending}>{sending ? 'Criando...' : 'Criar conta'}</Button>
        <Button component={RouterLink} to="/login">Voltar para o login</Button>
      </Stack>
    </AuthShell>
  );
}
