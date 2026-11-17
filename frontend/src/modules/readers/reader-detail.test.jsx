import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { finesApi, rentalsApi, usersApi } from '../../api';
import { LIBRARIAN, pageOf, renderPage, rental } from '../../test/render';
import ReaderDetailPage from './ReaderDetailPage';

vi.mock('../../api');

// as chamadas ao mock acumulam entre testes
beforeEach(() => vi.resetAllMocks());

const reader = { id: 'u1', name: 'Ana Souza', email: 'ana@acervo.com', role: 'user' };
const fine = { id: 'f1', userId: 'u1', userName: 'Ana Souza', rentalId: 'r1', bookTitle: 'Dom Casmurro', dueDate: '2026-10-01T12:00:00Z', amount: '6.00', status: 'pending', createdAt: '2026-10-04T06:00:00Z', settledAt: null };

const open = () => renderPage(<ReaderDetailPage />, { path: '/leitores/:id', route: '/leitores/u1', user: LIBRARIAN });

it('mostra os dados do leitor, as multas pendentes e o histórico de locações', async () => {
  usersApi.get.mockResolvedValue(reader);
  finesApi.ofUser.mockResolvedValue(pageOf([fine]));
  rentalsApi.ofUser.mockResolvedValue(pageOf([rental({ bookTitle: 'Iracema', status: 'returned' })]));
  open();

  expect(await screen.findByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument();
  expect(screen.getByText('ana@acervo.com')).toBeInTheDocument();
  expect(await screen.findByText('Iracema')).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Multas pendentes do leitor' })).toBeInTheDocument();
  expect(screen.getByText(/Este leitor tem multas pendentes/)).toBeInTheDocument();
  expect(usersApi.get).toHaveBeenCalledWith('u1');
  expect(finesApi.ofUser).toHaveBeenCalledWith('u1', expect.anything());
  expect(rentalsApi.ofUser).toHaveBeenCalledWith('u1', expect.anything());
});

it('sem multas nem locações mostra os estados vazios e nenhum aviso', async () => {
  usersApi.get.mockResolvedValue(reader);
  finesApi.ofUser.mockResolvedValue(pageOf([]));
  rentalsApi.ofUser.mockResolvedValue(pageOf([]));
  open();

  expect(await screen.findByText('Nenhuma multa pendente')).toBeInTheDocument();
  expect(await screen.findByText('Nenhuma locação registrada')).toBeInTheDocument();
  expect(screen.queryByText(/Este leitor tem multas pendentes/)).not.toBeInTheDocument();
});

it('quita a multa pendente e recarrega as multas do leitor', async () => {
  usersApi.get.mockResolvedValue(reader);
  finesApi.ofUser.mockResolvedValueOnce(pageOf([fine])).mockResolvedValue(pageOf([]));
  finesApi.settle.mockResolvedValue({ ...fine, status: 'settled' });
  rentalsApi.ofUser.mockResolvedValue(pageOf([]));
  open();

  await userEvent.click(await screen.findByRole('button', { name: 'Quitar' }));
  await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Quitar' }));

  expect(finesApi.settle).toHaveBeenCalledWith('f1');
  expect(await screen.findByText('Nenhuma multa pendente')).toBeInTheDocument();
});

it('leitor inexistente mostra o erro da API', async () => {
  usersApi.get.mockRejectedValue(new Error('User not found.'));
  finesApi.ofUser.mockResolvedValue(pageOf([]));
  rentalsApi.ofUser.mockResolvedValue(pageOf([]));
  open();

  expect(await screen.findByText('User not found.')).toBeInTheDocument();
});
