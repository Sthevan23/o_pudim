<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

$paths = [
  'api' => __DIR__ . '/config.local.php',
  'public_html' => dirname(__DIR__) . '/config.local.php',
  'acima' => dirname(__DIR__, 2) . '/config.local.php',
];

$onde = [];
foreach ($paths as $label => $path) {
  if (is_file($path)) {
    $onde[] = $label;
  }
}

$cfg = require __DIR__ . '/config.php';
$pass = (string) ($cfg['pass'] ?? '');
$senhaPronta = $pass !== '' && $pass !== 'COLOQUE_A_SENHA_DO_MYSQL_AQUI';

echo json_encode([
  'ok' => true,
  'light' => true,
  'ts' => time(),
  'arquivo_senha' => $onde !== [],
  'onde' => $onde,
  'senha_pronta' => $senhaPronta,
], JSON_UNESCAPED_UNICODE);
