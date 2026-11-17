import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, Link, TextField, Typography } from '@mui/material';
import { usersApi } from '../../api';
import { usePaged } from '../../hooks/useAsync';
import { useDebounced } from '../../hooks/useForm';
import { AsyncContent, DataTable, EmptyState, PageHeader, PageNav } from '../../components/ui';
import { compact } from '../../utils/format';

const COLUMNS = [
  {
    label: 'Leitor',
    render: (reader) => (
      <Link component={RouterLink} to={`/leitores/${reader.id}`} underline="hover" sx={{ fontWeight: 600 }}>
        {reader.name}
      </Link>
    ),
  },
  { label: 'E-mail', render: (reader) => <Typography variant="body2">{reader.email}</Typography> },
  {
    label: 'Ações',
    align: 'right',
    render: (reader) => <Button size="small" component={RouterLink} to={`/leitores/${reader.id}`}>Ver histórico</Button>,
  },
];

export default function ReadersPage() {
  const [search, setSearch] = useState('');
  // debounce: evita uma requisição por tecla digitada
  const q = useDebounced(search.trim());
  const paged = usePaged((params) => usersApi.list({ ...params, ...compact({ q }) }), [q]);

  return (
    <>
      <PageHeader title="Leitores" subtitle="Consulte o histórico de locações e as multas de cada leitor" />
      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            type="search"
            label="Buscar leitor"
            placeholder="Nome ou e-mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ width: { xs: '100%', sm: 360 } }}
          />
        </Box>
        <AsyncContent state={paged} isEmpty={!paged.items.length} empty={<EmptyState title="Nenhum leitor encontrado" text={q ? 'Tente outro nome ou e-mail.' : 'Ainda não há leitores cadastrados.'} />}>
          <DataTable label="Leitores cadastrados" columns={COLUMNS} rows={paged.items} />
          <PageNav paged={paged} />
        </AsyncContent>
      </Card>
    </>
  );
}
