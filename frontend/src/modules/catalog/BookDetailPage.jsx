import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Rating,
  Stack,
  Typography,
} from '@mui/material';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import Bookmark from '@mui/icons-material/Bookmark';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import { ALL, booksApi, favoritesApi, rentalsApi, wishlistApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useFeedback } from '../../components/Feedback';
import WishlistDialog from '../../components/WishlistDialog';
import { AsyncContent, BookCover, EmptyState, PageHeader } from '../../components/ui';
import { FINE_PER_DAY, RENTAL_DAYS, formatDate, formatMoney, formatReleaseDate } from '../../utils/format';
import { CONDITIONS, OPEN_RENTAL_STATUSES, REVIEWABLE_RENTAL_STATUSES } from '../../utils/labels';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLibrarian } = useAuth();
  const { run, confirm } = useFeedback();
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [ticket, setTicket] = useState(null);

  const bookState = useAsync(() => booksApi.get(id), [id]);
  const reviewsState = useAsync(() => booksApi.reviews(id, ALL), [id]);
  const rentalsState = useAsync(() => (isLibrarian ? Promise.resolve({ results: [] }) : rentalsApi.mine(ALL)), [isLibrarian]);
  const favState = useAsync(() => (isLibrarian ? Promise.resolve({ results: [] }) : favoritesApi.list(ALL)), [isLibrarian]);
  const wishState = useAsync(() => (isLibrarian ? Promise.resolve({ results: [] }) : wishlistApi.list(ALL)), [isLibrarian]);

  const book = bookState.data;
  const reviews = reviewsState.data?.results ?? [];
  const isFavorite = (favState.data?.results ?? []).some((item) => item.bookId === id);
  const wishItem = (wishState.data?.results ?? []).find((item) => item.bookId === id);

  const myRentalsForBook = (rentalsState.data?.results ?? []).filter((item) => item.bookId === id);
  const hasOpenRental = myRentalsForBook.some((item) => OPEN_RENTAL_STATUSES.includes(item.status));
  const alreadyReviewed = reviews.some((item) => item.userId === user?.id);
  const canReview = !isLibrarian && (alreadyReviewed || myRentalsForBook.some((item) => REVIEWABLE_RENTAL_STATUSES.includes(item.status)));
  const canReserve = !isLibrarian && book?.stock > 0 && !hasOpenRental;

  const toggleFavorite = async () => {
    const action = () => (isFavorite ? favoritesApi.remove(id) : favoritesApi.add(id));
    if (await run(action, isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')) favState.reload();
  };

  const toggleWishlist = async () => {
    if (wishItem) {
      if (await run(() => wishlistApi.remove(id), 'Removido da lista de desejos')) wishState.reload();
    } else {
      setWishlistDialogOpen(true);
    }
  };

  const saveWishlist = async (form) => {
    if (await run(() => wishlistApi.add(id, form), 'Adicionado à lista de desejos')) {
      setWishlistDialogOpen(false);
      wishState.reload();
    }
  };

  const reserve = async () => {
    const ok = await confirm({
      title: 'Reservar livro',
      message: `Você terá ${RENTAL_DAYS} dias após a retirada no balcão para devolver "${book.title}", com multa de ${formatMoney(FINE_PER_DAY)} por dia de atraso. Deseja reservar?`,
      confirmLabel: 'Confirmar reserva',
    });
    if (!ok) return;
    const result = await run(() => rentalsApi.reserve(book.id), 'Reserva realizada com sucesso');
    if (result) {
      setTicket(result.ticketCode);
      rentalsState.reload();
      bookState.reload();
      wishState.reload();
    }
  };

  const removeBook = async () => {
    const ok = await confirm({
      title: 'Remover livro',
      message: 'A remoção apaga favoritos, itens da lista de desejos e avaliações associados a este livro. Deseja continuar?',
      confirmLabel: 'Remover definitivamente',
      danger: true,
    });
    if (ok && (await run(() => booksApi.remove(id), 'Livro removido do acervo'))) navigate('/acervo');
  };

  return (
    <>
      <AsyncContent
        state={bookState}
        isEmpty={!book}
        empty={<Card><EmptyState title="Livro não encontrado" text="O livro solicitado não existe mais no acervo." action={<Button variant="contained" component={RouterLink} to="/acervo">Voltar ao catálogo</Button>} /></Card>}
      >
        {book && (
          <>
            <PageHeader
              title={book.title}
              subtitle={book.author}
              actions={
                isLibrarian ? (
                  <>
                    <Button variant="outlined" startIcon={<EditOutlined />} component={RouterLink} to={`/acervo/${id}/editar`}>Editar livro</Button>
                    <Button variant="outlined" color="error" startIcon={<DeleteOutlined />} onClick={removeBook}>Remover livro</Button>
                  </>
                ) : (
                  <>
                    <IconButton aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar'} onClick={toggleFavorite}>
                      {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
                    </IconButton>
                    <IconButton aria-label={wishItem ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'} onClick={toggleWishlist}>
                      {wishItem ? <Bookmark color="primary" /> : <BookmarkBorder />}
                    </IconButton>
                  </>
                )
              }
            />
            <Card>
              <CardContent sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <BookCover book={book} width={160} />
                <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 240 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip label={book.genre} />
                    <Typography variant="body2" color="text.secondary">Lançamento: {formatReleaseDate(book.releaseDate)}</Typography>
                  </Stack>
                  <Typography color={book.stock > 0 ? 'success.main' : 'error.main'}>
                    {book.stock > 0 ? `${book.stock} exemplar(es) disponível(is)` : 'Indisponível no momento'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Rating value={book.averageRating ?? 0} precision={0.5} readOnly />
                    <Typography variant="body2" color="text.secondary">
                      {book.reviewCount ? `${(book.averageRating ?? 0).toFixed(1)} (${book.reviewCount} avaliação(ões))` : 'Sem avaliações ainda'}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{book.synopsis || 'Sem sinopse cadastrada.'}</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', pt: 1 }}>
                    {!isLibrarian && (
                      <Button variant="contained" disabled={!canReserve} onClick={reserve}>
                        {hasOpenRental ? 'Você já tem uma locação deste livro' : book.stock > 0 ? 'Reservar' : 'Indisponível'}
                      </Button>
                    )}
                    {canReview && (
                      <Button variant="outlined" startIcon={<RateReviewOutlined />} component={RouterLink} to={`/acervo/${id}/avaliar`}>
                        {alreadyReviewed ? 'Editar avaliação' : 'Avaliar livro'}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Avaliações</Typography>
                <AsyncContent state={reviewsState} isEmpty={!reviews.length} empty={<EmptyState title="Nenhuma avaliação ainda" text="Seja o primeiro a avaliar este livro." />}>
                  <Stack spacing={2} divider={<Divider />}>
                    {reviews.map((review) => (
                      <Box key={review.id}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2">{review.userName}</Typography>
                          <Rating size="small" value={review.rating} readOnly />
                          <Chip size="small" variant="outlined" label={CONDITIONS[review.condition] ?? review.condition} />
                          <Typography variant="caption" color="text.secondary">{formatDate(review.createdAt)}</Typography>
                        </Stack>
                        {review.comment && <Typography variant="body2" sx={{ mt: 0.5 }}>{review.comment}</Typography>}
                      </Box>
                    ))}
                  </Stack>
                </AsyncContent>
              </CardContent>
            </Card>
          </>
        )}
      </AsyncContent>

      <WishlistDialog open={wishlistDialogOpen} title="Adicionar à lista de desejos" onClose={() => setWishlistDialogOpen(false)} onSave={saveWishlist} />

      <Dialog open={!!ticket} onClose={() => setTicket(null)}>
        <DialogTitle>Reserva confirmada</DialogTitle>
        <DialogContent>
          <DialogContentText>Apresente este código no balcão para retirar o livro:</DialogContentText>
          <Typography variant="h5" sx={{ fontFamily: 'IBM Plex Mono, monospace', my: 2, textAlign: 'center' }}>{ticket}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setTicket(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
