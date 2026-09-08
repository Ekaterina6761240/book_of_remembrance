<?php

namespace MuseumCore\Content;

use DateTimeImmutable;

final class HeroMeta {
	public const FIRST_NAME  = '_museum_first_name';
	public const LAST_NAME   = '_museum_last_name';
	public const MIDDLE_NAME = '_museum_middle_name';
	public const BIRTH_DATE  = '_museum_birth_date';
	public const DEATH_DATE  = '_museum_death_date';
	public const BIOGRAPHY   = '_museum_biography';
	public const FEAT        = '_museum_feat';
	public const AWARDS      = '_museum_awards';
	public const GALLERY_IDS = '_museum_gallery_ids';
	public const SEARCH_TEXT = '_museum_search_text';

	public static function register(): void {
		foreach ( array( self::FIRST_NAME, self::LAST_NAME, self::MIDDLE_NAME ) as $meta_key ) {
			self::register_string( $meta_key, 'sanitize_text_field' );
		}

		foreach ( array( self::BIRTH_DATE, self::DEATH_DATE ) as $meta_key ) {
			self::register_string( $meta_key, array( self::class, 'sanitize_date' ) );
		}

		foreach ( array( self::BIOGRAPHY, self::FEAT, self::AWARDS ) as $meta_key ) {
			self::register_string( $meta_key, 'sanitize_textarea_field' );
		}

		self::register_string( self::SEARCH_TEXT, 'sanitize_text_field' );

		register_post_meta(
			HeroPostType::POST_TYPE,
			self::GALLERY_IDS,
			array(
				'type'              => 'array',
				'single'            => true,
				'default'           => array(),
				'show_in_rest'      => false,
				'sanitize_callback' => array( self::class, 'sanitize_gallery_ids' ),
				'auth_callback'     => array( self::class, 'can_edit' ),
			)
		);
	}

	public static function sanitize_date( $value ): string {
		$value = sanitize_text_field( (string) $value );
		if ( '' === $value ) {
			return '';
		}

		$date = DateTimeImmutable::createFromFormat( '!Y-m-d', $value, wp_timezone() );
		return false !== $date && $date->format( 'Y-m-d' ) === $value ? $value : '';
	}

	public static function sanitize_gallery_ids( $value ): array {
		if ( ! is_array( $value ) ) {
			return array();
		}

		$attachment_ids = array();
		foreach ( $value as $attachment_id ) {
			$attachment_id = absint( $attachment_id );
			if ( 0 === $attachment_id || ! wp_attachment_is_image( $attachment_id ) ) {
				continue;
			}
			$attachment_ids[ $attachment_id ] = $attachment_id;
		}

		return array_values( $attachment_ids );
	}

	public static function can_edit( $allowed, $meta_key, $post_id ): bool {
		unset( $allowed, $meta_key );
		return current_user_can( 'edit_post', (int) $post_id );
	}

	private static function register_string( string $meta_key, $sanitize_callback ): void {
		register_post_meta(
			HeroPostType::POST_TYPE,
			$meta_key,
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '',
				'show_in_rest'      => false,
				'sanitize_callback' => $sanitize_callback,
				'auth_callback'     => array( self::class, 'can_edit' ),
			)
		);
	}
}
