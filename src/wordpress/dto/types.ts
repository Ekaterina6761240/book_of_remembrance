export type WordPressUserDto = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: string;
};

export type WordPressAuthDto = {
  user: WordPressUserDto;
  nonce: string;
};

export type WordPressMediaDto = {
  id: number;
  url: string;
  thumbnail_url: string | null;
  name: string;
  width: number | null;
  height: number | null;
};

export type WordPressDistrictDto = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
};

export type WordPressHeroStatus = 'draft' | 'scheduled' | 'published';

export type WordPressHeroDto = {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  district_id: number;
  birth_date: string | null;
  death_date: string | null;
  main_image: WordPressMediaDto | null;
  biography: string | null;
  feat: string | null;
  awards: string | null;
  gallery: WordPressMediaDto[];
  status?: WordPressHeroStatus;
  published_at?: string | null;
};

export type WordPressHeroWriteDto = {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  district_id: number;
  birth_date: string | null;
  death_date: string | null;
  main_image_id: number | null;
  biography: string | null;
  feat: string | null;
  awards: string | null;
  gallery_ids: number[];
  status: WordPressHeroStatus;
  published_at: string | null;
};

export type WordPressPagedHeroesDto = {
  items: WordPressHeroDto[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type WordPressScreenSnapshotDto = {
  version: number;
  generated_at: string;
  districts: WordPressDistrictDto[];
  heroes: WordPressHeroDto[];
};

export type WordPressScreenVersionDto = {
  version: number;
};
