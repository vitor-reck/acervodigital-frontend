import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar } from '@mui/material';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null);

  const notify = useCallback((message, severity = 'success') => setToast({ message, severity, key: Date.now() }), []);

  const run = useCallback(
    async (action, successMessage) => {
      try {
        const result = await action();
        if (successMessage) notify(successMessage);
        return result ?? true;
      } catch (error) {
        notify(error.message, 'error');
        return undefined;
      }
    },
    [notify],
  );

  const confirm = useCallback(
    (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
    [],
  );

  const close = (answer) => {
    dialog.resolve(answer);
    setDialog(null);
  };

  const value = useMemo(() => ({ notify, run, confirm }), [notify, run, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar open={!!toast} key={toast?.key} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.message}</Alert> : undefined}
      </Snackbar>
      <Dialog open={!!dialog} onClose={() => close(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog?.title}</DialogTitle>
        <DialogContent>{dialog?.message}</DialogContent>
        <DialogActions>
          <Button onClick={() => close(false)}>{dialog?.cancelLabel ?? 'Cancelar'}</Button>
          <Button variant="contained" color={dialog?.danger ? 'error' : 'primary'} onClick={() => close(true)} autoFocus>
            {dialog?.confirmLabel ?? 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);
