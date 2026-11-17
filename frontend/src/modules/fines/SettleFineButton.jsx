import { useState } from 'react';
import { Button } from '@mui/material';
import { finesApi } from '../../api';
import { useFeedback } from '../../components/Feedback';
import { formatMoney } from '../../utils/format';

// Compartilhado entre /multas e /leitores/:id. Só exibe o botão para multa pendente.
export default function SettleFineButton({ fine, onSettled }) {
  const { confirm, run } = useFeedback();
  const [busy, setBusy] = useState(false);

  if (fine.status !== 'pending') return null;

  const settle = async () => {
    const confirmed = await confirm({
      title: 'Quitar multa',
      message: `Confirmar o recebimento de ${formatMoney(fine.amount)} de ${fine.userName} (${fine.bookTitle})?`,
      confirmLabel: 'Quitar',
    });
    if (!confirmed) return;

    setBusy(true);
    await run(() => finesApi.settle(fine.id), 'Multa quitada.');
    setBusy(false);
    // Recarrega mesmo em caso de erro: se outro bibliotecário já quitou (409), a lista passa a mostrar o estado real.
    onSettled();
  };

  return <Button size="small" variant="contained" disabled={busy} onClick={settle}>Quitar</Button>;
}
