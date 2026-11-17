import axios from 'axios';
import { API_URL } from '../utils/format';

const SESSION_KEY = 'acervo.session';

const MESSAGES = {
  'Invalid email or password.': 'E-mail ou senha incorretos.',
  'A user with this email already exists.': 'Este e-mail já está cadastrado.',
  'Book is unavailable for rental.': 'Não há exemplares disponíveis no momento.',
  'You already have an open reservation or rental for this book.': 'Você já possui uma reserva ou locação em aberto deste livro.',
  'You can only review books you have rented.': 'Você só pode avaliar livros que já retirou.',
  'You have already reviewed this book.': 'Você já avaliou este livro.',
  'Cannot delete a book with active rentals or reservations.': 'Não é possível remover um livro com locações ou reservas em aberto.',
  'Fine is already settled.': 'Esta multa já foi quitada.',
  'Reservation not found.': 'Reserva não encontrada.',
  'Rental not found.': 'Ticket não encontrado.',
  'Only reserved rentals can be picked up.': 'Somente reservas podem ser retiradas.',
  'Only active or overdue rentals can be returned.': 'Somente locações ativas ou atrasadas podem ser devolvidas.',
  'Only reservations not yet picked up can be cancelled.': 'Somente reservas ainda não retiradas podem ser canceladas.',
};

export const session = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },
  write(value) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
};

export function errorMessage(error) {
  if (!error.response) {
    return error.code === 'ECONNABORTED'
      ? 'A API demorou para responder. Tente novamente.'
      : 'Não foi possível conectar à API.';
  }
  const detail = error.response.data?.error;
  const raw = typeof detail === 'string' ? detail : detail ? Object.values(detail).flat()[0] : 'Erro inesperado.';
  return MESSAGES[raw] ?? raw;
}

export const client = axios.create({ baseURL: `${API_URL}/api/v1`, timeout: 90000 });

client.interceptors.request.use((config) => {
  const token = session.read()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && session.read()) {
      session.clear();
      window.dispatchEvent(new Event('acervo:logout'));
    }
    const failure = new Error(errorMessage(error));
    failure.status = error.response?.status;
    return Promise.reject(failure);
  },
);
