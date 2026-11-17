import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { session } from '../api/client';
import { AuthProvider } from '../auth/AuthContext';
import { FeedbackProvider } from '../components/Feedback';
import { theme } from '../theme';

export const READER = { id: 'u1', name: 'Ana Souza', email: 'ana@acervo.com', role: 'user' };
export const LIBRARIAN = { id: 'b1', name: 'Bia Lima', email: 'bia@acervo.com', role: 'librarian' };

export const pageOf = (results) => ({ count: results.length, next: null, previous: null, results });

export function signIn(user) {
  if (user) session.write({ token: 'token', user, expiresAt: Date.now() + 60_000 });
}

export function renderWithProviders(ui, { user = READER, route = '/' } = {}) {
  signIn(user);
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <FeedbackProvider>{ui}</FeedbackProvider>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

export function renderPage(element, { path = '/', route = path, user } = {}) {
  return renderWithProviders(
    <Routes>
      <Route path={path} element={element} />
      <Route path="*" element={<p>Outra página</p>} />
    </Routes>,
    { route, user },
  );
}

export const book = (overrides = {}) => ({
  id: 'b-1',
  title: 'Dom Casmurro',
  author: 'Machado de Assis',
  genre: 'Romance',
  releaseDate: '01-01-1899',
  stock: 2,
  synopsis: 'Bentinho e Capitu.',
  imageUrl: null,
  averageRating: 4.5,
  reviewCount: 2,
  ...overrides,
});

export const rental = (overrides = {}) => ({
  id: 'r-1',
  userId: READER.id,
  userName: READER.name,
  bookId: 'b-1',
  bookTitle: 'Dom Casmurro',
  bookAuthor: 'Machado de Assis',
  ticketCode: 'RET-20261016-4B1F9A2C',
  status: 'active',
  rentalDate: '2026-10-10T12:00:00Z',
  dueDate: '2026-11-09T12:00:00Z',
  returnDate: null,
  createdAt: '2026-10-08T12:00:00Z',
  updatedAt: '2026-10-10T12:00:00Z',
  ...overrides,
});
