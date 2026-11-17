import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { booksApi, favoritesApi, wishlistApi } from '../../api';
import { LIBRARIAN, book, pageOf, renderPage } from '../../test/render';
import CatalogPage from './CatalogPage';

vi.mock('../../api');

beforeEach(() => {
  favoritesApi.list.mockResolvedValue(pageOf([]));
  wishlistApi.list.mockResolvedValue(pageOf([]));
});

it('lista os livros do acervo', async () => {
  booksApi.list.mockResolvedValue(pageOf([book()]));
  renderPage(<CatalogPage />);

  expect(await screen.findByText('Dom Casmurro')).toBeInTheDocument();
  expect(booksApi.list).toHaveBeenCalledWith({ page: 1, pageSize: 12, ordering: 'title' });
  expect(screen.queryByRole('link', { name: /Cadastrar livro/ })).not.toBeInTheDocument();
});

it('mostra o botão de cadastro ao bibliotecário', async () => {
  booksApi.list.mockResolvedValue(pageOf([book()]));
  renderPage(<CatalogPage />, { user: LIBRARIAN });

  expect(await screen.findByRole('link', { name: /Cadastrar livro/ })).toHaveAttribute('href', '/acervo/novo');
});

it('filtra por título na API e mostra o estado vazio', async () => {
  booksApi.list.mockResolvedValue(pageOf([book()]));
  renderPage(<CatalogPage />);
  await screen.findByText('Dom Casmurro');

  booksApi.list.mockResolvedValue(pageOf([]));
  await userEvent.type(screen.getByRole('searchbox', { name: 'Título' }), 'xyz');

  await waitFor(() => expect(booksApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 12, title: 'xyz', ordering: 'title' }));
  expect(await screen.findByText('Nenhum livro encontrado')).toBeInTheDocument();
});

it('favorita um livro do catálogo', async () => {
  booksApi.list.mockResolvedValue(pageOf([book()]));
  favoritesApi.add.mockResolvedValue({});
  renderPage(<CatalogPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Favoritar: Dom Casmurro' }));
  await waitFor(() => expect(favoritesApi.add).toHaveBeenCalledWith('b-1'));
});

it('adiciona um livro à lista de desejos', async () => {
  booksApi.list.mockResolvedValue(pageOf([book()]));
  wishlistApi.add.mockResolvedValue({});
  renderPage(<CatalogPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Adicionar à lista de desejos: Dom Casmurro' }));
  await waitFor(() => expect(wishlistApi.add).toHaveBeenCalledWith('b-1', { priority: 'medium', note: '' }));
});

it('mostra o link de editar ao bibliotecário', async () => {
  booksApi.list.mockResolvedValue(pageOf([book()]));
  renderPage(<CatalogPage />, { user: LIBRARIAN });

  expect(await screen.findByRole('link', { name: 'Editar Dom Casmurro' })).toHaveAttribute('href', '/acervo/b-1/editar');
});

it('alterna entre grade e lista', async () => {
  booksApi.list.mockResolvedValue(pageOf([book()]));
  renderPage(<CatalogPage />);
  await screen.findByText('Dom Casmurro');

  await userEvent.click(screen.getByRole('button', { name: 'Lista' }));
  expect(await screen.findByRole('table', { name: 'Livros do acervo' })).toBeInTheDocument();
});
