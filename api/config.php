<?php
$candidates = [
  __DIR__ . '/config.local.php',
  dirname(__DIR__) . '/config.local.php',
  dirname(__DIR__, 2) . '/config.local.php',
];

foreach ($candidates as $path) {
  if (!is_file($path)) {
    continue;
  }
  $cfg = require $path;
  if (!is_array($cfg)) {
    continue;
  }
  $pass = (string) ($cfg['pass'] ?? '');
  if ($pass === '' || $pass === 'COLOQUE_A_SENHA_DO_MYSQL_AQUI') {
    continue;
  }
  return $cfg;
}

$example = __DIR__ . '/config.local.example.php';
if (is_file($example)) {
  return require $example;
}

return [
  'host' => getenv('OPUDIM_DB_HOST') ?: 'localhost',
  'port' => (int) (getenv('OPUDIM_DB_PORT') ?: 3306),
  'name' => getenv('OPUDIM_DB_NAME') ?: 'u586160337_opudim',
  'user' => getenv('OPUDIM_DB_USER') ?: 'u586160337_opudim',
  'pass' => getenv('OPUDIM_DB_PASS') ?: '',
  'charset' => 'utf8mb4',
];
