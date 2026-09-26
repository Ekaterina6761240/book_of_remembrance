<?php

namespace MuseumCore;

require_once __DIR__ . '/Content/HeroPostType.php';
require_once __DIR__ . '/Content/DistrictTaxonomy.php';
require_once __DIR__ . '/Content/DistrictMeta.php';
require_once __DIR__ . '/Content/HeroMeta.php';
require_once __DIR__ . '/Content/HeroMetaBoxes.php';
require_once __DIR__ . '/Content/HeroDerivedFields.php';
require_once __DIR__ . '/Media/MediaService.php';
require_once __DIR__ . '/Screen/PublicMediaDto.php';
require_once __DIR__ . '/Screen/SnapshotBuilder.php';
require_once __DIR__ . '/Screen/SnapshotStore.php';
require_once __DIR__ . '/Screen/SnapshotHooks.php';
require_once __DIR__ . '/Auth/AuthService.php';
require_once __DIR__ . '/Auth/SameOriginGuard.php';
require_once __DIR__ . '/Frontend/FrontendApp.php';
require_once __DIR__ . '/Permissions/RoleManager.php';
require_once __DIR__ . '/Rest/MediaDto.php';
require_once __DIR__ . '/Rest/HeroesController.php';
require_once __DIR__ . '/Rest/DistrictsController.php';
require_once __DIR__ . '/Rest/MediaController.php';
require_once __DIR__ . '/Rest/ScreenController.php';
require_once __DIR__ . '/Rest/AuthController.php';

use MuseumCore\Content\DistrictTaxonomy;
use MuseumCore\Content\DistrictMeta;
use MuseumCore\Content\HeroDerivedFields;
use MuseumCore\Content\HeroMeta;
use MuseumCore\Content\HeroMetaBoxes;
use MuseumCore\Content\HeroPostType;
use MuseumCore\Frontend\FrontendApp;
use MuseumCore\Permissions\RoleManager;
use MuseumCore\Rest\DistrictsController;
use MuseumCore\Rest\AuthController;
use MuseumCore\Rest\HeroesController;
use MuseumCore\Rest\MediaController;
use MuseumCore\Rest\ScreenController;
use MuseumCore\Screen\SnapshotHooks;

final class Plugin {
	public const VERSION = '0.4.0';

	public function init(): void {
		add_action( 'init', array( HeroPostType::class, 'register' ) );
		add_action( 'init', array( DistrictTaxonomy::class, 'register' ) );
		add_action( 'init', array( DistrictMeta::class, 'register' ) );
		add_action( 'init', array( HeroMeta::class, 'register' ) );
		add_action( 'rest_api_init', array( HeroesController::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( DistrictsController::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( MediaController::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( ScreenController::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( AuthController::class, 'register_routes' ) );
		DistrictTaxonomy::register_hooks();
		HeroMetaBoxes::register_hooks();
		HeroDerivedFields::register_hooks();
		SnapshotHooks::register();
		AuthController::register_hooks();
		FrontendApp::register_hooks();
		add_action( 'plugins_loaded', array( $this, 'maybe_migrate' ) );
	}

	public static function activate(): void {
		HeroPostType::register();
		DistrictTaxonomy::register();
		DistrictMeta::register();
		HeroMeta::register();
		RoleManager::migrate( self::VERSION );
		FrontendApp::activate();
	}

	public static function deactivate(): void {
		FrontendApp::deactivate();
	}

	public function maybe_migrate(): void {
		RoleManager::maybe_migrate( self::VERSION );
	}
}
