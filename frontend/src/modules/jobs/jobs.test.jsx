import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { jobsApi } from '../../api';
import { LIBRARIAN, pageOf, renderPage } from '../../test/render';
import JobsPage from './JobsPage';

vi.mock('../../api');

const failed = {
  id: 'j1',
  status: 'failed',
  startedAt: '2026-10-11T06:00:02Z',
  finishedAt: '2026-10-11T06:00:35Z',
  details: { rentalsScanned: 4, summary: { overdueMarked: 1, finesCreated: 0, notificationsSent: 0 }, rentals: [] },
  error: 'cluster0: timed out',
  traceback: 'Traceback ... ServerSelectionTimeoutError',
};

it('lista execuções e mostra o traceback da falha', async () => {
  jobsApi.list.mockResolvedValue(pageOf([failed]));
  renderPage(<JobsPage />, { user: LIBRARIAN });

  expect(await screen.findByText('cluster0: timed out')).toBeInTheDocument();
  expect(screen.getByText('33s')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Detalhes' }));
  expect(await screen.findByText(/ServerSelectionTimeoutError/)).toBeInTheDocument();
});

it('filtra por status na API', async () => {
  jobsApi.list.mockResolvedValue(pageOf([]));
  renderPage(<JobsPage />, { user: LIBRARIAN });

  await userEvent.click(await screen.findByRole('button', { name: 'Falha' }));
  expect(jobsApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 12, status: 'failed' });
});
