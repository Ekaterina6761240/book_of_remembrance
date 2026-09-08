import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import imageFallbackUrl from '../../shared/assets/image.svg'
import { ROUTES } from '../../shared/constants/routes'
import type { Hero } from '../../shared/types'
import { getHeroFullName } from '../../shared/utils'
import { getOptimizedScreenMediaUrl } from '../utils/media'
import { guardScreenLinkNavigation } from '../utils/navigationGuard'
import styles from './ScreenHeroCard.module.css'

type ScreenHeroCardProps = {
	hero: Hero
	isPressed: boolean
	isActive: boolean
	onPressStart: (heroId: number) => void
	onPressEnd: () => void
	onActivate: (heroId: number) => void
}

export function ScreenHeroCard({
	hero,
	isPressed,
	isActive,
	onPressStart,
	onPressEnd,
	onActivate,
}: ScreenHeroCardProps) {
	const imageUrl = hero.mainImage
		? getOptimizedScreenMediaUrl(hero.mainImage)
		: undefined
	const [hasImageError, setHasImageError] = useState(false)
	const fullName = getHeroFullName(hero)

	useEffect(() => {
		setHasImageError(false)
	}, [imageUrl])

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
				onActivate(hero.id)
				onPressStart(hero.id)
			}}
			onPointerUp={onPressEnd}
			onPointerLeave={onPressEnd}
			onPointerCancel={onPressEnd}
			onBlur={onPressEnd}
		>
			<span className={styles.portrait}>
				{imageUrl && !hasImageError ? (
					<img
						src={imageUrl}
						alt={`Фото: ${fullName}`}
						draggable={false}
						onError={() => setHasImageError(true)}
					/>
				) : (
					<span className={styles.imageFallback} aria-hidden='true'>
						<img src={imageFallbackUrl} alt='' draggable={false} />
					</span>
				)}
			</span>
			<span className={styles.name}>
				<span>{hero.lastName}</span>
				<span>
					{[hero.firstName, hero.middleName].filter(Boolean).join(' ')}
				</span>
			</span>
		</Link>
	)
}
