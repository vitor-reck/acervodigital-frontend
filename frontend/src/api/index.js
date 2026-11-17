import { client } from './client';

const get = (url, params) => client.get(url, { params }).then((response) => response.data);
const send = (method, url, data) => client.request({ method, url, data }).then((response) => response.data);

export const ALL = { pageSize: 100 };

export const authApi = {
  login: (credentials) => send('post', '/auth/login', credentials),
  register: (data) => send('post', '/auth/register', data),
};

export const booksApi = {
  list: (params) => get('/books/', params),
  get: (id) => get(`/books/${id}`),
  create: (data) => send('post', '/books/', data),
  update: (id, data) => send('put', `/books/${id}`, data),
  remove: (id) => send('delete', `/books/${id}`),
  reviews: (id, params) => get(`/books/${id}/reviews`, params),
  review: (id, data) => send('post', `/books/${id}/reviews`, data),
};

export const reviewsApi = {
  mine: (params) => get('/reviews/me', params),
  update: (id, data) => send('put', `/reviews/${id}`, data),
  remove: (id) => send('delete', `/reviews/${id}`),
};

export const rentalsApi = {
  mine: (params) => get('/rentals/me', params),
  list: (params) => get('/rentals/', params),
  ofUser: (userId, params) => get(`/rentals/user/${userId}`, params),
  circulation: (params) => get('/rentals/circulation', params),
  reserve: (bookId) => send('post', '/rentals/', { bookId }),
  cancelMine: (id) => send('delete', `/rentals/me/${id}`),
  cancel: (id) => send('delete', `/rentals/${id}`),
  pickup: (ticketCode) => send('put', `/rentals/pickup/${encodeURIComponent(ticketCode)}`),
  giveBack: (ticketCode) => send('put', `/rentals/return/${encodeURIComponent(ticketCode)}`),
};

export const finesApi = {
  mine: (params) => get('/fines/me', params),
  list: (params) => get('/fines/', params),
  ofUser: (userId, params) => get(`/fines/user/${userId}`, params),
  settle: (id) => send('put', `/fines/${id}/settle`),
};

export const favoritesApi = {
  list: (params) => get('/favorites/', params),
  add: (bookId) => send('post', `/favorites/${bookId}`),
  remove: (bookId) => send('delete', `/favorites/${bookId}`),
};

export const wishlistApi = {
  list: (params) => get('/wishlist/', params),
  add: (bookId, data) => send('post', `/wishlist/${bookId}`, data),
  update: (bookId, data) => send('put', `/wishlist/${bookId}`, data),
  remove: (bookId) => send('delete', `/wishlist/${bookId}`),
};

export const notificationsApi = {
  list: (params) => get('/notifications/', params),
  read: (id) => send('put', `/notifications/${id}/read`),
  remove: (id) => send('delete', `/notifications/${id}`),
};

export const jobsApi = {
  list: (params) => get('/jobs/', params),
};

export const usersApi = {
  list: (params) => get('/users/', params),
  get: (id) => get(`/users/${id}`),
};
