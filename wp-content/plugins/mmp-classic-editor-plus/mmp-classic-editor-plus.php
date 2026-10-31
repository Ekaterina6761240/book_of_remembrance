<?php
/*
Plugin Name: MMP Classic Editor Plus
Description: Отключает Gutenberg и включает расширенный TinyMCE.
Version: 1.0.0
Author: MultimediaPro Team
License: GPLv2 or later
*/
if (!defined('ABSPATH')) exit;
class MMP_Classic_Editor_Plus {
  public static function init(){
    add_filter('use_block_editor_for_post', '__return_false', 100);
    add_filter('use_block_editor_for_post_type', '__return_false', 100);
    add_filter('gutenberg_can_edit_post_type', '__return_false', 100);
    add_filter('mce_buttons', [__CLASS__, 'toolbar1']);
    add_filter('mce_buttons_2', [__CLASS__, 'toolbar2']);
    add_filter('tiny_mce_before_init', [__CLASS__, 'mce_init']);
  }
  public static function toolbar1($buttons){
    return ['formatselect','bold','italic','underline','strikethrough','bullist','numlist','blockquote','alignleft','aligncenter','alignright','link','unlink','undo','redo'];
  }
  public static function toolbar2($buttons){
    return ['hr','charmap','forecolor','backcolor','fontselect','fontsizeselect','removeformat','outdent','indent'];
  }
  public static function mce_init($init){
    $plugins = ['charmap','hr','lists','link','paste','textcolor'];
    $init['plugins'] = isset($init['plugins']) ? $init['plugins'] . ' ' . implode(' ', $plugins) : implode(' ', $plugins);
    $init['block_formats'] = 'Параграф=p; Заголовок 2=h2; Заголовок 3=h3; Заголовок 4=h4; Цитата=blockquote; Преформатированный=pre';
    $init['fontsize_formats'] = '12px 14px 16px 18px 20px 24px 28px 32px';
    return $init;
  }
}
add_action('plugins_loaded', ['MMP_Classic_Editor_Plus','init']);
