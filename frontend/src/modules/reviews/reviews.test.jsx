import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { booksApi, rentalsApi, reviewsApi } from '../../api';
import { READER, book, pageOf, renderPage, rental } from '../../test/render';
import MyReviewsPage from './MyReviewsPage';
import ReviewFormPage from './ReviewFormPage';

vi.mock('../../api');

beforeEach(() => vi.clearAllMocks());

const review = (overrides = {}) => ({
  id: 'rv-1',
  bookId: 'b-1',
  userId: READER.id,
  userName: READER.name,
  bookTitle: 'O Cortiço',
  bookAuthor: 'Aluísio Azevedo',
  condition: 'good',
  rating: 5,
  comment: 'Retrato forte e atual da vida coletiva no Rio antigo.',
  createdAt: '2026-09-02T12:00:00Z',
  updatedAt: '2026-09-02T12:00:00Z',
  ...overrides,
});

describe('Minhas avaliações', () => {
  const render = () => renderPage(<MyReviewsPage />, { path: '/avaliacoes' });

  it('lista as avaliações do leitor', async () => {
    reviewsApi.mine.mockResolvedValue(
      pageOf([
        review(),
        review({ id: 'rv-2', bookId: 'b-2', bookTitle: 'Código Limpo', bookAuthor: 'Robert C. Martin', condition: 'worn', rating: 4, comment: 'Ótimo conteúdo.' }),
      ]),
    );
    render();

    expect(await screen.findByText('O Cortiço')).toBeInTheDocument();
    expect(screen.getByText('2 avaliações feitas')).toBeInTheDocument();
    expect(screen.getByText('Exemplar: Bom')).toBeInTheDocument();
    expect(screen.getByText('Exemplar: Desgastado')).toBeInTheDocument();
    expect(screen.getByText('Ótimo conteúdo.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Editar' })).toHaveLength(2);
  });

  it('mostra o estado vazio quando não há avaliações', async () => {
    reviewsApi.mine.mockResolvedValue(pageOf([]));
    render();

    expect(await screen.findByText('Você ainda não avaliou nenhum livro')).toBeInTheDocument();
  });

  it('indica livro removido e esconde o botão de editar', async () => {
    reviewsApi.mine.mockResolvedValue(pageOf([review({ bookTitle: null, bookAuthor: null })]));
    render();

    expect(await screen.findByText('Livro removido')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('exclui a avaliação depois de confirmar', async () => {
    reviewsApi.mine.mockResolvedValue(pageOf([review()]));
    reviewsApi.remove.mockResolvedValue({});
    render();

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Esta ação não pode ser desfeita/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(reviewsApi.remove).toHaveBeenCalledWith('rv-1'));
    await waitFor(() => expect(reviewsApi.mine).toHaveBeenCalledTimes(2));
  });

  it('não exclui quando o leitor cancela', async () => {
    reviewsApi.mine.mockResolvedValue(pageOf([review()]));
    render();

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(reviewsApi.remove).not.toHaveBeenCalled();
  });
});

describe('Avaliar livro', () => {
  const FORM = { path: '/acervo/:id/avaliar', route: '/acervo/b-1/avaliar' };

  const mockLoad = ({ reviews = [], rentals = [rental()] } = {}) => {
    booksApi.get.mockResolvedValue(book());
    booksApi.reviews.mockResolvedValue(pageOf(reviews));
    rentalsApi.mine.mockResolvedValue(pageOf(rentals));
  };

  it('envia uma nova avaliação', async () => {
    mockLoad();
    booksApi.review.mockResolvedValue({ id: 'rv-9' });
    renderPage(<ReviewFormPage />, FORM);

    expect(await screen.findByText('Conte como foi a leitura e o estado do exemplar que você retirou.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: '5 estrelas' }));
    await userEvent.click(screen.getByRole('combobox', { name: /Condição do exemplar/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Bom' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Comentário' }), 'Muito bom');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() => expect(booksApi.review).toHaveBeenCalledWith('b-1', { rating: 5, condition: 'good', comment: 'Muito bom' }));
    expect(await screen.findByText('Outra página')).toBeInTheDocument();
  });

  it('exige nota e condição antes de enviar', async () => {
    mockLoad();
    renderPage(<ReviewFormPage />, FORM);

    await userEvent.click(await screen.findByRole('button', { name: 'Enviar avaliação' }));

    expect(await screen.findByText('Informe a nota e a condição do exemplar.')).toBeInTheDocument();
    expect(booksApi.review).not.toHaveBeenCalled();
  });

  it('bloqueia a avaliação de quem ainda não retirou o livro', async () => {
    mockLoad({ rentals: [rental({ status: 'reserved' })] });
    renderPage(<ReviewFormPage />, FORM);

    expect(await screen.findByText('Avaliação indisponível')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar avaliação' })).not.toBeInTheDocument();
  });

  it('edita a avaliação que o leitor já fez', async () => {
    mockLoad({ reviews: [review({ rating: 4, condition: 'worn', comment: 'Bom' })], rentals: [] });
    reviewsApi.update.mockResolvedValue({ id: 'rv-1' });
    renderPage(<ReviewFormPage />, FORM);

    expect(await screen.findByRole('heading', { name: 'Editar avaliação' })).toBeInTheDocument();
    expect(screen.getByText('Você avaliou este livro em 02/09/2026. Altere os campos abaixo e salve.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: '5 estrelas' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(reviewsApi.update).toHaveBeenCalledWith('rv-1', { rating: 5, condition: 'worn', comment: 'Bom' }));
    expect(booksApi.review).not.toHaveBeenCalled();
  });
});