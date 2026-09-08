<?php

namespace MuseumCore\Rest;

final class MediaDto {
	public static function from_attachment( int $attachment_id ): ?array {
		if ( 'attachment' !== get_post_type( $attachment_id ) || ! wp_attachment_is_image( $attachment_id ) ) {
			return null;
		}

		$url       = wp_get_attachment_image_url( $attachment_id, 'full' );
		$thumbnail = wp_get_attachment_image_url( $attachment_id, 'medium' );
		$metadata  = wp_get_attachment_metadata( $attachment_id );

		return array(
			'id'            => $attachment_id,
			'url'           => $url ? $url : '',
			'thumbnail_url' => $thumbnail ? $thumbnail : null,
			'name'          => get_the_title( $attachment_id ),
			'width'         => is_array( $metadata ) && isset( $metadata['width'] ) ? (int) $metadata['width'] : null,
			'height'        => is_array( $metadata ) && isset( $metadata['height'] ) ? (int) $metadata['height'] : null,
		);
	}
}
