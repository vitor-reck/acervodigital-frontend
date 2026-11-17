export const STATUS = {
  rental: {
    reserved: ['Reservada', 'warning'],
    active: ['Ativa', 'info'],
    overdue: ['Atrasada', 'error'],
    returned: ['Devolvida', 'success'],
    cancelled: ['Cancelada', 'default'],
  },
  fine: { pending: ['Pendente', 'error'], settled: ['Quitada', 'success'] },
  job: { success: ['Sucesso', 'success'], failed: ['Falha', 'error'] },
  priority: { high: ['Alta', 'error'], medium: ['Média', 'warning'], low: ['Baixa', 'default'] },
};

export const OPEN_RENTAL_STATUSES = ['reserved', 'active', 'overdue'];
export const REVIEWABLE_RENTAL_STATUSES = ['active', 'overdue', 'returned'];

export const CONDITIONS = { new: 'Novo', good: 'Bom', worn: 'Desgastado', damaged: 'Danificado' };

export const NOTIFICATION_TYPES = {
  due_date_reminder: 'Vencimento hoje',
  fine_generated: 'Multa gerada',
  fine_settled: 'Multa quitada',
};

export const GENRES = [
  'Romance',
  'Literatura Brasileira',
  'Poesia',
  'Ficção Científica',
  'Fantasia',
  'História',
  'Tecnologia',
  'Exatas',
  'Biografia',
];
