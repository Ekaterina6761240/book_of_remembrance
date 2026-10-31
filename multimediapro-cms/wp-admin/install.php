<?php
/**
 *  Installer
 *
 * @package 
 * @subpackage Administration
 */

// Confidence check.
if ( false ) {
	?>
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<title>Ошибка: PHP не запущен</title>
</head>
<body class="wp-core-ui">
	<p id="logo"><a href="#">MultimediaPro</a></p>
	<h1>Ошибка: PHP не запущен</h1>
	<p>Multimedia Pro требует, чтобы на вашем веб-сервере был запущен PHP. На вашем сервере не установлен PHP или PHP отключен.</p>
</body>
</html>
	<?php
}

/**
 * We are installing MultimediaPro.
 *
 * @since 1.5.1
 * @var bool
 */
define( 'WP_INSTALLING', true );

/** Load  Bootstrap */
require_once dirname( __DIR__ ) . '/wp-load.php';

/** Load  Administration Upgrade API */
require_once ABSPATH . 'wp-admin/includes/upgrade.php';

/** Load  Translation Install API */
require_once ABSPATH . 'wp-admin/includes/translation-install.php';

/** Load wpdb */
require_once ABSPATH . WPINC . '/class-wpdb.php';

nocache_headers();

$step = isset( $_GET['step'] ) ? (int) $_GET['step'] : 0;

/**
 * Display installation header.
 *
 * @since 2.5.0
 *
 * @param string $body_classes
 */
function display_header( $body_classes = '' ) {
	header( 'Content-Type: text/html; charset=utf-8' );
	if ( is_rtl() ) {
		$body_classes .= 'rtl';
	}
	if ( $body_classes ) {
		$body_classes = ' ' . $body_classes;
	}
	?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta name="robots" content="noindex,nofollow" />
	<title><?php _e( 'MultimediaPro &rsaquo; установка' ); ?></title>
	<?php wp_admin_css( 'install', true ); ?>
</head>
<body class="wp-core-ui<?php echo $body_classes; ?>">
<p id="logo"><?php _e( 'MultimediaPro' ); ?></p>

	<?php
} // End display_header().

/**
 * Displays installer setup form.
 *
 * @since 2.8.0
 *
 * @global wpdb $wpdb  database abstraction object.
 *
 * @param string|null $error
 */
