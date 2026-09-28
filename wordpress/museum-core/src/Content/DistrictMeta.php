<?php

namespace MuseumCore\Content;

final class DistrictMeta {
	public const SORT_ORDER = 'museum_sort_order';

	public static function register(): void {
		register_term_meta(
			DistrictTaxonomy::TAXONOMY,
			self::SORT_ORDER,
			array(
				'type'              => 'integer',
				'single'            => true,
				'default'           => 0,
				'show_in_rest'      => false,
				'sanitize_callback' => array( self::class, 'sanitize_sort_order' ),
				'auth_callback'     => array( self::class, 'can_edit' ),
			)
		);
	}

	public static function sanitize_sort_order( $value ): int {
		return intval( $value );
	}

	public static function can_edit(): bool {
		return current_user_can( 'edit_museum_districts' );
	}
}
