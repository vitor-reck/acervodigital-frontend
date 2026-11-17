import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ALL, rentalsApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useAsync, usePaged } from '../../hooks/useAsync';
import { useDebounced } from '../../hooks/useForm';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, DataTable, EmptyState, PageHeader, PageNav, StatusChip } from '../../components/ui';
import { compact, dueLabel, formatDate } from '../../utils/format';

const STATUS_FILTERS = [
  ['', 'Todas'],
  ['reserved', 'Reservada'],
  ['active', 'Ativa'],
  ['overdue', 'Atrasada'],
  ['returned', 'Devolvida'],
  ['cancelled', 'Cancelada'],
];

function rentalDates(rental) {
  const title = rental.status === 'reserved' || rental.status === 'cancelled'
    ? `Reservada em ${formatDate(rental.rentalDate)}`
    : `Retirada em ${formatDate(rental.rentalDate)}`;

  if (rental.status === 'reserved') return `${title} · aguardando retirada`;
  if (rental.status === 'cancelled') return `${title} · cancelada em ${formatDate(rental.returnDate)}`;
  if (rental.status === 'returned') return `${title} · devolvida em ${formatDate(rental.returnDate)}`;
  return `${title} · devolver até ${formatDate(rental.dueDate)} (${dueLabel(rental.dueDate)})`;
}

export default function RentalsPage() {
  const { isLibrarian } = useAuth();
  const { run, confirm } = useFeedback();
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query);
  const mine = useAsync(() => (isLibrarian ? Promise.resolve(null) : rentalsApi.mine(ALL)), [isLibrarian]);
  const paged = usePaged(
    (params) => (isLibrarian
      ? rentalsApi.list({ ...params, ...compact({ status, ticketCode: debouncedQuery.trim() }) })
      : Promise.resolve({ count: 0, results: [] })),
    [isLibrarian, status, debouncedQuery],
  );

  const rows = isLibrarian
    ? paged.items
    : (mine.data?.results ?? []).filter((rental) => {
      const matchesStatus = !status || rental.status === status;
      const search = query.trim().toLocaleLowerCase('pt-BR');
      const matchesQuery = !search || `${rental.bookTitle} ${rental.ticketCode}`.toLocaleLowerCase('pt-BR').includes(search);
      return matchesStatus && matchesQuery;
    });
  const state = isLibrarian ? paged : mine;

  const cancel = async (rental) => {
    const ok = await confirm({
      title: 'Cancelar reserva',
      message: `Deseja cancelar a reserva de "${rental.bookTitle}"? O exemplar voltará ao estoque.`,
      confirmLabel: 'Cancelar reserva',
      danger: true,
    });
    if (!ok) return;

    const action = () => (isLibrarian ? rentalsApi.cancel(rental.id) : rentalsApi.cancelMine(rental.id));
    if (await run(action, 'Reserva cancelada')) state.reload();
  };

  const columns = [
    {
      label: 'Livro',
      render: (rental) => (
        <Typography
          component={RouterLink}
          to={`/acervo/${rental.bookId}`}
          variant="body2"
          sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
        >
          {rental.bookTitle ?? rental.title}
        </Typography>
      ),
    },
    ...(isLibrarian ? [{
      label: 'Leitor',
      render: (rental) => (
        <Typography component={RouterLink} to={`/leitores/${rental.userId}`} variant="body2" sx={{ color: 'primary.main' }}>
          {rental.userName}
        </Typography>
      ),
    }] : []),
    {
      label: 'Ticket',
      render: (rental) => <Typography variant="body2" sx={{ fontFamily: 'IBM Plex Mono, monospace', overflowWrap: 'anywhere' }}>{rental.ticketCode}</Typography>,
    },
    { label: 'Status', render: (rental) => <StatusChip kind="rental" value={rental.status} /> },
    { label: 'Datas', render: (rental) => <Typography variant="body2">{rentalDates(rental)}</Typography> },
    {
      label: 'Ações',
      align: 'right',
      render: (rental) => rental.status === 'reserved' && (
        <Button color="error" size="small" onClick={() => cancel(rental)}>Cancelar reserva</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={isLibrarian ? 'Locações' : 'Minhas locações'}
        subtitle={isLibrarian ? 'Reservas e locações de todos os leitores' : 'Acompanhe suas reservas, empréstimos e devoluções'}
        actions={isLibrarian && <Button variant="contained" component={RouterLink} to="/circulacao">Retirada e devolução</Button>}
      />
      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={status}
            onChange={(_, value) => value !== null && setStatus(value)}
            aria-label="Filtrar locações por status"
            sx={{ overflowX: 'auto', maxWidth: '100%' }}
          >
            {STATUS_FILTERS.map(([value, label]) => <ToggleButton key={value || 'all'} value={value}>{label}</ToggleButton>)}
          </ToggleButtonGroup>
          <TextField
            type="search"
            label={isLibrarian ? 'Código do ticket' : 'Livro ou ticket'}
            placeholder={isLibrarian ? 'Código do ticket' : 'Livro ou ticket'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            sx={{ width: { xs: '100%', sm: 264 } }}
          />
        </Box>
        <AsyncContent
          state={state}
          isEmpty={!rows.length}
          empty={<EmptyState title="Nenhuma locação encontrada" text="Suas reservas e empréstimos aparecerão aqui." />}
        >
          <DataTable label={isLibrarian ? 'Locações de todos os leitores' : 'Minhas locações'} columns={columns} rows={rows} />
          {isLibrarian && <PageNav paged={paged} />}
        </AsyncContent>
      </Card>
    </>
  );
}
