<?php
$local = __DIR__ . '/config.local.php';
$example = __DIR__ . '/config.local.example.php';

if (is_file($local)) {
  return require $local;
}

if (is_file($example)) {
  return require $example;
}

return [
  'host' => getenv('OPUDIM_DB_HOST') ?: 'localhost',
  'port' => (int) (getenv('OPUDIM_DB_PORT') ?: 3306),
  'name' => getenv('OPUDIM_DB_NAME') ?: 'u586760337_opudim',
  'user' => getenv('OPUDIM_DB_USER') ?: 'u586760337_opudim',
  'pass' => getenv('OPUDIM_DB_PASS') ?: '',
  'charset' => 'utf8mb4',
];
