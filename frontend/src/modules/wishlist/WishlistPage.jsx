import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ALL, wishlistApi } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { useFeedback } from '../../components/Feedback';
import WishlistDialog from '../../components/WishlistDialog';
import { AsyncContent, BookCover, EmptyState, PageHeader } from '../../components/ui';

const PRIORITIES = {
  high: { label: 'Alta', color: 'error' },
  medium: { label: 'Média', color: 'warning' },
  low: { label: 'Baixa', color: 'default' },
};

export default function WishlistPage() {
  const { run } = useFeedback();
  const state = useAsync(() => wishlistApi.list(ALL));
  const [editingItem, setEditingItem] = useState(null);
  const items = state.data?.results ?? [];

  const saveItem = async (form) => {
    const update = async () => {
      await wishlistApi.update(editingItem.bookId, form);
      return true;
    };
    if (await run(update, 'Lista de desejos atualizada')) {
      setEditingItem(null);
      state.reload();
    }
  };

  const removeItem = async (item) => {
    const remove = async () => {
      await wishlistApi.remove(item.bookId);
      return true;
    };
    if (await run(remove, 'Removido da lista de desejos')) {
      state.reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Lista de desejos"
        subtitle={`${state.data?.count ?? 0} livro(s)`}
        actions={<Button component={RouterLink} to="/acervo">Adicionar pelo catálogo</Button>}
      />

      <AsyncContent
        state={state}
        isEmpty={!items.length}
        empty={
          <Card>
            <EmptyState
              title="Lista de desejos vazia"
              text="Explore o catálogo para adicionar livros à sua lista de desejos."
            />
          </Card>
        }
      >
        <Box>
          <TableContainer
            component={Card}
            sx={{ display: { xs: 'none', md: 'block' } }}
          >
            <Table aria-label="Lista de desejos">
              <TableHead>
                <TableRow>
                  <TableCell>Livro</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Observação</TableCell>
                  <TableCell>Disponibilidade</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.bookId} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <BookCover book={item} width={36} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.author}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={PRIORITIES[item.priority].color}
                        label={PRIORITIES[item.priority].label}
                      />
                    </TableCell>
                    <TableCell>{item.note || '—'}</TableCell>
                    <TableCell>
                      {item.stock > 0 ? `${item.stock} disponível(is)` : 'Indisponível'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        <Button aria-label={`Editar ${item.title}`} onClick={() => setEditingItem(item)}>
                          Editar
                        </Button>
                        <Button
                          color="error"
                          aria-label={`Remover ${item.title}`}
                          onClick={() => removeItem(item)}
                        >
                          Remover
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {items.map((item) => (
              <Card key={item.bookId}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                    <BookCover book={item} width={48} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" component="h2">{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.author}</Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Prioridade:</Typography>
                      <Chip
                        size="small"
                        color={PRIORITIES[item.priority].color}
                        label={PRIORITIES[item.priority].label}
                      />
                    </Stack>
                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 600 }}>Observação: </Box>
                      {item.note || '—'}
                    </Typography>
                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 600 }}>Disponibilidade: </Box>
                      {item.stock > 0 ? `${item.stock} disponível(is)` : 'Indisponível'}
                    </Typography>
                  </Stack>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Button aria-label={`Editar ${item.title}`} onClick={() => setEditingItem(item)}>
                    Editar
                  </Button>
                  <Button
                    color="error"
                    aria-label={`Remover ${item.title}`}
                    onClick={() => removeItem(item)}
                  >
                    Remover
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
        </Box>
      </AsyncContent>
      <WishlistDialog
        open={!!editingItem}
        title={`Editar ${editingItem?.title ?? 'livro'}`}
        initial={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={saveItem}
      />
    </>
  );
}
