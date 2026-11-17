import { Alert, Card, CardHeader, Stack, Typography } from '@mui/material';
import { ALL, booksApi, finesApi, notificationsApi, rentalsApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { AsyncContent, DataTable, EmptyState, KpiCard, KpiGrid, PageHeader, StatusChip } from '../../components/ui';
import { dueLabel, formatDate, formatDateTime, formatMoney } from '../../utils/format';
import { NOTIFICATION_TYPES, OPEN_RENTAL_STATUSES } from '../../utils/labels';

async function loadSummary() {
  const [rentals, fines, notifications, books] = await Promise.all([
    rentalsApi.mine(ALL),
    finesApi.mine(ALL),
    notificationsApi.list(ALL),
    booksApi.list({ pageSize: 1 }),
  ]);
  const open = rentals.results.filter((rental) => OPEN_RENTAL_STATUSES.includes(rental.status));
  const pendingFines = fines.results.filter((fine) => fine.status === 'pending');
  return {
    books: books.count,
    open: open.sort((a, b) => (a.status === 'reserved') - (b.status === 'reserved') || a.dueDate.localeCompare(b.dueDate)),
    overdue: open.filter((rental) => rental.status === 'overdue').length,
    finesTotal: pendingFines.reduce((sum, fine) => sum + Number(fine.amount), 0),
    finesCount: pendingFines.length,
    notifications: notifications.results,
  };
}

const COLUMNS = [
  { label: 'Livro', render: (rental) => <><Typography variant="body2" sx={{ fontWeight: 600 }}>{rental.bookTitle}</Typography><Typography variant="caption" color="text.secondary">{rental.bookAuthor}</Typography></> },
  { label: 'Situação', render: (rental) => <StatusChip kind="rental" value={rental.status} /> },
  { label: 'Prazo', render: (rental) => (rental.status === 'reserved' ? 'Aguardando retirada no balcão' : `${formatDate(rental.dueDate)} (${dueLabel(rental.dueDate)})`) },
];

export default function ReaderDashboard() {
  const { user } = useAuth();
  const state = useAsync(loadSummary);
  const data = state.data;

  return (
    <>
      <PageHeader title={`Olá, ${user.name.split(' ')[0]}`} subtitle="Resumo da sua biblioteca" />
      <AsyncContent state={state}>
        {data && (
          <>
            {(data.overdue > 0 || data.finesCount > 0) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Você tem {data.overdue} livro(s) atrasado(s) e {formatMoney(data.finesTotal)} em multas pendentes.
              </Alert>
            )}
            <KpiGrid>
              <KpiCard label="Livros no acervo" value={data.books} to="/acervo" />
              <KpiCard label="Locações em aberto" value={data.open.length} hint={`${data.overdue} atrasada(s)`} to="/locacoes" />
              <KpiCard label="Multas pendentes" value={formatMoney(data.finesTotal)} hint={`${data.finesCount} multa(s)`} color={data.finesCount ? 'error.main' : undefined} to="/multas" />
              <KpiCard label="Notificações não lidas" value={data.notifications.filter((item) => !item.read).length} to="/notificacoes" />
            </KpiGrid>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
              <Card sx={{ flex: 2, width: '100%' }}>
                <CardHeader title="Próximos prazos" titleTypographyProps={{ variant: 'subtitle1' }} />
                {data.open.length ? <DataTable label="Próximos prazos" columns={COLUMNS} rows={data.open} /> : <EmptyState title="Nenhuma locação em andamento" text="Explore o catálogo para reservar seu próximo livro." />}
              </Card>
              <Card sx={{ flex: 1, width: '100%' }}>
                <CardHeader title="Notificações recentes" titleTypographyProps={{ variant: 'subtitle1' }} />
                {data.notifications.length ? (
                  <Stack spacing={2} sx={{ px: 2, pb: 2 }}>
                    {data.notifications.slice(0, 3).map((item) => (
                      <div key={item.id}>
                        <Typography variant="subtitle2">{NOTIFICATION_TYPES[item.type]}</Typography>
                        <Typography variant="body2" color="text.secondary">{item.message}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDateTime(item.createdAt)}</Typography>
                      </div>
                    ))}
                  </Stack>
                ) : <EmptyState title="Nenhuma notificação" />}
              </Card>
            </Stack>
          </>
        )}
      </AsyncContent>
    </>
  );
}
