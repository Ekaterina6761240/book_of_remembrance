<?php

namespace MuseumCore\Content;

final class HeroPostType {
	public const POST_TYPE = 'museum_hero';

	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => array(
					'name'               => 'Герои',
					'singular_name'      => 'Герой',
					'menu_name'          => 'Герои',
					'add_new'            => 'Добавить героя',
					'add_new_item'       => 'Добавить героя',
					'edit_item'          => 'Редактировать героя',
					'new_item'           => 'Новый герой',
					'view_item'          => 'Просмотреть героя',
					'search_items'       => 'Искать героев',
					'not_found'          => 'Герои не найдены',
					'not_found_in_trash' => 'В корзине герои не найдены',
					'all_items'          => 'Все герои',
				),
				'public'              => false,
				'publicly_queryable'  => false,
				'exclude_from_search' => true,
				'show_ui'             => true,
				'show_in_menu'        => true,
				'show_in_rest'        => false,
				'has_archive'         => false,
				'rewrite'             => false,
				'query_var'           => false,
				'delete_with_user'    => false,
				'map_meta_cap'        => true,
				'capability_type'     => array( 'museum_hero', 'museum_heroes' ),
				'capabilities'        => array(
					'create_posts' => 'create_museum_heroes',
				),
				'supports'            => array( 'title', 'thumbnail' ),
				'menu_icon'           => 'dashicons-id-alt',
			),
		);
	}

	public static function capabilities(): array {
		return array(
			'read_museum_hero',
			'edit_museum_hero',
			'delete_museum_hero',
			'create_museum_heroes',
			'edit_museum_heroes',
			'edit_others_museum_heroes',
			'edit_private_museum_heroes',
			'edit_published_museum_heroes',
			'publish_museum_heroes',
			'read_private_museum_heroes',
			'delete_museum_heroes',
			'delete_private_museum_heroes',
			'delete_published_museum_heroes',
			'delete_others_museum_heroes',
		);
	}
}
