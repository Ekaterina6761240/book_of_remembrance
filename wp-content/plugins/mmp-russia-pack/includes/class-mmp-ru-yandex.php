<?php
if (!defined('ABSPATH')) exit;
class MMP_RU_Yandex {
  static function init(){ add_action('login_form',[__CLASS__,'btn']); add_action('init',[__CLASS__,'routes']); add_action('template_redirect',[__CLASS__,'callback']); }
  static function opts(){ return get_option('mmp_ru_options',[]); }
  static function btn(){
    $o=self::opts(); if(empty($o['yandex_client_id'])) return;
    $cb=!empty($o['yandex_redirect_uri'])?$o['yandex_redirect_uri']:home_url('/mmp-yandex-callback');
    $auth=add_query_arg(['response_type'=>'code','client_id'=>$o['yandex_client_id'],'redirect_uri'=>$cb],'https://oauth.yandex.ru/authorize');
    echo '<p style="text-align:center;margin:10px 0;"><a class="button button-primary" href="'.esc_url($auth).'">Войти через Яндекс</a></p>';
  }
  static function routes(){ add_rewrite_rule('^mmp-yandex-callback/?','index.php?mmp_ycb=1','top'); add_rewrite_tag('%mmp_ycb%','([0-1])'); }
  static function callback(){
    if(get_query_var('mmp_ycb')!=1) return; $o=self::opts();
    $cid=$o['yandex_client_id']??''; $cs=$o['yandex_client_secret']??''; $cb=$o['yandex_redirect_uri']??home_url('/mmp-yandex-callback');
    if(empty($_GET['code'])||!$cid||!$cs) wp_die('Yandex OAuth не настроен');
    $resp=wp_remote_post('https://oauth.yandex.ru/token',['body'=>['grant_type'=>'authorization_code','code'=>sanitize_text_field($_GET['code']),'client_id'=>$cid,'client_secret'=>$cs,'redirect_uri'=>$cb]]);
    if(is_wp_error($resp)) wp_die('Ошибка соединения с Yandex OAuth');
    $data=json_decode(wp_remote_retrieve_body($resp),true); if(empty($data['access_token'])) wp_die('Нет токена');
    $u=wp_remote_get('https://login.yandex.ru/info?format=json',['headers'=>['Authorization'=>'OAuth '.$data['access_token']]]);
    if(is_wp_error($u)) wp_die('Ошибка профиля'); $ui=json_decode(wp_remote_retrieve_body($u),true);
    $email=$ui['default_email'] ?? ($ui['emails'][0] ?? ($ui['id'].'@yandex.local')); $login='yandex_'.$ui['id'];
    $user=get_user_by('email',$email); if(!$user){ $uid=wp_create_user($login,wp_generate_password(20),$email); $user=get_user_by('ID',$uid); }
    wp_set_current_user($user->ID); wp_set_auth_cookie($user->ID); wp_redirect(admin_url()); exit;
  }
}
