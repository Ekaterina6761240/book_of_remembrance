import { ApiError } from '../../api/ApiError';
import { AuthError, type AuthService } from '../../services/AuthService';
import type { User } from '../../shared/types';
import type { WordPressApiClient } from '../client/WordPressApiClient';
import { mapAuthDto } from '../mappers/userMapper';

const toAuthError = (error: unknown): AuthError => {
  if (error instanceof ApiError) {
    const code = error.status === 401 || error.apiCode === 'invalid_credentials'
      ? 'invalid_credentials'
      : 'api_error';
    return new AuthError(code, error.message);
  }
  return new AuthError('api_error', 'Не удалось выполнить запрос авторизации.');
};

export class WordPressAuthService implements AuthService {
  private initialUser: User | null | undefined;

  constructor(private readonly client: WordPressApiClient, initialUser?: User | null) {
    this.initialUser = initialUser;
  }

  async login(login: string, password: string, remember: boolean): Promise<User> {
    this.initialUser = undefined;
    try {
      const response = mapAuthDto(await this.client.request('/auth/login', {
        method: 'POST',
        authenticated: false,
        body: { login, password, remember },
      }));
      this.client.setNonce(response.nonce);
      return response.user;
    } catch (error) {
      this.client.clearNonce();
      throw toAuthError(error);
    }
  }

  async logout(): Promise<void> {
    this.initialUser = undefined;
    try {
      await this.client.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      throw toAuthError(error);
    } finally {
      this.client.clearNonce();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.initialUser !== undefined) {
      const user = this.initialUser;
      this.initialUser = undefined;
      return this.client.hasNonce() ? user : null;
    }
    if (!this.client.hasNonce()) return null;

    try {
      const response = mapAuthDto(await this.client.request('/auth/me'));
      this.client.setNonce(response.nonce);
      return response.user;
    } catch (error) {
      if (
        error instanceof ApiError
        && (error.status === 401 || error.apiCode === 'rest_cookie_invalid_nonce' || error.apiCode === 'invalid_rest_nonce')
      ) {
        this.client.clearNonce();
        return null;
      }
      throw toAuthError(error);
    }
  }
}
