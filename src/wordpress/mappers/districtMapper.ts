import type { District, DistrictFormData } from '../../shared/types';
import type { WordPressDistrictDto } from '../dto/types';
import { expectInteger, expectRecord, expectString } from './validation';

export const mapDistrictDto = (value: unknown): District => {
  const context = 'district DTO';
  const dto = expectRecord(value, context);
  const parsed: WordPressDistrictDto = {
    id: expectInteger(dto, 'id', context),
    name: expectString(dto, 'name', context),
    slug: expectString(dto, 'slug', context),
    sort_order: expectInteger(dto, 'sort_order', context),
  };

  return {
    id: parsed.id,
    name: parsed.name,
    slug: parsed.slug,
    sortOrder: parsed.sort_order,
  };
};

export const mapDistrictFormData = (data: DistrictFormData) => ({
  name: data.name,
  slug: data.slug,
  sort_order: data.sortOrder ?? null,
});
