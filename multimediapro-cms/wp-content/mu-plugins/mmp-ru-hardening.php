<?php
/**
 * Plugin Name: MMP RU Hardening (MU)
 * Description: ru_RU офлайн, блок WordPress.org/Gravatar, отключение автообновлений, XML-RPC и внешних касаний. Безопасно для установщика.
 * Author: MultimediaPro
 * Version: 1.2.0
 */

if (!defined('ABSPATH')) { return; }

/* =========================
 * 1) Базовая гигиена: Gravatar, emoji, oEmbed, новости в консоли
 * ========================= */
add_filter('pre_option_show_avatars', '__return_zero');
add_filter('avatar_defaults', static function($d){ return []; });

remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('admin_print_scripts', 'print_emoji_detection_script');
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('admin_print_styles', 'print_emoji_styles');
add_filter('emoji_svg_url', '__return_false');

remove_action('rest_api_init', 'wp_oembed_register_route');
remove_action('wp_head', 'wp_oembed_add_discovery_links');
remove_action('wp_head', 'wp_oembed_add_host_js');
add_filter('embed_oembed_discover', '__return_false');

add_action('wp_dashboard_setup', static function () {
    remove_meta_box('dashboard_primary', 'dashboard', 'side'); // Новости WordPress
});

/* =========================
 * 2) Локаль/переводы: ru_RU офлайн и без сети
 * ========================= */
// Фиксируем локаль (работает и на установщике)
add_filter('locale', static function($locale){ return 'ru_RU'; }, 0);

// На установке: возвращаем ПУСТОЙ СПИСОК переводов (ВНИМАНИЕ: массив, не объект)
add_filter('translations_api', static function ($result, $type = null, $args = null) {
    if (defined('WP_INSTALLING') && WP_INSTALLING) {
        return ['translations' => []];
    }
    return $result;
}, 0, 3);

// Убираем возможность ставить language packs
add_filter('wp_can_install_language_pack', '__return_false');

/* =========================
 * 3) Блок внешних запросов к WordPress.org/Gravatar (+ allowlist)
 * ========================= */
add_filter('pre_http_request', static function ($pre, $r, $url) {
    // Не мешаем установщику — он уже обезврежен блоком выше
    if (defined('WP_INSTALLING') && WP_INSTALLING) {
        return $pre;
    }
    $host = parse_url($url, PHP_URL_HOST);
    if (!$host) return $pre;

    // Полный список доменов экосистемы WP + Gravatar
    $blocked = [
        'wordpress.org','www.wordpress.org',
        'api.wordpress.org','translate.wordpress.org','s.w.org',
        'downloads.wordpress.org','ps.w.org','login.wordpress.org',
        'gravatar.com','secure.gravatar.com',
    ];

    // (опционально) внутренние разрешённые домены — добавьте свои при необходимости
    $allow = [
        // 'updates.multimedia-pro.ru',
        // 'repo.multimedia-pro.ru',
    ];

    foreach ($allow as $a) {
        if ($a && stripos($host, $a) !== false) return $pre;
    }
    foreach ($blocked as $b) {
        if ($b && stripos($host, $b) !== false) {
            // Возвращаем “пустой успешный” ответ (НЕ WP_Error), чтобы ничего не падало
            return ['headers'=>[], 'body'=>'', 'response'=>['code'=>200, 'message'=>'OK']];
        }
    }
    return $pre;
}, 1, 3);

/* =========================
 * 4) Полное отключение автообновлений и проверок версий
 * ========================= */
add_filter('automatic_updater_disabled','__return_true');
add_filter('auto_update_core','__return_false');
add_filter('auto_update_plugin','__return_false');
add_filter('auto_update_theme','__return_false');

// Скрыть карточки .org, если кто-то дергает API плагинов
add_filter('plugins_api', '__return_false', 100);

// Убрать крон-события и инициаторы проверок
add_action('init', static function () {
    wp_clear_scheduled_hook('wp_version_check');
    wp_clear_scheduled_hook('wp_update_plugins');
    wp_clear_scheduled_hook('wp_update_themes');

    remove_action('wp_version_check', 'wp_version_check');
    remove_action('admin_init', '_maybe_update_core');
    remove_action('admin_init', '_maybe_update_plugins');
    remove_action('admin_init', '_maybe_update_themes');
    remove_action('load-plugins.php', 'wp_update_plugins');
    remove_action('load-update-core.php', 'wp_update_core');
    remove_action('load-themes.php', 'wp_update_themes');
}, 1);

