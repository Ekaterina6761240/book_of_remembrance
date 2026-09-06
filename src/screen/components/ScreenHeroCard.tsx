import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import type { Hero } from '../../shared/types';
import { getHeroFullName } from '../utils/heroes';
import { guardScreenLinkNavigation } from '../utils/navigationGuard';
import styles from './ScreenHeroCard.module.css';

type ScreenHeroCardProps = {
  hero: Hero;
  isPressed: boolean;
  isActive: boolean;
  onPressStart: (heroId: number) => void;
  onPressEnd: () => void;
  onActivate: (heroId: number) => void;
};

export function ScreenHeroCard({ hero, isPressed, isActive, onPressStart, onPressEnd, onActivate }: ScreenHeroCardProps) {
  const imageUrl = hero.mainImage?.thumbnailUrl ?? hero.mainImage?.url;
  const [hasImageError, setHasImageError] = useState(false);
  const fullName = getHeroFullName(hero);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  return (
    <Link
      className={styles.card}
      data-pressed={isPressed || undefined}
      data-active={isActive || undefined}
      to={`${ROUTES.screenHeroes}/${hero.id}`}
      aria-label={fullName}
      onClick={guardScreenLinkNavigation}
      onFocus={() => onActivate(hero.id)}
      onPointerDown={() => {
        onActivate(hero.id);
        onPressStart(hero.id);
      }}
      onPointerUp={onPressEnd}
      onPointerLeave={onPressEnd}
      onPointerCancel={onPressEnd}
      onBlur={onPressEnd}
    >
      <span className={styles.portrait}>
        {imageUrl && !hasImageError ? (
          <img src={imageUrl} alt={`Фото: ${fullName}`} draggable={false} onError={() => setHasImageError(true)} />
        ) : (
          <span className={styles.imageFallback} aria-hidden="true">
            <UserRound strokeWidth={1} />
          </span>
        )}
      </span>
      <span className={styles.name}>
        <span>{hero.lastName}</span>
        <span>{[hero.firstName, hero.middleName].filter(Boolean).join(' ')}</span>
      </span>
    </Link>
  );
}
