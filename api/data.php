<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && isset($_GET['ping'])) {
  header('Cache-Control: no-store');
  echo '{"ok":true,"db":"mysql","light":true,"ts":' . time() . '}';
  exit;
}

if (
  ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET'
  && !isset($_GET['full'])
  && (($_GET['action'] ?? '') !== 'full')
) {
  $catalogFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'catalog.json';
  if (is_file($catalogFile)) {
    $raw = @file_get_contents($catalogFile);
    if (is_string($raw) && $raw !== '' && strpos($raw, '"products"') !== false) {
      header('Cache-Control: no-store, max-age=0');
      echo $raw;
      exit;
    }
  }
}

require_once __DIR__ . '/mysql_store.php';

function json_out($payload, int $code = 200): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function get_password_header(): string {
  return (string) ($_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '');
}

function db_or_fail(): PDO {
  try {
    return pudim_db();
  } catch (Throwable $e) {
    json_out([
      'error' => 'Falha na conexão MySQL',
      'detail' => $e->getMessage(),
      'hint' => 'Confira api/config.local.php e se importou api/o_pudim_mysql.sql',
    ], 500);
  }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
  $pdo = db_or_fail();
  $password = get_password_header();
  $wantFull = isset($_GET['full']) || $action === 'full';

  try {
    $data = pudim_load_all($pdo, $wantFull ? 'full' : 'public');
  } catch (Throwable $e) {
    json_out(['error' => 'Falha ao ler MySQL', 'detail' => $e->getMessage()], 500);
  }

  if ($data === null) {
    json_out(['empty' => true, 'db' => 'mysql']);
  }

  if ($wantFull) {
    $auth = pudim_get_auth($pdo);
    $ok = $auth['password'] !== '' && hash_equals($auth['password'], (string) $password);
    if (!$ok) json_out(['error' => 'Senha inválida'], 401);
    header('Cache-Control: no-store');
    json_out($data);
  }

  try { pudim_write_public_catalog($pdo); } catch (Throwable $e) {}
  header('Cache-Control: no-store, max-age=0');
  json_out(pudim_public_payload($data));
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  $body = json_decode($raw, true);
  if (!is_array($body)) json_out(['error' => 'JSON inválido'], 400);

  $actionName = (string) ($body['action'] ?? '');

  if ($actionName === 'login') {
    $email = trim((string) ($body['email'] ?? ''));
    $pass = (string) ($body['password'] ?? '');
    try {
      $pdoAuth = pudim_db();
      $auth = pudim_get_auth($pdoAuth);
    } catch (Throwable $e) {
      json_out(['error' => 'Falha na conexão MySQL', 'detail' => $e->getMessage()], 500);
    }

    $authEmail = (string) ($auth['email'] ?? '');
    $authPass = (string) ($auth['password'] ?? '');
    if ($authEmail === '' || $authPass === '') {
      json_out(['error' => 'Banco sem dados. Importe api/o_pudim_mysql.sql no phpMyAdmin.'], 404);
    }
    if (!hash_equals($authEmail, $email) || !hash_equals($authPass, $pass)) {
      json_out(['error' => 'E-mail ou senha incorretos.'], 401);
    }

    try {
      $stored = pudim_load_all($pdoAuth, 'full');
      pudim_write_public_catalog($pdoAuth);
    } catch (Throwable $e) {
      json_out(['error' => 'Falha ao ler MySQL', 'detail' => $e->getMessage()], 500);
    }
    json_out(['ok' => true, 'data' => $stored]);
  }

  $pdo = db_or_fail();
  $password = get_password_header() ?: (string) ($body['password'] ?? '');

  if ($actionName === 'create_reserva') {
    if (!pudim_db_ready($pdo)) json_out(['error' => 'Sistema ainda não inicializado no MySQL.'], 503);
    try {
      json_out(pudim_create_reserva($pdo, $body['reserva'] ?? []));
    } catch (InvalidArgumentException $e) {
      json_out(['error' => $e->getMessage()], 400);
    } catch (Throwable $e) {
      json_out(['error' => $e->getMessage(), 'hint' => 'Importe api/reservas_natal.sql no phpMyAdmin'], 500);
    }
  }

  if ($actionName === 'create_order') {
    if (!pudim_db_ready($pdo)) json_out(['error' => 'Sistema ainda não inicializado no MySQL.'], 503);
    try {
      json_out(pudim_create_order($pdo, $body['order'] ?? [], is_array($body['client'] ?? null) ? $body['client'] : null));
    } catch (InvalidArgumentException $e) {
      json_out(['error' => $e->getMessage()], 400);
    } catch (Throwable $e) {
      json_out(['error' => 'Falha ao gravar pedido', 'detail' => $e->getMessage()], 500);
    }
  }

  if (in_array($actionName, ['save_product', 'delete_product', 'set_product_active', 'publish_catalog', 'save_settings', 'set_order_status'], true)) {
    $auth = pudim_get_auth($pdo);
    if ($password === '' || $auth['password'] === '' || !hash_equals($auth['password'], $password)) {
      json_out(['error' => 'Senha inválida'], 401);
    }
  }

  if ($actionName === 'save_product') {
    try {
      $saved = pudim_save_one_product($pdo, $body['product'] ?? []);
      try { pudim_write_public_catalog($pdo); } catch (Throwable $e) {}
      json_out(['ok' => true, 'product' => $saved]);
    } catch (InvalidArgumentException $e) {
      json_out(['error' => $e->getMessage()], 400);
    } catch (Throwable $e) {
      json_out(['error' => 'Falha ao salvar produto', 'detail' => $e->getMessage()], 500);
    }
  }

  if ($actionName === 'delete_product') {
    $productId = trim((string) ($body['id'] ?? $body['productId'] ?? ''));
    if ($productId === '') json_out(['error' => 'Produto inválido'], 400);
    try {
      pudim_delete_one_product($pdo, $productId);
      try { pudim_write_public_catalog($pdo); } catch (Throwable $e) {}
      json_out(['ok' => true, 'id' => $productId]);
    } catch (Throwable $e) {
      json_out(['error' => 'Falha ao excluir produto', 'detail' => $e->getMessage()], 500);
    }
  }

  if ($actionName === 'set_product_active') {
    $productId = trim((string) ($body['id'] ?? ''));
    $active = !empty($body['active']) ? 1 : 0;
    $stmt = $pdo->prepare('UPDATE products SET active = ? WHERE id = ?');
    $stmt->execute([$active, $productId]);
    try { pudim_write_public_catalog($pdo); } catch (Throwable $e) {}
    json_out(['ok' => true, 'id' => $productId, 'active' => $active === 1]);
  }

  if ($actionName === 'set_order_status') {
    $orderId = trim((string) ($body['id'] ?? ''));
    $status = (string) ($body['status'] ?? '');
    $allowed = ['novo', 'preparo', 'entrega', 'finalizado', 'cancelado'];
    if ($orderId === '' || !in_array($status, $allowed, true)) json_out(['error' => 'Pedido inválido'], 400);
    if (strpos($orderId, 'rn-') === 0 && pudim_table_exists($pdo, 'reservas_natal')) {
      $map = ['novo' => 'novo', 'preparo' => 'confirmado', 'entrega' => 'entregue', 'finalizado' => 'entregue', 'cancelado' => 'cancelado'];
      $pdo->prepare('UPDATE reservas_natal SET status = ? WHERE id = ?')->execute([$map[$status], $orderId]);
    } else {
      $stmt = $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?');
      $stmt->execute([$status, $orderId]);
    }
    json_out(['ok' => true, 'id' => $orderId, 'status' => $status]);
  }

  if ($actionName === 'publish_catalog') {
    try {
      $wrote = pudim_write_public_catalog($pdo);
      if (!$wrote) json_out(['ok' => false, 'error' => 'Não foi possível gravar catalog.json'], 500);
      json_out(['ok' => true, 'catalog' => true]);
    } catch (Throwable $e) {
      json_out(['error' => $e->getMessage()], 500);
    }
  }

  if ($actionName !== '') {
    json_out(['error' => 'Ação não reconhecida'], 400);
  }

  $payload = $body['data'] ?? $body;
  if (!is_array($payload) || !isset($payload['settings'])) {
    json_out(['error' => 'Dados incompletos'], 400);
  }

  $auth = pudim_get_auth($pdo);
  $authPass = (string) ($auth['password'] ?? '');
  if ($password === '' || !hash_equals($authPass, $password)) {
    json_out(['error' => 'Senha inválida para salvar'], 401);
  }
  if (empty($payload['auth'])) {
    $payload['auth'] = $auth;
  }

  try {
    pudim_save_all($pdo, $payload);
    json_out(['ok' => true]);
  } catch (Throwable $e) {
    json_out(['error' => 'Falha ao salvar', 'detail' => $e->getMessage()], 500);
  }
}

json_out(['error' => 'Método não suportado'], 405);
