<?php
if (!defined('ABSPATH')) exit;
class MMP_RU_Allowlist {
  static function init(){ add_filter('http_request_args',[__CLASS__,'filter'],10,2); }
  static function filter($args,$url){
    $opts=get_option('mmp_ru_options',[]); $list=array_filter(array_map('trim', explode(',', $opts['allowlist_hosts'] ?? '')));
    if(empty($list)) return $args; // disabled by default
    $host=parse_url($url, PHP_URL_HOST); if(!$host) return $args;
    foreach($list as $a){ if(strtolower($a)===strtolower($host)) return $args; }
    $args['reject_unsafe_urls']=true; $args['blocking']=true; $args['headers']['X-MMP-Allowlist']='blocked'; return $args;
  }
}