function display_setup_form( $error = null ) {
	global $wpdb;

	$user_table = ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $wpdb->users ) ) ) !== null );

	// Ensure that sites appear in search engines by default.
	$blog_public = 1;
	if ( isset( $_POST['weblog_title'] ) ) {
		$blog_public = isset( $_POST['blog_public'] ) ? (int) $_POST['blog_public'] : $blog_public;
	}

	$weblog_title = isset( $_POST['weblog_title'] ) ? trim( wp_unslash( $_POST['weblog_title'] ) ) : '';
	$user_name    = isset( $_POST['user_name'] ) ? trim( wp_unslash( $_POST['user_name'] ) ) : '';
	$admin_email  = isset( $_POST['admin_email'] ) ? trim( wp_unslash( $_POST['admin_email'] ) ) : '';

	if ( ! is_null( $error ) ) {
		?>
<h1><?php _ex( 'Добро пожаловать', 'Howdy' ); ?></h1>
<p class="message"><?php echo $error; ?></p>
<?php } ?>
<form id="setup" method="post" action="install.php?step=2" novalidate="novalidate">
	<table class="form-table" role="presentation">
		<tr>
			<th scope="row"><label for="weblog_title"><?php _e( 'Название сайта' ); ?></label></th>
			<td><input name="weblog_title" type="text" id="weblog_title" size="25" value="<?php echo esc_attr( $weblog_title ); ?>" /></td>
		</tr>
		<tr>
			<th scope="row"><label for="user_login"><?php _e( 'Имя пользователя' ); ?></label></th>
			<td>
			<?php
			if ( $user_table ) {
				_e( 'Пользователь(ы) уже существует.' );
				echo '<input name="user_name" type="hidden" value="admin" />';
			} else {
				?>
				<input name="user_name" type="text" id="user_login" size="25" aria-describedby="user-name-desc" value="<?php echo esc_attr( sanitize_user( $user_name, true ) ); ?>" />
				<p id="user-name-desc"><?php _e( 'Имена пользователей могут содержать только буквенно-цифровые символы, пробелы, знаки подчеркивания, дефисы, точки и символ @.' ); ?></p>
				<?php
			}
			?>
			</td>
		</tr>
		<?php if ( ! $user_table ) : ?>
		<tr class="form-field form-required user-pass1-wrap">
			<th scope="row">
				<label for="pass1">
					<?php _e( 'Пароль' ); ?>
				</label>
			</th>
			<td>
				<div class="wp-pwd">
					<?php $initial_password = isset( $_POST['admin_password'] ) ? stripslashes( $_POST['admin_password'] ) : wp_generate_password( 18 ); ?>
					<div class="password-input-wrapper">
						<input type="password" name="admin_password" id="pass1" class="regular-text" autocomplete="new-password" spellcheck="false" data-reveal="1" data-pw="<?php echo esc_attr( $initial_password ); ?>" aria-describedby="pass-strength-result admin-password-desc" />
						<div id="pass-strength-result" aria-live="polite"></div>
					</div>
					<button type="button" class="button wp-hide-pw hide-if-no-js" data-start-masked="<?php echo (int) isset( $_POST['admin_password'] ); ?>" data-toggle="0" aria-label="<?php esc_attr_e( 'Скрыть пароль' ); ?>">
						<span class="dashicons dashicons-hidden"></span>
						<span class="text"><?php _e( 'Скрыть' ); ?></span>
					</button>
				</div>
				<p id="admin-password-desc"><span class="description important hide-if-no-js">
				<strong><?php _e( 'Важно:' ); ?></strong>
				<?php /* translators: The non-breaking space prevents 1Password from thinking the text "log in" should trigger a password save prompt. */ ?>
				<?php _e( 'Этот пароль понадобится вам для входа в систему. Пожалуйста, храните его в надежном месте.' ); ?></span></p>
			</td>
		</tr>
		<tr class="form-field form-required user-pass2-wrap hide-if-js">
			<th scope="row">
				<label for="pass2"><?php _e( 'Повторите пароль' ); ?>
					<span class="description"><?php _e( '(обязательный)' ); ?></span>
				</label>
			</th>
			<td>
				<input type="password" name="admin_password2" id="pass2" autocomplete="new-password" spellcheck="false" />
			</td>
		</tr>
		<tr class="pw-weak">
			<th scope="row"><?php _e( 'Подтвердите пароль' ); ?></th>
			<td>
				<label>
					<input type="checkbox" name="pw_weak" class="pw-checkbox" />
					<?php _e( 'Подтвердите использование ненадежного пароля' ); ?>
				</label>
			</td>
		</tr>
		<?php endif; ?>
		<tr>
			<th scope="row"><label for="admin_email"><?php _e( 'Your Email' ); ?></label></th>
			<td><input name="admin_email" type="email" id="admin_email" size="25" aria-describedby="admin-email-desc" value="<?php echo esc_attr( $admin_email ); ?>" />
			<p id="admin-email-desc"><?php _e( 'Прежде чем продолжить, дважды проверьте свой адрес электронной почты.' ); ?></p></td>
		</tr>
		<tr>
			<th scope="row"><?php has_action( 'blog_privacy_selector' ) ? _e( 'Видимость сайта' ) : _e( 'Видимость в поисковой системе' ); ?></th>
			<td>
				<fieldset>
					<legend class="screen-reader-text"><span>
						<?php
						has_action( 'blog_privacy_selector' )
							/* translators: Hidden accessibility text. */
							? _e( 'Видимость сайта' )
							/* translators: Hidden accessibility text. */
							: _e( 'Видимость в поисковой системе' );
						?>
					</span></legend>
					<?php
					if ( has_action( 'blog_privacy_selector' ) ) {
						?>
						<input id="blog-public" type="radio" name="blog_public" value="1" <?php checked( 1, $blog_public ); ?> />
						<label for="blog-public"><?php _e( 'Разрешить поисковым системам индексировать этот сайт' ); ?></label><br />
						<input id="blog-norobots" type="radio" name="blog_public"  aria-describedby="public-desc" value="0" <?php checked( 0, $blog_public ); ?> />
						<label for="blog-norobots"><?php _e( 'Препятствуйте поисковым системам индексировать этот сайт' ); ?></label>
						<p id="public-desc" class="description"><?php _e( 'Примечание: Препятствование поисковым системам не блокирует доступ к вашему сайту - поисковые системы сами должны выполнить ваш запрос.' ); ?></p>
						<?php
						/** This action is documented in wp-admin/options-reading.php */
						do_action( 'blog_privacy_selector' );
					} else {
						?>
						<label for="blog_public"><input name="blog_public" type="checkbox" id="blog_public" aria-describedby="privacy-desc" value="0" <?php checked( 0, $blog_public ); ?> />
						<?php _e( 'Препятствуйте поисковым системам индексировать этот сайт' ); ?></label>
						<p id="privacy-desc" class="description"><?php _e( 'Поисковые системы должны выполнить этот запрос.' ); ?></p>
					<?php } ?>
				</fieldset>
			</td>
		</tr>
	</table>
	<p class="step"><?php submit_button( __( 'Установить MultimediaPro' ), 'large', 'Submit', false, array( 'id' => 'submit' ) ); ?></p>
	<input type="hidden" name="language" value="<?php echo isset( $_REQUEST['language'] ) ? esc_attr( $_REQUEST['language'] ) : ''; ?>" />
