<?php
/**
 * Plugin Name: Museum Core
 * Description: Backend for Book of Remembrance
 * Version: 0.4.0
 * Author: Project Team
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/src/Plugin.php';

register_activation_hook( __FILE__, array( MuseumCore\Plugin::class, 'activate' ) );

$museum_core_plugin = new MuseumCore\Plugin();
$museum_core_plugin->init();
