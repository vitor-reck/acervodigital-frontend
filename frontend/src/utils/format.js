const TIME_ZONE = 'America/Sao_Paulo';

export const API_URL = import.meta.env.VITE_API_URL ?? '';
export const FINE_PER_DAY = 2;
export const RENTAL_DAYS = 30;

const dateFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE });
const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, dateStyle: 'short', timeStyle: 'short' });
const moneyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '-');
export const formatDateTime = (value) => (value ? dateTimeFormat.format(new Date(value)) : '-');
export const formatMoney = (value) => moneyFormat.format(Number(value) || 0);
export const formatReleaseDate = (value) => (value ? value.replaceAll('-', '/') : '-');

export const toApiDate = (isoDate) => (isoDate ? isoDate.split('-').reverse().join('-') : '');
export const fromApiDate = (apiDate) => (apiDate ? apiDate.split('-').reverse().join('-') : '');

export const imageSrc = (url) => (url ? `${API_URL}${url}` : null);

export function initials(text = '') {
  const words = text.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : text.slice(0, 2)).toUpperCase();
}

export function daysFromToday(value) {
  const day = (date) => new Date(dateFormat.format(date).split('/').reverse().join('-'));
  return Math.round((day(new Date(value)) - day(new Date())) / 86400000);
}

export function dueLabel(value) {
  const days = daysFromToday(value);
  if (days === 0) return 'vence hoje';
  if (days === 1) return 'vence amanhã';
  if (days > 1) return `vence em ${days} dias`;
  return `venceu há ${-days} dia(s)`;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const compact = (params) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));
