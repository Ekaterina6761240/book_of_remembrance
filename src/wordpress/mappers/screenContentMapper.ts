import type { ScreenContentSnapshot } from '../../repositories';
import type { WordPressScreenSnapshotDto } from '../dto/types';
import { mapDistrictDto } from './districtMapper';
import { mapPublicHeroDto } from './heroMapper';
import { expectArray, expectInteger, expectRecord, expectString } from './validation';

export const mapScreenSnapshotDto = (value: unknown): ScreenContentSnapshot => {
  const context = 'screen snapshot DTO';
  const dto = expectRecord(value, context);
  const parsed: WordPressScreenSnapshotDto = {
    version: expectInteger(dto, 'version', context),
    generated_at: expectString(dto, 'generated_at', context),
    districts: expectArray(dto.districts, context, 'districts') as WordPressScreenSnapshotDto['districts'],
    heroes: expectArray(dto.heroes, context, 'heroes') as WordPressScreenSnapshotDto['heroes'],
  };

  return {
    version: parsed.version,
    generatedAt: parsed.generated_at,
    districts: parsed.districts.map(mapDistrictDto),
    heroes: parsed.heroes.map(mapPublicHeroDto),
  };
};

export const mapScreenVersionDto = (value: unknown): number => {
  const dto = expectRecord(value, 'screen version DTO');
  return expectInteger(dto, 'version', 'screen version DTO');
};
