import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ALL, favoritesApi } from '../../api';
import { book, pageOf, renderWithProviders } from '../../test/render';
import FavoritesPage from './FavoritesPage';

vi.mock('../../api');

it('carrega e mostra os livros favoritos da API', async () => {
  favoritesApi.list.mockResolvedValue(pageOf([{ ...book(), bookId: 'b-1' }]));
  renderWithProviders(<FavoritesPage />);

  expect(screen.getByRole('heading', { name: 'Favoritos' })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Dom Casmurro' })).toBeInTheDocument();
  expect(screen.getByText('1 livro(s)')).toBeInTheDocument();
  expect(favoritesApi.list).toHaveBeenCalledWith(ALL);
  expect(screen.getByRole('button', { name: 'Remover Dom Casmurro dos favoritos' })).toBeEnabled();
  expect(screen.getByRole('link', { name: 'Ver detalhes' })).toHaveAttribute('href', '/acervo/b-1');
});

it('remove um livro dos favoritos e atualiza a lista', async () => {
  favoritesApi.list
    .mockResolvedValueOnce(pageOf([{ ...book(), bookId: 'b-1' }]))
    .mockResolvedValueOnce(pageOf([]));
  favoritesApi.remove.mockResolvedValue('');
  renderWithProviders(<FavoritesPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Remover Dom Casmurro dos favoritos' }));

  await waitFor(() => expect(favoritesApi.remove).toHaveBeenCalledWith('b-1'));
  expect(await screen.findByText('Nenhum favorito')).toBeInTheDocument();
  expect(favoritesApi.list).toHaveBeenCalledTimes(2);
});

it('mantém o favorito e mostra erro se a remoção falhar', async () => {
  favoritesApi.list.mockResolvedValue(pageOf([{ ...book(), bookId: 'b-1' }]));
  favoritesApi.remove.mockRejectedValue(new Error('Falha ao remover favorito'));
  renderWithProviders(<FavoritesPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Remover Dom Casmurro dos favoritos' }));

  expect(await screen.findByText('Falha ao remover favorito')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Dom Casmurro' })).toBeInTheDocument();
});

it('mostra estado vazio quando não há favoritos', async () => {
  favoritesApi.list.mockResolvedValue(pageOf([]));
  renderWithProviders(<FavoritesPage />);

  expect(await screen.findByText('Nenhum favorito')).toBeInTheDocument();
});

it('mostra erro e permite tentar carregar novamente', async () => {
  favoritesApi.list.mockRejectedValue(new Error('Falha ao carregar favoritos'));
  renderWithProviders(<FavoritesPage />);

  expect(await screen.findByText('Falha ao carregar favoritos')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
});
