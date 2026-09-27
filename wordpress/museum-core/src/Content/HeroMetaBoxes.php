<?php

namespace MuseumCore\Content;

final class HeroMetaBoxes {
	private const NONCE_ACTION = 'museum_core_save_hero_meta';
	private const NONCE_NAME   = '_museum_core_hero_meta_nonce';

	public static function register_hooks(): void {
		add_action( 'add_meta_boxes_' . HeroPostType::POST_TYPE, array( self::class, 'add_meta_boxes' ) );
		add_action( 'save_post_' . HeroPostType::POST_TYPE, array( self::class, 'save' ), 20, 3 );
	}

	public static function add_meta_boxes(): void {
		add_meta_box(
			'museum-core-hero-data',
			'Данные героя',
			array( self::class, 'render_data_meta_box' ),
			HeroPostType::POST_TYPE,
			'normal',
			'high'
		);

		add_meta_box(
			'museum-core-hero-gallery',
			'Изображения героя',
			array( self::class, 'render_gallery_meta_box' ),
			HeroPostType::POST_TYPE,
			'side',
			'default'
		);
	}

	public static function render_data_meta_box( $post ): void {
		wp_nonce_field( self::NONCE_ACTION, self::NONCE_NAME );
		?>
		<p>Заголовок записи формируется автоматически из фамилии, имени и отчества.</p>
		<table class="form-table" role="presentation">
			<tbody>
				<?php self::render_text_row( $post->ID, HeroMeta::LAST_NAME, 'Фамилия' ); ?>
				<?php self::render_text_row( $post->ID, HeroMeta::FIRST_NAME, 'Имя' ); ?>
				<?php self::render_text_row( $post->ID, HeroMeta::MIDDLE_NAME, 'Отчество' ); ?>
				<?php self::render_date_row( $post->ID, HeroMeta::BIRTH_DATE, 'Дата рождения' ); ?>
				<?php self::render_date_row( $post->ID, HeroMeta::DEATH_DATE, 'Дата смерти' ); ?>
				<?php self::render_textarea_row( $post->ID, HeroMeta::BIOGRAPHY, 'Биография' ); ?>
				<?php self::render_textarea_row( $post->ID, HeroMeta::FEAT, 'Подвиг' ); ?>
				<?php self::render_textarea_row( $post->ID, HeroMeta::AWARDS, 'Награды' ); ?>
			</tbody>
		</table>
		<?php
	}

	public static function render_gallery_meta_box( $post ): void {
		$gallery_ids = get_post_meta( $post->ID, HeroMeta::GALLERY_IDS, true );
		if ( ! is_array( $gallery_ids ) ) {
			$gallery_ids = array();
		}
		?>
		<p>Главное изображение задаётся штатным блоком «Изображение записи».</p>
		<label for="museum-core-gallery-ids">ID изображений в порядке показа</label>
		<input
			class="widefat"
			id="museum-core-gallery-ids"
			name="<?php echo esc_attr( HeroMeta::GALLERY_IDS ); ?>"
			type="text"
			inputmode="numeric"
			value="<?php echo esc_attr( implode( ', ', $gallery_ids ) ); ?>"
		/>
		<p class="description">Укажите ID изображений через запятую. Неизвестные и не являющиеся изображениями attachments будут исключены.</p>
		<?php
	}

	public static function save( int $post_id, $post, bool $update ): void {
		unset( $post, $update );
		if ( ! self::can_save( $post_id ) ) {
			return;
		}

		foreach ( self::editable_string_meta_keys() as $meta_key ) {
			if ( ! isset( $_POST[ $meta_key ] ) || ! is_string( $_POST[ $meta_key ] ) ) {
				continue;
			}
			$value = sanitize_meta(
				$meta_key,
				wp_unslash( $_POST[ $meta_key ] ),
				'post',
				HeroPostType::POST_TYPE
			);
			self::store_or_delete( $post_id, $meta_key, $value );
		}

		if ( isset( $_POST[ HeroMeta::GALLERY_IDS ] ) && is_string( $_POST[ HeroMeta::GALLERY_IDS ] ) ) {
			$raw_ids = trim( wp_unslash( $_POST[ HeroMeta::GALLERY_IDS ] ) );
			$ids     = '' === $raw_ids ? array() : preg_split( '/[\s,]+/', $raw_ids );
			$ids     = HeroMeta::sanitize_gallery_ids( false === $ids ? array() : $ids );
			self::store_or_delete( $post_id, HeroMeta::GALLERY_IDS, $ids );
		}
	}

	private static function can_save( int $post_id ): bool {
		if (
			! isset( $_POST[ self::NONCE_NAME ] )
			|| ! is_string( $_POST[ self::NONCE_NAME ] )
			|| ! wp_verify_nonce(
				sanitize_text_field( wp_unslash( $_POST[ self::NONCE_NAME ] ) ),
				self::NONCE_ACTION
			)
		) {
			return false;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return false;
		}

		if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
			return false;
		}

		return current_user_can( 'edit_post', $post_id );
	}

	private static function editable_string_meta_keys(): array {
		return array(
			HeroMeta::FIRST_NAME,
			HeroMeta::LAST_NAME,
			HeroMeta::MIDDLE_NAME,
			HeroMeta::BIRTH_DATE,
			HeroMeta::DEATH_DATE,
			HeroMeta::BIOGRAPHY,
			HeroMeta::FEAT,
			HeroMeta::AWARDS,
		);
	}

	private static function store_or_delete( int $post_id, string $meta_key, $value ): void {
		if ( '' === $value || array() === $value ) {
			delete_post_meta( $post_id, $meta_key );
			return;
		}
		update_post_meta( $post_id, $meta_key, $value );
	}

	private static function render_text_row( int $post_id, string $meta_key, string $label ): void {
		self::render_input_row( $post_id, $meta_key, $label, 'text' );
	}

	private static function render_date_row( int $post_id, string $meta_key, string $label ): void {
		self::render_input_row( $post_id, $meta_key, $label . ' (ГГГГ или ГГГГ-ММ-ДД)', 'text' );
	}

	private static function render_input_row( int $post_id, string $meta_key, string $label, string $type ): void {
		$value = (string) get_post_meta( $post_id, $meta_key, true );
		?>
		<tr>
			<th scope="row"><label for="<?php echo esc_attr( $meta_key ); ?>"><?php echo esc_html( $label ); ?></label></th>
			<td><input class="regular-text" id="<?php echo esc_attr( $meta_key ); ?>" name="<?php echo esc_attr( $meta_key ); ?>" type="<?php echo esc_attr( $type ); ?>" value="<?php echo esc_attr( $value ); ?>" /></td>
		</tr>
		<?php
	}

	private static function render_textarea_row( int $post_id, string $meta_key, string $label ): void {
		$value = (string) get_post_meta( $post_id, $meta_key, true );
		?>
		<tr>
			<th scope="row"><label for="<?php echo esc_attr( $meta_key ); ?>"><?php echo esc_html( $label ); ?></label></th>
			<td><textarea class="large-text" id="<?php echo esc_attr( $meta_key ); ?>" name="<?php echo esc_attr( $meta_key ); ?>" rows="6"><?php echo esc_textarea( $value ); ?></textarea></td>
		</tr>
		<?php
	}
}
