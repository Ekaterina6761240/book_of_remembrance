import { ApiError } from '../../api/ApiError';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
  headers?: HeadersInit;
};

type UploadOptions = {
  authenticated?: boolean;
  onProgress?: (progress: number) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const joinUrl = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

export class WordPressApiClient {
  private nonce: string | null = null;

  constructor(private readonly baseUrl: string) {}

  hasNonce(): boolean {
    return this.nonce !== null;
  }

  setNonce(nonce: string): void {
    if (nonce.trim() === '') throw new ApiError(502, 'WordPress вернул пустой REST nonce.');
    this.nonce = nonce;
  }

  clearNonce(): void {
    this.nonce = null;
  }

  async request(path: string, options: RequestOptions = {}): Promise<unknown> {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    this.addNonce(headers, options.authenticated ?? true);

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(joinUrl(this.baseUrl, path), {
        method: options.method ?? 'GET',
        credentials: 'include',
        headers,
        body,
      });
    } catch {
      throw new ApiError(0, 'Не удалось подключиться к WordPress API.');
    }

    return this.readResponse(response.status, response.ok, await response.text());
  }

  upload(path: string, formData: FormData, options: UploadOptions = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('POST', joinUrl(this.baseUrl, path));
      request.withCredentials = true;
      request.setRequestHeader('Accept', 'application/json');

      try {
        const nonce = this.requireNonce(options.authenticated ?? true);
        if (nonce) request.setRequestHeader('X-WP-Nonce', nonce);
      } catch (error) {
        reject(error);
        return;
      }

      request.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          options.onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      });
      request.addEventListener('load', () => {
        try {
          resolve(this.readResponse(request.status, request.status >= 200 && request.status < 300, request.responseText));
        } catch (error) {
          reject(error);
        }
      });
      request.addEventListener('error', () => reject(new ApiError(0, 'Не удалось подключиться к WordPress API.')));
      request.addEventListener('abort', () => reject(new ApiError(0, 'Загрузка была отменена.')));
      request.send(formData);
    });
  }

  private addNonce(headers: Headers, authenticated: boolean): void {
    const nonce = this.requireNonce(authenticated);
    if (nonce) headers.set('X-WP-Nonce', nonce);
  }

  private parseJson(status: number, text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ApiError(status || 502, 'WordPress API вернул некорректный JSON.');
    }
  }

  private requireNonce(authenticated: boolean): string | null {
    if (!authenticated) return null;
    if (!this.nonce) throw new ApiError(401, 'REST nonce отсутствует. Выполните вход заново.');
    return this.nonce;
  }

  private readResponse(status: number, ok: boolean, text: string): unknown {
    if (text.trim() === '') {
      if (ok) return undefined;
      throw new ApiError(status, `WordPress API вернул HTTP ${status}.`);
    }

    const payload = this.parseJson(ok ? 502 : status, text);

    if (!ok) {
      const message = isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : `WordPress API вернул HTTP ${status}.`;
      const code = isRecord(payload) && typeof payload.code === 'string' ? payload.code : undefined;
      throw new ApiError(status, message, code);
    }
    return payload;
  }
}
