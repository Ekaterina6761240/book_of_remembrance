<?php
ini_set('display_errors', '1'); error_reporting(E_ALL);
parse_str(implode('&', array_slice($argv, 1)), $args);
$wpzip  = $args['--wpzip']  ?? null;
$target = $args['--target'] ?? getcwd();
$rootList = isset($args['--root']) ? explode(',', $args['--root']) : ['index.php','wp-activate.php','wp-login.php'];
$force = array_key_exists('--force', $args);
if (!$wpzip || !file_exists($wpzip)) { fwrite(STDERR, "Укажи путь к ZIP MultimediaPro: --wpzip=/path/multimediapro.zip\n"); exit(1); }
if (!is_dir($target)) { fwrite(STDERR, "Каталог target не найден: $target\n"); exit(1); }
$zip = new ZipArchive();
if ($zip->open($wpzip) !== TRUE) { fwrite(STDERR, "Не удалось открыть ZIP: $wpzip\n"); exit(1); }
$tmp = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'mmp_wp_restore_' . uniqid();
mkdir($tmp); $zip->extractTo($tmp); $zip->close();
$base = $tmp; if (is_dir($tmp . DIRECTORY_SEPARATOR . 'multimediapro')) $base = $tmp . DIRECTORY_SEPARATOR . 'multimediapro';
function rr_copy($src, $dst, $force=false) {
  if (!is_dir($src)) return false;
  if (!is_dir($dst) && !mkdir($dst, 0777, true) && !is_dir($dst)) return false;
  $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
  foreach ($it as $item) {
    $rel = substr($item->getPathname(), strlen($src)+1);
    $tgt = $dst . DIRECTORY_SEPARATOR . $rel;
    if ($item->isDir()) { if (!is_dir($tgt)) mkdir($tgt, 0777, true); }
    else { if (file_exists($tgt) && !$force) { echo "Пропущено (есть): $tgt\n"; continue; } copy($item->getPathname(), $tgt); echo "Копия: $rel\n"; }
  } return true;
}
echo "==> Восстанавливаем wp-admin/\n"; rr_copy($base . DIRECTORY_SEPARATOR . 'wp-admin', $target . DIRECTORY_SEPARATOR . 'wp-admin', $force);
echo "==> Восстанавливаем корневые файлы\n";
foreach ($rootList as $file) { $file = trim($file); $src = $base . DIRECTORY_SEPARATOR . $file; $dst = $target . DIRECTORY_SEPARATOR . $file;
  if (!file_exists($src)) { echo "Нет в чистом MultimediaPro: $file\n"; continue; }
  if (file_exists($dst) && !$force) { echo "Пропущено (есть): $file\n"; continue; }
  copy($src, $dst); echo "Копия: $file\n";
}
$muDir = $target . DIRECTORY_SEPARATOR . 'wp-content' . DIRECTORY_SEPARATOR . 'mu-plugins';
if (!is_dir($muDir)) mkdir($muDir, 0777, true);
$muFile = $muDir . DIRECTORY_SEPARATOR . 'mmp-ru-hardening.php';
$srcMu  = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'wp-content' . DIRECTORY_SEPARATOR . 'mu-plugins' . DIRECTORY_SEPARATOR . 'mmp-ru-hardening.php';
if (!@copy($srcMu, $muFile)) { echo "Скопируйте MU-плагин вручную: $muFile\n"; } else { echo "Установлен MU-плагин: $muFile\n"; }
echo "Готово. Проверьте /wp-admin/users.php и корневые файлы.\n";?>