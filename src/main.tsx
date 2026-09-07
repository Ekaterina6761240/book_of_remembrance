import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource/golos-text/cyrillic-400.css';
import '@fontsource/golos-text/latin-400.css';
import '@fontsource/golos-text/cyrillic-500.css';
import '@fontsource/golos-text/latin-500.css';
import '@fontsource/golos-text/cyrillic-600.css';
import '@fontsource/golos-text/latin-600.css';
import '@fontsource/martian-mono/cyrillic-500.css';
import '@fontsource/martian-mono/latin-500.css';
import '@fontsource/martian-mono/cyrillic-600.css';
import '@fontsource/martian-mono/latin-600.css';
import { AppProviders } from './app/providers/AppProviders';
import { router } from './app/router';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element was not found');
}

rootElement.classList.add('book-of-remembrance-root');

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
