import { afterEach, describe, expect, it, vi } from 'vitest';
import { WordPressApiClient } from '../../../src/wordpress/client/WordPressApiClient';
import { WordPressAuthService } from '../../../src/wordpress/services/WordPressAuthService';

const authDto = (nonce: string) => ({
  user: {
    id: 7,
    username: 'museum-test',
    display_name: 'Museum Test',
    email: 'museum@example.test',
    role: 'editor',
  },
  nonce,
});

class TestHeaders {
  private readonly values = new Map<string, string>();

  constructor(initial?: HeadersInit) {
    if (initial instanceof TestHeaders) {
      initial.values.forEach((value, key) => this.values.set(key, value));
    }
  }

  set(name: string, value: string): void {
    this.values.set(name.toLowerCase(), value);
  }

  get(name: string): string | null {
    return this.values.get(name.toLowerCase()) ?? null;
  }

  has(name: string): boolean {
    return this.values.has(name.toLowerCase());
  }
}

const jsonResponse = (value: unknown, status = 200): Response => ({
  status,
  ok: status >= 200 && status < 300,
  text: async () => JSON.stringify(value),
}) as Response;

const emptyResponse = (status: number): Response => ({
  status,
  ok: status >= 200 && status < 300,
  text: async () => '',
}) as Response;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WordPressAuthService', () => {
  it('does not send a nonce for login, then uses and refreshes the in-memory nonce', async () => {
    vi.stubGlobal('Headers', TestHeaders);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(authDto('login-nonce')))
      .mockResolvedValueOnce(jsonResponse(authDto('fresh-nonce')))
      .mockResolvedValueOnce(emptyResponse(204));
    vi.stubGlobal('fetch', fetchMock);

    const client = new WordPressApiClient('/wp-json/museum/v1');
    const service = new WordPressAuthService(client);

    await service.login('museum-test', 'secret', true);
    await service.getCurrentUser();
    await service.logout();

    const loginInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const meInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const logoutInit = fetchMock.mock.calls[2]?.[1] as RequestInit;
    expect(new Headers(loginInit.headers).has('X-WP-Nonce')).toBe(false);
    expect(JSON.parse(String(loginInit.body))).toEqual({
      login: 'museum-test',
      password: 'secret',
      remember: true,
    });
    expect(new Headers(meInit.headers).get('X-WP-Nonce')).toBe('login-nonce');
    expect(new Headers(logoutInit.headers).get('X-WP-Nonce')).toBe('fresh-nonce');
    expect(loginInit.credentials).toBe('include');
    expect(client.hasNonce()).toBe(false);
  });

  it('does not attempt auth/me when the memory-only nonce is absent', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const service = new WordPressAuthService(new WordPressApiClient('/wp-json/museum/v1'));

    await expect(service.getCurrentUser()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
