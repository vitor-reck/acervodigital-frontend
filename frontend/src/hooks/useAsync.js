import { useCallback, useEffect, useState } from 'react';

export const PAGE_SIZE = 12;

export function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    load().then(
      (data) => active && setState({ data, loading: false, error: null }),
      (error) => active && setState({ data: null, loading: false, error }),
    );
    return () => {
      active = false;
    };
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...state, reload };
}

export function usePaged(load, deps = []) {
  const key = JSON.stringify(deps);
  const [cursor, setCursor] = useState({ key, page: 1 });
  const page = cursor.key === key ? cursor.page : 1;
  const state = useAsync(() => load({ page, pageSize: PAGE_SIZE }), [key, page]);

  return {
    ...state,
    items: state.data?.results ?? [],
    page,
    pages: Math.max(1, Math.ceil((state.data?.count ?? 0) / PAGE_SIZE)),
    setPage: (next) => setCursor({ key, page: next }),
  };
}
