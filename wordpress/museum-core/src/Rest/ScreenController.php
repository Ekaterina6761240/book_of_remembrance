<?php

namespace MuseumCore\Rest;

use MuseumCore\Screen\SnapshotStore;

final class ScreenController {
	private const NAMESPACE = 'museum/v1';

	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/screen',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'get_snapshot' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/screen/version',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'get_version' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	public static function get_snapshot( $request ) {
		$snapshot = SnapshotStore::get_or_build();
		if ( is_wp_error( $snapshot ) ) {
			return $snapshot;
		}
		return self::response( $request, $snapshot, (int) $snapshot['version'] );
	}

	public static function get_version( $request ) {
		$snapshot = SnapshotStore::get_or_build();
		if ( is_wp_error( $snapshot ) ) {
			return $snapshot;
		}
		return self::response( $request, array( 'version' => (int) $snapshot['version'] ), (int) $snapshot['version'] );
	}

	private static function response( $request, array $data, int $version ): \WP_REST_Response {
		$etag = '"museum-screen-' . $version . '"';
		if ( trim( (string) $request->get_header( 'if-none-match' ) ) === $etag ) {
			$response = new \WP_REST_Response( null, 304 );
		} else {
			$response = new \WP_REST_Response( $data );
		}
		$response->header( 'Cache-Control', 'public, no-cache, must-revalidate' );
		$response->header( 'ETag', $etag );
		return $response;
	}
}
