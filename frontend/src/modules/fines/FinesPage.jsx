import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Card, Link, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ALL, finesApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useAsync, usePaged } from '../../hooks/useAsync';
import { AsyncContent, DataTable, EmptyState, KpiCard, KpiGrid, PageHeader, PageNav, StatusChip } from '../../components/ui';
import { FINE_PER_DAY, compact, formatDate, formatMoney } from '../../utils/format';
import SettleFineButton from './SettleFineButton';

const COLUMNS = [
  { label: 'Livro', render: (fine) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{fine.bookTitle}</Typography> },
  { label: 'Venceu em', render: (fine) => formatDate(fine.dueDate) },
  { label: 'Gerada em', render: (fine) => formatDate(fine.createdAt) },
  { label: 'Valor', align: 'right', render: (fine) => formatMoney(fine.amount) },
  { label: 'Situação', render: (fine) => <StatusChip kind="fine" value={fine.status} /> },
  { label: 'Quitada em', render: (fine) => formatDate(fine.settledAt) },
];

const sumAmounts = (fines) => fines.reduce((sum, fine) => sum + Number(fine.amount), 0);

function FineKpis({ pending, settledCount }) {
  return (
    <KpiGrid>
      <KpiCard label="Total pendente" value={formatMoney(sumAmounts(pending))} hint={`${pending.length} multa(s)`} color={pending.length ? 'error.main' : undefined} />
      <KpiCard label="Multas quitadas" value={settledCount} />
    </KpiGrid>
  );
}

function StatusFilter({ value, onChange }) {
  return (
    <Box sx={{ p: 2 }}>
      <ToggleButtonGroup size="small" exclusive value={value} onChange={(_, next) => next !== null && onChange(next)}>
        <ToggleButton value="pending">Pendentes</ToggleButton>
        <ToggleButton value="settled">Quitadas</ToggleButton>
        <ToggleButton value="">Todas</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

function ReaderFines() {
  const [status, setStatus] = useState('');
  const state = useAsync(() => finesApi.mine(ALL));
  const fines = state.data?.results ?? [];
  const pending = fines.filter((fine) => fine.status === 'pending');
  const visible = status ? fines.filter((fine) => fine.status === status) : fines;

  return (
    <>
      <PageHeader title="Minhas multas" subtitle={`Multa de ${formatMoney(FINE_PER_DAY)} por dia de atraso na devolução`} />
      <AsyncContent state={state} isEmpty={!fines.length} empty={<Card><EmptyState title="Você não tem multas" text="Devolva seus livros até o prazo para evitar cobranças." /></Card>}>
        {pending.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            A quitação é registrada pelo bibliotecário no balcão. Procure a biblioteca para regularizar suas multas pendentes.
          </Alert>
        )}
        <FineKpis pending={pending} settledCount={fines.length - pending.length} />
        <Card>
          <StatusFilter value={status} onChange={setStatus} />
          {visible.length
            ? <DataTable label="Minhas multas" columns={COLUMNS} rows={visible} />
            : <EmptyState title="Nenhuma multa encontrada" text="Não há multas para o filtro selecionado." />}
        </Card>
      </AsyncContent>
    </>
  );
}

async function loadTotals() {
  const [pending, settled] = await Promise.all([finesApi.list({ ...ALL, status: 'pending' }), finesApi.list({ status: 'settled', pageSize: 1 })]);
  return { pending: pending.results, settledCount: settled.count };
}

function LibrarianFines() {
  const [status, setStatus] = useState('pending');
  const paged = usePaged((params) => finesApi.list({ ...params, ...compact({ status }) }), [status]);
  const totals = useAsync(loadTotals);
  const reload = () => {
    paged.reload();
    totals.reload();
  };

  const columns = [
    { label: 'Leitor', render: (fine) => <Link component={RouterLink} to={`/leitores/${fine.userId}`} underline="hover">{fine.userName}</Link> },
    ...COLUMNS,
    { label: 'Ações', align: 'right', render: (fine) => <SettleFineButton fine={fine} onSettled={reload} /> },
  ];

  return (
    <>
      <PageHeader title="Multas" subtitle="Multas geradas pelo job diário. A quitação é registrada aqui, após o recebimento no balcão." />
      {totals.data && <FineKpis pending={totals.data.pending} settledCount={totals.data.settledCount} />}
      <Card>
        <StatusFilter value={status} onChange={setStatus} />
        <AsyncContent state={paged} isEmpty={!paged.items.length} empty={<EmptyState title="Nenhuma multa encontrada" text="Não há multas para o filtro selecionado." />}>
          <DataTable label="Multas dos leitores" columns={columns} rows={paged.items} />
          <PageNav paged={paged} />
        </AsyncContent>
      </Card>
    </>
  );
}

export default function FinesPage() {
  const { user } = useAuth();
  return user.role === 'librarian' ? <LibrarianFines /> : <ReaderFines />;
}
