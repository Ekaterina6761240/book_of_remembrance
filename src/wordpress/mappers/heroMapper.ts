import { ApiError } from '../../api/ApiError';
import type { PagedResult } from '../../repositories';
import type { Hero, HeroFormData, HeroStatus } from '../../shared/types';
import type {
  WordPressHeroDto,
  WordPressHeroStatus,
  WordPressHeroWriteDto,
  WordPressPagedHeroesDto,
} from '../dto/types';
import { mapMediaDto } from './mediaMapper';
import {
  expectArray,
  expectInteger,
  expectNullableString,
  expectOptionalNullableString,
  expectRecord,
  expectString,
} from './validation';

const mapStatus = (value: unknown): HeroStatus => {
  if (value === 'draft' || value === 'scheduled' || value === 'published') return value;
  throw new ApiError(502, 'WordPress API вернул некорректный статус героя.');
};

const parseHeroDto = (value: unknown, requireStatus: boolean): WordPressHeroDto => {
  const context = 'hero DTO';
  const dto = expectRecord(value, context);
  const mainImage = dto.main_image;
  if (mainImage !== null && (typeof mainImage !== 'object' || Array.isArray(mainImage))) {
    throw new ApiError(502, 'WordPress API вернул некорректный hero DTO: поле main_image.');
  }

  const gallery = expectArray(dto.gallery, context, 'gallery');
  const status = dto.status === undefined && !requireStatus ? undefined : mapStatus(dto.status);

  return {
    id: expectInteger(dto, 'id', context),
    first_name: expectString(dto, 'first_name', context),
    last_name: expectString(dto, 'last_name', context),
    middle_name: expectNullableString(dto, 'middle_name', context) ?? null,
    district_id: expectInteger(dto, 'district_id', context),
    birth_date: expectNullableString(dto, 'birth_date', context) ?? null,
    death_date: expectNullableString(dto, 'death_date', context) ?? null,
    main_image: mainImage === null ? null : mainImage as WordPressHeroDto['main_image'],
    biography: expectNullableString(dto, 'biography', context) ?? null,
    feat: expectNullableString(dto, 'feat', context) ?? null,
    awards: expectNullableString(dto, 'awards', context) ?? null,
    gallery: gallery as WordPressHeroDto['gallery'],
    status,
    published_at: expectOptionalNullableString(dto, 'published_at', context) ?? null,
  };
};

const toHero = (dto: WordPressHeroDto): Hero => ({
  id: dto.id,
  firstName: dto.first_name,
  lastName: dto.last_name,
  middleName: dto.middle_name ?? undefined,
  districtId: dto.district_id,
  birthDate: dto.birth_date ?? undefined,
  deathDate: dto.death_date ?? undefined,
  mainImage: dto.main_image === null ? undefined : mapMediaDto(dto.main_image),
  biography: dto.biography ?? undefined,
  feat: dto.feat ?? undefined,
  awards: dto.awards ?? undefined,
  gallery: dto.gallery.map(mapMediaDto),
  status: dto.status,
  publishedAt: dto.published_at ?? undefined,
});

export const mapHeroDto = (value: unknown): Hero => toHero(parseHeroDto(value, true));

export const mapPublicHeroDto = (value: unknown): Hero => toHero(parseHeroDto(value, false));

export const mapPagedHeroesDto = (value: unknown): PagedResult<Hero> => {
  const context = 'heroes page DTO';
  const dto = expectRecord(value, context);
  const parsed: WordPressPagedHeroesDto = {
    items: expectArray(dto.items, context, 'items') as WordPressHeroDto[],
    page: expectInteger(dto, 'page', context),
    per_page: expectInteger(dto, 'per_page', context),
    total: expectInteger(dto, 'total', context),
    total_pages: expectInteger(dto, 'total_pages', context),
  };

  return {
    items: parsed.items.map(mapHeroDto),
    page: parsed.page,
    perPage: parsed.per_page,
    total: parsed.total,
    totalPages: parsed.total_pages,
  };
};

const nullable = (value: string | undefined): string | null => value ?? null;

export const mapHeroFormData = (data: HeroFormData): WordPressHeroWriteDto => ({
  first_name: data.firstName,
  last_name: data.lastName,
  middle_name: nullable(data.middleName),
  district_id: data.districtId,
  birth_date: nullable(data.birthDate),
  death_date: nullable(data.deathDate),
  main_image_id: data.mainImage?.id ?? null,
  biography: nullable(data.biography),
  feat: nullable(data.feat),
  awards: nullable(data.awards),
  gallery_ids: data.gallery.map((item) => item.id),
  status: data.status as WordPressHeroStatus,
  published_at: nullable(data.publishedAt),
});
