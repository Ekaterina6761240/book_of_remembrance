import type { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthProvider';
import { ServicesProvider } from './ServicesProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <ServicesProvider>{children}</ServicesProvider>
    </AuthProvider>
  );
}
