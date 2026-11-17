import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardActions, CardContent, Chip, Rating, Stack, Typography } from '@mui/material';
import { ALL, favoritesApi } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, BookCover, EmptyState, PageHeader } from '../../components/ui';

export default function FavoritesPage() {
  const { run } = useFeedback();
  const state = useAsync(() => favoritesApi.list(ALL));
  const favorites = state.data?.results ?? [];

  const removeFavorite = async (book) => {
    const remove = async () => {
      await favoritesApi.remove(book.bookId);
      return true;
    };
    if (await run(remove, 'Removido dos favoritos')) {
      state.reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Favoritos"
        subtitle={`${state.data?.count ?? 0} livro(s)`}
        actions={<Button component={RouterLink} to="/acervo">Explorar catálogo</Button>}
      />
      <AsyncContent
        state={state}
        isEmpty={!favorites.length}
        empty={
          <Card>
            <EmptyState
              title="Nenhum favorito"
              text="Explore o catálogo e adicione livros aos seus favoritos."
              action={<Button component={RouterLink} to="/acervo">Explorar catálogo</Button>}
            />
          </Card>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(260px, 1fr))' },
          }}
        >
          {favorites.map((book) => (
            <Card key={book.bookId} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <CardContent sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                <BookCover book={book} width={64} />
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" component="h2">{book.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{book.author}</Typography>
                  <Chip size="small" variant="outlined" label={book.genre} sx={{ alignSelf: 'flex-start' }} />
                  <Rating
                    aria-label={`${book.averageRating} de 5 estrelas`}
                    size="small"
                    value={book.averageRating}
                    readOnly
                  />
                  <Typography variant="caption" color={book.stock > 0 ? 'success.main' : 'text.secondary'}>
                    {book.stock > 0 ? `${book.stock} disponível(is)` : 'Indisponível'}
                  </Typography>
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  color="error"
                  aria-label={`Remover ${book.title} dos favoritos`}
                  onClick={() => removeFavorite(book)}
                >
                  Remover
                </Button>
                <Button component={RouterLink} to={`/acervo/${book.bookId}`}>
                  Ver detalhes
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </AsyncContent>
    </>
  );
}
