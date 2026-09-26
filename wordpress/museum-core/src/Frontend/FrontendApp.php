<?php

namespace MuseumCore\Frontend;

use MuseumCore\Auth\AuthService;

final class FrontendApp {
	public const BASE_PATH = '/book-of-remembrance';
	private const APP_QUERY_VAR = 'museum_core_app';
	private const SW_QUERY_VAR  = 'museum_core_app_sw';
	private const BASE_OPTION   = 'museum_core_app_base_path';

	public static function register_hooks(): void {
		add_filter( 'query_vars', array( self::class, 'register_query_vars' ) );
		add_action( 'init', array( self::class, 'register_rewrite_rules' ), 20 );
		add_action( 'init', array( self::class, 'maybe_flush_rewrite_rules' ), 99 );
		add_action( 'template_redirect', array( self::class, 'render_request' ), 0 );
	}

	public static function register_query_vars( array $query_vars ): array {
		$query_vars[] = self::APP_QUERY_VAR;
		$query_vars[] = self::SW_QUERY_VAR;
		return $query_vars;
	}

	public static function register_rewrite_rules(): void {
		$base = trim( self::BASE_PATH, '/' );
		add_rewrite_rule( '^' . preg_quote( $base, '#' ) . '/sw\.js$', 'index.php?' . self::SW_QUERY_VAR . '=1', 'top' );
		add_rewrite_rule( '^' . preg_quote( $base, '#' ) . '/(?:screen|staff)(?:/.*)?$', 'index.php?' . self::APP_QUERY_VAR . '=1', 'top' );
	}

	public static function maybe_flush_rewrite_rules(): void {
		if ( get_option( self::BASE_OPTION ) === self::BASE_PATH ) {
			return;
		}
		update_option( self::BASE_OPTION, self::BASE_PATH, false );
		flush_rewrite_rules( false );
	}

	public static function activate(): void {
		self::register_rewrite_rules();
		update_option( self::BASE_OPTION, self::BASE_PATH, false );
		flush_rewrite_rules( false );
	}

	public static function deactivate(): void {
		delete_option( self::BASE_OPTION );
		flush_rewrite_rules( false );
	}

	public static function render_request(): void {
		if ( get_query_var( self::SW_QUERY_VAR ) ) {
			self::render_service_worker();
		}
		if ( get_query_var( self::APP_QUERY_VAR ) ) {
			self::render_shell();
		}
	}

	private static function render_shell(): void {
		$entry = self::load_manifest_entry();
		if ( is_wp_error( $entry ) ) {
			self::render_unavailable();
		}

		$build_url = trailingslashit( plugins_url( 'public/build', self::plugin_file() ) );
		$config    = self::runtime_config();
		status_header( 200 );
		nocache_headers();
		header( 'Content-Type: text/html; charset=' . get_option( 'blog_charset' ) );
		?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php echo esc_attr( get_option( 'blog_charset' ) ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="Музейная книга памяти">
	<title>Книга памяти</title>
	<?php foreach ( $entry['css'] as $css_file ) : ?>
		<link rel="stylesheet" href="<?php echo esc_url( $build_url . $css_file ); ?>">
	<?php endforeach; ?>
</head>
<body style="margin:0">
	<div id="root" class="book-of-remembrance-root"></div>
	<script>window.MuseumAppConfig=<?php echo wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>;</script>
	<script type="module" crossorigin src="<?php echo esc_url( $build_url . $entry['file'] ); ?>"></script>
</body>
</html>
		<?php
		exit;
	}

	private static function render_service_worker(): void {
		$file = self::build_directory() . '/sw.js';
		if ( ! is_readable( $file ) ) {
			self::render_unavailable();
		}
		status_header( 200 );
		header( 'Content-Type: application/javascript; charset=UTF-8' );
		header( 'Cache-Control: no-cache, must-revalidate' );
		header( 'Service-Worker-Allowed: ' . trailingslashit( self::BASE_PATH ) );
		readfile( $file );
		exit;
	}

	private static function runtime_config(): array {
		$current_user = null;
		$nonce        = null;
		if ( is_user_logged_in() ) {
			$user = wp_get_current_user();
			if ( AuthService::has_museum_access( $user ) ) {
				$current_user = AuthService::to_user_dto( $user );
				$nonce        = wp_create_nonce( 'wp_rest' );
			}
		}

		return array(
			'restUrl'     => untrailingslashit( wp_make_link_relative( rest_url( 'museum/v1' ) ) ),
			'appBasePath' => self::BASE_PATH,
			'nonce'       => $nonce,
			'currentUser' => $current_user,
		);
	}

	private static function load_manifest_entry() {
		$manifest_file = self::build_directory() . '/manifest.json';
		if ( ! is_readable( $manifest_file ) ) {
			return new \WP_Error( 'museum_frontend_build_missing' );
		}
		$contents = file_get_contents( $manifest_file );
		$manifest = is_string( $contents ) ? json_decode( $contents, true ) : null;
		if ( ! is_array( $manifest ) ) {
			return new \WP_Error( 'museum_frontend_manifest_invalid' );
		}

		$entry = isset( $manifest['index.html'] ) && is_array( $manifest['index.html'] )
			? $manifest['index.html']
			: null;
		if ( null === $entry ) {
			foreach ( $manifest as $candidate ) {
				if ( is_array( $candidate ) && ! empty( $candidate['isEntry'] ) ) {
					$entry = $candidate;
					break;
				}
			}
		}

		if ( ! is_array( $entry ) || ! self::is_build_path( $entry['file'] ?? null ) ) {
			return new \WP_Error( 'museum_frontend_entry_missing' );
		}
		$css = isset( $entry['css'] ) && is_array( $entry['css'] ) ? $entry['css'] : array();
		if ( array_filter( $css, static function ( $file ): bool { return ! self::is_build_path( $file ); } ) ) {
			return new \WP_Error( 'museum_frontend_css_invalid' );
		}

		return array(
			'file' => $entry['file'],
			'css'  => array_values( $css ),
		);
	}

	private static function is_build_path( $path ): bool {
		return is_string( $path ) && '' !== $path && 0 !== strpos( $path, '/' ) && false === strpos( $path, '..' );
	}

	private static function build_directory(): string {
		return dirname( __DIR__, 2 ) . '/public/build';
	}

	private static function plugin_file(): string {
		return dirname( __DIR__, 2 ) . '/museum-core.php';
	}

	private static function render_unavailable(): void {
		status_header( 503 );
		nocache_headers();
		header( 'Content-Type: text/plain; charset=UTF-8' );
		echo 'Museum frontend build is unavailable.';
		exit;
	}
}
