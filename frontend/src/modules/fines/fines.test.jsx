import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { finesApi } from '../../api';
import { LIBRARIAN, pageOf, renderPage } from '../../test/render';
import FinesPage from './FinesPage';

vi.mock('../../api');

// as chamadas ao mock acumulam entre testes; sem o reset, o "não chamou settle" veria chamadas de outro teste
beforeEach(() => vi.resetAllMocks());

const fine = (overrides = {}) => ({
  id: 'f1',
  userId: 'u1',
  userName: 'Ana Souza',
  rentalId: 'r1',
  bookTitle: 'Dom Casmurro',
  dueDate: '2026-10-01T12:00:00Z',
  amount: '6.00',
  status: 'pending',
  createdAt: '2026-10-04T06:00:00Z',
  settledAt: null,
  ...overrides,
});

it('leitor vê o total pendente e o aviso de quitação no balcão', async () => {
  finesApi.mine.mockResolvedValue(pageOf([fine(), fine({ id: 'f2', bookTitle: 'Iracema', amount: '4.00', status: 'settled', settledAt: '2026-10-06T12:00:00Z' })]));
  renderPage(<FinesPage />);

  expect(await screen.findByText('Dom Casmurro')).toBeInTheDocument();
  expect(screen.getByText('Iracema')).toBeInTheDocument();
  expect(screen.getByText(/R\$\s6,00/, { selector: 'h5' })).toBeInTheDocument();
  expect(screen.getByText(/quitação é registrada pelo bibliotecário/i)).toBeInTheDocument();
});

it('leitor sem multas vê o estado vazio', async () => {
  finesApi.mine.mockResolvedValue(pageOf([]));
  renderPage(<FinesPage />);

  expect(await screen.findByText('Você não tem multas')).toBeInTheDocument();
});

it('leitor só com multas quitadas não vê o aviso de quitação', async () => {
  finesApi.mine.mockResolvedValue(pageOf([fine({ status: 'settled', settledAt: '2026-10-06T12:00:00Z' })]));
  renderPage(<FinesPage />);

  expect(await screen.findByText('Dom Casmurro')).toBeInTheDocument();
  expect(screen.queryByText(/quitação é registrada pelo bibliotecário/i)).not.toBeInTheDocument();
});

describe('visão do bibliotecário', () => {
  const pending = fine({ userName: 'Ana Souza' });

  it('lista as multas pendentes com link para o leitor e pede o filtro pendente à API', async () => {
    finesApi.list.mockResolvedValue(pageOf([pending]));
    renderPage(<FinesPage />, { user: LIBRARIAN });

    expect(await screen.findByRole('link', { name: 'Ana Souza' })).toHaveAttribute('href', '/leitores/u1');
    expect(screen.getByText('Dom Casmurro')).toBeInTheDocument();
    expect(finesApi.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
  });

  it('troca o filtro e consulta as quitadas', async () => {
    finesApi.list.mockResolvedValue(pageOf([]));
    renderPage(<FinesPage />, { user: LIBRARIAN });

    await userEvent.click(await screen.findByRole('button', { name: 'Quitadas' }));

    expect(await screen.findByText('Nenhuma multa encontrada')).toBeInTheDocument();
    expect(finesApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'settled' }));
  });

  it('quita a multa depois da confirmação e recarrega a lista', async () => {
    finesApi.list.mockResolvedValueOnce(pageOf([pending])).mockResolvedValue(pageOf([]));
    finesApi.settle.mockResolvedValue({ ...pending, status: 'settled' });
    renderPage(<FinesPage />, { user: LIBRARIAN });

    await userEvent.click(await screen.findByRole('button', { name: 'Quitar' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Quitar' }));

    expect(finesApi.settle).toHaveBeenCalledWith('f1');
    expect(await screen.findByText('Nenhuma multa encontrada')).toBeInTheDocument();
  });

  it('não quita se o bibliotecário cancelar a confirmação', async () => {
    finesApi.list.mockResolvedValue(pageOf([pending]));
    renderPage(<FinesPage />, { user: LIBRARIAN });

    await userEvent.click(await screen.findByRole('button', { name: 'Quitar' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }));

    expect(finesApi.settle).not.toHaveBeenCalled();
  });

  it('recarrega a lista quando a multa já tinha sido quitada (409)', async () => {
    finesApi.list.mockResolvedValueOnce(pageOf([pending])).mockResolvedValue(pageOf([]));
    finesApi.settle.mockRejectedValue(Object.assign(new Error('Fine is already settled.'), { status: 409 }));
    renderPage(<FinesPage />, { user: LIBRARIAN });

    await userEvent.click(await screen.findByRole('button', { name: 'Quitar' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Quitar' }));

    expect(await screen.findByText('Nenhuma multa encontrada')).toBeInTheDocument();
    expect(await screen.findByText('Fine is already settled.')).toBeInTheDocument();
  });
});

it('leitor filtra as multas por situação', async () => {
  finesApi.mine.mockResolvedValue(pageOf([fine(), fine({ id: 'f2', bookTitle: 'Iracema', status: 'settled', settledAt: '2026-10-06T12:00:00Z' })]));
  renderPage(<FinesPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Quitadas' }));

  expect(screen.getByText('Iracema')).toBeInTheDocument();
  expect(screen.queryByText('Dom Casmurro')).not.toBeInTheDocument();
});

it('bibliotecário vê os totais de multas pendentes e quitadas', async () => {
  finesApi.list.mockImplementation((params) => Promise.resolve(
    params.status === 'settled' ? { ...pageOf([fine({ status: 'settled' })]), count: 7 } : pageOf([fine(), fine({ id: 'f2', amount: '4.00' })]),
  ));
  renderPage(<FinesPage />, { user: LIBRARIAN });

  expect(await screen.findByText(/R\$\s10,00/, { selector: 'h5' })).toBeInTheDocument();
  expect(screen.getByText('7', { selector: 'h5' })).toBeInTheDocument();
});
