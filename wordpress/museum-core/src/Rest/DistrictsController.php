<?php

namespace MuseumCore\Rest;

use MuseumCore\Content\DistrictMeta;
use MuseumCore\Content\DistrictTaxonomy;
use MuseumCore\Content\HeroPostType;

final class DistrictsController {
	private const NAMESPACE = 'museum/v1';

	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/districts',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_list' ),
					'permission_callback' => array( self::class, 'can_read' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'create' ),
					'permission_callback' => array( self::class, 'can_manage' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/districts/(?P<id>\d+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_item' ),
					'permission_callback' => array( self::class, 'can_read' ),
				),
				array(
					'methods'             => array( 'PUT', 'PATCH' ),
					'callback'            => array( self::class, 'update' ),
					'permission_callback' => array( self::class, 'can_edit' ),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( self::class, 'delete' ),
					'permission_callback' => array( self::class, 'can_delete' ),
				),
			)
		);
	}

	public static function can_read(): bool {
		return current_user_can( 'edit_museum_heroes' );
	}

	public static function can_manage(): bool {
		return current_user_can( 'manage_museum_districts' );
	}

	public static function can_edit(): bool {
		return current_user_can( 'edit_museum_districts' );
	}

	public static function can_delete(): bool {
		return current_user_can( 'delete_museum_districts' );
	}

	public static function get_list() {
		$terms = get_terms(
			array(
				'taxonomy'   => DistrictTaxonomy::TAXONOMY,
				'hide_empty' => false,
			)
		);
		if ( is_wp_error( $terms ) ) {
			return new \WP_Error( 'district_list_failed', 'Не удалось получить районы.', array( 'status' => 500 ) );
		}
		$items = array_map( array( self::class, 'to_dto' ), $terms );
		usort(
			$items,
			static function ( array $left, array $right ): int {
				return array( $left['sort_order'], $left['name'], $left['id'] ) <=> array( $right['sort_order'], $right['name'], $right['id'] );
			}
		);
		return new \WP_REST_Response( $items );
	}

	public static function get_item( $request ) {
		$term = self::find_district( (int) $request['id'] );
		return is_wp_error( $term ) ? $term : new \WP_REST_Response( self::to_dto( $term ) );
	}

	public static function create( $request ) {
		$data = self::validate_payload( self::body( $request ), true );
		if ( is_wp_error( $data ) ) {
			return $data;
		}
		$conflict = self::slug_conflict( $data['slug'], 0 );
		if ( $conflict ) {
			return $conflict;
		}

		$created = wp_insert_term( $data['name'], DistrictTaxonomy::TAXONOMY, array( 'slug' => $data['slug'] ) );
		if ( is_wp_error( $created ) ) {
			if ( in_array( $created->get_error_code(), array( 'term_exists', 'duplicate_term_slug' ), true ) ) {
				return self::slug_error();
			}
			return new \WP_Error( 'district_create_failed', 'Не удалось создать район.', array( 'status' => 500 ) );
		}
		$term_id = (int) $created['term_id'];
		update_term_meta( $term_id, DistrictMeta::SORT_ORDER, $data['sort_order'] );
		return new \WP_REST_Response( self::to_dto( get_term( $term_id, DistrictTaxonomy::TAXONOMY ) ), 201 );
	}

	public static function update( $request ) {
		$term = self::find_district( (int) $request['id'] );
		if ( is_wp_error( $term ) ) {
			return $term;
		}
		$payload = self::body( $request );
		if ( 'PATCH' === strtoupper( $request->get_method() ) ) {
			$payload = array_merge( self::to_dto( $term ), $payload );
		}
		$data = self::validate_payload( $payload, true );
		if ( is_wp_error( $data ) ) {
			return $data;
		}
		$conflict = self::slug_conflict( $data['slug'], (int) $term->term_id );
		if ( $conflict ) {
			return $conflict;
		}

		$updated = wp_update_term( $term->term_id, DistrictTaxonomy::TAXONOMY, array( 'name' => $data['name'], 'slug' => $data['slug'] ) );
		if ( is_wp_error( $updated ) ) {
			if ( in_array( $updated->get_error_code(), array( 'term_exists', 'duplicate_term_slug' ), true ) ) {
				return self::slug_error();
			}
			return new \WP_Error( 'district_update_failed', 'Не удалось обновить район.', array( 'status' => 500 ) );
		}
		update_term_meta( $term->term_id, DistrictMeta::SORT_ORDER, $data['sort_order'] );
		return new \WP_REST_Response( self::to_dto( get_term( $term->term_id, DistrictTaxonomy::TAXONOMY ) ) );
	}

	public static function delete( $request ) {
		$term = self::find_district( (int) $request['id'] );
		if ( is_wp_error( $term ) ) {
			return $term;
		}
		if ( self::is_in_use( (int) $term->term_id ) ) {
			return new \WP_Error( 'district_in_use', 'Район используется героем и не может быть удалён.', array( 'status' => 409 ) );
		}
		$deleted = wp_delete_term( $term->term_id, DistrictTaxonomy::TAXONOMY );
		if ( is_wp_error( $deleted ) || ! $deleted ) {
			return new \WP_Error( 'district_delete_failed', 'Не удалось удалить район.', array( 'status' => 500 ) );
		}
		return new \WP_REST_Response( null, 204 );
	}

	public static function to_dto( $term ): array {
		return array(
			'id'         => (int) $term->term_id,
			'name'       => (string) $term->name,
			'slug'       => (string) $term->slug,
			'sort_order' => (int) get_term_meta( $term->term_id, DistrictMeta::SORT_ORDER, true ),
		);
	}

	private static function validate_payload( array $payload, bool $required ) {
		foreach ( array( 'name', 'slug' ) as $field ) {
			if ( array_key_exists( $field, $payload ) && null !== $payload[ $field ] && ! is_string( $payload[ $field ] ) ) {
				return self::validation_error( $field, 'Поле должно быть строкой.' );
			}
		}
		if ( array_key_exists( 'sort_order', $payload ) && null !== $payload['sort_order'] && ( ! is_scalar( $payload['sort_order'] ) || false === filter_var( $payload['sort_order'], FILTER_VALIDATE_INT ) ) ) {
			return self::validation_error( 'sort_order', 'sort_order должен быть integer.' );
		}
		if ( $required && ( ! array_key_exists( 'name', $payload ) || '' === trim( (string) $payload['name'] ) ) ) {
			return self::validation_error( 'name', 'Название района обязательно.' );
		}
		$name = sanitize_text_field( (string) ( $payload['name'] ?? '' ) );
		$slug = sanitize_title( (string) ( $payload['slug'] ?? $name ) );
		if ( '' === $name || '' === $slug ) {
			return self::validation_error( 'slug', 'Название и slug района не могут быть пустыми.' );
		}
		return array(
			'name'       => $name,
			'slug'       => $slug,
			'sort_order' => array_key_exists( 'sort_order', $payload ) && null !== $payload['sort_order'] ? intval( $payload['sort_order'] ) : self::next_sort_order(),
		);
	}

	private static function slug_conflict( string $slug, int $exclude_id ) {
		$existing = get_term_by( 'slug', $slug, DistrictTaxonomy::TAXONOMY );
		if ( $existing && (int) $existing->term_id !== $exclude_id ) {
			return self::slug_error();
		}
		return false;
	}

	private static function is_in_use( int $term_id ): bool {
		$query = new \WP_Query(
			array(
				'post_type'      => HeroPostType::POST_TYPE,
				'post_status'    => array_keys( get_post_stati() ),
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'no_found_rows'  => true,
				'tax_query'      => array(
					array(
						'taxonomy' => DistrictTaxonomy::TAXONOMY,
						'field'    => 'term_id',
						'terms'    => array( $term_id ),
					),
				),
			)
		);
		return ! empty( $query->posts );
	}

	private static function next_sort_order(): int {
		$term_ids = get_terms( array( 'taxonomy' => DistrictTaxonomy::TAXONOMY, 'hide_empty' => false, 'fields' => 'ids' ) );
		$maximum  = 0;
		if ( ! is_wp_error( $term_ids ) ) {
			foreach ( $term_ids as $term_id ) {
				$maximum = max( $maximum, (int) get_term_meta( $term_id, DistrictMeta::SORT_ORDER, true ) );
			}
		}
		return $maximum + 10;
	}

	private static function find_district( int $term_id ) {
		$term = get_term( $term_id, DistrictTaxonomy::TAXONOMY );
		if ( ! $term || is_wp_error( $term ) ) {
			return new \WP_Error( 'district_not_found', 'Район не найден.', array( 'status' => 404 ) );
		}
		return $term;
	}

	private static function body( $request ): array {
		$json = $request->get_json_params();
		return is_array( $json ) ? $json : $request->get_body_params();
	}

	private static function validation_error( string $field, string $message ): \WP_Error {
		return new \WP_Error( 'district_validation_failed', $message, array( 'status' => 422, 'field' => $field ) );
	}

	private static function slug_error(): \WP_Error {
		return new \WP_Error( 'district_slug_conflict', 'Такой slug района уже существует.', array( 'status' => 422, 'field' => 'slug' ) );
	}
}
