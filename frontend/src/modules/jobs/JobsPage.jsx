import { useState } from 'react';
import { Box, Button, Card, Dialog, DialogContent, DialogTitle, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { jobsApi } from '../../api';
import { usePaged } from '../../hooks/useAsync';
import { AsyncContent, DataTable, EmptyState, KpiCard, KpiGrid, PageHeader, PageNav, StatusChip } from '../../components/ui';
import { compact, formatDateTime, formatMoney } from '../../utils/format';

const seconds = (job) => Math.round((new Date(job.finishedAt) - new Date(job.startedAt)) / 1000);

function summary(job) {
  const { summary: totals } = job.details;
  return `${job.details.rentalsScanned} locação(ões) verificada(s) · ${totals.overdueMarked} atraso(s) · ${totals.finesCreated} multa(s) · ${totals.notificationsSent} notificação(ões)`;
}

const RENTAL_COLUMNS = [
  { label: 'Ticket', render: (item) => item.ticketCode },
  { label: 'Evento', render: (item) => (item.event === 'due_today' ? 'Vence hoje' : 'Em atraso') },
  { label: 'Atraso', render: (item) => (item.daysLate ? `${item.daysLate} dia(s)` : '-') },
  { label: 'Multa', render: (item) => (item.fineAmount ? formatMoney(item.fineAmount) : '-') },
  { label: 'Notificação', render: (item) => (item.notificationSent ? 'Enviada' : 'Já enviada hoje') },
];

function JobDialog({ job, onClose }) {
  return (
    <Dialog open={!!job} onClose={onClose} maxWidth="md" fullWidth>
      {job && (
        <>
          <DialogTitle>Execução de {formatDateTime(job.startedAt)} <StatusChip kind="job" value={job.status} /></DialogTitle>
          <DialogContent>
            <KpiGrid>
              <KpiCard label="Locações verificadas" value={job.details.rentalsScanned ?? 0} />
              <KpiCard label="Atrasos marcados" value={job.details.summary?.overdueMarked ?? 0} />
              <KpiCard label="Multas criadas" value={job.details.summary?.finesCreated ?? 0} />
              <KpiCard label="Notificações" value={job.details.summary?.notificationsSent ?? 0} />
            </KpiGrid>
            {job.details.rentals?.length ? <DataTable label="Locações tratadas" columns={RENTAL_COLUMNS} rows={job.details.rentals} rowKey={(item) => item.rentalId} /> : <EmptyState title="Nenhuma locação tratada" />}
            {job.error && (
              <Box component="pre" sx={{ mt: 2, p: 2, bgcolor: 'grey.900', color: 'error.light', borderRadius: 1, overflow: 'auto', fontSize: 12 }}>
                {job.traceback ?? job.error}
              </Box>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

export default function JobsPage() {
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const paged = usePaged((params) => jobsApi.list({ ...params, ...compact({ status }) }), [status]);

  const columns = [
    { label: 'Início', render: (job) => formatDateTime(job.startedAt) },
    { label: 'Duração', render: (job) => `${seconds(job)}s` },
    { label: 'Status', render: (job) => <StatusChip kind="job" value={job.status} /> },
    { label: 'Resumo', render: (job) => (job.error ? <Typography variant="body2" color="error">{job.error}</Typography> : summary(job)) },
    { label: 'Ações', align: 'right', render: (job) => <Button size="small" onClick={() => setSelected(job)}>Detalhes</Button> },
  ];

  return (
    <>
      <PageHeader title="Logs do job diário" subtitle="Execuções do processamento de vencimentos, multas e avisos (todos os dias às 03:00)" />
      <Card>
        <Box sx={{ p: 2 }}>
          <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, value) => value !== null && setStatus(value)}>
            <ToggleButton value="">Todas</ToggleButton>
            <ToggleButton value="success">Sucesso</ToggleButton>
            <ToggleButton value="failed">Falha</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <AsyncContent state={paged} isEmpty={!paged.items.length} empty={<EmptyState title="Nenhuma execução encontrada" />}>
          <DataTable label="Execuções do job diário" columns={columns} rows={paged.items} />
          <PageNav paged={paged} />
        </AsyncContent>
      </Card>
      <JobDialog job={selected} onClose={() => setSelected(null)} />
    </>
  );
}
