#!/usr/bin/env bash
set -euo pipefail

# -----------------------------
# MultimediaPro offline installer (Linux/macOS/Git Bash on Windows)
# -----------------------------

# Helpers
ask() {
  local var="$1" prompt="$2" def="${3:-}"
  local val="${!var:-}"
  if [ -n "$val" ]; then echo "$var=$val"; return; fi
  if [ -n "$def" ]; then
    read -r -p "$prompt [$def]: " val || true
    val="${val:-$def}"
  else
    read -r -p "$prompt: " val || true
    while [ -z "${val:-}" ]; do read -r -p "$prompt: " val || true; done
  fi
  export "$var=$val"
}

# 0) Pre-flight
command -v php >/dev/null 2>&1 || { echo "PHP не найден в PATH"; exit 1; }
[ -f "wp-config.php" ] || [ -f "wp-config-sample.php" ] || { echo "Запусти из корня сайта (должен быть wp-config-sample.php)"; exit 1; }

# 1) Collect config (env overrides supported)
ask DB_NAME   "Имя БД"
ask DB_USER   "Пользователь БД"
ask DB_PASS   "Пароль БД"
ask DB_HOST   "Хост БД" "localhost"
ask TABLE_PREFIX "Префикс таблиц" "mmp_"
ask SITE_URL  "URL сайта (https://example.com)"
ask SITE_TITLE "Название сайта" "MultimediaPro"
ask ADMIN_USER "Логин администратора" "admin"
ask ADMIN_PASS "Пароль администратора" ""
ask ADMIN_EMAIL "Email администратора" "admin@example.com"

# 2) Create wp-config.php from sample if needed
if [ ! -f "wp-config.php" ] && [ -f "wp-config-sample.php" ]; then
  cp -f wp-config-sample.php wp-config.php
  # portable sed for both GNU/BSD (macOS)
  sed -i.bak \
    -e "s/database_name_here/${DB_NAME//\//\\/}/" \
    -e "s/username_here/${DB_USER//\//\\/}/" \
    -e "s/password_here/${DB_PASS//\//\\/}/" \
    -e "s/localhost/${DB_HOST//\//\\/}/" \
    wp-config.php && rm -f wp-config.php.bak

  # set prefix
  perl -0777 -pe "s/\\\$table_prefix\s*=\s*'[^']*';/\$table_prefix = '${TABLE_PREFIX}';/g" -i wp-config.php

  # add debugging defaults (safe for prod if DISPLAY off)
  if ! grep -q "WP_DEBUG" wp-config.php; then
cat >> wp-config.php <<'PHPDBG'

/* MMP defaults */
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
PHPDBG
  fi
  echo "Создан wp-config.php"
fi

# 3) Copy offline ru_RU locale pack if present
mkdir -p wp-content/languages wp-content/languages/plugins wp-content/languages/themes
if [ -d "tools/locale/ru_RU" ]; then
  cp -f tools/locale/ru_RU/*.mo               wp-content/languages/            2>/dev/null || true
  cp -f tools/locale/ru_RU/plugins/*.mo       wp-content/languages/plugins/    2>/dev/null || true
  cp -f tools/locale/ru_RU/themes/*.mo        wp-content/languages/themes/     2>/dev/null || true
  echo "Локальные ru_RU .mo скопированы (если были)"
fi

# 4) Detect WP-CLI
WP=""
if command -v wp >/dev/null 2>&1; then
  WP="wp"
elif [ -f "wp-cli.phar" ]; then
  WP="php wp-cli.phar"
fi

# 5) Install
if [ -n "$WP" ]; then
  echo "→ Установка через WP-CLI"
  # Ensure correct URL context
  $WP core is-installed >/dev/null 2>&1 || $WP core install \
    --url="$SITE_URL" \
    --title="$SITE_TITLE" \
    --admin_user="$ADMIN_USER" \
    --admin_password="$ADMIN_PASS" \
    --admin_email="$ADMIN_EMAIL" \
    --skip-email \
    --locale=ru_RU

  # Post install options
  $WP option update WPLANG ru_RU || true
  $WP option update timezone_string Europe/Moscow || true
  $WP option update date_format d.m.Y || true
  $WP option update time_format H:i || true

  # Permalinks
  $WP rewrite structure '/%postname%/' --hard || true
  $WP rewrite flush --hard || true

  # Activate default plugins if present
  for p in mmp-classic-editor-plus mmp-russia-pack mmp-users-manager carbon-fields; do
    $WP plugin is-installed "$p" >/dev/null 2>&1 && $WP plugin activate "$p" || true
  done

  # Create base pages (if not exist)
  $WP post create --post_type=page --post_title="Главная" --post_status=publish >/dev/null 2>&1 || true
  $WP post create --post_type=page --post_title="Контакты" --post_status=publish >/dev/null 2>&1 || true
  $WP post create --post_type=page --post_title="Политика конфиденциальности" --post_status=publish >/dev/null 2>&1 || true

else
  echo "→ WP-CLI не найден — используем PHP фолбэк"
  php tools/installer.php \
    --url="$SITE_URL" \
    --title="$SITE_TITLE" \
    --admin_user="$ADMIN_USER" \
    --admin_password="$ADMIN_PASS" \
    --admin_email="$ADMIN_EMAIL" \
    --locale="ru_RU" \
    --activate="mmp-classic-editor-plus,mmp-russia-pack,mmp-users-manager,carbon-fields" \
    || { echo "PHP-инсталлятор завершился с ошибкой"; exit 1; }
fi

echo "✅ Готово. Админка: $SITE_URL/wp-admin/"