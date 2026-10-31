<?php
/**
 * Front to the MultimediaPro application. This file doesn't do anything, but loads
 * wp-blog-header.php which does and tells MultimediaPro to load the theme.
 *
 * @package MultimediaPro
 */

/**
 * Tells MultimediaPro to load the MultimediaPro theme and output it.
 *
 * @var bool
 */
define( 'WP_USE_THEMES', true );

/** Loads the MultimediaPro Environment and Template */
require __DIR__ . '/wp-blog-header.php';
