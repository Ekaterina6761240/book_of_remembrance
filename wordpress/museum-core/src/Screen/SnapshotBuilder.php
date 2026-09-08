<?php

namespace MuseumCore\Screen;

use MuseumCore\Content\DistrictMeta;
use MuseumCore\Content\DistrictTaxonomy;
use MuseumCore\Content\HeroDerivedFields;
use MuseumCore\Content\HeroMeta;
use MuseumCore\Content\HeroPostType;

final class SnapshotBuilder {
	public static function build_projection() {
		$districts = self::build_districts();
		if ( is_wp_error( $districts ) ) {
			return $districts;
		}
		$heroes = self::build_heroes();
		if ( is_wp_error( $heroes ) ) {
			return $heroes;
		}
		return array(
			'districts' => $districts,
			'heroes'    => $heroes,
		);
	}

	public static function build_districts() {
		$terms = get_terms(
			array(
				'taxonomy'   => DistrictTaxonomy::TAXONOMY,
				'hide_empty' => false,
			)
		);
		if ( is_wp_error( $terms ) ) {
			return self::build_error();
		}

		$items = array_map(
			static function ( $term ): array {
				return array(
					'id'         => (int) $term->term_id,
					'name'       => (string) $term->name,
					'slug'       => (string) $term->slug,
					'sort_order' => (int) get_term_meta( $term->term_id, DistrictMeta::SORT_ORDER, true ),
				);
			},
			$terms
		);
		usort(
			$items,
			static function ( array $left, array $right ): int {
				return array( $left['sort_order'], $left['name'], $left['id'] ) <=> array( $right['sort_order'], $right['name'], $right['id'] );
			}
		);
		return $items;
	}

	public static function build_heroes() {
		$posts = get_posts(
			array(
				'post_type'      => HeroPostType::POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'orderby'        => 'ID',
				'order'          => 'ASC',
			)
		);
		$items = array();
		foreach ( $posts as $post ) {
			$item = self::hero_to_dto( $post );
			if ( is_wp_error( $item ) ) {
				return $item;
			}
			$items[] = $item;
		}
		usort(
			$items,
			static function ( array $left, array $right ): int {
				$left_key  = HeroDerivedFields::normalize_search_text( $left['last_name'] . ' ' . $left['first_name'] );
				$right_key = HeroDerivedFields::normalize_search_text( $right['last_name'] . ' ' . $right['first_name'] );
				return array( $left_key, $left['id'] ) <=> array( $right_key, $right['id'] );
			}
		);
		return $items;
	}

	public static function hero_to_dto( $post ) {
		if ( ! $post || HeroPostType::POST_TYPE !== $post->post_type || 'publish' !== $post->post_status ) {
			return self::build_error();
		}
		$first_name = trim( (string) get_post_meta( $post->ID, HeroMeta::FIRST_NAME, true ) );
		$last_name  = trim( (string) get_post_meta( $post->ID, HeroMeta::LAST_NAME, true ) );
		if ( '' === $first_name || '' === $last_name ) {
			return self::build_error();
		}

		$districts = wp_get_object_terms( $post->ID, DistrictTaxonomy::TAXONOMY, array( 'fields' => 'ids' ) );
		if ( is_wp_error( $districts ) || 1 !== count( $districts ) || ! term_exists( (int) $districts[0], DistrictTaxonomy::TAXONOMY ) ) {
			return self::build_error();
		}

		$birth_date = self::nullable_meta( $post->ID, HeroMeta::BIRTH_DATE );
		$death_date = self::nullable_meta( $post->ID, HeroMeta::DEATH_DATE );
		if ( ( $birth_date && '' === HeroMeta::sanitize_date( $birth_date ) ) || ( $death_date && '' === HeroMeta::sanitize_date( $death_date ) ) || ( $birth_date && $death_date && $death_date < $birth_date ) ) {
			return self::build_error();
		}

		$main_image_id = (int) get_post_thumbnail_id( $post->ID );
		$main_image    = PublicMediaDto::from_attachment( $main_image_id );
		if ( is_wp_error( $main_image ) ) {
			return self::build_error();
		}

		$gallery_ids = get_post_meta( $post->ID, HeroMeta::GALLERY_IDS, true );
		$gallery_ids = is_array( $gallery_ids ) ? $gallery_ids : array();
		$gallery     = array();
		foreach ( $gallery_ids as $attachment_id ) {
			$media = PublicMediaDto::from_attachment( (int) $attachment_id );
			if ( is_wp_error( $media ) || null === $media ) {
				return self::build_error();
			}
			$gallery[] = $media;
		}

		return array(
			'id'          => (int) $post->ID,
			'first_name'  => $first_name,
			'last_name'   => $last_name,
			'middle_name' => self::nullable_meta( $post->ID, HeroMeta::MIDDLE_NAME ),
			'district_id' => (int) $districts[0],
			'birth_date'  => $birth_date,
			'death_date'  => $death_date,
			'main_image'  => $main_image,
			'biography'   => self::nullable_meta( $post->ID, HeroMeta::BIOGRAPHY ),
			'feat'        => self::nullable_meta( $post->ID, HeroMeta::FEAT ),
			'awards'      => self::nullable_meta( $post->ID, HeroMeta::AWARDS ),
			'gallery'     => $gallery,
		);
	}

	private static function nullable_meta( int $post_id, string $key ) {
		$value = (string) get_post_meta( $post_id, $key, true );
		return '' === $value ? null : $value;
	}

	private static function build_error(): \WP_Error {
		return new \WP_Error( 'screen_snapshot_build_failed', 'Не удалось собрать целостный публичный snapshot.', array( 'status' => 503 ) );
	}
}
