<?php
if (!defined('ABSPATH')) exit;
class MMP_RU_Admin {
  const OPTION_KEY='mmp_ru_options';
  static function init(){
    add_action('admin_menu',[__CLASS__,'menu']);
    add_action('admin_init',[__CLASS__,'settings']);
  }
  static function menu(){
    add_menu_page('MultimediaPro RU','MultimediaPro RU','manage_options','mmp-ru',[__CLASS__,'render'],'dashicons-shield-alt',56);
  }
  static function settings(){
    register_setting(self::OPTION_KEY,self::OPTION_KEY);
    add_settings_section('oauth','Yandex ID (OAuth2)','__return_false','mmp-ru');
    foreach(['yandex_client_id','yandex_client_secret','yandex_redirect_uri'] as $k){
      add_settings_field($k,$k,[__CLASS__,'field'],'mmp-ru','oauth',['key'=>$k]);
    }
    add_settings_section('allow','HTTP allowlist (опционально)','__return_false','mmp-ru');
    add_settings_field('allowlist_hosts','Разрешенные хосты',[__CLASS__,'field'],'mmp-ru','allow',['key'=>'allowlist_hosts']);
  }
  static function field($args){
    $opts=get_option(self::OPTION_KEY,[]); $v=esc_attr($opts[$args['key']]??'');
    echo '<input type="text" style="width:420px" name="'.self::OPTION_KEY.'['.$args['key'].']" value="'.$v.'">';
  }
  static function render(){
    echo '<div class="wrap"><h1>MultimediaPro — Российские интеграции</h1><form method="post" action="options.php">';
    settings_fields(self::OPTION_KEY); do_settings_sections('mmp-ru'); submit_button();
    echo '</form><p>Заполните параметры OAuth Яндекса и при необходимости задайте allowlist исходящих HTTP.</p></div>';
  }
}
