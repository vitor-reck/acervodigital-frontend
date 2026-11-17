import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Box, Breadcrumbs, Button, Card, CardContent, Divider, FormLabel, Link, MenuItem, Rating, Select, Stack, TextField, Typography, alpha,
} from '@mui/material';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import Star from '@mui/icons-material/Star';
import StarOutlined from '@mui/icons-material/StarOutlined';
import { ALL, booksApi, rentalsApi, reviewsApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, BookCover, EmptyState, PageHeader } from '../../components/ui';
import { CONDITIONS, REVIEWABLE_RENTAL_STATUSES } from '../../utils/labels';
import { formatDate } from '../../utils/format';

const COMMENT_LIMIT = 1000;
const RATING_LABELS = { 1: 'Ruim', 2: 'Regular', 3: 'Bom', 4: 'Muito bom', 5: 'Excelente' };

function StarBox({ filled }) {
  const Icon = filled ? Star : StarOutlined;
  return (
    <Box
      sx={(theme) => ({
        width: 44,
        height: 44,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 1.5,
        border: 1,
        borderColor: filled ? alpha(theme.palette.warning.main, 0.4) : 'divider',
        bgcolor: filled ? alpha(theme.palette.warning.main, 0.12) : 'background.paper',
        color: filled ? 'warning.main' : 'text.secondary',
      })}
    >
      <Icon />
    </Box>
  );
}

function Crumbs({ book, current }) {
  return (
    <Breadcrumbs separator={<ChevronRightOutlined fontSize="small" />} sx={{ mb: 2 }}>
      <Link component={RouterLink} to="/acervo" underline="hover" color="inherit">Catálogo</Link>
      <Link component={RouterLink} to={`/acervo/${book.id}`} underline="hover" color="inherit">{book.title}</Link>
      <Typography component="span" color="text.primary">{current}</Typography>
    </Breadcrumbs>
  );
}

function Unavailable({ book }) {
  return (
    <>
      <Crumbs book={book} current="Avaliar livro" />
      <PageHeader title="Avaliar livro" />
      <Card>
        <EmptyState
          title="Avaliação indisponível"
          text="Você só pode avaliar livros que já retirou na biblioteca."
          action={<Button variant="outlined" component={RouterLink} to={`/acervo/${book.id}`}>Voltar ao livro</Button>}
        />
      </Card>
    </>
  );
}

function ReviewForm({ book, existing }) {
  const navigate = useNavigate();
  const { notify, run } = useFeedback();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    rating: existing?.rating ?? 0,
    condition: existing?.condition ?? '',
    comment: existing?.comment ?? '',
  });

  const save = async () => {
    if (!form.rating || !form.condition) {
      notify('Informe a nota e a condição do exemplar.', 'warning');
      return;
    }
    const payload = { rating: form.rating, condition: form.condition, comment: form.comment.trim() };
    const action = existing ? () => reviewsApi.update(existing.id, payload) : () => booksApi.review(book.id, payload);

    setSaving(true);
    const done = await run(action, existing ? 'Avaliação atualizada' : 'Avaliação enviada');
    setSaving(false);
    if (done) navigate('/avaliacoes');
  };

  return (
    <>
      <Crumbs book={book} current={existing ? 'Editar avaliação' : 'Avaliar livro'} />
      <PageHeader
        title={existing ? 'Editar avaliação' : 'Avaliar livro'}
        subtitle={
          existing
            ? `Você avaliou este livro em ${formatDate(existing.createdAt)}. Altere os campos abaixo e salve.`
            : 'Conte como foi a leitura e o estado do exemplar que você retirou.'
        }
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <BookCover book={book} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{book.title}</Typography>
                <Typography color="text.secondary">{book.author}</Typography>
              </Box>
            </Stack>

            <Stack spacing={0.5}>
              <FormLabel required>Nota</FormLabel>
              <Rating
                name="rating"
                value={form.rating || null}
                onChange={(_, value) => value && setForm((current) => ({ ...current, rating: value }))}
                icon={<StarBox filled />}
                emptyIcon={<StarBox />}
                getLabelText={(value) => `${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                sx={{ gap: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {form.rating ? RATING_LABELS[form.rating] : 'Toque em uma estrela para avaliar.'}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <FormLabel id="condition-label" required>Condição do exemplar</FormLabel>
              <Select
                labelId="condition-label"
                size="small"
                fullWidth
                displayEmpty
                value={form.condition}
                onChange={(event) => setForm((current) => ({ ...current, condition: event.target.value }))}
              >
                <MenuItem value="" disabled>Selecione</MenuItem>
                {Object.entries(CONDITIONS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </Select>
            </Stack>

            <Stack spacing={0.5}>
              <FormLabel htmlFor="review-comment">Comentário</FormLabel>
              <TextField
                id="review-comment"
                multiline
                minRows={4}
                fullWidth
                placeholder="O que você achou do livro? (opcional)"
                helperText={`${form.comment.length}/${COMMENT_LIMIT} caracteres.`}
                slotProps={{ htmlInput: { maxLength: COMMENT_LIMIT } }}
                value={form.comment}
                onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" color="inherit" onClick={() => navigate(existing ? '/avaliacoes' : `/acervo/${book.id}`)}>
              Cancelar
            </Button>
            <Button variant="contained" startIcon={<CheckOutlined />} onClick={save} disabled={saving}>
              {existing ? 'Salvar alterações' : 'Enviar avaliação'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}

export default function ReviewFormPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const state = useAsync(async () => {
    const [book, reviews, rentals] = await Promise.all([booksApi.get(id), booksApi.reviews(id, ALL), rentalsApi.mine(ALL)]);
    const existing = reviews.results.find((review) => review.userId === user.id) ?? null;
    const canReview = rentals.results.some((rental) => rental.bookId === id && REVIEWABLE_RENTAL_STATUSES.includes(rental.status));
    return { book, existing, canReview };
  }, [id, user.id]);

  return (
    <AsyncContent state={state} isEmpty={false}>
      {state.data && (state.data.existing || state.data.canReview
        ? <ReviewForm key={state.data.existing?.id ?? 'new'} book={state.data.book} existing={state.data.existing} />
        : <Unavailable book={state.data.book} />)}
    </AsyncContent>
  );
}