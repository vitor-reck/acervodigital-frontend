import { Link as RouterLink, useParams } from 'react-router-dom';
import { Alert, Box, Button, Card, Typography } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { ALL, finesApi, rentalsApi, usersApi } from '../../api';
import { useAsync, usePaged } from '../../hooks/useAsync';
import { AsyncContent, DataTable, EmptyState, KpiCard, KpiGrid, PageHeader, PageNav, StatusChip } from '../../components/ui';
import { formatDate, formatMoney } from '../../utils/format';
import SettleFineButton from '../fines/SettleFineButton';

const RENTAL_COLUMNS = [
  { label: 'Livro', render: (rental) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{rental.bookTitle}</Typography> },
  { label: 'Ticket', render: (rental) => rental.ticketCode },
  { label: 'Retirada', render: (rental) => formatDate(rental.rentalDate) },
  { label: 'Vencimento', render: (rental) => formatDate(rental.dueDate) },
  { label: 'Devolução', render: (rental) => formatDate(rental.returnDate) },
  { label: 'Situação', render: (rental) => <StatusChip kind="rental" value={rental.status} /> },
];

function PendingFines({ state }) {
  const fines = state.data?.results ?? [];
  const columns = [
    { label: 'Livro', render: (fine) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{fine.bookTitle}</Typography> },
    { label: 'Venceu em', render: (fine) => formatDate(fine.dueDate) },
    { label: 'Gerada em', render: (fine) => formatDate(fine.createdAt) },
    { label: 'Valor', align: 'right', render: (fine) => formatMoney(fine.amount) },
    { label: 'Ações', align: 'right', render: (fine) => <SettleFineButton fine={fine} onSettled={state.reload} /> },
  ];

  return (
    <Card sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="h2">Multas pendentes</Typography>
      </Box>
      <AsyncContent state={state} isEmpty={!fines.length} empty={<EmptyState title="Nenhuma multa pendente" />}>
        <DataTable label="Multas pendentes do leitor" columns={columns} rows={fines} />
      </AsyncContent>
    </Card>
  );
}

export default function ReaderDetailPage() {
  const { id } = useParams();
  const reader = useAsync(() => usersApi.get(id), [id]);
  const finesState = useAsync(() => finesApi.ofUser(id, ALL), [id]);
  const rentals = usePaged((params) => rentalsApi.ofUser(id, params), [id]);

  const fines = finesState.data?.results ?? [];
  const pendingTotal = fines.reduce((sum, fine) => sum + Number(fine.amount), 0);

  return (
    <>
      <Button component={RouterLink} to="/leitores" startIcon={<ArrowBackOutlined />} sx={{ mb: 1 }}>Voltar para leitores</Button>
      <AsyncContent state={reader} isEmpty={false}>
        <PageHeader title={reader.data?.name} subtitle={reader.data?.email} />
        {fines.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>Este leitor tem multas pendentes. Registre a quitação após o recebimento no balcão.</Alert>
        )}
        <KpiGrid>
          <KpiCard label="Total pendente" value={formatMoney(pendingTotal)} hint={`${fines.length} multa(s)`} color={fines.length ? 'error.main' : undefined} />
          <KpiCard label="Locações no histórico" value={rentals.data?.count ?? '-'} />
        </KpiGrid>
        <PendingFines state={finesState} />
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" component="h2">Histórico de locações</Typography>
          </Box>
          <AsyncContent state={rentals} isEmpty={!rentals.items.length} empty={<EmptyState title="Nenhuma locação registrada" text="Este leitor ainda não reservou nem retirou livros." />}>
            <DataTable label="Histórico de locações do leitor" columns={RENTAL_COLUMNS} rows={rentals.items} />
            <PageNav paged={rentals} />
          </AsyncContent>
        </Card>
      </AsyncContent>
    </>
  );
}
