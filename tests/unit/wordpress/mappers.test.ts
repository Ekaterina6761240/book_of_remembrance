import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../src/api/ApiError';
import { mapDistrictDto } from '../../../src/wordpress/mappers/districtMapper';
import { mapHeroDto, mapHeroFormData } from '../../../src/wordpress/mappers/heroMapper';

const mediaDto = {
  id: 31,
  url: 'https://example.test/full.jpg',
  thumbnail_url: 'https://example.test/thumb.jpg',
  name: 'Portrait',
  width: 1200,
  height: 800,
};

const heroDto = {
  id: 12,
  first_name: 'Иван',
  last_name: 'Иванов',
  middle_name: 'Иванович',
  district_id: 4,
  birth_date: '1920-01-01',
  death_date: null,
  main_image: mediaDto,
  biography: 'Биография',
  feat: null,
  awards: null,
  gallery: [mediaDto],
  status: 'scheduled',
  published_at: '2030-05-01T12:30:00+03:00',
};

describe('WordPress DTO mappers', () => {
  it('maps snake_case hero data into the domain and back into a write DTO', () => {
    const hero = mapHeroDto(heroDto);

    expect(hero).toMatchObject({
      firstName: 'Иван',
      lastName: 'Иванов',
      middleName: 'Иванович',
      districtId: 4,
      mainImage: { id: 31, thumbnailUrl: 'https://example.test/thumb.jpg' },
      gallery: [{ id: 31 }],
      status: 'scheduled',
      publishedAt: '2030-05-01T12:30:00+03:00',
    });

    expect(mapHeroFormData({ ...hero, status: 'scheduled' })).toMatchObject({
      first_name: 'Иван',
      last_name: 'Иванов',
      middle_name: 'Иванович',
      district_id: 4,
      main_image_id: 31,
      gallery_ids: [31],
      published_at: '2030-05-01T12:30:00+03:00',
    });
  });

  it('uses district name as the display field and preserves slug separately', () => {
    expect(mapDistrictDto({ id: 2, name: 'Центральный район', slug: 'central', sort_order: 10 }))
      .toEqual({ id: 2, name: 'Центральный район', slug: 'central', sortOrder: 10 });
  });

  it('rejects malformed required response fields', () => {
    expect(() => mapHeroDto({ ...heroDto, gallery: null })).toThrow(ApiError);
    expect(() => mapDistrictDto({ id: 2, name: 'Район', slug: 'district' })).toThrow(/sort_order/);
  });
});
