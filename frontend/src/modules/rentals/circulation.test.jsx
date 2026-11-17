import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { rentalsApi } from '../../api';
import { LIBRARIAN, pageOf, rental, renderPage } from '../../test/render';
import CirculationPage from './CirculationPage';

vi.mock('../../api');

it('lista tickets abertos e permite registrar a retirada de uma reserva', async () => {
  const reserved = rental({ id: 'reserved-1', status: 'reserved', ticketCode: 'RET-20261016-AAAA1111' });
  const active = rental({ id: 'active-1', status: 'active', ticketCode: 'RET-20261016-BBBB2222' });
  rentalsApi.list.mockImplementation((params) => Promise.resolve(pageOf(params.ticketCode ? [reserved] : [reserved, active])));
  rentalsApi.circulation.mockResolvedValue({ recent: [] });
  rentalsApi.pickup.mockResolvedValue({ ...reserved, status: 'active' });
  renderPage(<CirculationPage />, { user: LIBRARIAN });

  expect(await screen.findByText('RET-20261016-AAAA1111')).toBeInTheDocument();
  expect(screen.getByText('RET-20261016-BBBB2222')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirmar retirada' })).toBeDisabled();

  await userEvent.type(screen.getByRole('textbox', { name: 'Código do ticket' }), reserved.ticketCode);
  expect(await screen.findByRole('button', { name: 'Confirmar retirada' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Confirmar devolução' })).toBeDisabled();

  await userEvent.click(screen.getByRole('button', { name: 'Confirmar retirada' }));
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar retirada' }));

  await waitFor(() => expect(rentalsApi.pickup).toHaveBeenCalledWith(reserved.ticketCode));
});

it('habilita devolução somente para locações ativas ou atrasadas', async () => {
  const active = rental({ status: 'active', ticketCode: 'RET-20261016-BBBB2222' });
  rentalsApi.list.mockImplementation((params) => Promise.resolve(pageOf(params.ticketCode ? [active] : [active])));
  rentalsApi.circulation.mockResolvedValue({ recent: [] });
  rentalsApi.giveBack.mockResolvedValue({ ...active, status: 'returned' });
  renderPage(<CirculationPage />, { user: LIBRARIAN });

  await userEvent.type(screen.getByRole('textbox', { name: 'Código do ticket' }), active.ticketCode);

  expect(await screen.findByRole('button', { name: 'Confirmar devolução' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Confirmar retirada' })).toBeDisabled();

  await userEvent.click(screen.getByRole('button', { name: 'Confirmar devolução' }));
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar devolução' }));

  await waitFor(() => expect(rentalsApi.giveBack).toHaveBeenCalledWith(active.ticketCode));
});