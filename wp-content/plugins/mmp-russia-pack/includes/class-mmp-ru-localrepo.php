<?php
if (!defined('ABSPATH')) exit;
class MMP_RU_LocalRepo {
  static function init(){ add_action('admin_menu',[__CLASS__,'menu']); add_action('admin_post_mmp_install_zip',[__CLASS__,'install_from_catalog']); }
  static function menu(){ add_submenu_page('mmp-ru','Локальный каталог','Локальный каталог','install_plugins','mmp-ru-localrepo',[__CLASS__,'render']); }
  static function render(){
    if(!current_user_can('install_plugins')) wp_die('Нет прав');
    echo '<div class="wrap"><h1>Локальный каталог расширений</h1>';
    echo '<p>Загрузите ZIP или установите из предустановленного каталога ниже.</p>';
    echo '<form method="post" enctype="multipart/form-data">'; wp_nonce_field('mmp_ru_localrepo');
    echo '<input type="file" name="mmp_zip" accept=".zip" required> '; submit_button('Установить из ZIP'); echo '</form>';
    self::list_preloaded(); echo '</div>';
    if(isset($_FILES['mmp_zip']) && check_admin_referer('mmp_ru_localrepo')){
      require_once ABSPATH.'wp-admin/includes/file.php'; require_once ABSPATH.'wp-admin/includes/class-wp-upgrader.php'; WP_Filesystem();
      $u = new Plugin_Upgrader(new Automatic_Upgrader_Skin()); $res=$u->install($_FILES['mmp_zip']['tmp_name']);
      if(is_wp_error($res)||!$res){ $t=new Theme_Upgrader(new Automatic_Upgrader_Skin()); $res=$t->install($_FILES['mmp_zip']['tmp_name']); }
      echo $res?'<div class="updated"><p>Готово.</p></div>':'<div class="error"><p>Ошибка установки.</p></div>';
    }
  }
  static function list_preloaded(){
    $dir = WP_CONTENT_DIR . '/mmp-catalog'; if(!is_dir($dir)) return;
    $items = array_values(array_filter(scandir($dir), function($f){ return substr($f,-4)=='.zip'; }));
    if(!$items) return;
    echo '<h2>Предустановленные плагины</h2><ul>';
    foreach($items as $zip){
      $url = wp_nonce_url(admin_url('admin-post.php?action=mmp_install_zip&file='.$zip),'mmp_install_zip');
      echo '<li style="margin:6px 0;">'.esc_html($zip).' — <a class="button" href="'.esc_url($url).'">Установить</a></li>';
    }
    echo '</ul>';
  }
  static function install_from_catalog(){
    if(!current_user_can('install_plugins')) wp_die('Нет прав');
    if(!check_admin_referer('mmp_install_zip')) wp_die('Bad nonce');
    $file = sanitize_file_name($_GET['file'] ?? '');
    $src = WP_CONTENT_DIR . '/mmp-catalog/' . $file;
    if(!file_exists($src)) wp_die('Файл не найден');
    require_once ABSPATH.'wp-admin/includes/file.php'; require_once ABSPATH.'wp-admin/includes/class-wp-upgrader.php'; WP_Filesystem();
    $u=new Plugin_Upgrader(new Automatic_Upgrader_Skin()); $res=$u->install($src);
    if(is_wp_error($res)||!$res){ $t=new Theme_Upgrader(new Automatic_Upgrader_Skin()); $res=$t->install($src); }
    wp_redirect(admin_url('admin.php?page=mmp-ru-localrepo&installed='.( $res ? '1':'0'))); exit;
  }
}
