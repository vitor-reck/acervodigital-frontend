import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { usersApi } from '../../api';
import { LIBRARIAN, pageOf, renderPage } from '../../test/render';
import ReadersPage from './ReadersPage';

vi.mock('../../api');

// as chamadas ao mock acumulam entre testes
beforeEach(() => vi.resetAllMocks());

const reader = (overrides = {}) => ({ id: 'u1', name: 'Ana Souza', email: 'ana@acervo.com', role: 'user', ...overrides });

it('lista os leitores com link para o histórico', async () => {
  usersApi.list.mockResolvedValue(pageOf([reader(), reader({ id: 'u2', name: 'Bruno Lima', email: 'bruno@acervo.com' })]));
  renderPage(<ReadersPage />, { user: LIBRARIAN });

  expect(await screen.findByRole('link', { name: 'Ana Souza' })).toHaveAttribute('href', '/leitores/u1');
  expect(screen.getByRole('link', { name: 'Bruno Lima' })).toHaveAttribute('href', '/leitores/u2');
  expect(screen.getByText('bruno@acervo.com')).toBeInTheDocument();
});

it('busca pelo termo digitado, sem enviar q quando o campo está vazio', async () => {
  usersApi.list.mockResolvedValue(pageOf([reader()]));
  renderPage(<ReadersPage />, { user: LIBRARIAN });
  await screen.findByText('Ana Souza');
  expect(usersApi.list.mock.calls[0][0]).not.toHaveProperty('q');

  usersApi.list.mockResolvedValue(pageOf([]));
  await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar leitor' }), 'xyz');

  expect(await screen.findByText('Nenhum leitor encontrado')).toBeInTheDocument();
  expect(usersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'xyz' }));
});

it('mostra o estado vazio quando não há leitores', async () => {
  usersApi.list.mockResolvedValue(pageOf([]));
  renderPage(<ReadersPage />, { user: LIBRARIAN });

  expect(await screen.findByText('Ainda não há leitores cadastrados.')).toBeInTheDocument();
});