</form>
	<?php
} // End display_setup_form().

// Let's check to make sure WP isn't already installed.
if ( is_blog_installed() ) {
	display_header();
	die(
		'<h1>' . __( 'Уже установленный' ) . '</h1>' .
		'<p>' . __( 'Похоже, вы уже установили Multimedia Pro. Для переустановки, пожалуйста, сначала очистите старые таблицы базы данных.' ) . '</p>' .
		'<p class="step"><a href="' . esc_url( wp_login_url() ) . '">' . __( 'Вход' ) . '</a></p>' .
		'</body></html>'
	);
}

/**
 * @global string   $wp_version              The  version string.
 * @global string   $required_php_version    The required PHP version string.
 * @global string[] $required_php_extensions The names of required PHP extensions.
 * @global string   $required_mysql_version  The required MySQL version string.
 * @global wpdb     $wpdb                     database abstraction object.
 */
global $wp_version, $required_php_version, $required_php_extensions, $required_mysql_version, $wpdb;

$php_version   = PHP_VERSION;
$mysql_version = $wpdb->db_version();
$php_compat = version_compare((string)($php_version ?? '0'), (string)($required_php_version ?? '0'), '>=');
$mysql_compat = version_compare((string)($mysql_version ?? '0'), (string)($required_mysql_version ?? '0'), '>=')
    || file_exists(WP_CONTENT_DIR . '/db.php');

$version_url = sprintf(
	/* translators: %s: MultimediaPro version. */
	esc_url( __( 'https://cms.multimedia-pro.ru/' ) ),
	sanitize_title( $wp_version )
);

$php_update_message = '</p><p>' . sprintf(
	/* translators: %s: URL to Update PHP page. */
	__( '<a href="%s">Узнайте больше об обновлении PHP</a>.' ),
	esc_url( wp_get_update_php_url() )
);

$annotation = wp_get_update_php_annotation();

if ( $annotation ) {
	$php_update_message .= '</p><p><em>' . $annotation . '</em>';
}

if ( ! $mysql_compat && ! $php_compat ) {
	$compat = sprintf(
		/* translators: 1: URL to MultimediaPro release notes, 2: MultimediaPro version number, 3: Minimum required PHP version number, 4: Minimum required MySQL version number, 5: Current PHP version number, 6: Current MySQL version number. */
		__( 'Вы не можете установить программу, потому что <a href="%1$s">MultimediaPro %2$s</a> требуется версия PHP %3$s или более поздней версии и MySQL %4$s или выше. У вас установлена версия PHP %5$s и MySQL версии %6$s.' ),
		$version_url,
		$wp_version,
		$required_php_version,
		$required_mysql_version,
		$php_version,
		$mysql_version
	) . $php_update_message;
} elseif ( ! $php_compat ) {
	$compat = sprintf(
		/* translators: 1: URL to MultimediaPro release notes, 2: MultimediaPro version number, 3: Minimum required PHP version number, 4: Current PHP version number. */
		__( 'Вы не можете установить программу, потому что <a href="%1$s">MultimediaPro %2$s</a> требуется версия PHP %3$s или выше. У вас запущена версия %4$s.' ),
		$version_url,
		$wp_version,
		$required_php_version,
		$php_version
	) . $php_update_message;
} elseif ( ! $mysql_compat ) {
	$compat = sprintf(
		/* translators: 1: URL to MultimediaPro release notes, 2: MultimediaPro version number, 3: Minimum required MySQL version number, 4: Current MySQL version number. */
		__( 'Вы не можете установить программу, потому что <a href="%1$s">MultimediaPro %2$s</a> требуется версия MySQL %3$s или выше. У вас запущена версия %4$s.' ),
		$version_url,
		$wp_version,
		$required_mysql_version,
		$mysql_version
	);
}