// Пустые транзиенты, чтобы админка ничего не искала
add_filter('site_transient_update_core',    static fn($t)=> (object)['last_checked'=> time(), 'updates'=>[]]);
add_filter('site_transient_update_plugins', static fn($t)=> (object)['last_checked'=> time(), 'response'=>[]]);
add_filter('site_transient_update_themes',  static fn($t)=> (object)['last_checked'=> time(), 'response'=>[]]);

/* =========================
 * 5) Site Health — убрать проверки, лезущие в .org
 * ========================= */
add_filter('site_status_tests', static function($tests){
    unset($tests['async']['dotorg_communication']);
    unset($tests['direct']['background_updates']);
    return $tests;
}, 10, 1);

/* =========================
 * 6) Отключение XML-RPC и pingback/trackback
 * ========================= */
add_filter('xmlrpc_enabled', '__return_false');
add_filter('wp_headers', static function($headers){
    unset($headers['X-Pingback']);
    return $headers;
});

// По умолчанию отключить pingbacks/trackbacks для новых записей (БЕЗОПАСНО после наличия таблиц)
add_action('init', static function(){
    // Не трогаем во время установки
    if (defined('WP_INSTALLING') && WP_INSTALLING) return;

    global $wpdb;
    $options_table = $wpdb->options; // уже с префиксом
    $exists = $wpdb->get_var( $wpdb->prepare("SHOW TABLES LIKE %s", $options_table) );
    if ($exists !== $options_table) return;

    update_option('default_ping_status', 'closed');
    update_option('default_pingback_flag', 0);
}, 1);

/* =========================
 * 7) Безопасное применение RU-настроек после установки
 * ========================= */
add_action('init', static function(){
    // Не трогаем БД во время установки
    if (defined('WP_INSTALLING') && WP_INSTALLING) return;

    global $wpdb;
    // Проверяем существование таблицы опций (префикс учитывается автоматически)
    $options_table = $wpdb->options;
    $exists = $wpdb->get_var( $wpdb->prepare("SHOW TABLES LIKE %s", $options_table) );
    if ($exists !== $options_table) return;

    if (get_option('WPLANG') !== 'ru_RU') update_option('WPLANG','ru_RU');
    update_option('timezone_string','Europe/Moscow');
    update_option('date_format','d.m.Y');
    update_option('time_format','H:i');
}, 1);


add_action('after_setup_theme', function () {
    // Отключение сжатия файлов
//    if (!defined('CONCATENATE_SCRIPTS')) define('CONCATENATE_SCRIPTS', false);
//    if (!defined('COMPRESS_SCRIPTS'))    define('COMPRESS_SCRIPTS', false);
    if (!defined('COMPRESS_CSS'))        define('COMPRESS_CSS', false);

    // Тема по умолчанию
//    $default = 'multimediapro-default';
//    if (get_option('template') !== $default || get_option('stylesheet') !== $default) {
//        switch_theme($default);
//    }
}, 0);




/**
 * Удаляем пункты меню/подменю:
 * - Настройки → Приватность
 * - Инструменты → Экспорт персональных данных
 * - Инструменты → Удаление персональных данных
 * - Инструменты → Проводник по политике конфиденциальности
 */
function mmp_remove_privacy_menus() {
    // Settings ▸ Privacy.
    remove_submenu_page('options-general.php', 'privacy.php');

    // Tools ▸ Personal Data tools + Privacy guide.
    remove_submenu_page('tools.php', 'export-personal-data.php');
    remove_submenu_page('tools.php', 'erase-personal-data.php');
    remove_submenu_page('tools.php', 'privacy-policy-guide');
    remove_submenu_page('index.php', 'update-core.php');
}
add_action('admin_menu', 'mmp_remove_privacy_menus', 9999);
add_action('network_admin_menu', 'mmp_remove_privacy_menus', 9999);

// убрать «Updates» из верхней панели (иконка-колокольчик)
add_action('admin_bar_menu', function($bar){
    $bar->remove_node('updates');
}, 999);

/**
 * Полностью блокируем прямой доступ по URL на эти экраны (редирект в админку).
 */
function mmp_redirect_from_privacy_pages() {
    wp_safe_redirect( admin_url() );
    exit;
}
add_action('load-privacy.php', 'mmp_redirect_from_privacy_pages');
add_action('load-tools_page_export-personal-data', 'mmp_redirect_from_privacy_pages');
add_action('load-tools_page_erase-personal-data', 'mmp_redirect_from_privacy_pages');
add_action('load-tools_page_privacy-policy-guide', 'mmp_redirect_from_privacy_pages');
add_action('load-update-core.php', 'mmp_redirect_from_privacy_pages');
add_action('load-update.php',      'mmp_redirect_from_privacy_pages');

