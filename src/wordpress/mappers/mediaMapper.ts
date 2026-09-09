import type { MediaFile } from '../../shared/types';
import type { WordPressMediaDto } from '../dto/types';
import {
  expectInteger,
  expectNullableInteger,
  expectNullableString,
  expectRecord,
  expectString,
} from './validation';

export const mapMediaDto = (value: unknown): MediaFile => {
  const context = 'media DTO';
  const dto = expectRecord(value, context);
  const parsed: WordPressMediaDto = {
    id: expectInteger(dto, 'id', context),
    url: expectString(dto, 'url', context),
    thumbnail_url: expectNullableString(dto, 'thumbnail_url', context) ?? null,
    name: expectString(dto, 'name', context),
    width: expectNullableInteger(dto, 'width', context) ?? null,
    height: expectNullableInteger(dto, 'height', context) ?? null,
  };

  return {
    id: parsed.id,
    url: parsed.url,
    thumbnailUrl: parsed.thumbnail_url ?? undefined,
    name: parsed.name,
    width: parsed.width ?? undefined,
    height: parsed.height ?? undefined,
  };
};
