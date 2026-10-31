# 📦 MultimediaPro CMS v1.0 (RU Edition)

**MultimediaPro** — русифицированная CMS на базе MultimediaPro, адаптированная для российского рынка и соответствия требованиям Минцифры РФ.  
Сборка включает предустановленные плагины, локальные интеграции, каталог расширений и скрипт автоконфигурации.

---

## 📋 Содержание
1. [Особенности](#особенности)
2. [Системные требования](#системные-требования)
3. [Установка](#установка)
4. [Автоконфигурация (Installer Script)](#автоконфигурация-installer-script)
5. [Структура проекта](#структура-проекта)
6. [Сборка из исходников](#сборка-из-исходников)
7. [Тестирование сборки](#тестирование-сборки)
8. [Обновления](#обновления)
9. [Лицензии](#лицензии)

---

## 🚀 Особенности
- 🇷🇺 Полная локализация (интерфейс, форматы даты/времени, ЧПУ-транслитерация)
- 🔐 Отключение Google Fonts, Gravatar, oEmbed внешних ресурсов
- 🛡 Проверка безопасности и чек-лист для продакшн-настроек
- 📂 Локальный каталог расширений с предзагруженными ZIP-плагинами
- 🔑 Вход через Яндекс ID (OAuth2)
- 📝 Classic Editor Plus (расширенный TinyMCE вместо Gutenberg)
- 📦 Плагины для SMTP РФ, локальных бэкапов и Метрики через прокси
- 🛠 Инсталлер-скрипт для автоматической конфигурации

---

## 💻 Системные требования
- **PHP:** 8.1 или выше (рекомендовано 8.2+)
- **MySQL/MariaDB:** MySQL 5.7+ или MariaDB 10.4+
- **Веб-сервер:** Apache/Nginx с поддержкой `.htaccess` или эквивалента
- **Расширения PHP:** `mbstring`, `zip`, `curl`, `json`, `openssl`, `pdo_mysql`
- **WP-CLI** для автоконфигурации (опционально, но рекомендовано)
- **Git** (если собираете из исходников)

---

## 📥 Установка

1. **Распакуйте архив** в директорию веб-сервера:
   ```bash
   unzip multimediapro_template_ru_1_0_full_with_installer.zip -d /var/www/html/multimediapro
   ```

2. **Создайте БД**:
   ```bash
   mysql -u root -p -e "CREATE DATABASE mmp_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

3. **Скопируйте `wp-config-sample.php` → `wp-config.php`** и укажите настройки БД:
   ```php
   define('DB_NAME', 'mmp_db');
   define('DB_USER', 'root');
   define('DB_PASSWORD', 'your_password');
   define('DB_HOST', 'localhost');
   ```

4. **Запустите установку** через браузер (`http://yourdomain/`) или WP-CLI:
   ```bash
   wp core install      --url="http://yourdomain"      --title="MultimediaPro"      --admin_user="admin"      --admin_password="strongpass"      --admin_email="you@example.com"      --locale=ru_RU
   ```

---

## ⚡ Автоконфигурация (Installer Script)

В сборке есть скрипт **`tools/installer.sh`**, который:
- устанавливает локаль и формат даты/времени
- включает ЧПУ `/postname/`
- активирует все ключевые плагины (`mmp-russia-pack`, `mmp-classic-editor-plus`, мост Carbon Fields)
- создаёт страницы «Главная» и «Блог»
- сбрасывает кэш

Запуск:
```bash
cd /var/www/html/multimediapro
bash tools/installer.sh --path=.
```

---

## 📂 Структура проекта
```
wp-admin/              # Админ-панель
wp-content/
  themes/              # Темы
  plugins/             # Предустановленные плагины
  mmp-catalog/         # Локальный каталог ZIP-плагинов
  m-plugins/           # Плагины меняющие предустановленые конфигурации ядра
wp-includes/           # Ядро
docs/                  # Документация по интеграциям
tools/                 # Утилиты (инсталлер, update-server)
```

---

## 🛠 Сборка из исходников

1. Клонировать репозиторий:
   ```bash
   git clone git@gitflic.ru:indexvision/multimediapro.git
   ```

2. Установить зависимости (если есть Composer/NPM):
   ```bash
   composer install   # если проект использует PHP-пакеты
   npm install        # если проект использует JS/SCSS-бандлер
   ```

3. Собрать фронтенд (если применимо):
   ```bash
   npm run build
   ```

4. Создать релизный ZIP:
   ```bash
   zip -r multimediapro_v1.0.zip .
   ```

---

## 🧪 Тестирование сборки

1. **Локальный сервер**:  
   Запустить PHP built-in сервер:
   ```bash
   php -S localhost:8080
   ```
2. **Проверить плагины**:
   - Активированы ли все MMP-плагины
   - Проверка безопасности (`MMP RU → Проверка безопасности`)
3. **Проверить русскую локаль**:
   - Дата/время формата `дд.мм.гггг`
   - URL транслитерируются

---

## 🔄 Обновления

В процессе разработки.

---

## 📜 Лицензии

MultimediaPro распространяется по GPLv2+, включая зависимости:
- MultimediaPro Core — GPLv2+
- Carbon Fields — GPLv2+
- MMP плагины — GPLv2+
- Остальные лицензии см. в `docs/05_open_source_licenses.md`

---
© 2025 [Ваша компания / ИП]
