import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { booksApi, finesApi, jobsApi, notificationsApi, rentalsApi } from '../../api';
import { LIBRARIAN, pageOf, rental, renderPage } from '../../test/render';
import DashboardPage from './DashboardPage';

vi.mock('../../api');

it('mostra o resumo do leitor com multas e prazos', async () => {
  booksApi.list.mockResolvedValue({ count: 16, results: [] });
  rentalsApi.mine.mockResolvedValue(pageOf([rental({ status: 'overdue' })]));
  finesApi.mine.mockResolvedValue(pageOf([{ id: 'f1', amount: '14.00', status: 'pending' }]));
  notificationsApi.list.mockResolvedValue(pageOf([{ id: 'n1', type: 'fine_generated', message: 'Multa atual: R$ 14,00.', read: false, createdAt: '2026-10-17T06:00:00Z' }]));

  renderPage(<DashboardPage />);

  expect(await screen.findByText('Olá, Ana')).toBeInTheDocument();
  expect(screen.getByText('16')).toBeInTheDocument();
  expect(screen.getByText(/1 livro\(s\) atrasado\(s\)/)).toBeInTheDocument();
  expect(screen.getByText('Multa atual: R$ 14,00.')).toBeInTheDocument();
});

it('mostra os atrasos e a última execução do job para o bibliotecário', async () => {
  booksApi.list.mockResolvedValue({ count: 3, results: [] });
  rentalsApi.list.mockImplementation(({ status }) => Promise.resolve(pageOf(status === 'overdue' ? [rental({ status: 'overdue', userName: 'Carlos' })] : [])));
  finesApi.list.mockResolvedValue(pageOf([]));
  jobsApi.list.mockResolvedValue(pageOf([{ id: 'j1', status: 'failed', startedAt: '2026-10-17T06:00:00Z' }]));
  rentalsApi.circulation.mockResolvedValue({ days: [{ date: '2026-10-17', pickups: 2, returns: 1 }], recent: [] });

  renderPage(<DashboardPage />, { user: LIBRARIAN });

  expect(await screen.findByText('Painel do bibliotecário')).toBeInTheDocument();
  expect(screen.getByText('Carlos')).toBeInTheDocument();
  expect(screen.getByText('Falha')).toBeInTheDocument();
});
