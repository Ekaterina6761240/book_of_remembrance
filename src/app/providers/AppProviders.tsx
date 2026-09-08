import { type PropsWithChildren, useState } from 'react';
import { AuthProvider } from './AuthProvider';
import { createRuntimeAdapters } from './runtime';
import { ServicesProvider } from './ServicesProvider';

export function AppProviders({ children }: PropsWithChildren) {
  const [runtime] = useState(createRuntimeAdapters);

  return (
    <AuthProvider authService={runtime.auth}>
      <ServicesProvider repositories={runtime.repositories}>{children}</ServicesProvider>
    </AuthProvider>
  );
}
