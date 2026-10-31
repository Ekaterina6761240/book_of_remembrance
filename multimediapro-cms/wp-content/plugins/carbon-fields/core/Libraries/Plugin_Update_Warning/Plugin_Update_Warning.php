<?php

namespace Carbon_Fields_Plugin\Libraries\Plugin_Update_Warning;

/**
 * This class is responsible for displaying a plugin update warning when a major version is released.
 */
class Plugin_Update_Warning {

    public static function instance() {
        static $instance;

        // PHP 8.3-safe: без get_class(), используем позднее статическое связывание
        if ( ! $instance instanceof static ) {
            $instance = new static();
        }
        return $instance;
    }

    public static function boot() {
        add_action( 'admin_head', array( static::instance(), 'setup' ) );
    }

    public function setup() {
        global $pagenow;

        if ( ! in_array( $pagenow, array( 'plugins.php', 'update-core.php' ), true ) ) {
            return;
        }

        if ( ! $this->has_major_update() ) {
            return;
        }

        add_action( 'admin_footer', array( $this, 'enqueue_scripts' ) );

        ob_start();
        $this->template();
        $template = ob_get_clean();

        add_action( 'admin_footer', function () use ( $template ) {
            ?>
            <script type="text/html" id="crb-tmpl-plugin-update-warning">
                <?php echo apply_filters( 'carbon_fields_plugin_update_warning_template', $template ); ?>
            </script>
            <?php
        } );
    }

    protected function has_major_update() {
        if ( ! function_exists( 'get_plugin_updates' ) ) {
            require_once ABSPATH . 'wp-admin/includes/update.php';
        }

        $all_updates = get_plugin_updates();

        // Безопасно получаем данные по текущему плагину
        $plugin_key = defined( '\Carbon_Fields_Plugin\RELATIVE_PLUGIN_FILE' )
            ? \Carbon_Fields_Plugin\RELATIVE_PLUGIN_FILE
            : null;

        if ( ! $plugin_key || empty( $all_updates[ $plugin_key ] ) ) {
            return false;
        }

        $carbon_fields_data = $all_updates[ $plugin_key ];

        if ( ! function_exists( '_get_plugin_data_markup_translate' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugin_data     = (object) _get_plugin_data_markup_translate( $plugin_key, (array) $carbon_fields_data, false, true );
        $current_version = implode( '.', array_slice( explode( '.', $plugin_data->Version ), 0, 1 ) );
        $update_version  = implode( '.', array_slice( explode( '.', $plugin_data->update->new_version ), 0, 1 ) );

        // сравниваем только MAJOR-часть SemVer
        return version_compare( $current_version, $update_version, '<' );
    }

    protected function get_json_data() {
        return array(
            // FIX: правильная константа неймспейса
            'plugin_path' => defined( '\Carbon_Fields_Plugin\RELATIVE_PLUGIN_FILE' )
                ? \Carbon_Fields_Plugin\RELATIVE_PLUGIN_FILE
                : '',
        );
    }

    protected function template() {
        ?>
        <div class="update-message notice inline notice-error notice-alt">
            <p><?php
                echo nl2br( sprintf(
                    __( 'The new version of Carbon Fields is a major update. Please make sure you have a full backup before updating and test any add-ons or custom functionality.' . "\n" . 'Developers should review the upgrade guide on %1$s.', 'carbon-fields' ),
                    '<a href="https://carbonfields.net/" target="_blank" rel="noopener">carbonfields.net</a>'
                ) );
                ?></p>
        </div>
        <?php
    }

    public function enqueue_scripts() {
        // Защита на случай, если константы не определены
        $base_url = defined( '\Carbon_Fields\URL' ) ? \Carbon_Fields\URL : '';
        $ver      = defined( '\Carbon_Fields\VERSION' ) ? \Carbon_Fields\VERSION : null;

        if ( $base_url ) {
            wp_enqueue_style(
                'carbon-fields-plugin-update-warning',
                $base_url . '/core/Libraries/Plugin_Update_Warning/assets/css/app.css',
                array(),
                $ver
            );
            wp_enqueue_script(
                'carbon-fields-plugin-update-warning',
                $base_url . '/core/Libraries/Plugin_Update_Warning/assets/js/app.js',
                array( 'jquery', 'backbone' ),
                $ver,
                true
            );
            wp_localize_script(
                'carbon-fields-plugin-update-warning',
                'carbonFieldsPluginUpdateWarning',
                $this->get_json_data()
            );
        }
    }
}
