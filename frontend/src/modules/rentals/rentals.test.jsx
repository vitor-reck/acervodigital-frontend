import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { rentalsApi } from '../../api';
import { LIBRARIAN, READER, pageOf, rental, renderPage } from '../../test/render';
import RentalsPage from './RentalsPage';

vi.mock('../../api');

beforeEach(() => {
  rentalsApi.mine.mockResolvedValue(pageOf([]));
  rentalsApi.list.mockResolvedValue(pageOf([]));
});

it('lista apenas as locações do leitor e permite cancelar reserva pendente', async () => {
  rentalsApi.mine.mockResolvedValue(pageOf([
    rental({ id: 'reserved-1', status: 'reserved', ticketCode: 'RET-20261016-AAAA1111' }),
    rental({ id: 'active-1', status: 'active', ticketCode: 'RET-20261016-BBBB2222' }),
  ]));
  rentalsApi.cancelMine.mockResolvedValue({});
  renderPage(<RentalsPage />, { user: READER });

  expect(await screen.findByText('Minhas locações')).toBeInTheDocument();
  expect(screen.getByText('RET-20261016-AAAA1111')).toBeInTheDocument();
  expect(screen.getByText('RET-20261016-BBBB2222')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Cancelar reserva' })).toHaveLength(1);
  expect(rentalsApi.list).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }));

  await waitFor(() => expect(rentalsApi.cancelMine).toHaveBeenCalledWith('reserved-1'));
});

it('lista locações do bibliotecário com filtro por ticket e leitor', async () => {
  rentalsApi.list.mockResolvedValue(pageOf([rental({ userName: 'João Pereira' })]));
  renderPage(<RentalsPage />, { user: LIBRARIAN });

  expect(await screen.findByText('João Pereira')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Retirada e devolução' })).toHaveAttribute('href', '/circulacao');

  await userEvent.click(screen.getByRole('button', { name: 'Atrasada' }));

  await waitFor(() => expect(rentalsApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 12, status: 'overdue' }));
});