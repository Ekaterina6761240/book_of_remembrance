<?php

namespace MuseumCore\Auth;

final class SameOriginGuard {
	public static function validate( $request ) {
		$origin          = trim( (string) $request->get_header( 'origin' ) );
		$referer         = trim( (string) $request->get_header( 'referer' ) );
		$fetch_site      = strtolower( trim( (string) $request->get_header( 'sec-fetch-site' ) ) );
		$allowed_origins = apply_filters(
			'museum_core_allowed_auth_origins',
			array_filter( array( self::origin_of( home_url( '/' ) ), self::origin_of( site_url( '/' ) ) ) )
		);
		$allowed_origins = array_values( array_unique( array_filter( array_map( array( self::class, 'origin_of' ), (array) $allowed_origins ) ) ) );

		if ( '' !== $origin && ! in_array( self::origin_of( $origin ), $allowed_origins, true ) ) {
			return self::forbidden();
		}
		if ( '' === $origin && '' !== $referer && ! in_array( self::origin_of( $referer ), $allowed_origins, true ) ) {
			return self::forbidden();
		}
		if ( '' === $origin && '' === $referer && '' !== $fetch_site && ! in_array( $fetch_site, array( 'same-origin', 'none' ), true ) ) {
			return self::forbidden();
		}
		return true;
	}

	public static function origin_of( $url ): string {
		if ( ! is_string( $url ) || '' === trim( $url ) ) {
			return '';
		}
		$parts = wp_parse_url( trim( $url ) );
		if ( ! is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
			return '';
		}
		$scheme = strtolower( $parts['scheme'] );
		$host   = strtolower( $parts['host'] );
		if ( false !== strpos( $host, ':' ) && '[' !== substr( $host, 0, 1 ) ) {
			$host = '[' . $host . ']';
		}
		$port   = isset( $parts['port'] ) ? (int) $parts['port'] : null;
		if ( ( 'http' === $scheme && 80 === $port ) || ( 'https' === $scheme && 443 === $port ) ) {
			$port = null;
		}
		return $scheme . '://' . $host . ( $port ? ':' . $port : '' );
	}

	private static function forbidden(): \WP_Error {
		return new \WP_Error( 'cross_origin_forbidden', 'Вход разрешён только с same-origin Museum Core.', array( 'status' => 403 ) );
	}
}
