import { useState } from 'react';
import { Box, Button, Card, Chip, Divider, Stack, Tab, Tabs, Typography } from '@mui/material';
import { ALL, notificationsApi } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, EmptyState, PageHeader } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { NOTIFICATION_TYPES } from '../../utils/labels';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const { run, confirm } = useFeedback();
  const state = useAsync(() => notificationsApi.list(ALL));
  const notifications = state.data?.results ?? [];
  const unread = notifications.filter((notification) => !notification.read);
  const read = notifications.filter((notification) => notification.read);
  const unreadCount = unread.length;
  const visibleNotifications = filter === 'unread'
    ? unread
    : notifications;

  const markRead = async (notification) => {
    if (await run(() => notificationsApi.read(notification.id), 'Notificação marcada como lida')) {
      state.reload();
    }
  };

  const markAllRead = async () => {
    const result = await run(async () => {
      const results = await Promise.allSettled(unread.map((notification) => notificationsApi.read(notification.id)));
      const failure = results.find((item) => item.status === 'rejected');
      if (failure) {
        state.reload();
        throw failure.reason;
      }
      return true;
    }, 'Todas as notificações foram marcadas como lidas');
    if (result) state.reload();
  };

  const removeNotification = async (notification) => {
    const type = NOTIFICATION_TYPES[notification.type] ?? notification.type;
    const ok = await confirm({
      title: 'Excluir notificação',
      message: `Deseja excluir a notificação "${type}"?`,
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;

    const result = await run(async () => {
      await notificationsApi.remove(notification.id);
      return true;
    }, 'Notificação excluída');
    if (result) state.reload();
  };

  const clearRead = async () => {
    const ok = await confirm({
      title: 'Limpar notificações lidas',
      message: `Deseja excluir ${read.length} notificação(ões) lida(s)?`,
      confirmLabel: 'Limpar lidas',
      danger: true,
    });
    if (!ok) return;

    const result = await run(async () => {
      const results = await Promise.allSettled(read.map((notification) => notificationsApi.remove(notification.id)));
      const failure = results.find((item) => item.status === 'rejected');
      if (failure) {
        state.reload();
        throw failure.reason;
      }
      return true;
    }, 'Notificações lidas excluídas');
    if (result) state.reload();
  };

  return (
    <>
      <PageHeader
        title="Notificações"
        subtitle={`${unreadCount} não lida(s)`}
        actions={(
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button disabled={!unreadCount} variant="outlined" onClick={markAllRead}>
              Marcar todas como lidas
            </Button>
            <Button disabled={!read.length} onClick={clearRead}>Limpar lidas</Button>
          </Stack>
        )}
      />
      <Card>
        <Tabs value={filter} onChange={(_, value) => setFilter(value)} aria-label="Filtro de notificações">
          <Tab value="all" label="Todas" />
          <Tab value="unread" label="Não lidas" />
        </Tabs>
        <Divider />
        <AsyncContent
          state={state}
          isEmpty={!visibleNotifications.length}
          empty={(
            <EmptyState
              title={filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              text="Avisos de vencimento e de multas aparecem aqui."
            />
          )}
        >
          <Stack divider={<Divider flexItem />}>
            {visibleNotifications.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  bgcolor: notification.read ? 'background.paper' : 'action.hover',
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}
                >
                  <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2">
                        {NOTIFICATION_TYPES[notification.type] ?? notification.type}
                      </Typography>
                      {!notification.read && <Chip size="small" color="primary" label="Não lida" />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.5} sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexShrink: 0 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: { sm: 'nowrap' } }}
                    >
                      {formatDateTime(notification.createdAt)}
                    </Typography>
                    {!notification.read && (
                      <Button size="small" onClick={() => markRead(notification)}>
                        Marcar como lida
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      aria-label={`Excluir notificação: ${NOTIFICATION_TYPES[notification.type] ?? notification.type}`}
                      onClick={() => removeNotification(notification)}
                    >
                      Excluir
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </AsyncContent>
      </Card>
    </>
  );
}
