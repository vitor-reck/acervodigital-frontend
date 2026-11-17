import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { authApi } from '../../api';
import { session } from '../../api/client';
import { READER, renderPage } from '../../test/render';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

vi.mock('../../api');

it('faz login, salva a sessão e sai da tela de login', async () => {
  authApi.login.mockResolvedValue({ token: 'jwt', expiresIn: 3600, user: READER });
  renderPage(<LoginPage />, { path: '/login', user: null });

  await userEvent.type(screen.getByLabelText(/E-mail/), 'ana@acervo.com');
  await userEvent.type(screen.getByLabelText(/Senha/), 'senha12345');
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

  expect(await screen.findByText('Outra página')).toBeInTheDocument();
  expect(authApi.login).toHaveBeenCalledWith({ email: 'ana@acervo.com', password: 'senha12345' });
  expect(session.read().token).toBe('jwt');
});

it('mostra o erro da API no login', async () => {
  authApi.login.mockRejectedValue(new Error('E-mail ou senha incorretos.'));
  renderPage(<LoginPage />, { path: '/login', user: null });

  await userEvent.type(screen.getByLabelText(/E-mail/), 'ana@acervo.com');
  await userEvent.type(screen.getByLabelText(/Senha/), 'errada');
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

  expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument();
});

it('valida a senha no cadastro antes de chamar a API', async () => {
  renderPage(<RegisterPage />, { path: '/cadastro', user: null });

  await userEvent.type(screen.getByLabelText(/Nome completo/), 'Ana');
  await userEvent.type(screen.getByLabelText(/^E-mail/), 'ana@acervo.com');
  await userEvent.type(screen.getByLabelText(/^Senha/), 'curta');
  await userEvent.type(screen.getByLabelText(/Confirmar senha/), 'curta');
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

  expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeInTheDocument();
  expect(authApi.register).not.toHaveBeenCalled();
});
