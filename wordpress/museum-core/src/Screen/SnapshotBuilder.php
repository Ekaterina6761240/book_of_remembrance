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
			return self::build_error( 'districts.query', $terms->get_error_message(), __FUNCTION__ );
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
				self::report_skipped_hero( (int) $post->ID, $item );
				continue;
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
			return self::build_error( 'heroes.status', 'В public serializer передана запись, которая не является опубликованным героем.', __FUNCTION__ );
		}
		$hero_id    = (int) $post->ID;
		$first_name = trim( (string) get_post_meta( $post->ID, HeroMeta::FIRST_NAME, true ) );
		$last_name  = trim( (string) get_post_meta( $post->ID, HeroMeta::LAST_NAME, true ) );
		if ( '' === $first_name || '' === $last_name ) {
			return self::build_error( 'heroes.name', 'У опубликованного героя отсутствует first_name или last_name.', __FUNCTION__, array( 'hero_id' => $hero_id ) );
		}

		$districts = wp_get_object_terms( $post->ID, DistrictTaxonomy::TAXONOMY, array( 'fields' => 'ids' ) );
		if ( is_wp_error( $districts ) || 1 !== count( $districts ) || ! term_exists( (int) $districts[0], DistrictTaxonomy::TAXONOMY ) ) {
			$detail = is_wp_error( $districts ) ? $districts->get_error_message() : 'У опубликованного героя должен быть ровно один существующий район.';
			return self::build_error( 'heroes.district', $detail, __FUNCTION__, array( 'hero_id' => $hero_id ) );
		}

		$birth_date = self::nullable_meta( $post->ID, HeroMeta::BIRTH_DATE );
		$death_date = self::nullable_meta( $post->ID, HeroMeta::DEATH_DATE );
		if ( ( $birth_date && '' === HeroMeta::sanitize_date( $birth_date ) ) || ( $death_date && '' === HeroMeta::sanitize_date( $death_date ) ) || ! HeroMeta::dates_are_chronological( $birth_date, $death_date ) ) {
			return self::build_error( 'heroes.dates', 'У опубликованного героя некорректны birth_date или death_date.', __FUNCTION__, array( 'hero_id' => $hero_id ) );
		}

		$main_image_id = (int) get_post_thumbnail_id( $post->ID );
		$main_image    = PublicMediaDto::from_attachment( $main_image_id );
		if ( is_wp_error( $main_image ) ) {
			return self::build_error( 'heroes.main_image', $main_image->get_error_message(), __FUNCTION__, array( 'hero_id' => $hero_id, 'attachment_id' => $main_image_id ) );
		}

		$gallery_ids = get_post_meta( $post->ID, HeroMeta::GALLERY_IDS, true );
		$gallery_ids = is_array( $gallery_ids ) ? $gallery_ids : array();
		$gallery     = array();
		foreach ( $gallery_ids as $attachment_id ) {
			$media = PublicMediaDto::from_attachment( (int) $attachment_id );
			if ( is_wp_error( $media ) || null === $media ) {
				$detail = is_wp_error( $media ) ? $media->get_error_message() : 'Gallery attachment ID пуст.';
				return self::build_error( 'heroes.gallery', $detail, __FUNCTION__, array( 'hero_id' => $hero_id, 'attachment_id' => (int) $attachment_id ) );
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

	public static function exception_error( \Throwable $error, string $stage, string $function ): \WP_Error {
		return self::build_error(
			$stage,
			$error->getMessage(),
			$function,
			array(
				'exception_class' => get_class( $error ),
				'exception_file'  => $error->getFile(),
			)
		);
	}

	public static function operation_error( string $stage, string $detail, string $function ): \WP_Error {
		return self::build_error( $stage, $detail, $function );
	}

	private static function report_skipped_hero( int $hero_id, \WP_Error $error ): void {
		if ( ! self::is_development_environment() ) {
			return;
		}
		$data       = $error->get_error_data();
		$diagnostic = is_array( $data ) && isset( $data['diagnostic'] ) && is_array( $data['diagnostic'] )
			? $data['diagnostic']
			: array();
		$message    = sprintf(
			'Museum Core snapshot skipped published hero %d at %s: %s (%s::%s in %s)',
			$hero_id,
			isset( $diagnostic['stage'] ) ? (string) $diagnostic['stage'] : 'heroes.serialize',
			isset( $diagnostic['message'] ) ? (string) $diagnostic['message'] : $error->get_error_message(),
			isset( $diagnostic['class'] ) ? (string) $diagnostic['class'] : self::class,
			isset( $diagnostic['function'] ) ? (string) $diagnostic['function'] : 'hero_to_dto',
			isset( $diagnostic['file'] ) ? (string) $diagnostic['file'] : __FILE__
		);
		error_log( $message );
	}

	private static function build_error( string $stage, string $detail, string $function, array $context = array() ): \WP_Error {
		$data = array( 'status' => 503 );
		if ( self::is_development_environment() ) {
			$data['diagnostic'] = array_merge(
				array(
					'stage'    => $stage,
					'message'  => $detail,
					'class'    => self::class,
					'file'     => __FILE__,
					'function' => $function,
				),
				$context
			);
		}
		return new \WP_Error( 'screen_snapshot_build_failed', 'Не удалось собрать целостный публичный snapshot.', $data );
	}

	private static function is_development_environment(): bool {
		$environment = function_exists( 'wp_get_environment_type' ) ? wp_get_environment_type() : 'production';
		return in_array( $environment, array( 'local', 'development' ), true );
	}
}
