<?php

namespace MuseumCore\Screen;

use MuseumCore\Content\DistrictMeta;
use MuseumCore\Content\DistrictTaxonomy;
use MuseumCore\Content\HeroMeta;
use MuseumCore\Content\HeroPostType;
use MuseumCore\Media\MediaService;

final class SnapshotHooks {
	private static $rebuild_scheduled = false;

	public static function register(): void {
		add_action( 'transition_post_status', array( self::class, 'handle_status_transition' ), 10, 3 );
		add_action( 'save_post_' . HeroPostType::POST_TYPE, array( self::class, 'handle_hero_save' ), 200, 3 );
		add_action( 'added_post_meta', array( self::class, 'handle_post_meta_change' ), 20, 4 );
		add_action( 'updated_post_meta', array( self::class, 'handle_post_meta_change' ), 20, 4 );
		add_action( 'deleted_post_meta', array( self::class, 'handle_post_meta_change' ), 20, 4 );
		add_action( 'set_object_terms', array( self::class, 'handle_terms_change' ), 20, 6 );

		add_action( 'created_' . DistrictTaxonomy::TAXONOMY, array( self::class, 'handle_district_change' ), 10, 3 );
		add_action( 'edited_' . DistrictTaxonomy::TAXONOMY, array( self::class, 'handle_district_change' ), 10, 3 );
		add_action( 'deleted_' . DistrictTaxonomy::TAXONOMY, array( self::class, 'handle_district_change' ), 10, 4 );
		add_action( 'added_term_meta', array( self::class, 'handle_term_meta_change' ), 10, 4 );
		add_action( 'updated_term_meta', array( self::class, 'handle_term_meta_change' ), 10, 4 );
		add_action( 'deleted_term_meta', array( self::class, 'handle_term_meta_change' ), 10, 4 );

		add_action( 'edit_attachment', array( self::class, 'handle_attachment_change' ) );
		add_action( 'delete_attachment', array( self::class, 'handle_attachment_change' ) );
	}

	public static function handle_status_transition( $new_status, $old_status, $post ): void {
		if (
			$post
			&& HeroPostType::POST_TYPE === $post->post_type
			&& ( 'publish' === $new_status || 'publish' === $old_status )
		) {
			self::schedule_rebuild();
		}
	}

	public static function handle_hero_save( $post_id, $post, $update ): void {
		unset( $post, $update );
		if ( self::is_published_hero( (int) $post_id ) ) {
			self::schedule_rebuild();
		}
	}

	public static function handle_post_meta_change( $meta_id, $post_id, $meta_key, $meta_value ): void {
		unset( $meta_id, $meta_value );
		$post_id = (int) $post_id;
		if (
			self::is_published_hero( $post_id )
			&& in_array( $meta_key, self::public_hero_meta_keys(), true )
		) {
			self::schedule_rebuild();
			return;
		}

		if (
			in_array( $meta_key, array( '_wp_attachment_metadata', '_wp_attached_file' ), true )
			&& MediaService::is_used_by_published_hero( $post_id )
		) {
			self::schedule_rebuild();
		}
	}

	public static function handle_terms_change( $object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ): void {
		unset( $terms, $tt_ids, $append, $old_tt_ids );
		if ( DistrictTaxonomy::TAXONOMY === $taxonomy && self::is_published_hero( (int) $object_id ) ) {
			self::schedule_rebuild();
		}
	}

	public static function handle_district_change(): void {
		self::schedule_rebuild();
	}

	public static function handle_term_meta_change( $meta_id, $term_id, $meta_key, $meta_value ): void {
		unset( $meta_id, $meta_value );
		if ( DistrictMeta::SORT_ORDER !== $meta_key ) {
			return;
		}
		$term = get_term( (int) $term_id, DistrictTaxonomy::TAXONOMY );
		if ( $term && ! is_wp_error( $term ) ) {
			self::schedule_rebuild();
		}
	}

	public static function handle_attachment_change( $attachment_id ): void {
		if ( MediaService::is_used_by_published_hero( (int) $attachment_id ) ) {
			self::schedule_rebuild();
		}
	}

	public static function schedule_rebuild(): void {
		if ( self::$rebuild_scheduled ) {
			return;
		}
		self::$rebuild_scheduled = true;
		add_action( 'shutdown', array( self::class, 'run_scheduled_rebuild' ), 1 );
	}

	public static function run_scheduled_rebuild(): void {
		self::$rebuild_scheduled = false;
		SnapshotStore::rebuild();
	}

	private static function is_published_hero( int $post_id ): bool {
		return HeroPostType::POST_TYPE === get_post_type( $post_id ) && 'publish' === get_post_status( $post_id );
	}

	private static function public_hero_meta_keys(): array {
		return array(
			HeroMeta::FIRST_NAME,
			HeroMeta::LAST_NAME,
			HeroMeta::MIDDLE_NAME,
			HeroMeta::BIRTH_DATE,
			HeroMeta::DEATH_DATE,
			HeroMeta::BIOGRAPHY,
			HeroMeta::FEAT,
			HeroMeta::AWARDS,
			HeroMeta::GALLERY_IDS,
			'_thumbnail_id',
		);
	}
}
