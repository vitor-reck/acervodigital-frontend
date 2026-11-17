import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ALL, wishlistApi } from '../../api';
import { book, pageOf, renderWithProviders } from '../../test/render';
import WishlistPage from './WishlistPage';

vi.mock('../../api');

it('carrega e mostra os itens da lista de desejos pela API', async () => {
  wishlistApi.list.mockResolvedValue(pageOf([{
    ...book(),
    bookId: 'b-1',
    priority: 'medium',
    note: 'Ler nas férias.',
  }]));
  renderWithProviders(<WishlistPage />);

  expect(screen.getByRole('heading', { name: 'Lista de desejos' })).toBeInTheDocument();
  expect(await screen.findAllByText('Dom Casmurro')).not.toHaveLength(0);
  expect(screen.getByText('1 livro(s)')).toBeInTheDocument();
  expect(screen.getAllByText('Ler nas férias.').length).toBeGreaterThan(0);
  expect(wishlistApi.list).toHaveBeenCalledWith(ALL);
  expect(screen.getByRole('link', { name: 'Adicionar pelo catálogo' })).toHaveAttribute('href', '/acervo');
  expect(screen.getAllByRole('button', { name: 'Editar Dom Casmurro' })[0]).toBeEnabled();
  expect(screen.getAllByRole('button', { name: 'Remover Dom Casmurro' })[0]).toBeEnabled();
});

it('atualiza prioridade e observação pela API', async () => {
  const originalItem = {
    ...book(),
    bookId: 'b-1',
    priority: 'medium',
    note: 'Ler nas férias.',
  };
  wishlistApi.list
    .mockResolvedValueOnce(pageOf([originalItem]))
    .mockResolvedValueOnce(pageOf([{ ...originalItem, priority: 'high', note: 'Prioridade máxima' }]));
  wishlistApi.update.mockResolvedValue({});
  renderWithProviders(<WishlistPage />);

  await userEvent.click((await screen.findAllByRole('button', { name: 'Editar Dom Casmurro' }))[0]);
  const dialog = screen.getByRole('dialog');
  await userEvent.click(within(dialog).getByRole('combobox', { name: 'Prioridade' }));
  await userEvent.click(await screen.findByRole('option', { name: 'Alta' }));
  await userEvent.clear(within(dialog).getByRole('textbox', { name: 'Observação' }));
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Observação' }), 'Prioridade máxima');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

  await waitFor(() => expect(wishlistApi.update).toHaveBeenCalledWith('b-1', {
    priority: 'high',
    note: 'Prioridade máxima',
  }));
  expect(await screen.findAllByText('Prioridade máxima')).not.toHaveLength(0);
  expect(wishlistApi.list).toHaveBeenCalledTimes(2);
});

it('mantém o diálogo aberto e mostra erro se a atualização falhar', async () => {
  wishlistApi.list.mockResolvedValue(pageOf([{
    ...book(),
    bookId: 'b-1',
    priority: 'medium',
    note: 'Ler nas férias.',
  }]));
  wishlistApi.update.mockRejectedValue(new Error('Falha ao atualizar item'));
  renderWithProviders(<WishlistPage />);

  await userEvent.click((await screen.findAllByRole('button', { name: 'Editar Dom Casmurro' }))[0]);
  const dialog = screen.getByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

  expect(await screen.findByText('Falha ao atualizar item')).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('remove um item da lista de desejos e atualiza a tela', async () => {
  wishlistApi.list
    .mockResolvedValueOnce(pageOf([{
      ...book(),
      bookId: 'b-1',
      priority: 'medium',
      note: 'Ler nas férias.',
    }]))
    .mockResolvedValueOnce(pageOf([]));
  wishlistApi.remove.mockResolvedValue('');
  renderWithProviders(<WishlistPage />);

  await userEvent.click((await screen.findAllByRole('button', { name: 'Remover Dom Casmurro' }))[0]);

  await waitFor(() => expect(wishlistApi.remove).toHaveBeenCalledWith('b-1'));
  expect(await screen.findByText('Lista de desejos vazia')).toBeInTheDocument();
  expect(wishlistApi.list).toHaveBeenCalledTimes(2);
});

it('mantém o item e mostra erro se a remoção falhar', async () => {
  wishlistApi.list.mockResolvedValue(pageOf([{
    ...book(),
    bookId: 'b-1',
    priority: 'medium',
    note: 'Ler nas férias.',
  }]));
  wishlistApi.remove.mockRejectedValue(new Error('Falha ao remover item'));
  renderWithProviders(<WishlistPage />);

  await userEvent.click((await screen.findAllByRole('button', { name: 'Remover Dom Casmurro' }))[0]);

  expect(await screen.findByText('Falha ao remover item')).toBeInTheDocument();
  expect(screen.getAllByText('Dom Casmurro').length).toBeGreaterThan(0);
});

it('mostra estado vazio quando não há itens na lista', async () => {
  wishlistApi.list.mockResolvedValue(pageOf([]));
  renderWithProviders(<WishlistPage />);

  expect(await screen.findByText('Lista de desejos vazia')).toBeInTheDocument();
});

it('mostra erro e permite tentar novamente quando a API falha', async () => {
  wishlistApi.list.mockRejectedValue(new Error('Falha ao carregar lista de desejos'));
  renderWithProviders(<WishlistPage />);

  expect(await screen.findByText('Falha ao carregar lista de desejos')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
});
