import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItemButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { ALL, rentalsApi } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, EmptyState, PageHeader, StatusChip } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { OPEN_RENTAL_STATUSES } from '../../utils/labels';

const TICKET_PATTERN = /^RET-\d{8}-[A-F\d]{8}$/;

async function loadCirculation() {
  const [rentals, circulation] = await Promise.all([
    rentalsApi.list(ALL),
    rentalsApi.circulation({ days: 7 }),
  ]);
  return {
    openTickets: rentals.results.filter((rental) => OPEN_RENTAL_STATUSES.includes(rental.status)),
    recent: circulation.recent ?? [],
  };
}

function operationLabel(operation) {
  const action = `${operation.type ?? operation.event ?? operation.action ?? ''}`.toLowerCase();
  return action.includes('return') || action.includes('devol') ? 'Devolução' : 'Retirada';
}

export default function CirculationPage() {
  const { run, confirm } = useFeedback();
  const [ticket, setTicket] = useState('');
  const ticketCode = ticket.trim().toUpperCase();
  const ticketIsComplete = TICKET_PATTERN.test(ticketCode);
  const state = useAsync(loadCirculation);
  const previewState = useAsync(
    () => (ticketIsComplete ? rentalsApi.list({ ticketCode }) : Promise.resolve({ results: [] })),
    [ticketCode, ticketIsComplete],
  );
  const data = state.data;
  const rental = previewState.data?.results?.find((item) => item.ticketCode.toUpperCase() === ticketCode);

  const performOperation = async (type) => {
    const isPickup = type === 'pickup';
    const confirmed = await confirm({
      title: isPickup ? 'Confirmar retirada' : 'Confirmar devolução',
      message: `Registrar a ${isPickup ? 'retirada' : 'devolução'} de "${rental.bookTitle}"?`,
      confirmLabel: isPickup ? 'Confirmar retirada' : 'Confirmar devolução',
    });
    if (!confirmed) return;

    const action = () => (isPickup ? rentalsApi.pickup(ticketCode) : rentalsApi.giveBack(ticketCode));
    if (await run(action, isPickup ? 'Retirada registrada' : 'Devolução registrada')) {
      setTicket('');
      state.reload();
      previewState.reload();
    }
  };

  return (
    <>
      <PageHeader title="Retirada e devolução" subtitle="Registre a retirada de uma reserva ou a devolução de uma locação pelo código do ticket" />
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Card sx={{ flex: 1.7, width: '100%' }}>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Código do ticket"
                placeholder="RET-AAAAMMDD-XXXXXXXX"
                value={ticket}
                onChange={(event) => setTicket(event.target.value.toUpperCase().slice(0, 21))}
                slotProps={{ htmlInput: { maxLength: 21, 'aria-label': 'Código do ticket' } }}
                fullWidth
              />
              {!ticketIsComplete ? (
                <Alert severity="info" icon={<InfoOutlined />}>
                  Digite o código completo do ticket para localizar a locação.
                </Alert>
              ) : (
                <AsyncContent
                  state={previewState}
                  isEmpty={!rental}
                  empty={<Alert severity="warning">Nenhuma locação encontrada para este ticket.</Alert>}
                >
                  {rental && (
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{rental.bookTitle}</Typography>
                          <Typography variant="body2" color="text.secondary">{rental.userName}</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'IBM Plex Mono, monospace' }}>{rental.ticketCode}</Typography>
                        </Box>
                        <StatusChip kind="rental" value={rental.status} />
                      </Stack>
                      {rental.dueDate && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Prazo: {formatDateTime(rental.dueDate)}</Typography>}
                    </Box>
                  )}
                </AsyncContent>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  disabled={!rental || rental.status !== 'reserved'}
                  onClick={() => performOperation('pickup')}
                >
                  Confirmar retirada
                </Button>
                <Button
                  variant="outlined"
                  disabled={!rental || !['active', 'overdue'].includes(rental.status)}
                  onClick={() => performOperation('return')}
                >
                  Confirmar devolução
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Tickets em aberto</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Reservas aguardando retirada e locações para devolução. Clique para preencher.</Typography>
              <AsyncContent
                state={state}
                isEmpty={!data?.openTickets.length}
                empty={<EmptyState title="Nenhum ticket em aberto" />}
              >
                <List disablePadding>
                  {data?.openTickets.map((item) => (
                    <ListItemButton
                      key={item.id}
                      onClick={() => setTicket(item.ticketCode)}
                      sx={{ px: 0, gap: 1, justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'IBM Plex Mono, monospace', overflowWrap: 'anywhere' }}>{item.ticketCode}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.bookTitle} · {item.userName}</Typography>
                      </Box>
                      <StatusChip kind="rental" value={item.status} />
                    </ListItemButton>
                  ))}
                </List>
              </AsyncContent>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Últimas operações</Typography>
              {data?.recent.length ? (
                <Stack spacing={1.25} divider={<Divider flexItem />}>
                  {data.recent.map((operation, index) => (
                    <Box key={operation.id ?? `${operation.ticketCode}-${index}`}>
                      <Typography variant="body2">{operationLabel(operation)} · {operation.bookTitle}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {operation.userName} · {formatDateTime(operation.at ?? operation.createdAt ?? operation.occurredAt)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : <EmptyState title="Nenhuma operação recente" />}
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </>
  );
}
