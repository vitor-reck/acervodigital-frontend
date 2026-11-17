import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ALL, notificationsApi } from '../../api';
import { pageOf, renderWithProviders } from '../../test/render';
import NotificationsPage from './NotificationsPage';

vi.mock('../../api');

const notifications = [
  {
    id: 'n-1',
    type: 'due_date_reminder',
    message: 'A devolução de Iracema vence hoje.',
    createdAt: '2026-11-02T09:00:00-03:00',
    read: false,
  },
  {
    id: 'n-2',
    type: 'fine_generated',
    message: 'Uma multa foi gerada.',
    createdAt: '2026-11-01T14:30:00-03:00',
    read: false,
  },
  {
    id: 'n-3',
    type: 'fine_settled',
    message: 'A multa foi quitada.',
    createdAt: '2026-10-28T11:15:00-03:00',
    read: true,
  },
];

it('carrega e mostra notificações da API', async () => {
  notificationsApi.list.mockResolvedValue(pageOf(notifications));
  renderWithProviders(<NotificationsPage />);

  expect(screen.getByRole('heading', { name: 'Notificações' })).toBeInTheDocument();
  expect(await screen.findByText('A devolução de Iracema vence hoje.')).toBeInTheDocument();
  expect(screen.getByText('2 não lida(s)')).toBeInTheDocument();
  expect(screen.getByText('Uma multa foi gerada.')).toBeInTheDocument();
  expect(screen.getByText('A multa foi quitada.')).toBeInTheDocument();
  expect(notificationsApi.list).toHaveBeenCalledWith(ALL);
  expect(screen.getByRole('button', { name: 'Marcar todas como lidas' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Limpar lidas' })).toBeEnabled();
});

it('marca uma notificação como lida e atualiza os dados', async () => {
  const updatedNotifications = notifications.map((notification) => (
    notification.id === 'n-1' ? { ...notification, read: true } : notification
  ));
  notificationsApi.list
    .mockResolvedValueOnce(pageOf(notifications))
    .mockResolvedValueOnce(pageOf(updatedNotifications));
  notificationsApi.read.mockResolvedValue({});
  renderWithProviders(<NotificationsPage />);

  const markReadButtons = await screen.findAllByRole('button', { name: 'Marcar como lida' });
  await userEvent.click(markReadButtons[0]);

  expect(notificationsApi.read).toHaveBeenCalledWith('n-1');
  expect(await screen.findByText('1 não lida(s)')).toBeInTheDocument();
  expect(notificationsApi.list).toHaveBeenCalledTimes(2);
});

it('marca todas as notificações não lidas como lidas', async () => {
  const updatedNotifications = notifications.map((notification) => ({ ...notification, read: true }));
  notificationsApi.list
    .mockResolvedValueOnce(pageOf(notifications))
    .mockResolvedValueOnce(pageOf(updatedNotifications));
  notificationsApi.read.mockResolvedValue({});
  renderWithProviders(<NotificationsPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Marcar todas como lidas' }));

  expect(notificationsApi.read).toHaveBeenCalledTimes(2);
  expect(notificationsApi.read).toHaveBeenCalledWith('n-1');
  expect(notificationsApi.read).toHaveBeenCalledWith('n-2');
  expect(await screen.findByText('0 não lida(s)')).toBeInTheDocument();
});

it('mostra erro se não conseguir marcar uma notificação como lida', async () => {
  notificationsApi.list.mockResolvedValue(pageOf(notifications));
  notificationsApi.read.mockRejectedValue(new Error('Falha ao marcar notificação como lida'));
  renderWithProviders(<NotificationsPage />);

  await userEvent.click((await screen.findAllByRole('button', { name: 'Marcar como lida' }))[0]);

  expect(await screen.findByText('Falha ao marcar notificação como lida')).toBeInTheDocument();
});

it('exclui uma notificação após confirmação e atualiza os dados', async () => {
  notificationsApi.list
    .mockResolvedValueOnce(pageOf(notifications))
    .mockResolvedValueOnce(pageOf(notifications.slice(0, 2)));
  notificationsApi.remove.mockResolvedValue('');
  renderWithProviders(<NotificationsPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Excluir notificação: Multa quitada' }));
  await userEvent.click(screen.getByRole('button', { name: 'Excluir', exact: true }));

  expect(notificationsApi.remove).toHaveBeenCalledWith('n-3');
  expect(await screen.findByText('2 não lida(s)')).toBeInTheDocument();
  expect(screen.queryByText('A multa foi quitada.')).not.toBeInTheDocument();
  expect(notificationsApi.list).toHaveBeenCalledTimes(2);
});

it('exclui todas as notificações lidas ao usar Limpar lidas', async () => {
  notificationsApi.list
    .mockResolvedValueOnce(pageOf(notifications))
    .mockResolvedValueOnce(pageOf(notifications.filter((notification) => !notification.read)));
  notificationsApi.remove.mockResolvedValue('');
  renderWithProviders(<NotificationsPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Limpar lidas' }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Limpar lidas' }));

  expect(notificationsApi.remove).toHaveBeenCalledTimes(1);
  expect(notificationsApi.remove).toHaveBeenCalledWith('n-3');
  expect(screen.queryByText('A multa foi quitada.')).not.toBeInTheDocument();
  expect(notificationsApi.list).toHaveBeenCalledTimes(2);
});

it('cancela a exclusão sem chamar a API', async () => {
  notificationsApi.list.mockResolvedValue(pageOf(notifications));
  renderWithProviders(<NotificationsPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Excluir notificação: Multa quitada' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

  expect(notificationsApi.remove).not.toHaveBeenCalled();
});

it('filtra as notificações ao clicar na aba Não lidas', async () => {
  notificationsApi.list.mockResolvedValue(pageOf(notifications));
  renderWithProviders(<NotificationsPage />);

  await userEvent.click(screen.getByRole('tab', { name: 'Não lidas' }));

  expect(await screen.findByText('A devolução de Iracema vence hoje.')).toBeInTheDocument();
  expect(screen.getByText('Uma multa foi gerada.')).toBeInTheDocument();
  expect(screen.queryByText('A multa foi quitada.')).not.toBeInTheDocument();
});

it('volta a mostrar todas as notificações ao selecionar Todas', async () => {
  notificationsApi.list.mockResolvedValue(pageOf(notifications));
  renderWithProviders(<NotificationsPage />);

  await userEvent.click(screen.getByRole('tab', { name: 'Não lidas' }));
  await userEvent.click(screen.getByRole('tab', { name: 'Todas' }));

  expect(await screen.findByText('A multa foi quitada.')).toBeInTheDocument();
});

it('mostra estado vazio quando a API não retorna notificações', async () => {
  notificationsApi.list.mockResolvedValue(pageOf([]));
  renderWithProviders(<NotificationsPage />);

  expect(await screen.findByText('Nenhuma notificação')).toBeInTheDocument();
});

it('mostra erro e permite tentar novamente quando a API falha', async () => {
  notificationsApi.list.mockRejectedValue(new Error('Falha ao carregar notificações'));
  renderWithProviders(<NotificationsPage />);

  expect(await screen.findByText('Falha ao carregar notificações')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
});
