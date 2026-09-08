<?php

namespace MuseumCore\Media;

use MuseumCore\Content\HeroMeta;
use MuseumCore\Content\HeroPostType;

final class MediaService {
	public const DELETE_CAPABILITY = 'delete_museum_media';

	public static function is_image_attachment( int $attachment_id ): bool {
		return $attachment_id > 0
			&& 'attachment' === get_post_type( $attachment_id )
			&& wp_attachment_is_image( $attachment_id );
	}

	public static function is_in_use( int $attachment_id ): bool {
		return self::is_used_by_heroes( $attachment_id, array_keys( get_post_stati() ) );
	}

	public static function is_used_by_published_hero( int $attachment_id ): bool {
		return self::is_used_by_heroes( $attachment_id, array( 'publish' ) );
	}

	private static function is_used_by_heroes( int $attachment_id, array $post_statuses ): bool {
		$hero_ids = get_posts(
			array(
				'post_type'      => HeroPostType::POST_TYPE,
				'post_status'    => $post_statuses,
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'no_found_rows'  => true,
			)
		);

		foreach ( $hero_ids as $hero_id ) {
			if ( $attachment_id === (int) get_post_thumbnail_id( $hero_id ) ) {
				return true;
			}
			$gallery = get_post_meta( $hero_id, HeroMeta::GALLERY_IDS, true );
			if ( is_array( $gallery ) && in_array( $attachment_id, array_map( 'intval', $gallery ), true ) ) {
				return true;
			}
		}

		return false;
	}
}
