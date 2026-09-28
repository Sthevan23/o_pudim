<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo '{"ok":false}';
  exit;
}

$ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
if ($ua !== '' && preg_match('/bot|crawler|spider|preview|slurp|bingpreview/i', $ua)) {
  echo '{"ok":true,"skip":"bot"}';
  exit;
}

$raw = file_get_contents('php://input');
$body = json_decode(is_string($raw) ? $raw : '', true);
if (!is_array($body)) $body = [];

$session = substr(preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($body['session'] ?? '')), 0, 64);
$path = substr((string) ($body['path'] ?? '/'), 0, 190);

if (strlen($session) < 8) {
  echo '{"ok":true,"skip":"session"}';
  exit;
}

try {
  require_once __DIR__ . '/mysql_store.php';
  pudim_record_visit(pudim_db(), $session, $path);
} catch (Throwable $e) {
  echo '{"ok":true}';
  exit;
}

echo '{"ok":true}';