if ( ! $mysql_compat || ! $php_compat ) {
	display_header();
	die( '<h1>' . __( 'Требования не выполнены' ) . '</h1><p>' . $compat . '</p></body></html>' );
}

if ( isset( $required_php_extensions ) && is_array( $required_php_extensions ) ) {
	$missing_extensions = array();

	foreach ( $required_php_extensions as $extension ) {
		if ( extension_loaded( $extension ) ) {
			continue;
		}

		$missing_extensions[] = sprintf(
			/* translators: 1: URL to MultimediaPro release notes, 2: MultimediaPro version number, 3: The PHP extension name needed. */
			__( 'Вы не можете установить программу, потому что <a href="%1$s">MultimediaPro %2$s</a> требует, чтобы присутствие %3$s PHP расширение.' ),
			$version_url,
			$wp_version,
			$extension
		);
	}

	if ( count( $missing_extensions ) > 0 ) {
		display_header();
		die( '<h1>' . __( 'Требования не выполнены' ) . '</h1><p>' . implode( '</p><p>', $missing_extensions ) . '</p></body></html>' );
	}
}

if ( ! is_string( $wpdb->base_prefix ) || '' === $wpdb->base_prefix ) {
	display_header();
	die(
		'<h1>' . __( 'Ошибка конфигурации' ) . '</h1>' .
		'<p>' . sprintf(
			/* translators: %s: wp-config.php */
			__( 'Ваш файл %s имеет пустой префикс таблицы базы данных, который не поддерживается.' ),
			'<code>wp-config.php</code>'
		) . '</p></body></html>'
	);
}

// Set error message if DO_NOT_UPGRADE_GLOBAL_TABLES isn't set as it will break install.
if ( defined( 'DO_NOT_UPGRADE_GLOBAL_TABLES' ) ) {
	display_header();
	die(
		'<h1>' . __( 'Configuration Error' ) . '</h1>' .
		'<p>' . sprintf(
			/* translators: %s: DO_NOT_UPGRADE_GLOBAL_TABLES */
			__( 'Константа %s не может быть определена при установке MultimediaPro.' ),
			'<code>DO_NOT_UPGRADE_GLOBAL_TABLES</code>'
		) . '</p></body></html>'
	);
}

/**
 * @global string    $wp_local_package Locale code of the package.
 * @global WP_Locale $wp_locale         date and time locale object.
 */
$language = '';
if ( ! empty( $_REQUEST['language'] ) ) {
	$language = sanitize_locale_name( $_REQUEST['language'] );
} elseif ( isset( $GLOBALS['wp_local_package'] ) ) {
	$language = $GLOBALS['wp_local_package'];
}

$scripts_to_print = array( 'jquery' );

