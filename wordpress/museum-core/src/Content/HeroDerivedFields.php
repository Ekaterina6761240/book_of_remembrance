<?php

namespace MuseumCore\Content;

final class HeroDerivedFields {
	private static $is_syncing = false;

	public static function register_hooks(): void {
		add_action( 'save_post_' . HeroPostType::POST_TYPE, array( self::class, 'handle_save' ), 100, 3 );
		add_action( 'added_post_meta', array( self::class, 'handle_meta_change' ), 10, 4 );
		add_action( 'updated_post_meta', array( self::class, 'handle_meta_change' ), 10, 4 );
		add_action( 'deleted_post_meta', array( self::class, 'handle_meta_change' ), 10, 4 );
	}

	public static function handle_save( int $post_id, $post, bool $update ): void {
		unset( $post, $update );
		self::sync( $post_id );
	}

	public static function handle_meta_change( int $meta_id, int $post_id, string $meta_key, $meta_value ): void {
		unset( $meta_id, $meta_value );
		if ( ! in_array( $meta_key, self::name_meta_keys(), true ) ) {
			return;
		}
		self::sync( $post_id );
	}

	public static function sync( int $post_id ): void {
		if ( self::$is_syncing || HeroPostType::POST_TYPE !== get_post_type( $post_id ) ) {
			return;
		}

		$first_name  = trim( (string) get_post_meta( $post_id, HeroMeta::FIRST_NAME, true ) );
		$last_name   = trim( (string) get_post_meta( $post_id, HeroMeta::LAST_NAME, true ) );
		$middle_name = trim( (string) get_post_meta( $post_id, HeroMeta::MIDDLE_NAME, true ) );
		$title       = implode( ' ', array_filter( array( $last_name, $first_name, $middle_name ) ) );
		$reverse     = implode( ' ', array_filter( array( $first_name, $middle_name, $last_name ) ) );
		$search_text = self::normalize_search_text( trim( $title . ' ' . $reverse ) );

		self::$is_syncing = true;
		try {
			if ( get_post_meta( $post_id, HeroMeta::SEARCH_TEXT, true ) !== $search_text ) {
				update_post_meta( $post_id, HeroMeta::SEARCH_TEXT, $search_text );
			}

			$post = get_post( $post_id );
			if ( $post && $post->post_title !== $title ) {
				wp_update_post(
					array(
						'ID'         => $post_id,
						'post_title' => $title,
					)
				);
			}
		} finally {
			self::$is_syncing = false;
		}
	}

	private static function name_meta_keys(): array {
		return array( HeroMeta::FIRST_NAME, HeroMeta::LAST_NAME, HeroMeta::MIDDLE_NAME );
	}

	public static function normalize_search_text( string $value ): string {
		$value = str_replace( array( 'ё', 'Ё' ), array( 'е', 'Е' ), $value );
		return function_exists( 'mb_strtoupper' ) ? mb_strtoupper( $value, 'UTF-8' ) : strtoupper( $value );
	}
}
