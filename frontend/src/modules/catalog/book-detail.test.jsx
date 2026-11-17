import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { booksApi, favoritesApi, rentalsApi, wishlistApi } from '../../api';
import { LIBRARIAN, READER, book, pageOf, rental, renderPage } from '../../test/render';
import BookDetailPage from './BookDetailPage';

vi.mock('../../api');

const DETAIL_PATH = { path: '/acervo/:id', route: '/acervo/b-1' };

beforeEach(() => {
  booksApi.reviews.mockResolvedValue(pageOf([]));
  rentalsApi.mine.mockResolvedValue(pageOf([]));
  favoritesApi.list.mockResolvedValue(pageOf([]));
  wishlistApi.list.mockResolvedValue(pageOf([]));
});

it('mostra os dados do livro e as avaliações', async () => {
  booksApi.get.mockResolvedValue(book());
  booksApi.reviews.mockResolvedValue(pageOf([
    { id: 'rv-1', userId: 'u-9', userName: 'Carla', rating: 5, condition: 'good', comment: 'Ótimo livro!', createdAt: '2026-10-01T00:00:00Z' },
  ]));
  renderPage(<BookDetailPage />, DETAIL_PATH);

  expect(await screen.findByRole('heading', { name: 'Dom Casmurro' })).toBeInTheDocument();
  expect(screen.getByText('Machado de Assis')).toBeInTheDocument();
  expect(screen.getByText('Bentinho e Capitu.')).toBeInTheDocument();
  expect(await screen.findByText('Carla')).toBeInTheDocument();
  expect(screen.getByText('Ótimo livro!')).toBeInTheDocument();
});

it('reserva um livro disponível e mostra o ticket', async () => {
  booksApi.get.mockResolvedValue(book({ stock: 2 }));
  rentalsApi.reserve.mockResolvedValue({ id: 'r-9', ticketCode: 'RET-20261027-ABCDEF12' });
  renderPage(<BookDetailPage />, DETAIL_PATH);

  await userEvent.click(await screen.findByRole('button', { name: 'Reservar' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Confirmar reserva' }));

  await waitFor(() => expect(rentalsApi.reserve).toHaveBeenCalledWith('b-1'));
  expect(await screen.findByText('RET-20261027-ABCDEF12')).toBeInTheDocument();
});

it('desabilita a reserva quando já existe uma locação em aberto do livro', async () => {
  booksApi.get.mockResolvedValue(book({ stock: 2 }));
  rentalsApi.mine.mockResolvedValue(pageOf([rental({ bookId: 'b-1', status: 'active' })]));
  renderPage(<BookDetailPage />, DETAIL_PATH);

  expect(await screen.findByRole('button', { name: 'Você já tem uma locação deste livro' })).toBeDisabled();
});

it('favorita o livro', async () => {
  booksApi.get.mockResolvedValue(book());
  favoritesApi.add.mockResolvedValue({});
  renderPage(<BookDetailPage />, DETAIL_PATH);

  await userEvent.click(await screen.findByRole('button', { name: 'Favoritar' }));
  await waitFor(() => expect(favoritesApi.add).toHaveBeenCalledWith('b-1'));
});

it('adiciona à lista de desejos pelo diálogo', async () => {
  booksApi.get.mockResolvedValue(book());
  wishlistApi.add.mockResolvedValue({});
  renderPage(<BookDetailPage />, DETAIL_PATH);

  await userEvent.click(await screen.findByRole('button', { name: 'Adicionar à lista de desejos' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

  await waitFor(() => expect(wishlistApi.add).toHaveBeenCalledWith('b-1', { priority: 'medium', note: '' }));
});

it('mostra o link de avaliar para quem já retirou o livro', async () => {
  booksApi.get.mockResolvedValue(book());
  rentalsApi.mine.mockResolvedValue(pageOf([rental({ bookId: 'b-1', status: 'returned' })]));
  renderPage(<BookDetailPage />, { ...DETAIL_PATH, user: READER });

  expect(await screen.findByRole('link', { name: /Avaliar livro/ })).toHaveAttribute('href', '/acervo/b-1/avaliar');
});

it('bibliotecário edita e remove o livro', async () => {
  booksApi.get.mockResolvedValue(book());
  booksApi.remove.mockResolvedValue({});
  renderPage(<BookDetailPage />, { ...DETAIL_PATH, user: LIBRARIAN });

  expect(await screen.findByRole('link', { name: /Editar livro/ })).toHaveAttribute('href', '/acervo/b-1/editar');

  await userEvent.click(screen.getByRole('button', { name: /Remover livro/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Remover definitivamente' }));

  await waitFor(() => expect(booksApi.remove).toHaveBeenCalledWith('b-1'));
  expect(await screen.findByText('Outra página')).toBeInTheDocument();
});

it('oferece avaliação mesmo quando a locação mais recente foi cancelada', async () => {
  booksApi.get.mockResolvedValue(book());
  rentalsApi.mine.mockResolvedValue(pageOf([rental({ id: 'r-2', status: 'cancelled' }), rental({ id: 'r-1', status: 'returned' })]));
  renderPage(<BookDetailPage />, DETAIL_PATH);

  expect(await screen.findByRole('link', { name: /Avaliar livro/ })).toBeInTheDocument();
});

it('atualiza a lista de desejos depois de reservar', async () => {
  booksApi.get.mockResolvedValue(book({ stock: 2 }));
  rentalsApi.reserve.mockResolvedValue({ id: 'r-9', ticketCode: 'RET-20261027-ABCDEF12' });
  renderPage(<BookDetailPage />, DETAIL_PATH);

  await userEvent.click(await screen.findByRole('button', { name: 'Reservar' }));
  const calls = wishlistApi.list.mock.calls.length;
  await userEvent.click(await screen.findByRole('button', { name: 'Confirmar reserva' }));

  await waitFor(() => expect(wishlistApi.list.mock.calls.length).toBeGreaterThan(calls));
});