switch ( $step ) {
	case 0: // Step 0.
		if ( wp_can_install_language_pack() && empty( $language ) ) {
			$languages = wp_get_available_translations();
			if ( $languages ) {
				$scripts_to_print[] = 'language-chooser';
				display_header( 'language-chooser' );
				echo '<form id="setup" method="post" action="?step=1">';
				wp_install_language_form( $languages );
				echo '</form>';
				break;
			}
		}

		// Deliberately fall through if we can't reach the translations API.

	case 1: // Step 1, direct link or from language chooser.
		if ( ! empty( $language ) ) {
			$loaded_language = wp_download_language_pack( $language );
			if ( $loaded_language ) {
				load_default_textdomain( $loaded_language );
				$GLOBALS['wp_locale'] = new WP_Locale();
			}
		}

		$scripts_to_print[] = 'user-profile';

		display_header();
		?>
<h1><?php _ex( 'Добро пожаловат', 'Howdy' ); ?></h1>
<p><?php _e( 'Добро пожаловать на знаменитый пятиминутный процесс установки Multimedia Pro! Просто заполните приведенную ниже информацию, и вы будете на пути к использованию самой расширяемой и мощной персональной издательской платформы в мире.' ); ?></p>

<h2><?php _e( 'Необходимая информация' ); ?></h2>
<p><?php _e( 'Пожалуйста, предоставьте следующую информацию. Не волнуйтесь, вы всегда сможете изменить эти настройки позже.' ); ?></p>

		<?php
		display_setup_form();
		break;
	case 2:
		if ( ! empty( $language ) && load_default_textdomain( $language ) ) {
			$loaded_language      = $language;
			$GLOBALS['wp_locale'] = new WP_Locale();
		} else {
			$loaded_language = 'en_US';
		}

		if ( ! empty( $wpdb->error ) ) {
			wp_die( $wpdb->error->get_error_message() );
		}

		$scripts_to_print[] = 'user-profile';

		display_header();
		// Fill in the data we gathered.
		$weblog_title         = isset( $_POST['weblog_title'] ) ? trim( wp_unslash( $_POST['weblog_title'] ) ) : '';
		$user_name            = isset( $_POST['user_name'] ) ? trim( wp_unslash( $_POST['user_name'] ) ) : '';
		$admin_password       = isset( $_POST['admin_password'] ) ? wp_unslash( $_POST['admin_password'] ) : '';
		$admin_password_check = isset( $_POST['admin_password2'] ) ? wp_unslash( $_POST['admin_password2'] ) : '';
		$admin_email          = isset( $_POST['admin_email'] ) ? trim( wp_unslash( $_POST['admin_email'] ) ) : '';
		$public               = isset( $_POST['blog_public'] ) ? (int) $_POST['blog_public'] : 1;

		// Check email address.
		$error = false;
		if ( empty( $user_name ) ) {
			display_setup_form( __( 'Пожалуйста, укажите действительное имя пользователя.' ) );
			$error = true;
		} elseif ( sanitize_user( $user_name, true ) !== $user_name ) {
			display_setup_form( __( 'Указанное вами имя пользователя содержит недопустимые символы.' ) );
			$error = true;
		} elseif ( $admin_password !== $admin_password_check ) {
			display_setup_form( __( 'Ваши пароли не совпадают. Пожалуйста, попробуйте снова.' ) );
			$error = true;
		} elseif ( empty( $admin_email ) ) {
			display_setup_form( __( 'Вы должны указать адрес электронной почты.' ) );
			$error = true;
		} elseif ( ! is_email( $admin_email ) ) {
			display_setup_form( __( 'Извините, это неверный адрес электронной почты. Адреса электронной почты выглядят как <code>username@example.com</code>.' ) );
			$error = true;
		}

		if ( false === $error ) {
			$wpdb->show_errors();
			$result = wp_install( $weblog_title, $user_name, $admin_email, $public, '', wp_slash( $admin_password ), $loaded_language );
			?>

<h1><?php _e( 'Успешно!' ); ?></h1>

<p><?php _e( 'MultimediaPro был установлен. Спасибо и наслаждайтесь!' ); ?></p>

<table class="form-table install-success">
	<tr>
		<th><?php _e( 'Username' ); ?></th>
		<td><?php echo esc_html( sanitize_user( $user_name, true ) ); ?></td>
	</tr>
	<tr>
		<th><?php _e( 'Password' ); ?></th>
		<td>
			<?php if ( ! empty( $result['password'] ) && empty( $admin_password_check ) ) : ?>
				<code><?php echo esc_html( $result['password'] ); ?></code><br />
			<?php endif; ?>
			<p><?php echo $result['password_message']; ?></p>
		</td>
	</tr>
</table>

<p class="step"><a href="<?php echo esc_url( wp_login_url() ); ?>"><?php _e( 'Log In' ); ?></a></p>

			<?php
		}
		break;
}

if ( ! wp_is_mobile() ) {
	?>
<script type="text/javascript">var t = document.getElementById('weblog_title'); if (t){ t.focus(); }</script>
	<?php
}

wp_print_scripts( $scripts_to_print );
?>
<script type="text/javascript">
jQuery( function( $ ) {
	$( '.hide-if-no-js' ).removeClass( 'hide-if-no-js' );
} );
</script>
</body>
</html>
