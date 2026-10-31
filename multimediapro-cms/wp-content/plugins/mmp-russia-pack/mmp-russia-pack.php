<?php
/*
Plugin Name: MultimediaPro Russia Pack
Description: Российские интеграции: Yandex ID, RU транслитерация URL, отключение Gravatar/Google Fonts, локальный каталог, проверка безопасности, опциональный HTTP allowlist.
Version: 1.3.0
Author: MultimediaPro Team
License: GPLv2 or later
*/
if (!defined('ABSPATH')) exit;
require_once __DIR__ . '/includes/class-mmp-ru-admin.php';
require_once __DIR__ . '/includes/class-mmp-ru-yandex.php';
require_once __DIR__ . '/includes/class-mmp-ru-translit.php';
require_once __DIR__ . '/includes/class-mmp-ru-harden.php';
require_once __DIR__ . '/includes/class-mmp-ru-localrepo.php';
require_once __DIR__ . '/includes/class-mmp-ru-security.php';
require_once __DIR__ . '/includes/class-mmp-ru-allowlist.php';

add_action('plugins_loaded', function(){
    MMP_RU_Admin::init();
    MMP_RU_Yandex::init();
    MMP_RU_Translit::init();
    MMP_RU_Harden::init();
    MMP_RU_LocalRepo::init();
    MMP_RU_Security::init();
    MMP_RU_Allowlist::init(); // disabled until configured
}, 20);
