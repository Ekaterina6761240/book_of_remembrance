<?php
// MultimediaPro PHP fallback installer (offline).
// Usage (called by installer.sh):
// php tools/installer.php --url="https://site" --title="MultimediaPro" --admin_user="admin" --admin_password="pass" --admin_email="you@ex.com" --locale="ru_RU" --activate="plugin1,plugin2"

ini_set('display_errors', '1');
error_reporting(E_ALL);

parse_str(implode('&', array_slice($argv, 1)), $args);
$site_url   = $args['--url']            ?? null;
$site_title = $args['--title']          ?? 'MultimediaPro';
$admin_user = $args['--admin_user']     ?? 'admin';
$admin_pass = $args['--admin_password'] ?? null;
$admin_mail = $args['--admin_email']    ?? 'admin@example.com';
$locale     = $args['--locale']         ?? 'ru_RU';
$activate   = $args['--activate']       ?? ''; // comma-separated

if (!$site_url || !$admin_pass) {
    fwrite(STDERR, "Need --url and --admin_password\n");
    exit(1);
}

// Ensure we run from WP root
$root = getcwd();
if (!file_exists($root.'/wp-load.php')) {
    fwrite(STDERR, "Run from WordPress root (wp-load.php not found)\n");
    exit(1);
}

// Fix locale early (works with our MU plugin too)
putenv("WPLANG=$locale");
define('WP_INSTALLING', true);

require_once $root.'/wp-load.php';
require_once ABSPATH.'wp-admin/includes/upgrade.php';
require_once ABSPATH.'wp-includes/option.php';
require_once ABSPATH.'wp-includes/pluggable.php';
require_once ABSPATH.'wp-admin/includes/plugin.php';

// Normalize site URL (no trailing slash)
$site_url = rtrim($site_url, "/");

// Install core (creates tables and admin)
$public = 1;
$deprecated = '';
wp_install($site_title, $admin_user, $admin_mail, $public, $deprecated, $admin_pass, $locale);

// After install, switch off installing mode
if (!defined('WP_INSTALLING')) { define('WP_INSTALLING', false); }

// RU baseline options (safe now — tables exist)
update_option('WPLANG', $locale);
update_option('timezone_string', 'Europe/Moscow');
update_option('date_format', 'd.m.Y');
update_option('time_format', 'H:i');

// Site URL (in some hosts, better set explicitly)
update_option('siteurl', $site_url);
update_option('home', $site_url);

// Permalinks: /%postname%/
global $wp_rewrite;
update_option('permalink_structure', '/%postname%/');
if (function_exists('flush_rewrite_rules')) {
    flush_rewrite_rules(true);
}

// Activate plugins if present
$to_activate = array_filter(array_map('trim', explode(',', $activate)));
foreach ($to_activate as $slug) {
    $main = WP_PLUGIN_DIR . "/$slug/$slug.php";
    if (file_exists($main)) {
        $res = activate_plugin("$slug/$slug.php", '', false, true);
        if (is_wp_error($res)) {
            error_log("Activate $slug: ".$res->get_error_message());
        }
    }
}

// Create base pages (ignore if fail)
$pages = [
    ['post_title'=>'Главная','post_status'=>'publish','post_type'=>'page'],
    ['post_title'=>'Контакты','post_status'=>'publish','post_type'=>'page'],
    ['post_title'=>'Политика конфиденциальности','post_status'=>'publish','post_type'=>'page'],
];
foreach ($pages as $p) {
    wp_insert_post($p);
}

echo "Installed OK. Admin: $site_url/wp-admin/\n";
