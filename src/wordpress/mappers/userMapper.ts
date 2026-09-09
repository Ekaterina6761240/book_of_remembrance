import { ApiError } from '../../api/ApiError';
import type { User, UserRole } from '../../shared/types';
import type { WordPressAuthDto, WordPressUserDto } from '../dto/types';
import { expectInteger, expectRecord, expectString } from './validation';

const mapRole = (value: string): UserRole => {
  if (value === 'editor' || value === 'administrator') return value;
  throw new ApiError(502, 'WordPress API вернул некорректную роль пользователя.');
};

export const mapUserDto = (value: unknown): User => {
  const context = 'user DTO';
  const dto = expectRecord(value, context);
  const parsed: WordPressUserDto = {
    id: expectInteger(dto, 'id', context),
    username: expectString(dto, 'username', context),
    display_name: expectString(dto, 'display_name', context),
    email: expectString(dto, 'email', context),
    role: expectString(dto, 'role', context),
  };

  return {
    id: parsed.id,
    username: parsed.username,
    displayName: parsed.display_name,
    email: parsed.email || undefined,
    role: mapRole(parsed.role),
  };
};

export const mapAuthDto = (value: unknown): { user: User; nonce: string } => {
  const context = 'auth DTO';
  const dto = expectRecord(value, context);
  const parsed: WordPressAuthDto = {
    user: dto.user as WordPressUserDto,
    nonce: expectString(dto, 'nonce', context),
  };
  if (parsed.nonce.trim() === '') throw new ApiError(502, 'WordPress API вернул пустой REST nonce.');
  return { user: mapUserDto(parsed.user), nonce: parsed.nonce };
};
