import type { District, Hero } from '../shared/types';

export type ScreenContentSnapshot = {
  version: number;
  districts: District[];
  heroes: Hero[];
  generatedAt?: string;
};

export interface ScreenContentRepository {
  getSnapshot(): Promise<ScreenContentSnapshot>;
  getVersion(): Promise<number>;
}
