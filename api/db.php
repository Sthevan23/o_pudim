<?php
function pudim_db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) {
    return $pdo;
  }

  $cfg = require __DIR__ . '/config.php';
  $host = $cfg['host'] ?? 'localhost';
  $port = (int) ($cfg['port'] ?? 3306);
  $name = $cfg['name'] ?? '';
  $user = $cfg['user'] ?? '';
  $pass = $cfg['pass'] ?? '';
  $charset = $cfg['charset'] ?? 'utf8mb4';

  if ($name === '' || $user === '') {
    throw new RuntimeException('Config MySQL incompleta (name/user).');
  }
  if ($pass === '' || $pass === 'COLOQUE_A_SENHA_DO_MYSQL_AQUI') {
    throw new RuntimeException('Defina a senha MySQL em api/config.local.php');
  }

  $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);

  return $pdo;
}

function pudim_table_exists(PDO $pdo, string $table): bool {
  $stmt = $pdo->prepare(
    'SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1'
  );
  $stmt->execute([$table]);
  return (bool) $stmt->fetchColumn();
}

function pudim_db_ready(PDO $pdo): bool {
  try {
    return pudim_table_exists($pdo, 'settings')
      && pudim_table_exists($pdo, 'products')
      && pudim_table_exists($pdo, 'admins');
  } catch (Throwable $e) {
    return false;
  }
}
