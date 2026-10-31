<?php
if (!defined('ABSPATH')) exit;
class MMP_RU_Harden {
  static function init(){
    add_filter('pre_option_show_avatars','__return_zero');
    add_filter('avatar_defaults',function($l){return [];});
    add_action('init',[__CLASS__,'oe'],99);
    add_action('wp_enqueue_scripts',[__CLASS__,'gf'],100);
  }
  static function oe(){ remove_action('wp_head','wp_oembed_add_discovery_links'); remove_action('wp_head','wp_oembed_add_host_js'); remove_action('rest_api_init','wp_oembed_register_route'); }
  static function gf(){ global $wp_styles; if(!$wp_styles) return; foreach($wp_styles->queue as $h){ $src=$wp_styles->registered[$h]->src??''; if(strpos($src,'fonts.googleapis.com')!==false){ wp_dequeue_style($h); } } }
}
