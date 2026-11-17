import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import LocalLibraryOutlined from '@mui/icons-material/LocalLibraryOutlined';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import PaidOutlined from '@mui/icons-material/PaidOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import TerminalOutlined from '@mui/icons-material/TerminalOutlined';
import StarBorder from '@mui/icons-material/StarBorder';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import { lazy } from 'react';

const page = (load, name) => lazy(() => load().then((module) => ({ default: module[name] })));
const dashboard = () => import('./modules/dashboard');
const notifications = () => import('./modules/notifications');
const jobs = () => import('./modules/jobs');
const catalog = () => import('./modules/catalog');
const rentals = () => import('./modules/rentals');
const fines = () => import('./modules/fines');
const readers = () => import('./modules/readers');
const reviews = () => import('./modules/reviews');
const favorites = () => import('./modules/favorites');
const wishlist = () => import('./modules/wishlist');

const DashboardPage = page(dashboard, 'DashboardPage');
const NotificationsPage = page(notifications, 'NotificationsPage');
const JobsPage = page(jobs, 'JobsPage');
const CatalogPage = page(catalog, 'CatalogPage');
const BookDetailPage = page(catalog, 'BookDetailPage');
const BookFormPage = page(catalog, 'BookFormPage');
const RentalsPage = page(rentals, 'RentalsPage');
const CirculationPage = page(rentals, 'CirculationPage');
const FinesPage = page(fines, 'FinesPage');
const ReadersPage = page(readers, 'ReadersPage');
const ReaderDetailPage = page(readers, 'ReaderDetailPage');
const MyReviewsPage = page(reviews, 'MyReviewsPage');
const ReviewFormPage = page(reviews, 'ReviewFormPage');
const FavoritesPage = page(favorites, 'FavoritesPage');
const WishlistPage = page(wishlist, 'WishlistPage');

const READER = ['user'];
const LIBRARIAN = ['librarian'];

export const ROUTES = [
  { path: '/', element: <DashboardPage /> },
  { path: '/acervo', element: <CatalogPage /> },
  { path: '/acervo/novo', element: <BookFormPage />, roles: LIBRARIAN },
  { path: '/acervo/:id', element: <BookDetailPage /> },
  { path: '/acervo/:id/editar', element: <BookFormPage />, roles: LIBRARIAN },
  { path: '/acervo/:id/avaliar', element: <ReviewFormPage />, roles: READER },
  { path: '/locacoes', element: <RentalsPage /> },
  { path: '/circulacao', element: <CirculationPage />, roles: LIBRARIAN },
  { path: '/multas', element: <FinesPage /> },
  { path: '/leitores', element: <ReadersPage />, roles: LIBRARIAN },
  { path: '/leitores/:id', element: <ReaderDetailPage />, roles: LIBRARIAN },
  { path: '/avaliacoes', element: <MyReviewsPage />, roles: READER },
  { path: '/favoritos', element: <FavoritesPage />, roles: READER },
  { path: '/desejos', element: <WishlistPage />, roles: READER },
  { path: '/notificacoes', element: <NotificationsPage />, roles: READER },
  { path: '/jobs', element: <JobsPage />, roles: LIBRARIAN },
];

export const NAVIGATION = {
  user: [
    { section: 'Visão geral', items: [{ to: '/', label: 'Dashboard', icon: DashboardOutlined }] },
    { section: 'Biblioteca', items: [{ to: '/acervo', label: 'Catálogo', icon: LocalLibraryOutlined }] },
    {
      section: 'Minha área',
      items: [
        { to: '/locacoes', label: 'Minhas locações', icon: ScheduleOutlined },
        { to: '/multas', label: 'Minhas multas', icon: PaidOutlined },
        { to: '/avaliacoes', label: 'Minhas avaliações', icon: StarBorder },
        { to: '/favoritos', label: 'Favoritos', icon: FavoriteBorder },
        { to: '/desejos', label: 'Lista de desejos', icon: BookmarkBorder },
        { to: '/notificacoes', label: 'Notificações', icon: NotificationsNone },
      ],
    },
  ],
  librarian: [
    { section: 'Visão geral', items: [{ to: '/', label: 'Dashboard', icon: DashboardOutlined }] },
    {
      section: 'Acervo',
      items: [
        { to: '/acervo', label: 'Catálogo', icon: LocalLibraryOutlined },
        { to: '/acervo/novo', label: 'Cadastrar livro', icon: AddCircleOutlined },
      ],
    },
    {
      section: 'Operação',
      items: [
        { to: '/circulacao', label: 'Retirada e devolução', icon: ConfirmationNumberOutlined },
        { to: '/locacoes', label: 'Locações', icon: ScheduleOutlined },
        { to: '/multas', label: 'Multas', icon: PaidOutlined },
        { to: '/leitores', label: 'Leitores', icon: PeopleOutlined },
      ],
    },
    { section: 'Administração', items: [{ to: '/jobs', label: 'Logs do job diário', icon: TerminalOutlined }] },
  ],
};
