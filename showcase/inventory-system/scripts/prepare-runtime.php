<?php

declare(strict_types=1);

$baseDirectory = $argv[1] ?? dirname(__DIR__);
$runtimeDirectories = [
    'bootstrap/cache',
    'storage/framework/cache/data',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs',
];

try {
    if (! is_dir($baseDirectory)) {
        throw new RuntimeException("项目根目录不存在: {$baseDirectory}");
    }

    $baseDirectory = rtrim($baseDirectory, '/\\');
    foreach ($runtimeDirectories as $relativeDirectory) {
        $directory = $baseDirectory.DIRECTORY_SEPARATOR.str_replace(
            '/',
            DIRECTORY_SEPARATOR,
            $relativeDirectory,
        );

        if (is_dir($directory)) {
            continue;
        }

        if (file_exists($directory)) {
            throw new RuntimeException("运行目录路径已被文件占用: {$directory}");
        }

        if (! mkdir($directory, 0775, true) && ! is_dir($directory)) {
            throw new RuntimeException("无法创建运行目录: {$directory}");
        }
    }
} catch (Throwable $error) {
    fwrite(STDERR, "准备 Laravel 运行目录失败: {$error->getMessage()}".PHP_EOL);
    exit(1);
}
