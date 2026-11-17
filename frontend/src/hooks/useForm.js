import { useEffect, useState } from 'react';

export function useForm(initial) {
  const [form, setForm] = useState(initial);
  const field = (name) => ({
    name,
    value: form[name],
    onChange: (event) => setForm((current) => ({ ...current, [name]: event.target.value })),
  });
  return { form, setForm, field };
}

export function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
