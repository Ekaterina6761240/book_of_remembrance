<?php

namespace MuseumCore\Rest;

use DateTimeImmutable;
use MuseumCore\Content\DistrictTaxonomy;
use MuseumCore\Content\HeroDerivedFields;
use MuseumCore\Content\HeroMeta;
use MuseumCore\Content\HeroPostType;
use MuseumCore\Media\MediaService;

final class HeroesController {
	private const NAMESPACE = 'museum/v1';
	private const STATUSES  = array(
		'draft'     => 'draft',
		'scheduled' => 'future',
		'published' => 'publish',
	);

	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/heroes',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_list' ),
					'permission_callback' => array( self::class, 'can_list' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'create' ),
					'permission_callback' => array( self::class, 'can_create' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/heroes/(?P<id>\d+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_item' ),
					'permission_callback' => array( self::class, 'can_edit_item' ),
				),
				array(
					'methods'             => array( 'PUT', 'PATCH' ),
					'callback'            => array( self::class, 'update' ),
					'permission_callback' => array( self::class, 'can_edit_item' ),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( self::class, 'delete' ),
					'permission_callback' => array( self::class, 'can_delete_item' ),
				),
			)
		);
	}

	public static function can_list(): bool {
		return current_user_can( 'edit_museum_heroes' );
	}

	public static function can_create(): bool {
		return current_user_can( 'create_museum_heroes' );
	}

	public static function can_edit_item( $request ) {
		$post = self::find_hero( (int) $request['id'] );
		return is_wp_error( $post ) ? $post : current_user_can( 'edit_post', $post->ID );
	}

	public static function can_delete_item( $request ) {
		$post = self::find_hero( (int) $request['id'] );
		return is_wp_error( $post ) ? $post : current_user_can( 'delete_post', $post->ID );
	}

	public static function get_list( $request ) {
		$page_result = self::positive_query_integer( $request->get_param( 'page' ), 1, 'page' );
		if ( is_wp_error( $page_result ) ) {
			return $page_result;
		}
		$per_page_result = self::positive_query_integer( $request->get_param( 'per_page' ), 10, 'per_page' );
		if ( is_wp_error( $per_page_result ) ) {
			return $per_page_result;
		}
		$page      = $page_result;
		$per_page  = min( 100, $per_page_result );
		$order_arg = $request->get_param( 'order' );
		if ( null !== $order_arg && ( ! is_string( $order_arg ) || ! in_array( strtolower( $order_arg ), array( 'asc', 'desc' ), true ) ) ) {
			return self::validation_error( 'order', 'Порядок должен быть asc или desc.' );
		}
		$order    = 'desc' === strtolower( (string) $order_arg ) ? 'DESC' : 'ASC';
		$status   = $request->get_param( 'status' );
		if ( null !== $status && ( ! is_string( $status ) || ! isset( self::STATUSES[ $status ] ) ) ) {
			return self::validation_error( 'status', 'Недопустимый статус героя.' );
		}

		$args = array(
			'post_type'      => HeroPostType::POST_TYPE,
			'post_status'    => null === $status ? array_values( self::STATUSES ) : self::STATUSES[ $status ],
			'paged'           => $page,
			'posts_per_page' => $per_page,
			'meta_key'       => HeroMeta::LAST_NAME,
			'orderby'        => array( 'meta_value' => $order, 'title' => $order, 'ID' => $order ),
		);

		$search_arg = $request->get_param( 'search' );
		if ( null !== $search_arg && ! is_string( $search_arg ) ) {
			return self::validation_error( 'search', 'Поисковый запрос должен быть строкой.' );
		}
		$search = trim( sanitize_text_field( (string) $search_arg ) );
		if ( '' !== $search ) {
			$args['meta_query'] = array(
				array(
					'key'     => HeroMeta::SEARCH_TEXT,
					'value'   => HeroDerivedFields::normalize_search_text( $search ),
					'compare' => 'LIKE',
				),
			);
		}

		$district_arg = $request->get_param( 'district_id' );
		if ( null !== $district_arg && ( ! is_scalar( $district_arg ) || ! ctype_digit( (string) $district_arg ) ) ) {
			return self::validation_error( 'district_id', 'district_id должен быть положительным integer.' );
		}
		$district_id = absint( $district_arg );
		if ( $district_id ) {
			if ( ! term_exists( $district_id, DistrictTaxonomy::TAXONOMY ) ) {
				return self::validation_error( 'district_id', 'Район не найден.' );
			}
			$args['tax_query'] = array(
				array(
					'taxonomy' => DistrictTaxonomy::TAXONOMY,
					'field'    => 'term_id',
					'terms'    => array( $district_id ),
				),
			);
		}

		$query = new \WP_Query( $args );
		return new \WP_REST_Response(
			array(
				'items'       => array_map( array( self::class, 'to_dto' ), $query->posts ),
				'page'        => $page,
				'per_page'    => $per_page,
				'total'       => (int) $query->found_posts,
				'total_pages' => (int) $query->max_num_pages,
			)
		);
	}

	public static function get_item( $request ) {
		$post = self::find_hero( (int) $request['id'] );
		return is_wp_error( $post ) ? $post : new \WP_REST_Response( self::to_dto( $post ) );
	}

	public static function create( $request ) {
		$payload = self::body( $request );
		$result  = self::validate_payload( $payload, true );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$permission = self::check_write_permissions( $result );
		if ( is_wp_error( $permission ) ) {
			return $permission;
		}

		$post_data         = self::post_data( $result );
		$post_data['post_type']   = HeroPostType::POST_TYPE;
		$post_data['post_author'] = get_current_user_id();
		$post_id = wp_insert_post( wp_slash( $post_data ), true );
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'hero_create_failed', 'Не удалось создать героя.', array( 'status' => 500 ) );
		}

		$saved = self::save_relations_and_meta( (int) $post_id, $result );
		if ( is_wp_error( $saved ) ) {
			wp_trash_post( (int) $post_id );
			return $saved;
		}

		HeroDerivedFields::sync( (int) $post_id );
		return new \WP_REST_Response( self::to_dto( get_post( $post_id ) ), 201 );
	}

	public static function update( $request ) {
		$post = self::find_hero( (int) $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		$is_put  = 'PUT' === strtoupper( $request->get_method() );
		$payload = self::body( $request );
		if ( ! $is_put ) {
			$payload = array_merge( self::to_write_payload( $post ), $payload );
		}
		$result = self::validate_payload( $payload, $is_put );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$permission = self::check_write_permissions( $result );
		if ( is_wp_error( $permission ) ) {
			return $permission;
		}

		$post_data       = self::post_data( $result );
		$post_data['ID'] = $post->ID;
		$updated = wp_update_post( wp_slash( $post_data ), true );
		if ( is_wp_error( $updated ) ) {
			return new \WP_Error( 'hero_update_failed', 'Не удалось обновить героя.', array( 'status' => 500 ) );
		}

		$saved = self::save_relations_and_meta( $post->ID, $result );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}
		HeroDerivedFields::sync( $post->ID );
		return new \WP_REST_Response( self::to_dto( get_post( $post->ID ) ) );
	}

	public static function delete( $request ) {
		$post = self::find_hero( (int) $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}
		if ( ! wp_trash_post( $post->ID ) ) {
			return new \WP_Error( 'hero_delete_failed', 'Не удалось переместить героя в корзину.', array( 'status' => 500 ) );
		}
		return new \WP_REST_Response( null, 204 );
	}

	public static function to_dto( $post ): array {
		$districts = wp_get_object_terms( $post->ID, DistrictTaxonomy::TAXONOMY, array( 'fields' => 'ids' ) );
		$gallery   = get_post_meta( $post->ID, HeroMeta::GALLERY_IDS, true );
		$gallery   = is_array( $gallery ) ? $gallery : array();
		$main      = MediaDto::from_attachment( (int) get_post_thumbnail_id( $post->ID ) );
		$published = 'draft' === $post->post_status ? null : get_post_datetime( $post, 'date' );

		return array(
			'id'           => (int) $post->ID,
			'first_name'   => (string) get_post_meta( $post->ID, HeroMeta::FIRST_NAME, true ),
			'last_name'    => (string) get_post_meta( $post->ID, HeroMeta::LAST_NAME, true ),
			'middle_name'  => self::nullable_meta( $post->ID, HeroMeta::MIDDLE_NAME ),
			'district_id'  => ! is_wp_error( $districts ) && $districts ? (int) reset( $districts ) : 0,
			'birth_date'   => self::nullable_meta( $post->ID, HeroMeta::BIRTH_DATE ),
			'death_date'   => self::nullable_meta( $post->ID, HeroMeta::DEATH_DATE ),
			'main_image'   => $main,
			'biography'    => self::nullable_meta( $post->ID, HeroMeta::BIOGRAPHY ),
			'feat'         => self::nullable_meta( $post->ID, HeroMeta::FEAT ),
			'awards'       => self::nullable_meta( $post->ID, HeroMeta::AWARDS ),
			'gallery'      => array_values( array_filter( array_map( array( MediaDto::class, 'from_attachment' ), array_map( 'intval', $gallery ) ) ) ),
			'status'       => array_search( $post->post_status, self::STATUSES, true ) ?: 'draft',
			'published_at' => $published ? $published->format( DATE_ATOM ) : null,
		);
	}

	private static function find_hero( int $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post || HeroPostType::POST_TYPE !== $post->post_type || ! in_array( $post->post_status, array_values( self::STATUSES ), true ) ) {
			return new \WP_Error( 'hero_not_found', 'Герой не найден.', array( 'status' => 404 ) );
		}
		return $post;
	}

	private static function body( $request ): array {
		$json = $request->get_json_params();
		return is_array( $json ) ? $json : $request->get_body_params();
	}

	private static function validate_payload( array $payload, bool $require_core_fields ) {
		foreach ( array( 'first_name', 'last_name', 'district_id', 'status' ) as $required ) {
			if ( $require_core_fields && ! array_key_exists( $required, $payload ) ) {
				return self::validation_error( $required, 'Обязательное поле отсутствует.' );
			}
		}
		$string_fields = array( 'first_name', 'last_name', 'middle_name', 'birth_date', 'death_date', 'biography', 'feat', 'awards', 'status', 'published_at' );
		foreach ( $string_fields as $field ) {
			if ( array_key_exists( $field, $payload ) && null !== $payload[ $field ] && ! is_string( $payload[ $field ] ) ) {
				return self::validation_error( $field, 'Поле должно быть строкой или null.' );
			}
		}
		foreach ( array( 'district_id', 'main_image_id' ) as $field ) {
			if ( array_key_exists( $field, $payload ) && null !== $payload[ $field ] && ( ! is_scalar( $payload[ $field ] ) || ! ctype_digit( (string) $payload[ $field ] ) ) ) {
				return self::validation_error( $field, 'Поле должно быть целым ID или null.' );
			}
		}

		$data = array(
			'first_name'    => sanitize_text_field( (string) ( $payload['first_name'] ?? '' ) ),
			'last_name'     => sanitize_text_field( (string) ( $payload['last_name'] ?? '' ) ),
			'middle_name'   => sanitize_text_field( (string) ( $payload['middle_name'] ?? '' ) ),
			'district_id'   => absint( $payload['district_id'] ?? 0 ),
			'birth_date'    => trim( (string) ( $payload['birth_date'] ?? '' ) ),
			'death_date'    => trim( (string) ( $payload['death_date'] ?? '' ) ),
			'main_image_id' => absint( $payload['main_image_id'] ?? 0 ),
			'biography'     => sanitize_textarea_field( (string) ( $payload['biography'] ?? '' ) ),
			'feat'          => sanitize_textarea_field( (string) ( $payload['feat'] ?? '' ) ),
			'awards'        => sanitize_textarea_field( (string) ( $payload['awards'] ?? '' ) ),
			'gallery_ids'   => $payload['gallery_ids'] ?? array(),
			'status'        => (string) ( $payload['status'] ?? '' ),
			'published_at'  => trim( (string) ( $payload['published_at'] ?? '' ) ),
		);

		if ( '' === trim( $data['first_name'] ) || '' === trim( $data['last_name'] ) ) {
			return self::validation_error( 'name', 'Имя и фамилия обязательны.' );
		}
		if ( self::string_length( $data['first_name'] ) > 200 || self::string_length( $data['last_name'] ) > 200 || self::string_length( $data['middle_name'] ) > 200 ) {
			return self::validation_error( 'name', 'Поле имени не должно быть длиннее 200 символов.' );
		}
		if ( ! $data['district_id'] || ! term_exists( $data['district_id'], DistrictTaxonomy::TAXONOMY ) ) {
			return self::validation_error( 'district_id', 'Указанный район не существует.' );
		}
		if ( ! isset( self::STATUSES[ $data['status'] ] ) ) {
			return self::validation_error( 'status', 'Недопустимый статус героя.' );
		}

		foreach ( array( 'birth_date', 'death_date' ) as $date_field ) {
			if ( '' !== $data[ $date_field ] && '' === HeroMeta::sanitize_date( $data[ $date_field ] ) ) {
				return self::validation_error( $date_field, 'Дата должна содержать год YYYY или полную календарную дату YYYY-MM-DD.' );
			}
		}
		if ( '' !== $data['birth_date'] && '' !== $data['death_date'] && ! HeroMeta::dates_are_chronological( $data['birth_date'], $data['death_date'] ) ) {
			return self::validation_error( 'death_date', 'Дата смерти не может быть раньше даты рождения.' );
		}

		if ( $data['main_image_id'] && ! MediaService::is_image_attachment( $data['main_image_id'] ) ) {
			return self::validation_error( 'main_image_id', 'Главное изображение не является image attachment.' );
		}
		if ( ! is_array( $data['gallery_ids'] ) ) {
			return self::validation_error( 'gallery_ids', 'Галерея должна быть массивом ID.' );
		}
		foreach ( $data['gallery_ids'] as $attachment_id ) {
			if ( ! is_scalar( $attachment_id ) || ! ctype_digit( (string) $attachment_id ) ) {
				return self::validation_error( 'gallery_ids', 'Каждый gallery ID должен быть целым числом.' );
			}
		}
		$data['gallery_ids'] = array_values( array_unique( array_map( 'absint', $data['gallery_ids'] ) ) );
		foreach ( $data['gallery_ids'] as $attachment_id ) {
			if ( ! MediaService::is_image_attachment( $attachment_id ) ) {
				return self::validation_error( 'gallery_ids', 'Галерея содержит ID, который не является image attachment.' );
			}
		}

		$data['scheduled_date'] = null;
		if ( 'scheduled' === $data['status'] ) {
			$date = self::parse_scheduled_date( $data['published_at'] );
			if ( is_wp_error( $date ) ) {
				return $date;
			}
			$data['scheduled_date'] = $date;
		}
		return $data;
	}

	private static function check_write_permissions( array $data ) {
		if ( ! current_user_can( 'assign_museum_districts' ) ) {
			return new \WP_Error( 'museum_forbidden', 'Нет права назначать район.', array( 'status' => 403 ) );
		}
		if ( in_array( $data['status'], array( 'scheduled', 'published' ), true ) && ! current_user_can( 'publish_museum_heroes' ) ) {
			return new \WP_Error( 'museum_forbidden', 'Нет права публиковать героев.', array( 'status' => 403 ) );
		}
		return true;
	}

	private static function parse_scheduled_date( string $value ) {
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/', $value ) ) {
			return self::validation_error( 'published_at', 'Для scheduled нужна ISO-8601 дата и время без timezone conversion.' );
		}
		$format = 16 === strlen( $value ) ? '!Y-m-d\TH:i' : '!Y-m-d\TH:i:s';
		$date   = DateTimeImmutable::createFromFormat( $format, $value, wp_timezone() );
		$errors = DateTimeImmutable::getLastErrors();
		if ( false === $date || ( is_array( $errors ) && ( $errors['warning_count'] || $errors['error_count'] ) ) ) {
			return self::validation_error( 'published_at', 'Некорректная дата отложенной публикации.' );
		}
		if ( $date <= current_datetime() ) {
			return self::validation_error( 'published_at', 'Дата отложенной публикации должна быть строго в будущем.' );
		}
		return $date;
	}

	private static function post_data( array $data ): array {
		$post_data = array(
			'post_title'  => implode( ' ', array_filter( array( $data['last_name'], $data['first_name'], $data['middle_name'] ) ) ),
			'post_status' => self::STATUSES[ $data['status'] ],
		);
		if ( 'scheduled' === $data['status'] ) {
			$post_data['post_date']     = $data['scheduled_date']->format( 'Y-m-d H:i:s' );
			$post_data['post_date_gmt'] = get_gmt_from_date( $post_data['post_date'] );
		} elseif ( 'published' === $data['status'] ) {
			$post_data['post_date']     = current_time( 'mysql' );
			$post_data['post_date_gmt'] = current_time( 'mysql', true );
		}
		return $post_data;
	}

	private static function save_relations_and_meta( int $post_id, array $data ) {
		$terms = wp_set_object_terms( $post_id, array( $data['district_id'] ), DistrictTaxonomy::TAXONOMY, false );
		if ( is_wp_error( $terms ) ) {
			return new \WP_Error( 'hero_district_update_failed', 'Не удалось назначить район.', array( 'status' => 500 ) );
		}

		$meta = array(
			HeroMeta::FIRST_NAME  => $data['first_name'],
			HeroMeta::LAST_NAME   => $data['last_name'],
			HeroMeta::MIDDLE_NAME => $data['middle_name'],
			HeroMeta::BIRTH_DATE  => $data['birth_date'],
			HeroMeta::DEATH_DATE  => $data['death_date'],
			HeroMeta::BIOGRAPHY   => $data['biography'],
			HeroMeta::FEAT        => $data['feat'],
			HeroMeta::AWARDS      => $data['awards'],
			HeroMeta::GALLERY_IDS => $data['gallery_ids'],
		);
		foreach ( $meta as $key => $value ) {
			if ( '' === $value || array() === $value ) {
				delete_post_meta( $post_id, $key );
			} else {
				update_post_meta( $post_id, $key, is_string( $value ) ? wp_slash( $value ) : $value );
			}
		}
		$data['main_image_id'] ? set_post_thumbnail( $post_id, $data['main_image_id'] ) : delete_post_thumbnail( $post_id );
		return true;
	}

	private static function to_write_payload( $post ): array {
		$date      = get_post_datetime( $post, 'date' );
		$districts = wp_get_object_terms( $post->ID, DistrictTaxonomy::TAXONOMY, array( 'fields' => 'ids' ) );
		$gallery   = get_post_meta( $post->ID, HeroMeta::GALLERY_IDS, true );
		return array(
			'first_name'    => get_post_meta( $post->ID, HeroMeta::FIRST_NAME, true ),
			'last_name'     => get_post_meta( $post->ID, HeroMeta::LAST_NAME, true ),
			'middle_name'   => get_post_meta( $post->ID, HeroMeta::MIDDLE_NAME, true ),
			'district_id'   => ! is_wp_error( $districts ) && $districts ? (int) reset( $districts ) : 0,
			'birth_date'    => get_post_meta( $post->ID, HeroMeta::BIRTH_DATE, true ),
			'death_date'    => get_post_meta( $post->ID, HeroMeta::DEATH_DATE, true ),
			'main_image_id' => (int) get_post_thumbnail_id( $post->ID ),
			'biography'     => get_post_meta( $post->ID, HeroMeta::BIOGRAPHY, true ),
			'feat'          => get_post_meta( $post->ID, HeroMeta::FEAT, true ),
			'awards'        => get_post_meta( $post->ID, HeroMeta::AWARDS, true ),
			'gallery_ids'   => is_array( $gallery ) ? $gallery : array(),
			'status'        => array_search( $post->post_status, self::STATUSES, true ) ?: 'draft',
			'published_at'  => $date ? $date->setTimezone( wp_timezone() )->format( 'Y-m-d\TH:i:s' ) : '',
		);
	}

	private static function nullable_meta( int $post_id, string $key ) {
		$value = (string) get_post_meta( $post_id, $key, true );
		return '' === $value ? null : $value;
	}

	private static function validation_error( string $field, string $message ): \WP_Error {
		return new \WP_Error( 'hero_validation_failed', $message, array( 'status' => 422, 'field' => $field ) );
	}

	private static function string_length( string $value ): int {
		return function_exists( 'mb_strlen' ) ? mb_strlen( $value, 'UTF-8' ) : strlen( $value );
	}

	private static function positive_query_integer( $value, int $default, string $field ) {
		if ( null === $value || '' === $value ) {
			return $default;
		}
		if ( ! is_scalar( $value ) || ! ctype_digit( (string) $value ) || absint( $value ) < 1 ) {
			return self::validation_error( $field, 'Поле должно быть положительным integer.' );
		}
		return absint( $value );
	}
}
