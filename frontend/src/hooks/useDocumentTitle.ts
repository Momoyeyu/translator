import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const appName = import.meta.env.VITE_APP_NAME || 'Arco Boilerplate';
    document.title = title ? `${title} - ${appName}` : appName;
  }, [title]);
}
