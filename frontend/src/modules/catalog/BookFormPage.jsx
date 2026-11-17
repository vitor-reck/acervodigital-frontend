import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Autocomplete, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { booksApi } from '../../api';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, PageHeader } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useForm } from '../../hooks/useForm';
import { compact, fromApiDate, imageSrc, readFileAsDataUrl, toApiDate } from '../../utils/format';
import { GENRES } from '../../utils/labels';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const INITIAL_FORM = { title: '', author: '', genre: '', releaseDate: '', stock: 1, synopsis: '', image: null };

export default function BookFormPage() {
  const { id } = useParams();
  if (id) return <EditBook id={id} />;
  return <BookForm />;
}

function EditBook({ id }) {
  const state = useAsync(() => booksApi.get(id), [id]);
  const book = state.data;
  return (
    <>
      {!book && <PageHeader title="Editar livro" />}
      <AsyncContent state={state}>{book && <BookForm book={book} />}</AsyncContent>
    </>
  );
}

// No modo edição, form.image: undefined = capa atual mantida, null = removida, string = nova capa.
function BookForm({ book }) {
  const navigate = useNavigate();
  const { run, notify } = useFeedback();
  const editing = Boolean(book);
  const { form, setForm, field } = useForm(
    editing
      ? {
          title: book.title ?? '',
          author: book.author ?? '',
          genre: book.genre ?? '',
          releaseDate: fromApiDate(book.releaseDate),
          stock: book.stock ?? 0,
          synopsis: book.synopsis ?? '',
          image: undefined,
        }
      : INITIAL_FORM,
  );
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const preview = form.image === undefined ? imageSrc(book?.imageUrl) : form.image;

  const pickImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      notify('A imagem deve ter até 5 MB.', 'error');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setForm((current) => ({ ...current, image: dataUrl }));
  };

  const removeImage = () => setForm((current) => ({ ...current, image: null }));

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    const payload = compact({
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre.trim(),
      releaseDate: toApiDate(form.releaseDate),
      stock: Number(form.stock),
      synopsis: form.synopsis.trim(),
      image: form.image,
    });
    if (editing) payload.synopsis = form.synopsis.trim();
    if (editing && form.image === null && book.imageUrl) payload.image = null;
    const result = await run(
      () => (editing ? booksApi.update(book.id, payload) : booksApi.create(payload)),
      editing ? 'Livro atualizado com sucesso' : 'Livro cadastrado com sucesso',
    );
    if (result) navigate(`/acervo/${editing ? book.id : result.id}`);
    else setSending(false);
  };

  return (
    <>
      <PageHeader
        title={editing ? 'Editar livro' : 'Cadastrar livro'}
        subtitle={editing ? 'Atualize os dados do título.' : 'Preencha os dados para adicionar um título ao acervo.'}
      />
      <Card>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submit} sx={{ maxWidth: 560 }}>
            <TextField label="Título" required {...field('title')} />
            <TextField label="Autor" required {...field('author')} />
            <Autocomplete
              freeSolo
              options={GENRES}
              inputValue={form.genre}
              onInputChange={(_, value) => setForm((current) => ({ ...current, genre: value }))}
              renderInput={(params) => <TextField {...params} label="Gênero" required />}
            />
            <TextField
              label="Data de lançamento"
              type="date"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              {...field('releaseDate')}
            />
            <TextField
              label="Exemplares"
              type="number"
              required
              slotProps={{ htmlInput: { min: 0 } }}
              {...field('stock')}
            />
            <TextField
              label="Sinopse"
              multiline
              minRows={3}
              slotProps={{ htmlInput: { maxLength: 2000 } }}
              helperText={`${form.synopsis.length}/2000`}
              {...field('synopsis')}
            />
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 96,
                  aspectRatio: '2 / 3',
                  borderRadius: 1,
                  bgcolor: 'grey.100',
                  border: 1,
                  borderColor: 'divider',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {preview ? (
                  <Box component="img" src={preview} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">Sem capa</Typography>
                )}
              </Box>
              <Stack spacing={1}>
                <Button variant="outlined" component="label" startIcon={<PhotoCameraOutlined />}>
                  {preview ? 'Trocar capa' : 'Selecionar capa'}
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={pickImage} />
                </Button>
                {preview && (
                  <Button color="error" size="small" startIcon={<DeleteOutlined />} onClick={removeImage}>Remover capa</Button>
                )}
                <Typography variant="caption" color="text.secondary">Opcional, até 5 MB.</Typography>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={sending}>              {sending ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar livro'}</Button>
                            <Button onClick={() => navigate(editing ? `/acervo/${book.id}` : '/acervo')}>Cancelar</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
