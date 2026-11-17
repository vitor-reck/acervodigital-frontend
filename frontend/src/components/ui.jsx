import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import { STATUS } from '../utils/labels';
import { imageSrc, initials } from '../utils/format';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}>
      <Box>
        <Typography variant="h5" component="h1">{title}</Typography>
        {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
      </Box>
      {actions && <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>{actions}</Stack>}
    </Stack>
  );
}

export function EmptyState({ title, text, action, icon = <InboxOutlined fontSize="large" /> }) {
  return (
    <Stack spacing={1} sx={{ py: 6, px: 2, alignItems: 'center', textAlign: 'center', color: 'text.secondary' }}>
      {icon}
      <Typography variant="subtitle1" color="text.primary">{title}</Typography>
      {text && <Typography variant="body2" sx={{ maxWidth: 420 }}>{text}</Typography>}
      {action}
    </Stack>
  );
}

export function AsyncContent({ state, isEmpty, empty, children }) {
  if (state.loading && !state.data) {
    return (
      <Stack spacing={2} sx={{ py: 6, alignItems: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Carregando. Se a API estiver inativa, a primeira resposta pode levar até 1 minuto.</Typography>
      </Stack>
    );
  }
  if (state.error && !state.data) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={state.reload}>Tentar novamente</Button>}>
        {state.error.message}
      </Alert>
    );
  }
  if (isEmpty) return empty;
  return children;
}

export function StatusChip({ kind, value, size = 'small' }) {
  const [label, color] = STATUS[kind][value] ?? [value, 'default'];
  return <Chip size={size} label={label} color={color} variant={color === 'default' ? 'outlined' : 'filled'} />;
}

export function BookCover({ book, width = 56 }) {
  const src = imageSrc(book.imageUrl);
  return (
    <Box
      sx={{
        width,
        aspectRatio: '2 / 3',
        flexShrink: 0,
        borderRadius: 1,
        bgcolor: 'grey.100',
        border: 1,
        borderColor: 'divider',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        color: 'text.secondary',
        fontWeight: 600,
        fontSize: width / 3.5,
      }}
    >
      {src ? <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(book.title ?? book.bookTitle ?? '')}
    </Box>
  );
}

export function KpiCard({ label, value, hint, color, to }) {
  const content = (
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </CardContent>
  );
  return <Card>{to ? <CardActionArea component={RouterLink} to={to}>{content}</CardActionArea> : content}</Card>;
}

export function KpiGrid({ children }) {
  return <Box sx={{ display: 'grid', gap: 2, mb: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>{children}</Box>;
}

export function DataTable({ columns, rows, rowKey = (row) => row.id, label }) {
  return (
    <TableContainer>
      <Table size="small" aria-label={label}>
        <TableHead>
          <TableRow>
            {columns.map((column) => <TableCell key={column.label} align={column.align}>{column.label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} hover>
              {columns.map((column) => <TableCell key={column.label} align={column.align}>{column.render(row)}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function PageNav({ paged }) {
  if (paged.pages <= 1) return null;
  return <Pagination sx={{ p: 2, display: 'flex', justifyContent: 'center' }} page={paged.page} count={paged.pages} onChange={(_, page) => paged.setPage(page)} />;
}

export function Placeholder({ title }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState title="Em desenvolvimento" text="Esta página ainda está sendo construída pelo integrante responsável." />
      </Card>
    </>
  );
}
