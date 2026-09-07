import type { User } from '../shared/types';

export interface AuthService {
  login(login: string, password: string, remember: boolean): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

export type AuthErrorCode = 'invalid_credentials' | 'api_error';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
