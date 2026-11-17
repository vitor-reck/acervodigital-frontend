import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Rating,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import ViewListOutlined from '@mui/icons-material/ViewListOutlined';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import Bookmark from '@mui/icons-material/Bookmark';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import { ALL, booksApi, favoritesApi, wishlistApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useAsync, usePaged } from '../../hooks/useAsync';
import { useDebounced } from '../../hooks/useForm';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, BookCover, DataTable, EmptyState, PageHeader, PageNav } from '../../components/ui';
import { compact, formatReleaseDate, toApiDate } from '../../utils/format';
import { GENRES } from '../../utils/labels';

const EMPTY_FILTERS = { title: '', author: '', genre: '', releaseDate: '', ordering: 'title' };

const ORDERINGS = [
  { value: 'title', label: 'Título (A a Z)' },
  { value: 'rating', label: 'Melhor avaliados' },
  { value: 'recent', label: 'Lançamento mais recente' },
  { value: 'stock', label: 'Mais exemplares disponíveis' },
];

const stockText = (book) => (book.stock > 0 ? `${book.stock} disponível(is)` : 'Indisponível');

export default function CatalogPage() {
  const { isLibrarian } = useAuth();
  const { run } = useFeedback();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [view, setView] = useState('grid');
  const title = useDebounced(filters.title);
  const author = useDebounced(filters.author);
  const { genre, releaseDate, ordering } = filters;

  const paged = usePaged(
    (params) => booksApi.list({ ...params, ...compact({ title, author, genre, releaseDate: toApiDate(releaseDate), ordering }) }),
    [title, author, genre, releaseDate, ordering],
  );
  const favState = useAsync(() => (isLibrarian ? Promise.resolve({ results: [] }) : favoritesApi.list(ALL)), [isLibrarian]);
  const wishState = useAsync(() => (isLibrarian ? Promise.resolve({ results: [] }) : wishlistApi.list(ALL)), [isLibrarian]);
  const favoriteIds = new Set((favState.data?.results ?? []).map((item) => item.bookId));
  const wishIds = new Set((wishState.data?.results ?? []).map((item) => item.bookId));

  const toggleFavorite = async (book) => {
    const isFav = favoriteIds.has(book.id);
    const action = () => (isFav ? favoritesApi.remove(book.id) : favoritesApi.add(book.id));
    if (await run(action, isFav ? 'Removido dos favoritos' : 'Adicionado aos favoritos')) favState.reload();
  };

  const toggleWishlist = async (book) => {
    const isWished = wishIds.has(book.id);
    const action = () => (isWished ? wishlistApi.remove(book.id) : wishlistApi.add(book.id, { priority: 'medium', note: '' }));
    if (await run(action, isWished ? 'Removido da lista de desejos' : 'Adicionado à lista de desejos')) wishState.reload();
  };

  const field = (name) => ({
    value: filters[name],
    onChange: (event) => setFilters((previous) => ({ ...previous, [name]: event.target.value })),
  });

  const total = paged.data?.count ?? 0;
  const clear = (
    <Button variant="contained" onClick={() => setFilters(EMPTY_FILTERS)}>Limpar filtros</Button>
  );

  const favWishActions = (book) => (
    <>
      <IconButton
        size="small"
        aria-label={favoriteIds.has(book.id) ? `Remover dos favoritos: ${book.title}` : `Favoritar: ${book.title}`}
        onClick={() => toggleFavorite(book)}
      >
        {favoriteIds.has(book.id) ? <Favorite fontSize="small" color="error" /> : <FavoriteBorder fontSize="small" />}
      </IconButton>
      <IconButton
        size="small"
        aria-label={wishIds.has(book.id) ? `Remover da lista de desejos: ${book.title}` : `Adicionar à lista de desejos: ${book.title}`}
        onClick={() => toggleWishlist(book)}
      >
        {wishIds.has(book.id) ? <Bookmark fontSize="small" color="primary" /> : <BookmarkBorder fontSize="small" />}
      </IconButton>
    </>
  );

  const columns = [
    {
      label: 'Livro',
      render: (book) => (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <BookCover book={book} width={40} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" component={RouterLink} to={`/acervo/${book.id}`} sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
              {book.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">{book.author}</Typography>
          </Box>
        </Stack>
      ),
    },
    { label: 'Gênero', render: (book) => book.genre },
    { label: 'Lançamento', render: (book) => formatReleaseDate(book.releaseDate) },
    { label: 'Estoque', render: (book) => stockText(book) },
    {
      label: 'Ações',
      align: 'right',
      render: (book) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <IconButton size="small" aria-label={`Ver detalhes de ${book.title}`} component={RouterLink} to={`/acervo/${book.id}`}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
          {isLibrarian ? (
            <IconButton size="small" aria-label={`Editar ${book.title}`} component={RouterLink} to={`/acervo/${book.id}/editar`}>
              <EditOutlined fontSize="small" />
            </IconButton>
          ) : (
            favWishActions(book)
          )}
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Catálogo de livros"
        subtitle={`${total} título(s) no acervo`}
        actions={isLibrarian && (
          <Button variant="contained" startIcon={<AddOutlined />} component={RouterLink} to="/acervo/novo">Cadastrar livro</Button>
        )}
      />
      <Card>
        <Box component="form" role="search" onSubmit={(event) => event.preventDefault()} sx={{ p: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
          <TextField size="small" label="Título" placeholder="Buscar pelo título" type="search" {...field('title')} />
          <TextField size="small" label="Autor" placeholder="Nome do autor" type="search" {...field('author')} />
          <TextField size="small" select label="Gênero" {...field('genre')}>
            <MenuItem value="">Todos</MenuItem>
            {GENRES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
          <TextField size="small" type="date" label="Data de lançamento" slotProps={{ inputLabel: { shrink: true } }} {...field('releaseDate')} />
          <TextField size="small" select label="Ordenar por" {...field('ordering')}>
            {ORDERINGS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value) => value && setView(value)} aria-label="Modo de visualização">
              <ToggleButton value="grid" aria-label="Grade"><GridViewOutlined fontSize="small" /></ToggleButton>
              <ToggleButton value="list" aria-label="Lista"><ViewListOutlined fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
            <Button onClick={() => setFilters(EMPTY_FILTERS)}>Limpar</Button>
          </Stack>
        </Box>
      </Card>
      <Box sx={{ mt: 2 }}>
        <AsyncContent
          state={paged}
          isEmpty={!paged.items.length}
          empty={<Card><EmptyState title="Nenhum livro encontrado" text="Não encontramos resultados para essa combinação de busca e filtros. Tente outros termos ou limpe os filtros." action={clear} /></Card>}
        >
          {view === 'grid' ? (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {paged.items.map((book) => (
                <Card key={book.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                    <BookCover book={book} width={64} />
                    <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" component="h3">{book.title}</Typography>
                        {!isLibrarian && <Stack direction="row">{favWishActions(book)}</Stack>}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{book.author}</Typography>
                      <Chip size="small" variant="outlined" label={book.genre} sx={{ alignSelf: 'flex-start' }} />
                      {book.reviewCount > 0 && <Rating size="small" value={book.averageRating} precision={0.5} readOnly />}
                      <Typography variant="caption" color={book.stock > 0 ? 'success.main' : 'text.secondary'}>{stockText(book)}</Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                    {isLibrarian && (
                      <IconButton size="small" aria-label={`Editar ${book.title}`} component={RouterLink} to={`/acervo/${book.id}/editar`}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    )}
                    <Button size="small" component={RouterLink} to={`/acervo/${book.id}`}>Ver detalhes</Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          ) : (
            <DataTable label="Livros do acervo" columns={columns} rows={paged.items} />
          )}
          <PageNav paged={paged} />
        </AsyncContent>
      </Box>
    </>
  );
}
