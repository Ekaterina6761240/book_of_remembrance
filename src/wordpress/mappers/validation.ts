import { ApiError } from '../../api/ApiError';

export type UnknownRecord = Record<string, unknown>;

const malformed = (context: string, field?: string): never => {
  const suffix = field ? `: поле ${field}` : '';
  throw new ApiError(502, `WordPress API вернул некорректный ${context}${suffix}.`);
};

export const expectRecord = (value: unknown, context: string): UnknownRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) malformed(context);
  return value as UnknownRecord;
};

export const expectArray = (value: unknown, context: string, field?: string): unknown[] => {
  if (!Array.isArray(value)) malformed(context, field);
  return value as unknown[];
};

export const expectString = (record: UnknownRecord, field: string, context: string): string => {
  const value = record[field];
  if (typeof value !== 'string') malformed(context, field);
  return value as string;
};

export const expectInteger = (record: UnknownRecord, field: string, context: string): number => {
  const value = record[field];
  if (typeof value !== 'number' || !Number.isInteger(value)) malformed(context, field);
  return value as number;
};

export const expectNullableString = (
  record: UnknownRecord,
  field: string,
  context: string,
): string | undefined => {
  const value = record[field];
  if (value === null) return undefined;
  if (typeof value !== 'string') malformed(context, field);
  return value as string;
};

export const expectNullableInteger = (
  record: UnknownRecord,
  field: string,
  context: string,
): number | undefined => {
  const value = record[field];
  if (value === null) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value)) malformed(context, field);
  return value as number;
};

export const expectOptionalNullableString = (
  record: UnknownRecord,
  field: string,
  context: string,
): string | undefined => {
  if (!(field in record)) return undefined;
  return expectNullableString(record, field, context);
};
