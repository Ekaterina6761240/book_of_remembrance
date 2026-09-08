<?php

namespace MuseumCore\Content;

final class DistrictTaxonomy {
	public const TAXONOMY = 'museum_district';
	private static $is_enforcing_assignment = false;

	public static function register_hooks(): void {
		add_action( 'set_object_terms', array( self::class, 'enforce_single_assignment' ), 10, 6 );
	}

	public static function register(): void {
		register_taxonomy(
			self::TAXONOMY,
			array( HeroPostType::POST_TYPE ),
			array(
				'labels'            => array(
					'name'                       => 'Районы',
					'singular_name'              => 'Район',
					'menu_name'                  => 'Районы',
					'all_items'                  => 'Все районы',
					'edit_item'                  => 'Редактировать район',
					'view_item'                  => 'Просмотреть район',
					'update_item'                => 'Обновить район',
					'add_new_item'               => 'Добавить район',
					'new_item_name'              => 'Название нового района',
					'search_items'               => 'Искать районы',
					'not_found'                  => 'Районы не найдены',
					'separate_items_with_commas' => 'Укажите один район',
				),
				'public'            => false,
				'publicly_queryable' => false,
				'show_ui'           => true,
				'show_in_menu'      => true,
				'show_in_rest'      => false,
				'show_admin_column' => true,
				'hierarchical'      => false,
				'rewrite'           => false,
				'query_var'         => false,
				'capabilities'      => array(
					'manage_terms' => 'manage_museum_districts',
					'edit_terms'   => 'edit_museum_districts',
					'delete_terms' => 'delete_museum_districts',
					'assign_terms' => 'assign_museum_districts',
				),
			),
		);
	}

	public static function capabilities(): array {
		return array(
			'manage_museum_districts',
			'edit_museum_districts',
			'delete_museum_districts',
			'assign_museum_districts',
		);
	}

	public static function enforce_single_assignment( $object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ): void {
		unset( $terms, $append );
		if (
			self::$is_enforcing_assignment
			|| self::TAXONOMY !== $taxonomy
			|| HeroPostType::POST_TYPE !== get_post_type( $object_id )
		) {
			return;
		}

		$district_ids = wp_get_object_terms(
			$object_id,
			self::TAXONOMY,
			array( 'fields' => 'ids' )
		);
		if ( is_wp_error( $district_ids ) ) {
			return;
		}

		if ( count( $district_ids ) > 1 ) {
			self::replace_assignment( (int) $object_id, (int) reset( $district_ids ) );
			return;
		}

		if ( empty( $district_ids ) && ! empty( $old_tt_ids ) && empty( $tt_ids ) ) {
			$old_term = get_term_by( 'term_taxonomy_id', (int) reset( $old_tt_ids ), self::TAXONOMY );
			if ( $old_term ) {
				self::replace_assignment( (int) $object_id, (int) $old_term->term_id );
			}
		}
	}

	public static function has_single_assignment( int $hero_id ): bool {
		$district_ids = wp_get_object_terms(
			$hero_id,
			self::TAXONOMY,
			array( 'fields' => 'ids' )
		);
		return ! is_wp_error( $district_ids ) && 1 === count( $district_ids );
	}

	private static function replace_assignment( int $hero_id, int $district_id ): void {
		self::$is_enforcing_assignment = true;
		try {
			wp_set_object_terms( $hero_id, array( $district_id ), self::TAXONOMY, false );
		} finally {
			self::$is_enforcing_assignment = false;
		}
	}
}
