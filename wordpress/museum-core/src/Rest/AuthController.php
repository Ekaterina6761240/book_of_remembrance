<?php

namespace MuseumCore\Rest;

use MuseumCore\Auth\AuthService;
use MuseumCore\Auth\SameOriginGuard;

final class AuthController {
	private const NAMESPACE = 'museum/v1';

	public static function register_hooks(): void {
		add_filter( 'rest_post_dispatch', array( self::class, 'add_no_store_headers' ), 10, 3 );
	}

	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/auth/login',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( self::class, 'login' ),
				'permission_callback' => array( SameOriginGuard::class, 'validate' ),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/auth/logout',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( self::class, 'logout' ),
				'permission_callback' => array( AuthService::class, 'require_authenticated_request' ),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/auth/me',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'me' ),
				'permission_callback' => array( AuthService::class, 'require_authenticated_request' ),
			)
		);
	}

	public static function login( $request ) {
		if ( 'POST' !== strtoupper( $request->get_method() ) ) {
			return new \WP_Error( 'auth_method_not_allowed', 'Для входа разрешён только POST.', array( 'status' => 405 ) );
		}
		if ( method_exists( $request, 'get_json_error' ) && is_wp_error( $request->get_json_error() ) ) {
			return self::validation_error( 'Тело запроса содержит некорректный JSON.' );
		}

		$body = $request->get_json_params();
		if ( ! is_array( $body ) ) {
			$body = $request->get_body_params();
		}
		if ( ! is_array( $body ) ) {
			return self::validation_error( 'Тело запроса обязательно.' );
		}
		if ( ! isset( $body['login'] ) || ! is_string( $body['login'] ) || '' === trim( $body['login'] ) ) {
			return self::validation_error( 'Поле login обязательно.' );
		}
		if ( ! isset( $body['password'] ) || ! is_string( $body['password'] ) || '' === $body['password'] ) {
			return self::validation_error( 'Поле password обязательно.' );
		}
		if ( array_key_exists( 'remember', $body ) && ! is_bool( $body['remember'] ) ) {
			return self::validation_error( 'Поле remember должно быть boolean.' );
		}

		$logged_in_cookie = '';
		$session_token    = '';
		$session_user_id  = 0;
		$capture_session  = static function ( $cookie, $expire, $expiration, $user_id, $scheme, $token ) use ( &$logged_in_cookie, &$session_token, &$session_user_id ): void {
			unset( $expire, $expiration, $scheme );
			$logged_in_cookie = (string) $cookie;
			$session_token    = (string) $token;
			$session_user_id  = (int) $user_id;
		};

		add_action( 'set_logged_in_cookie', $capture_session, 10, 6 );
		$user = wp_signon(
			array(
				'user_login'    => trim( $body['login'] ),
				'user_password' => $body['password'],
				'remember'      => $body['remember'] ?? false,
			),
			is_ssl()
		);
		remove_action( 'set_logged_in_cookie', $capture_session, 10 );

		if ( is_wp_error( $user ) ) {
			return new \WP_Error( 'invalid_credentials', 'Неверный логин или пароль.', array( 'status' => 401 ) );
		}

		$user = wp_set_current_user( $user->ID );
		if ( '' === $logged_in_cookie || '' === $session_token || $session_user_id !== (int) $user->ID ) {
			wp_logout();
			return new \WP_Error( 'auth_session_failed', 'Не удалось создать сессию WordPress.', array( 'status' => 500 ) );
		}

		// setcookie() only affects the next request; expose that same session to nonce creation now.
		$_COOKIE[ LOGGED_IN_COOKIE ] = $logged_in_cookie;
		if ( ! hash_equals( $session_token, wp_get_session_token() ) ) {
			wp_logout();
			return new \WP_Error( 'auth_session_failed', 'Не удалось создать сессию WordPress.', array( 'status' => 500 ) );
		}

		if ( ! AuthService::has_museum_access( $user ) ) {
			wp_logout();
			return new \WP_Error( 'museum_access_forbidden', 'Пользователь не имеет доступа к Museum Core.', array( 'status' => 403 ) );
		}

		return AuthService::no_store_response( AuthService::auth_payload( $user ) );
	}

	public static function logout( $request ) {
		if ( 'POST' !== strtoupper( $request->get_method() ) ) {
			return new \WP_Error( 'auth_method_not_allowed', 'Для выхода разрешён только POST.', array( 'status' => 405 ) );
		}
		wp_logout();
		return AuthService::no_store_response( array( 'success' => true ) );
	}

	public static function me( $request ) {
		if ( 'GET' !== strtoupper( $request->get_method() ) ) {
			return new \WP_Error( 'auth_method_not_allowed', 'Для auth/me разрешён только GET.', array( 'status' => 405 ) );
		}
		return AuthService::no_store_response( AuthService::auth_payload( wp_get_current_user() ) );
	}

	public static function add_no_store_headers( $response, $server, $request ) {
		unset( $server );
		if ( 0 === strpos( (string) $request->get_route(), '/museum/v1/auth/' ) ) {
			$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
			$response->header( 'Pragma', 'no-cache' );
		}
		return $response;
	}

	private static function validation_error( string $message ): \WP_Error {
		return new \WP_Error( 'auth_validation_failed', $message, array( 'status' => 422 ) );
	}
}
