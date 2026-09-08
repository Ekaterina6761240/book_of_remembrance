<?php

namespace MuseumCore\Permissions;

use MuseumCore\Content\DistrictTaxonomy;
use MuseumCore\Content\HeroPostType;
use MuseumCore\Media\MediaService;

final class RoleManager {
	public const ROLE = 'museum_editor';
	private const VERSION_OPTION = 'museum_core_capabilities_version';

	public static function maybe_migrate( string $version ): void {
		if ( get_option( self::VERSION_OPTION ) === $version ) {
			return;
		}
		self::migrate( $version );
	}

	public static function migrate( string $version ): void {
		$role = get_role( self::ROLE );
		if ( ! $role ) {
			add_role( self::ROLE, 'Сотрудник музея', array( 'read' => true ) );
			$role = get_role( self::ROLE );
		}

		if ( $role ) {
			foreach ( self::editor_capabilities() as $capability ) {
				$role->add_cap( $capability );
			}
			foreach ( self::forbidden_capabilities() as $capability ) {
				$role->remove_cap( $capability );
			}
		}

		$administrator = get_role( 'administrator' );
		if ( $administrator ) {
			foreach ( self::museum_capabilities() as $capability ) {
				$administrator->add_cap( $capability );
			}
		}

		update_option( self::VERSION_OPTION, $version, false );
	}

	public static function museum_capabilities(): array {
		return array_values(
			array_unique(
				array_merge(
					HeroPostType::capabilities(),
					DistrictTaxonomy::capabilities(),
					array( MediaService::DELETE_CAPABILITY )
				)
			)
		);
	}

	private static function editor_capabilities(): array {
		return array_merge( array( 'read', 'upload_files' ), self::museum_capabilities() );
	}

	private static function forbidden_capabilities(): array {
		return array(
			'manage_options',
			'activate_plugins',
			'install_plugins',
			'update_plugins',
			'delete_plugins',
			'edit_plugins',
			'switch_themes',
			'edit_theme_options',
			'install_themes',
			'update_themes',
			'delete_themes',
			'edit_themes',
			'list_users',
			'create_users',
			'edit_users',
			'delete_users',
			'promote_users',
		);
	}
}
