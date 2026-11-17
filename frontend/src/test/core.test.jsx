import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import { client, errorMessage, session } from '../api/client';
import { compact, toApiDate } from '../utils/format';
import { LIBRARIAN, READER, renderWithProviders } from './render';

vi.mock('../api');

describe('cliente da API', () => {
  it('envia o token salvo no header Authorization', async () => {
    session.write({ token: 'abc', user: READER, expiresAt: Date.now() + 1000 });
    const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc');
  });

  it('traduz mensagens da API e de validação', () => {
    expect(errorMessage({ response: { data: { error: 'Invalid email or password.' } } })).toBe('E-mail ou senha incorretos.');
    expect(errorMessage({ response: { data: { error: { email: ['Este campo é obrigatório.'] } } } })).toBe('Este campo é obrigatório.');
    expect(errorMessage({ code: 'ECONNABORTED' })).toMatch(/demorou/);
  });
});

describe('utilitários', () => {
  it('converte data para o formato da API e remove filtros vazios', () => {
    expect(toApiDate('1899-01-31')).toBe('31-01-1899');
    expect(compact({ title: '', genre: 'Romance', page: 1, author: null })).toEqual({ genre: 'Romance', page: 1 });
  });
});

describe('rotas', () => {
  it('redireciona para o login sem sessão', async () => {
    renderWithProviders(<App />, { user: null, route: '/multas' });
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('bloqueia área do bibliotecário para o leitor', async () => {
    renderWithProviders(<App />, { user: READER, route: '/jobs' });
    expect(await screen.findByText('Acesso restrito')).toBeInTheDocument();
  });

  it('mostra o menu conforme o perfil', async () => {
    renderWithProviders(<App />, { user: LIBRARIAN, route: '/rota-inexistente' });
    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument();
    expect(screen.getAllByText('Leitores').length).toBeGreaterThan(0);
    expect(screen.queryByText('Minhas multas')).not.toBeInTheDocument();
  });
});
