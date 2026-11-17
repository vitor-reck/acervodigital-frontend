import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardHeader, Link, Stack, Typography } from '@mui/material';
import { ALL, booksApi, finesApi, jobsApi, rentalsApi } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { AsyncContent, DataTable, EmptyState, KpiCard, KpiGrid, PageHeader } from '../../components/ui';
import { STATUS } from '../../utils/labels';
import { FINE_PER_DAY, daysFromToday, formatDate, formatDateTime, formatMoney } from '../../utils/format';

async function loadSummary() {
  const [books, active, overdue, reserved, fines, jobs, circulation] = await Promise.all([
    booksApi.list({ pageSize: 1 }),
    rentalsApi.list({ status: 'active', pageSize: 1 }),
    rentalsApi.list({ status: 'overdue', ...ALL }),
    rentalsApi.list({ status: 'reserved', ...ALL }),
    finesApi.list({ status: 'pending', ...ALL }),
    jobsApi.list({ pageSize: 1 }),
    rentalsApi.circulation(),
  ]);
  return {
    books: books.count,
    open: active.count + overdue.count,
    overdue: overdue.results,
    reserved: reserved.results,
    finesTotal: fines.results.reduce((sum, fine) => sum + Number(fine.amount), 0),
    finesCount: fines.count,
    lastJob: jobs.results[0],
    circulation,
  };
}

const OVERDUE_COLUMNS = [
  { label: 'Livro', render: (rental) => <><Typography variant="body2" sx={{ fontWeight: 600 }}>{rental.bookTitle}</Typography><Typography variant="caption" sx={{ fontFamily: 'IBM Plex Mono, monospace' }}>{rental.ticketCode}</Typography></> },
  { label: 'Leitor', render: (rental) => <Link component={RouterLink} to={`/leitores/${rental.userId}`}>{rental.userName}</Link> },
  { label: 'Atraso', render: (rental) => `${-daysFromToday(rental.dueDate)} dia(s)` },
  { label: 'Multa', align: 'right', render: (rental) => formatMoney(-daysFromToday(rental.dueDate) * FINE_PER_DAY) },
];

function CirculationChart({ days }) {
  const max = Math.max(1, ...days.map((day) => day.pickups + day.returns));
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end', height: 140, px: 2, pb: 2 }} role="img" aria-label="Retiradas e devoluções por dia">
      {days.map((day) => {
        const total = day.pickups + day.returns;
        return (
          <Stack key={day.date} spacing={0.5} sx={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <Typography variant="caption">{total}</Typography>
            <Box sx={{ width: '100%', maxWidth: 32, height: `${(total / max) * 80}%`, minHeight: 2, bgcolor: 'primary.main', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">{day.date.slice(8, 10)}/{day.date.slice(5, 7)}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

function ListCard({ title, items, empty, render }) {
  return (
    <Card>
      <CardHeader title={title} titleTypographyProps={{ variant: 'subtitle1' }} />
      {items.length ? <Stack spacing={1.5} sx={{ px: 2, pb: 2 }}>{items.map(render)}</Stack> : <EmptyState title={empty} />}
    </Card>
  );
}

export default function LibrarianDashboard() {
  const state = useAsync(loadSummary);
  const data = state.data;

  return (
    <>
      <PageHeader
        title="Painel do bibliotecário"
        subtitle="Visão geral da operação"
        actions={<>
          <Button variant="contained" component={RouterLink} to="/acervo/novo">Cadastrar livro</Button>
          <Button variant="outlined" component={RouterLink} to="/circulacao">Retirada e devolução</Button>
        </>}
      />
      <AsyncContent state={state}>
        {data && (
          <>
            <KpiGrid>
              <KpiCard label="Livros no acervo" value={data.books} to="/acervo" />
              <KpiCard label="Locações em aberto" value={data.open} hint={`${data.overdue.length} atrasada(s)`} to="/locacoes" />
              <KpiCard label="Reservas aguardando" value={data.reserved.length} to="/circulacao" />
              <KpiCard label="Multas pendentes" value={formatMoney(data.finesTotal)} hint={`${data.finesCount} multa(s)`} color={data.finesCount ? 'error.main' : undefined} to="/multas" />
              <KpiCard label="Processamento diário" value={data.lastJob ? STATUS.job[data.lastJob.status][0] : '-'} color={data.lastJob?.status === 'failed' ? 'error.main' : 'success.main'} hint={data.lastJob ? formatDateTime(data.lastJob.startedAt) : 'Nenhuma execução'} to="/jobs" />
            </KpiGrid>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, alignItems: 'start' }}>
              <Stack spacing={2}>
                <Card>
                  <CardHeader title="Atrasos para acompanhar" titleTypographyProps={{ variant: 'subtitle1' }} />
                  {data.overdue.length ? <DataTable label="Atrasos" columns={OVERDUE_COLUMNS} rows={data.overdue} /> : <EmptyState title="Sem atrasos" />}
                </Card>
                <Card>
                  <CardHeader title="Circulação nos últimos 7 dias" subheader="Retiradas e devoluções" titleTypographyProps={{ variant: 'subtitle1' }} />
                  <CirculationChart days={data.circulation.days} />
                </Card>
              </Stack>
              <Stack spacing={2}>
                <ListCard title="Reservas aguardando retirada" items={data.reserved} empty="Nenhuma reserva pendente" render={(rental) => (
                  <div key={rental.id}>
                    <Typography variant="subtitle2">{rental.bookTitle}</Typography>
                    <Typography variant="caption" color="text.secondary">{rental.userName} · {rental.ticketCode} · {formatDate(rental.createdAt)}</Typography>
                  </div>
                )} />
                <ListCard title="Últimas operações" items={data.circulation.recent.slice(0, 5)} empty="Nenhuma operação recente" render={(event) => (
                  <div key={`${event.type}-${event.rentalId}`}>
                    <Typography variant="subtitle2">{event.type === 'pickup' ? 'Retirada' : 'Devolução'} · {event.bookTitle}</Typography>
                    <Typography variant="caption" color="text.secondary">{event.userName} · {formatDateTime(event.at)}</Typography>
                  </div>
                )} />
              </Stack>
            </Box>
          </>
        )}
      </AsyncContent>
    </>
  );
}
