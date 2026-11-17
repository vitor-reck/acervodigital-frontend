import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { STATUS } from '../utils/labels';

export default function WishlistDialog({ open, title, initial, onClose, onSave }) {
  const [form, setForm] = useState({ priority: 'medium', note: '' });

  useEffect(() => {
    if (open) setForm({ priority: initial?.priority ?? 'medium', note: initial?.note ?? '' });
  }, [open, initial]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Prioridade" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            {Object.entries(STATUS.priority).map(([value, [label]]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField label="Observação" multiline minRows={2} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onSave(form)}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
