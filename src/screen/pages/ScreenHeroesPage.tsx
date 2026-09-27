import { type FormEvent, type MouseEvent, useMemo, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { HeroesScroller } from '../components/HeroesScroller';
import { ScreenHeroCard } from '../components/ScreenHeroCard';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { useScreenHeroes } from '../hooks/useScreenHeroes';
import { filterAndSortHeroes, normalizeRussianText, RUSSIAN_ALPHABET } from '../utils/heroes';
import { guardScreenLinkNavigation } from '../utils/navigationGuard';
import styles from './ScreenHeroesPage.module.css';

const parseDistrictId = (value: string | null): number | null => {
  if (!value || !/^\d+$/.test(value)) return null;
  const districtId = Number(value);
  return Number.isSafeInteger(districtId) && districtId > 0 ? districtId : null;
};

export function ScreenHeroesPage() {
  const { heroes, isLoading, error } = useScreenHeroes();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeHeroId, setActiveHeroId] = useState<number | null>(null);
  const [pressedHeroId, setPressedHeroId] = useState<number | null>(null);
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const districtId = parseDistrictId(searchParams.get('district'));
  const isCompactViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;

  const visibleHeroes = useMemo(
    () => filterAndSortHeroes(heroes, { districtId, firstLetter: activeLetter, query }),
    [activeLetter, districtId, heroes, query],
  );

  const normalizedQuery = normalizeRussianText(query);
  const hasActiveFilter = Boolean(activeLetter || normalizedQuery);

  const changeQuery = (value: string) => {
    setQuery(value);
    setActiveLetter(null);
    setActiveHeroId(null);
  };

  const clearQuery = () => {
    setQuery('');
    setActiveHeroId(null);
  };

  const handleLetter = (letter: string) => {
    setActiveLetter((current) => current === letter ? null : letter);
    setQuery('');
    setActiveHeroId(null);
    setKeyboardOpen(false);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCompactViewport) {
      setKeyboardOpen(true);
      event.currentTarget.querySelector('input')?.blur();
      return;
    }
    setKeyboardOpen(false);
  };

  const handleBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isCompactViewport && isKeyboardOpen) {
      event.preventDefault();
      setKeyboardOpen(false);
      return;
    }
    guardScreenLinkNavigation(event);
  };

  const appendVirtualKey = (key: string) => {
    setActiveLetter(null);
    setActiveHeroId(null);
    setQuery((current) => {
      const shouldCapitalize = current.length === 0 || /[\s-]$/.test(current);
      return current + (shouldCapitalize ? key : key.toLocaleLowerCase('ru-RU'));
    });
  };

  return (
    <main className={styles.page} data-keyboard-open={isKeyboardOpen || undefined} data-has-query={normalizedQuery || undefined}>
      <header className={styles.header}>
        <Link className={styles.backLink} to={ROUTES.screenDistricts} onClick={handleBack} aria-label="Вернуться к выбору района">
          <span className={styles.backIcon}><ArrowLeft aria-hidden="true" strokeWidth={1.35} /></span>
          <span>Назад</span>
        </Link>

        <form className={styles.searchForm} role="search" onSubmit={handleSearch}>
          <div className={styles.searchField}>
            <input
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              onFocus={() => setKeyboardOpen(true)}
              onClick={() => setKeyboardOpen(true)}
              placeholder="Имя, фамилия"
              aria-label="Поиск героя по имени, фамилии или отчеству"
              autoComplete="off"
              inputMode={isCompactViewport ? 'search' : 'none'}
              spellCheck={false}
            />
            {query && (
              <button className={styles.clearButton} type="button" onClick={clearQuery} aria-label="Очистить поиск">
                <X aria-hidden="true" />
              </button>
            )}
          </div>
          <button className={styles.searchButton} type="submit" aria-label="Найти героя">
            <Search aria-hidden="true" strokeWidth={1.5} />
            <span className={styles.searchButtonLabel}>Начать поиск</span>
          </button>
        </form>

        <nav className={styles.alphabet} aria-label="Фильтр по первой букве фамилии">
          {RUSSIAN_ALPHABET.map((letter) => (
            <button
              key={letter}
              type="button"
              aria-pressed={activeLetter === letter}
              onClick={() => handleLetter(letter)}
            >
              {letter}
            </button>
          ))}
        </nav>
      </header>

      <section className={styles.results} aria-label="Список героев" aria-live="polite">
        {isLoading && <p className={styles.status}>Загрузка героев…</p>}
        {error && <p className={`${styles.status} ${styles.error}`} role="alert">{error}</p>}

        {!isLoading && !error && visibleHeroes.length > 0 && (
          <HeroesScroller>
            {visibleHeroes.map((hero) => (
              <ScreenHeroCard
                key={hero.id}
                hero={hero}
                isPressed={pressedHeroId === hero.id}
                isActive={activeHeroId === hero.id}
                onActivate={setActiveHeroId}
                onPressStart={setPressedHeroId}
                onPressEnd={() => setPressedHeroId(null)}
              />
            ))}
          </HeroesScroller>
        )}

        {!isLoading && !error && visibleHeroes.length === 0 && (
          <p className={styles.emptyState}>
            {hasActiveFilter
              ? <>К сожалению, по вашему<br />запросу совпадений<br />не найдено</>
              : <>В выбранном районе<br />пока нет опубликованных<br />историй</>}
          </p>
        )}
      </section>

      {isKeyboardOpen && !isCompactViewport && (
        <>
          <button className={styles.keyboardOverlay} type="button" onClick={() => setKeyboardOpen(false)} aria-label="Закрыть экранную клавиатуру" />
          <VirtualKeyboard
            onInput={appendVirtualKey}
            onBackspace={() => changeQuery(query.slice(0, -1))}
            onSpace={() => changeQuery(`${query} `)}
            onClose={() => setKeyboardOpen(false)}
          />
        </>
      )}
    </main>
  );
}
