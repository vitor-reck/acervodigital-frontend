import { Link as RouterLink } from 'react-router-dom';
import { Button, Card, CardActions, CardContent, Chip, Rating, Stack, Typography } from '@mui/material';
import { BookCover } from './ui';

export default function BookCard({ book, actions }) {
  const id = book.id ?? book.bookId;
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
        <BookCover book={book} width={64} />
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" component="h3">{book.title}</Typography>
          <Typography variant="body2" color="text.secondary">{book.author}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip size="small" variant="outlined" label={book.genre} />
            {book.reviewCount > 0 && <Rating size="small" value={book.averageRating} precision={0.5} readOnly />}
          </Stack>
          <Typography variant="caption" color={book.stock > 0 ? 'success.main' : 'text.secondary'}>
            {book.stock > 0 ? `${book.stock} disponível(is)` : 'Indisponível'}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        {actions}
        <Button size="small" component={RouterLink} to={`/acervo/${id}`}>Ver detalhes</Button>
      </CardActions>
    </Card>
  );
}

export function BookGrid({ children }) {
  return <Stack sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>{children}</Stack>;
}
