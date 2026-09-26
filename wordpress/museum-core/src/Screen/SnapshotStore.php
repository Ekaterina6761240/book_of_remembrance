<?php

namespace MuseumCore\Screen;

final class SnapshotStore {
	public const OPTION = 'museum_screen_snapshot';
	private const LOCK_OPTION = 'museum_screen_snapshot_lock';
	private const LOCK_TTL    = 60;

	public static function get_active() {
		$snapshot = get_option( self::OPTION );
		return self::is_valid_snapshot( $snapshot ) ? $snapshot : null;
	}

	public static function get_or_build() {
		$active = self::get_active();
		return null !== $active ? $active : self::rebuild();
	}

	public static function rebuild() {
		$token = self::acquire_lock();
		if ( ! $token ) {
			$active = self::get_active();
			return null !== $active ? $active : SnapshotBuilder::operation_error( 'lock.acquire', 'Не удалось получить rebuild lock при отсутствии active snapshot.', __FUNCTION__ );
		}

		try {
			$projection = SnapshotBuilder::build_projection();
			if ( is_wp_error( $projection ) ) {
				return $projection;
			}

			$active = self::get_active();
			if (
				null !== $active
				&& $active['districts'] === $projection['districts']
				&& $active['heroes'] === $projection['heroes']
			) {
				return $active;
			}

			$snapshot = array(
				'version'      => null === $active ? 1 : (int) $active['version'] + 1,
				'generated_at' => current_datetime()->format( DATE_ATOM ),
				'districts'    => $projection['districts'],
				'heroes'       => $projection['heroes'],
			);
			if ( false === wp_json_encode( $snapshot ) ) {
				return SnapshotBuilder::operation_error( 'json.encode', json_last_error_msg(), __FUNCTION__ );
			}

			$saved = null === $active
				? add_option( self::OPTION, $snapshot, '', false )
				: update_option( self::OPTION, $snapshot, false );
			if ( ! $saved ) {
				$concurrent = self::get_active();
				return null !== $concurrent ? $concurrent : SnapshotBuilder::operation_error( 'option.save', 'WordPress не сохранил snapshot option.', __FUNCTION__ );
			}
			return $snapshot;
		} catch ( \Throwable $error ) {
			$active = self::get_active();
			return null !== $active ? $active : SnapshotBuilder::exception_error( $error, 'rebuild.exception', __FUNCTION__ );
		} finally {
			self::release_lock( $token );
		}
	}

	private static function acquire_lock() {
		$token = wp_generate_uuid4();
		$lock  = array( 'token' => $token, 'expires_at' => time() + self::LOCK_TTL );
		if ( add_option( self::LOCK_OPTION, $lock, '', false ) ) {
			return $token;
		}

		$current = get_option( self::LOCK_OPTION );
		if ( is_array( $current ) && isset( $current['expires_at'] ) && (int) $current['expires_at'] < time() ) {
			delete_option( self::LOCK_OPTION );
			return add_option( self::LOCK_OPTION, $lock, '', false ) ? $token : false;
		}
		return false;
	}

	private static function release_lock( string $token ): void {
		$current = get_option( self::LOCK_OPTION );
		if ( is_array( $current ) && isset( $current['token'] ) && hash_equals( $token, (string) $current['token'] ) ) {
			delete_option( self::LOCK_OPTION );
		}
	}

	private static function is_valid_snapshot( $snapshot ): bool {
		return is_array( $snapshot )
			&& isset( $snapshot['version'], $snapshot['generated_at'], $snapshot['districts'], $snapshot['heroes'] )
			&& is_int( $snapshot['version'] )
			&& $snapshot['version'] > 0
			&& is_string( $snapshot['generated_at'] )
			&& is_array( $snapshot['districts'] )
			&& is_array( $snapshot['heroes'] );
	}

}
