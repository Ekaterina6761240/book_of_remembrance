<?php

namespace MuseumCore\Rest;

use MuseumCore\Media\MediaService;

final class MediaController {
	private const NAMESPACE     = 'museum/v1';
	private const ALLOWED_MIMES = array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif' );

	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/media',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_list' ),
					'permission_callback' => array( self::class, 'can_upload' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'upload' ),
					'permission_callback' => array( self::class, 'can_upload' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/media/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( self::class, 'delete' ),
				'permission_callback' => array( self::class, 'can_delete' ),
			)
		);
	}

	public static function can_upload(): bool {
		return current_user_can( 'upload_files' );
	}

	public static function can_delete( $request ) {
		$attachment_id = (int) $request['id'];
		if ( ! MediaService::is_image_attachment( $attachment_id ) ) {
			return new \WP_Error( 'media_not_found', 'Изображение не найдено.', array( 'status' => 404 ) );
		}
		if ( ! current_user_can( MediaService::DELETE_CAPABILITY ) || ! current_user_can( 'delete_post', $attachment_id ) ) {
			return new \WP_Error( 'museum_forbidden', 'Нет права удалять это изображение.', array( 'status' => 403 ) );
		}
		return true;
	}

	public static function get_list() {
		$attachments = get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);
		return new \WP_REST_Response( array_values( array_filter( array_map( array( MediaDto::class, 'from_attachment' ), $attachments ) ) ) );
	}

	public static function upload( $request ) {
		$name_param = $request->get_param( 'name' );
		if ( null !== $name_param && ! is_string( $name_param ) ) {
			return self::validation_error( 'name', 'Имя media должно быть строкой.' );
		}
		$files = $request->get_file_params();
		if ( empty( $files['file'] ) || ! is_array( $files['file'] ) ) {
			return self::validation_error( 'file', 'Нужен multipart file в поле file.' );
		}
		$file = $files['file'];
		if (
			! empty( $file['error'] )
			|| empty( $file['tmp_name'] )
			|| ! is_string( $file['tmp_name'] )
			|| empty( $file['name'] )
			|| ! is_string( $file['name'] )
		) {
			return self::validation_error( 'file', 'Файл не был загружен корректно.' );
		}
		if ( ! empty( $file['size'] ) && (int) $file['size'] > wp_max_upload_size() ) {
			return self::validation_error( 'file', 'Файл превышает допустимый WordPress upload limit.' );
		}

		$checked = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'] );
		if ( empty( $checked['type'] ) || ! in_array( $checked['type'], self::ALLOWED_MIMES, true ) ) {
			return self::validation_error( 'file', 'Разрешены только JPEG, PNG, GIF, WebP и AVIF изображения.' );
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';

		$post_data = array();
		$name      = sanitize_text_field( (string) $name_param );
		if ( '' !== $name ) {
			$post_data['post_title'] = $name;
		}
		$attachment_id = media_handle_upload( 'file', 0, $post_data, array( 'test_form' => false ) );
		if ( is_wp_error( $attachment_id ) ) {
			return new \WP_Error( 'media_upload_failed', 'Не удалось сохранить изображение.', array( 'status' => 500 ) );
		}

		return new \WP_REST_Response( MediaDto::from_attachment( (int) $attachment_id ), 201 );
	}

	public static function delete( $request ) {
		$attachment_id = (int) $request['id'];
		if ( MediaService::is_in_use( $attachment_id ) ) {
			return new \WP_Error( 'media_in_use', 'Изображение используется героем и не может быть удалено.', array( 'status' => 409 ) );
		}
		if ( ! wp_delete_attachment( $attachment_id, true ) ) {
			return new \WP_Error( 'media_delete_failed', 'Не удалось удалить изображение.', array( 'status' => 500 ) );
		}
		return new \WP_REST_Response( null, 204 );
	}

	private static function validation_error( string $field, string $message ): \WP_Error {
		return new \WP_Error( 'media_validation_failed', $message, array( 'status' => 422, 'field' => $field ) );
	}
}
