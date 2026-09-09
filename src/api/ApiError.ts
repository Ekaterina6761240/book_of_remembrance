export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly apiCode?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
