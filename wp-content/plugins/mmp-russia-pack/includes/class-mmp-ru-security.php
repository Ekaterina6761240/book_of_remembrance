<?php
if (!defined('ABSPATH')) exit;
class MMP_RU_Security {
  static function init(){ add_action('admin_menu',[__CLASS__,'menu']); }
  static function menu(){ add_submenu_page('mmp-ru','Проверка безопасности','Проверка безопасности','manage_options','mmp-ru-security',[__CLASS__,'render']); }
  static function render(){
    if(!current_user_can('manage_options')) wp_die('Нет прав');
    $items=[];
    $items[]=['PHP', phpversion(), version_compare(PHP_VERSION,'8.1','>=')];
    $items[]=['OPcache', function_exists('opcache_get_status')?'включен':'выключен', function_exists('opcache_get_status')];
    $items[]=['WP_DEBUG', (defined('WP_DEBUG')&&WP_DEBUG)?'ON':'OFF', !(defined('WP_DEBUG')&&WP_DEBUG)];
    $items[]=['ЧПУ включены', get_option('permalink_structure') ? 'да':'нет', (bool)get_option('permalink_structure')];
    $items[]=['Логин admin', (get_user_by('login','admin')?'есть':'нет'), !get_user_by('login','admin')];
    echo '<div class="wrap"><h1>Быстрая проверка безопасности</h1><table class="widefat"><thead><tr><th>Проверка</th><th>Значение</th><th>OK</th></tr></thead><tbody>';
    foreach($items as $i){ echo '<tr><td>'.esc_html($i[0]).'</td><td>'.esc_html($i[1]).'</td><td>'.($i[2]?'ОК':'Есть проблемы').'</td></tr>'; }
    echo '</tbody></table><p>Рекомендуется: 2FA, ограничение /wp-admin по IP, регулярные бэкапы.</p></div>';
  }
}
