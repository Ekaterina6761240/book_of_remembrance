import { AuthError, type AuthService } from '../../services/AuthService';
import type { User } from '../../shared/types';
import { clone } from '../../shared/utils';
import { mockStaffUser } from '../fixtures/user';

const SESSION_COOKIE = 'museum_mock_session';
const SESSION_MARKER = 'staff-session-v1';
const MOCK_PASSWORD = 'admin';

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const readCookie = (name: string): string | null => {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
};

export class MockAuthService implements AuthService {
  async login(login: string, password: string): Promise<User> {
    await delay(450);

    if (login.trim().toLowerCase() === 'api-error') {
      throw new AuthError('api_error', 'Сервис временно недоступен. Попробуйте ещё раз.');
    }

    if (login.trim().toLowerCase() !== mockStaffUser.username || password !== MOCK_PASSWORD) {
      throw new AuthError('invalid_credentials', 'Неверный логин или пароль');
    }

    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(SESSION_MARKER)}; Path=/; SameSite=Lax`;
    return clone(mockStaffUser);
  }

  async logout(): Promise<void> {
    await delay(150);
    document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  async getCurrentUser(): Promise<User | null> {
    await delay(250);
    if (readCookie(SESSION_COOKIE) !== SESSION_MARKER) {
      return null;
    }
    return clone(mockStaffUser);
  }
}
