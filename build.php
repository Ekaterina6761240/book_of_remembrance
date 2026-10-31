<?php
/**
 * MultimediaPro build.php — кроссплатформенная сборка релиза
 *
 * Поддерживает:
 *   --version=1.0.0        Имя архива (по умолчанию 1.0.0)
 *   --out=release.zip      Явное имя файла
 *   --format=zip|tar.gz    Формат архива (по умолчанию zip)
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

// ---- CLI args ----
$version = '1.0.0';
$out = null;
$format = 'zip';
foreach ($argv as $arg) {
    if (preg_match('/^--version=(.+)$/', $arg, $m)) $version = $m[1];
    if (preg_match('/^--out=(.+)$/',      $arg, $m)) $out     = $m[1];
    if (preg_match('/^--format=(zip|tar\.gz)$/i', $arg, $m)) $format  = strtolower($m[1]);
}
if (!$out) $out = 'multimediapro-' . $version . ($format === 'tar.gz' ? '.tar.gz' : '.zip');

$root = realpath(__DIR__);
if (!$root) { fwrite(STDERR, "Не удалось определить корень проекта.\n"); exit(1); }

// Список исключений
$excludePatterns = [
    '#(^|/)\.git(/|$)#',
    '#(^|/)node_modules(/|$)#',
    '#(^|/)__pycache__(/|$)#',
    '#(^|/)tests?(/|$)#',
    '#(^|/)\.DS_Store$#',
    '#(^|/)Thumbs\.db$#',
    '#(^|/)multimediapro-.*\.(zip|tar\.gz)$#i',
    '#(^|/)vendor(/|$)#', // уберите, если хотите включать vendor
];

// Собираем список файлов
$files = [];
$iter = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::LEAVES_ONLY
);
foreach ($iter as $file) {
    /** @var SplFileInfo $file */
    if ($file->isDir()) continue;
    $path = $file->getRealPath(); if ($path === false) continue;
    $rel  = substr($path, strlen($root) + 1);
    $relN = str_replace('\\', '/', $rel);

    if ($relN === 'build.php') continue; // не включаем сам себя

    $skip = false;
    foreach ($excludePatterns as $re) {
        if (preg_match($re, $relN)) { $skip = true; break; }
    }
    if ($skip) continue;

    $files[$relN] = $path;
}

function build_zip_with_ziparchive(string $out, array $files): bool {
    if (!class_exists('ZipArchive')) return false;
    $zip = new ZipArchive();
    if ($zip->open($out, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        fwrite(STDERR, "Не удалось создать архив ZIP: $out\n"); return false;
    }
    $added = 0;
    foreach ($files as $rel => $path) {
        if (!$zip->addFile($path, $rel)) fwrite(STDERR, "Не удалось добавить: $rel\n");
        else $added++;
    }
    $zip->close();
    echo "✅ Готово (ZipArchive): $out (файлов: $added)\n";
    return true;
}

function is_windows(): bool {
    return strtoupper(PHP_OS_FAMILY) === 'WINDOWS';
}

/**
 * На Windows: делаем временную копию дерева, пишем build.ps1 с Compress-Archive и запускаем его.
 * Так мы избегаем адового экранирования кавычек.
 */
function build_zip_with_powershell(string $out, array $files): bool {
    if (!is_windows()) return false;

    $tmp = rtrim(sys_get_temp_dir(), "\\/") . DIRECTORY_SEPARATOR . 'mmp_build_' . uniqid();
    if (!@mkdir($tmp) && !is_dir($tmp)) { fwrite(STDERR, "Не удалось создать временную папку.\n"); return false; }

    // Копируем структуру
    foreach ($files as $rel => $path) {
        $target = $tmp . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);
        $dir = dirname($target);
        if (!is_dir($dir) && !mkdir($dir, 0777, true) && !is_dir($dir)) {
            fwrite(STDERR, "Не удалось создать каталог: $dir\n");
            continue;
        }
        if (!copy($path, $target)) fwrite(STDERR, "Не удалось скопировать: $rel\n");
    }

    // Абсолютный путь к выходному архиву
    $cwd = getcwd() ?: $tmp;
    $outAbs = $out;
    if (!preg_match('#^[A-Za-z]:\\\\|^/#', $outAbs)) {
        $outAbs = $cwd . DIRECTORY_SEPARATOR . $outAbs;
    }

    // Пишем временный PowerShell-скрипт
    $ps1 = $tmp . DIRECTORY_SEPARATOR . 'build.ps1';
    // В PowerShell для путей лучше использовать двойные кавычки
    $psCode = "Compress-Archive -Path * -DestinationPath \"{$outAbs}\" -Force";
    if (file_put_contents($ps1, $psCode) === false) {
        fwrite(STDERR, "Не удалось записать $ps1\n");
        return false;
    }

    // Запуск PowerShell-скрипта
    $cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -File "' . $ps1 . '"';
    $prev = getcwd(); chdir($tmp);
    $code = 1;
    if (function_exists('exec')) exec($cmd, $outLines, $code);
    else system($cmd, $code);
    chdir($prev ?: $tmp);

    // Чистка временной папки
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($tmp, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($it as $fs) { $fs->isDir() ? @rmdir($fs) : @unlink($fs); }
    @rmdir($tmp);

    if ($code === 0 && file_exists($outAbs)) {
        echo "✅ Готово (PowerShell Compress-Archive): $outAbs\n";
        return true;
    }
    fwrite(STDERR, "PowerShell Compress-Archive не удалось выполнить сборку.\n");
    return false;
}

function build_tar_gz(string $out, array $files): bool {
    $tarPath = preg_replace('/\.gz$/', '', $out);
    try {
        if (file_exists($tarPath)) unlink($tarPath);
        $tar = new PharData($tarPath);
        foreach ($files as $rel => $path) $tar->addFile($path, $rel);
        if (file_exists($out)) unlink($out);
        $tar->compress(Phar::GZ);      // создаст .tar.gz рядом
        if (file_exists($tarPath)) unlink($tarPath);
        echo "✅ Готово (PharData tar.gz): $out\n";
        return true;
    } catch (Throwable $e) {
        fwrite(STDERR, "Ошибка tar.gz: " . $e->getMessage() . "\n");
        return false;
    }
}

// ---- Build ----
if ($format === 'zip') {
    if (build_zip_with_ziparchive($out, $files)) exit(0);
    if (is_windows() && build_zip_with_powershell($out, $files)) exit(0);
    fwrite(STDERR, "ZipArchive недоступен. Запустите с --format=tar.gz (создаст tar.gz без ZipArchive)\n");
    exit(2);
}

if ($format === 'tar.gz') {
    if (build_tar_gz($out, $files)) exit(0);
    exit(3);
}

fwrite(STDERR, "Неизвестный формат: $format\n");
exit(4);
