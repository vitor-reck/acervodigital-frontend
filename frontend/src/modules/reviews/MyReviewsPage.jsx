import { Link as RouterLink } from 'react-router-dom';
import { Button, Card, CardContent, Chip, Rating, Stack, Typography } from '@mui/material';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { reviewsApi } from '../../api';
import { usePaged } from '../../hooks/useAsync';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, BookCover, EmptyState, PageHeader, PageNav } from '../../components/ui';
import { CONDITIONS } from '../../utils/labels';
import { formatDate } from '../../utils/format';

const REMOVED_BOOK = 'Livro removido';

const exploreButton = (
  <Button variant="contained" startIcon={<SearchOutlined />} component={RouterLink} to="/acervo">
    Explorar catálogo
  </Button>
);

function ReviewCard({ review, onDelete }) {
  const title = review.bookTitle ?? REMOVED_BOOK;

  return (
    <Card component="article" aria-label={`Avaliação de ${title}`}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <BookCover book={{ title }} width={40} />
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
            {review.bookAuthor && <Typography variant="body2" color="text.secondary">{review.bookAuthor}</Typography>}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Rating value={review.rating} readOnly size="small" getLabelText={(value) => `${value} de 5 estrelas`} />
              <Chip size="small" variant="outlined" label={`Exemplar: ${CONDITIONS[review.condition] ?? review.condition}`} />
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {formatDate(review.createdAt)}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1}>
            {review.bookTitle && (
              <Button size="small" variant="outlined" color="inherit" startIcon={<EditOutlined />} component={RouterLink} to={`/acervo/${review.bookId}/avaliar`}>
                Editar
              </Button>
            )}
            <Button size="small" color="error" startIcon={<DeleteOutlined />} onClick={() => onDelete(review)}>
              Excluir
            </Button>
          </Stack>
        </Stack>
        {review.comment && <Typography sx={{ mt: 2 }}>{review.comment}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function MyReviewsPage() {
  const { confirm, run } = useFeedback();
  const paged = usePaged((params) => reviewsApi.mine(params), []);
  const count = paged.data?.count;

  const remove = async (review) => {
    const confirmed = await confirm({
      title: 'Excluir avaliação',
      message: (
        <>
          Deseja excluir sua avaliação de <strong>{review.bookTitle ?? REMOVED_BOOK}</strong>? Esta ação não pode ser desfeita.
        </>
      ),
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!confirmed) return;
    if (await run(() => reviewsApi.remove(review.id), 'Avaliação excluída')) {
      if (paged.items.length === 1 && paged.page > 1) paged.setPage(paged.page - 1);
      else paged.reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Minhas avaliações"
        subtitle={count == null ? undefined : `${count} ${count === 1 ? 'avaliação feita' : 'avaliações feitas'}`}
        actions={exploreButton}
      />
      <AsyncContent
        state={paged}
        isEmpty={!paged.items.length}
        empty={
          <Card>
            <EmptyState
              title="Você ainda não avaliou nenhum livro"
              text="Depois de retirar um livro, volte ao catálogo para contar como foi a leitura e o estado do exemplar."
            />
          </Card>
        }
      >
        <Stack spacing={2}>
          {paged.items.map((review) => <ReviewCard key={review.id} review={review} onDelete={remove} />)}
        </Stack>
        <PageNav paged={paged} />
      </AsyncContent>
    </>
  );
}