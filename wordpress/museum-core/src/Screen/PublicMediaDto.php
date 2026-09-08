<?php

namespace MuseumCore\Screen;

final class PublicMediaDto {
	public static function from_attachment( int $attachment_id ) {
		if ( ! $attachment_id ) {
			return null;
		}
		if ( 'attachment' !== get_post_type( $attachment_id ) || ! wp_attachment_is_image( $attachment_id ) ) {
			return new \WP_Error( 'screen_snapshot_invalid_media', 'Публичное изображение недоступно.', array( 'status' => 503 ) );
		}

		$image     = wp_get_attachment_image_src( $attachment_id, 'large' );
		$thumbnail = wp_get_attachment_image_url( $attachment_id, 'medium' );
		if ( ! $image ) {
			return new \WP_Error( 'screen_snapshot_invalid_media', 'Публичное изображение недоступно.', array( 'status' => 503 ) );
		}

		return array(
			'id'            => $attachment_id,
			'url'           => (string) $image[0],
			'thumbnail_url' => $thumbnail ? $thumbnail : (string) $image[0],
			'name'          => sanitize_text_field( get_the_title( $attachment_id ) ),
			'width'         => (int) $image[1],
			'height'        => (int) $image[2],
		);
	}
}
