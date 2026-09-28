<?php
/**
 * Copie este arquivo para config.local.php e preencha a senha do MySQL da Hostinger.
 *
 * No servidor (public_html) o host é localhost.
 * No PC, use o hostname Remote MySQL do hPanel.
 */
$httpHost = $_SERVER['HTTP_HOST'] ?? 'cli';
$isLocalDev = (bool) preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/i', $httpHost);
$remoteHost = 'COLOQUE_O_HOSTNAME_REMOTE_MYSQL_AQUI';

return [
  'host' => $isLocalDev ? $remoteHost : 'localhost',
  'port' => 3306,
  'name' => 'u586760337_opudim',
  'user' => 'u586760337_opudim',
  'pass' => 'COLOQUE_A_SENHA_DO_MYSQL_AQUI',
  'charset' => 'utf8mb4',
];
