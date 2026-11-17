import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { booksApi } from '../../api';
import { LIBRARIAN, renderPage } from '../../test/render';
import BookFormPage from './BookFormPage';

vi.mock('../../api');

it('cadastra um livro com os dados informados', async () => {
  booksApi.create.mockResolvedValue({ id: 'b-9', title: 'Vidas Secas' });
  renderPage(<BookFormPage />, { path: '/acervo/novo', user: LIBRARIAN });

  await userEvent.type(screen.getByLabelText(/Título/), 'Vidas Secas');
  await userEvent.type(screen.getByLabelText(/Autor/), 'Graciliano Ramos');
  await userEvent.type(screen.getByLabelText(/Gênero/), 'Literatura Brasileira');
  await userEvent.keyboard('{Escape}');
  fireEvent.change(screen.getByLabelText(/Data de lançamento/), { target: { value: '1938-01-01' } });
  const stock = screen.getByLabelText(/Exemplares/);
  await userEvent.clear(stock);
  await userEvent.type(stock, '3');
  await userEvent.type(screen.getByLabelText('Sinopse'), 'Uma família de retirantes.');

  await userEvent.click(screen.getByRole('button', { name: 'Cadastrar livro' }));

  await waitFor(() => expect(booksApi.create).toHaveBeenCalledWith({
    title: 'Vidas Secas',
    author: 'Graciliano Ramos',
    genre: 'Literatura Brasileira',
    releaseDate: '01-01-1938',
    stock: 3,
    synopsis: 'Uma família de retirantes.',
  }));
}, 20000);

it('remove a capa selecionada antes de enviar', async () => {
  booksApi.create.mockResolvedValue({ id: 'b-9' });
  renderPage(<BookFormPage />, { path: '/acervo/novo', user: LIBRARIAN });

  const file = new File(['conteudo'], 'capa.png', { type: 'image/png' });
  const input = document.querySelector('input[type="file"]');
  await userEvent.upload(input, file);

  expect(await screen.findByRole('button', { name: /Remover capa/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Remover capa/ }));
  expect(screen.queryByRole('button', { name: /Remover capa/ })).not.toBeInTheDocument();
});

const EDIT = { path: '/acervo/:id/editar', route: '/acervo/b-1/editar', user: LIBRARIAN };
const existing = {
  id: 'b-1', title: 'Iracema', author: 'José de Alencar', genre: 'Romance',
  releaseDate: '01-01-1865', stock: 4, synopsis: 'Lenda do Ceará.', imageUrl: '/api/v1/books/b-1/image?v=1',
};

it('carrega o livro e salva sem enviar a capa quando ela não muda', async () => {
  booksApi.get.mockResolvedValue(existing);
  booksApi.update.mockResolvedValue(existing);
  renderPage(<BookFormPage />, EDIT);

  const title = await screen.findByDisplayValue('Iracema');
  expect(screen.getByDisplayValue('1865-01-01')).toBeInTheDocument();
  await userEvent.clear(title);
  await userEvent.type(title, 'Iracema (2ª ed.)');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

  await waitFor(() => expect(booksApi.update).toHaveBeenCalledWith('b-1', {
    title: 'Iracema (2ª ed.)',
    author: 'José de Alencar',
    genre: 'Romance',
    releaseDate: '01-01-1865',
    stock: 4,
    synopsis: 'Lenda do Ceará.',
  }));
}, 20000);

it('envia image null ao remover a capa atual', async () => {
  booksApi.get.mockResolvedValue(existing);
  booksApi.update.mockResolvedValue(existing);
  renderPage(<BookFormPage />, EDIT);

  await userEvent.click(await screen.findByRole('button', { name: /Remover capa/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

  await waitFor(() => expect(booksApi.update).toHaveBeenCalledWith('b-1', expect.objectContaining({ image: null })));
}, 20000);

it('envia a sinopse vazia ao apagá-la na edição', async () => {
  booksApi.get.mockResolvedValue({ id: 'b-1', title: 'Dom Casmurro', author: 'Machado de Assis', genre: 'Romance', releaseDate: '01-01-1899', stock: 2, synopsis: 'Bentinho e Capitu.', imageUrl: null });
  booksApi.update.mockResolvedValue({ id: 'b-1' });
  renderPage(<BookFormPage />, { path: '/acervo/:id/editar', route: '/acervo/b-1/editar', user: LIBRARIAN });

  await userEvent.clear(await screen.findByDisplayValue('Bentinho e Capitu.'));
  await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

  await waitFor(() => expect(booksApi.update).toHaveBeenCalledWith('b-1', expect.objectContaining({ synopsis: '' })));
});