// скрыть уведомление «Доступны обновления»
add_action('admin_init', function () {
    remove_action('admin_notices', 'update_nag', 3);
    remove_action('network_admin_notices', 'update_nag', 3);
}, 999);

// на всякий — не показывать счетчики обновлений
add_filter('wp_get_update_data', function($data){
    return array('counts'=>array('plugins'=>0,'themes'=>0,'wordpress'=>0,'translations'=>0,'total'=>0), 'title'=>'');
}, 999);

/**
 * Отключаем соответствующие права, чтобы пункты вообще не рисовались.
 * (Даже если что-то попытается их добавить.)
 */
add_filter('map_meta_cap', function($caps, $cap) {
    // Право на экран Настройки ▸ Приватность
    if ($cap === 'manage_privacy_options') {
        return ['do_not_allow'];
    }
    // Права на инструменты персональных данных
    if ($cap === 'export_others_personal_data' || $cap === 'erase_others_personal_data') {
        return ['do_not_allow'];
    }
    return $caps;
}, 9999, 2);

/**
 * На случай, если у вас где-то массово проставлен defer/async и меню рисуется раньше/позже —
 * дополнительно уберём пункт CSS-ом (не обязателен, но помогает «добить» UI).
 */
add_action('admin_head', function () {
    echo '<style>
      #menu-settings a[href$="privacy.php"] { display:none !important; }
      #menu-tools  a[href*="export-personal-data.php"],
      #menu-tools  a[href*="erase-personal-data.php"],
      #menu-tools  a[href*="page=privacy-policy-guide"] { display:none !important; }
    </style>';
}, 999);


/** =========================
 *  2) Брендинг логотипа
 *  ========================= */

// абсолютный URL к вашему svg (лежит в wp-admin/images/logo.svg)
function mmp_admin_logo_url() {
    return admin_url('images/logo.svg');
}

// верхняя админ‑панель: меняем иконку «W» слева
add_action('admin_head', function () {
    $logo = esc_url( mmp_admin_logo_url() );
    echo '<style id="mmp-admin-branding">
    /* заменяем иконку WP в верхнем баре */
    #wp-admin-bar-wp-logo > .ab-item .ab-icon:before {
        content: "";
        background-image: url('.$logo.');
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        width: 140px !important;
        height: auto !important;
        top: initial !important;
    }
    /* у некоторых тем цвет перекрывает svg — обнулим */
    #wp-admin-bar-wp-logo > .ab-item .ab-icon {
        color: transparent !important;
        float: none !important;
        align-items: center !important;
        display: flex !important;
        width: 140px !important;
    }
    #wp-admin-bar-wp-logo > .ab-item {
      align-items: center !important;
        display: flex !important;
    }
    /* на ховере оставляем тот же логотип */
    #wpadminbar #wp-admin-bar-wp-logo .ab-icon:before { color: transparent !important; }
    </style>';
}, 11);

// страница логина: заменяем логотип и ссылку
add_action('login_head', function () {
    $logo = esc_url( mmp_admin_logo_url() );
    echo '<style id="mmp-login-branding">
    #login h1 a {
        background-image: url('.$logo.') !important;
        width: 200px !important;           /* подгоните при необходимости */
        height: 80px !important;           /* подгоните при необходимости */
        background-size: contain !important;
        background-repeat: no-repeat !important;
        background-position: center !important;
    }
    </style>';
}, 11);
// клик по логотипу на логине -> на главную админки
add_filter('login_headerurl', function(){ return admin_url(); });
add_filter('login_headertext', function(){ return get_bloginfo('name'); });

/** =========================
 *  3) (опционально) отрубить сами права на обновления,
 *     чтобы разделы не «всплывали»
 *  ========================= */
add_filter('map_meta_cap', function($caps, $cap){
    if (in_array($cap, ['update_core','update_plugins','update_themes'], true)) {
        return ['do_not_allow'];
    }
    return $caps;
}, 9999, 2);

// Устанавливаем цветовую схему по умолчанию при регистрации нового пользователя
function mmp_set_default_admin_color($user_id) {
    $args = array(
        'ID' => $user_id,
        'admin_color' => 'midnight' // варианты: fresh, light, blue, coffee, ectoplasm, midnight, ocean, sunrise
    );
    wp_update_user($args);
}
add_action('user_register', 'mmp_set_default_admin_color');

