import { useMemo } from 'react';

type UseLangResult = {
  lang: string;
};

export function useLang(): UseLangResult {
  const lang = useMemo(() => document.documentElement.lang || navigator.language || 'en', []);
  return { lang };
}

