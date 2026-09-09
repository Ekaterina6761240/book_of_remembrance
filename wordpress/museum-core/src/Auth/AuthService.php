<?php

namespace MuseumCore\Auth;

final class AuthService {
	public static function has_museum_access( $user ): bool {
		return $user instanceof \WP_User
			&& $user->exists()
			&& user_can( $user, 'edit_museum_heroes' );
	}

	public static function to_user_dto( $user ): array {
		$roles = is_array( $user->roles ) ? $user->roles : array();
		$role  = in_array( 'administrator', $roles, true ) ? 'administrator' : 'editor';
		return array(
			'id'           => (int) $user->ID,
			'username'     => sanitize_user( (string) $user->user_login, true ),
			'display_name' => sanitize_text_field( (string) $user->display_name ),
			'email'        => sanitize_email( (string) $user->user_email ),
			'role'         => $role,
		);
	}

	public static function auth_payload( $user ): array {
		return array(
			'user'  => self::to_user_dto( $user ),
			'nonce' => wp_create_nonce( 'wp_rest' ),
		);
	}

	public static function no_store_response( array $data, int $status = 200 ): \WP_REST_Response {
		$response = new \WP_REST_Response( $data, $status );
		$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
		$response->header( 'Pragma', 'no-cache' );
		return $response;
	}

	public static function require_authenticated_request( $request ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'auth_unauthorized', 'Требуется авторизация.', array( 'status' => 401 ) );
		}

		$nonce = $request->get_header( 'x-wp-nonce' );
		if ( ! is_string( $nonce ) || '' === $nonce || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new \WP_Error( 'invalid_rest_nonce', 'Некорректный или истёкший REST nonce.', array( 'status' => 403 ) );
		}

		$user = wp_get_current_user();
		if ( ! self::has_museum_access( $user ) ) {
			return new \WP_Error( 'museum_access_forbidden', 'Пользователь не имеет доступа к Museum Core.', array( 'status' => 403 ) );
		}
		return true;
	}
}
