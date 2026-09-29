<?php

function pudim_fallback_auth(): array {
  return [
    'email' => 'ana@pudins.com',
    'password' => 'pudim123',
  ];
}

function pudim_admin_password_ok(string $password): bool {
  if ($password === '') return false;
  $fb = pudim_fallback_auth();
  if (hash_equals($fb['password'], $password)) return true;
  try {
    if (!function_exists('pudim_db') || !function_exists('pudim_get_auth')) {
      return false;
    }
    $auth = pudim_get_auth(pudim_db());
    $stored = (string) ($auth['password'] ?? '');
    return $stored !== '' && hash_equals($stored, $password);
  } catch (Throwable $e) {
    return false;
  }
}

function pudim_reservas_file(): string {
  $candidates = [
    dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'opudim_reservas.json',
    dirname(__DIR__) . DIRECTORY_SEPARATOR . 'opudim_reservas.json',
    __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'reservas_natal.json',
  ];
  foreach ($candidates as $path) {
    if (is_file($path) && is_readable($path)) {
      return $path;
    }
  }
  foreach ($candidates as $path) {
    $dir = dirname($path);
    if (!is_dir($dir)) {
      @mkdir($dir, 0755, true);
    }
    if (is_dir($dir) && is_writable($dir)) {
      return $path;
    }
  }
  return $candidates[1];
}

function pudim_file_load_reservas(): array {
  $path = pudim_reservas_file();
  if (!is_file($path)) return [];
  $raw = @file_get_contents($path);
  if (!is_string($raw) || $raw === '') return [];
  $data = json_decode($raw, true);
  if (is_array($data) && isset($data['orders']) && is_array($data['orders'])) {
    return $data['orders'];
  }
  return is_array($data) ? $data : [];
}

function pudim_file_save_reservas(array $orders): void {
  $path = pudim_reservas_file();
  $dir = dirname($path);
  if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
    throw new RuntimeException('Sem pasta para gravar as reservas.');
  }
  $json = json_encode(['orders' => array_values($orders)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if (!is_string($json) || $json === '') {
    throw new RuntimeException('Falha ao montar as reservas.');
  }
  if (@file_put_contents($path, $json, LOCK_EX) === false) {
    throw new RuntimeException('Sem permissão para gravar a reserva no servidor.');
  }
  @chmod($path, 0640);
}

function pudim_merge_file_orders(array $orders): array {
  $seen = [];
  $out = [];
  foreach ($orders as $o) {
    if (!is_array($o)) continue;
    $key = (string) ($o['id'] ?? $o['number'] ?? '');
    if ($key !== '') $seen[$key] = true;
    $out[] = $o;
  }
  foreach (pudim_file_load_reservas() as $o) {
    if (!is_array($o)) continue;
    $key = (string) ($o['id'] ?? $o['number'] ?? '');
    if ($key !== '' && isset($seen[$key])) continue;
    if ($key !== '') $seen[$key] = true;
    $out[] = $o;
  }
  return $out;
}

function pudim_attach_file_orders(array $data): array {
  if (!isset($data['orders']) || !is_array($data['orders'])) {
    $data['orders'] = [];
  }
  $data['orders'] = pudim_merge_file_orders($data['orders']);
  return $data;
}

function pudim_offline_admin_data(): array {
  $base = [
    'version' => 1,
    'settings' => [],
    'categories' => [],
    'products' => [],
    'reviews' => [],
    'gallery' => [],
    'clients' => [],
    'orders' => [],
    'finance' => [],
    'auth' => pudim_fallback_auth(),
  ];
  $catalogFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'catalog.json';
  if (is_file($catalogFile)) {
    $cat = json_decode((string) @file_get_contents($catalogFile), true);
    if (is_array($cat)) {
      $base = array_merge($base, $cat);
    }
  }
  $base['orders'] = pudim_file_load_reservas();
  $base['auth'] = pudim_fallback_auth();
  return $base;
}

function pudim_file_format_address(array $reserva): string {
  $ready = trim((string) ($reserva['deliveryAddress'] ?? ''));
  if ($ready !== '') return $ready;
  $street = trim((string) ($reserva['street'] ?? ''));
  $number = trim((string) ($reserva['number'] ?? ''));
  $bairro = trim((string) ($reserva['neighborhood'] ?? ''));
  $comp = trim((string) ($reserva['complement'] ?? ''));
  $city = trim((string) ($reserva['city'] ?? ''));
  $ref = trim((string) ($reserva['reference'] ?? ''));
  $parts = [];
  $line = $street;
  if ($number !== '') $line = trim($line . ', ' . $number, ' ,');
  if ($line !== '') $parts[] = $line;
  if ($bairro !== '') $parts[] = $bairro;
  if ($city !== '') $parts[] = $city;
  if ($comp !== '') $parts[] = $comp;
  if ($ref !== '') $parts[] = 'Ref.: ' . $ref;
  return implode(' · ', $parts);
}

function pudim_file_build_reserva(array $reserva): array {
  $name = trim((string) ($reserva['customerName'] ?? ''));
  $phone = preg_replace('/\D+/', '', (string) ($reserva['phone'] ?? ''));
  $qty = max(1, min(20, (int) ($reserva['qty'] ?? 1)));
  $payment = trim((string) ($reserva['payment'] ?? ''));
  $date = trim((string) ($reserva['desiredDate'] ?? ''));
  $receive = trim((string) ($reserva['receiveMethod'] ?? ''));
  $pays = ['Pix', 'Cartão de débito', 'Cartão de crédito'];
  $dates = ['23/12/2026', '24/12/2026'];
  $receives = ['Entrega', 'Retirada na .7 Express', 'Retirada no Restaurante do Taioba'];
  if ($name === '' || strlen($phone) < 10 || !in_array($payment, $pays, true) || !in_array($date, $dates, true) || !in_array($receive, $receives, true)) {
    throw new InvalidArgumentException('Preencha todos os dados da reserva.');
  }
  $address = '';
  if ($receive === 'Entrega') {
    $street = trim((string) ($reserva['street'] ?? ''));
    $num = trim((string) ($reserva['number'] ?? ''));
    $bairro = trim((string) ($reserva['neighborhood'] ?? ''));
    $city = trim((string) ($reserva['city'] ?? ''));
    if ($street === '' || $num === '' || $bairro === '' || $city === '') {
      throw new InvalidArgumentException('Preencha o endereço de entrega (rua, número, bairro e cidade).');
    }
    $address = pudim_file_format_address($reserva);
  }
  $price = 65.00;
  $total = $price * $qty;
  $id = function_exists('pudim_uid') ? pudim_uid('rn') : ('rn-' . bin2hex(random_bytes(6)));
  $number = 'NT' . date('ymd') . '-' . strtoupper(substr($id, -4));
  $notes = trim('Natal · ' . $payment . ' · ' . $date . ' · ' . $receive . ($address !== '' ? ' · ' . $address : ''));
  return [
    'id' => $id,
    'number' => $number,
    'clientName' => $name,
    'clientWhatsapp' => $phone,
    'total' => $total,
    'status' => 'novo',
    'notes' => $notes,
    'orderedAt' => date('Y-m-d H:i:s'),
    'kind' => 'natal',
    'payment' => $payment,
    'desiredDate' => $date,
    'receiveMethod' => $receive,
    'deliveryAddress' => $address,
    'qty' => $qty,
    'items' => [[
      'productId' => 'p-natal',
      'name' => 'Pudim Tradicional Família',
      'qty' => $qty,
      'price' => $price,
    ]],
  ];
}

function pudim_file_create_reserva(array $reserva): array {
  $row = pudim_file_build_reserva($reserva);
  $orders = pudim_file_load_reservas();
  array_unshift($orders, $row);
  pudim_file_save_reservas($orders);
  return $row;
}

function pudim_file_set_status(string $id, string $status): bool {
  $orders = pudim_file_load_reservas();
  $found = false;
  foreach ($orders as &$o) {
    if ((string) ($o['id'] ?? '') === $id) {
      $o['status'] = $status;
      $found = true;
    }
  }
  unset($o);
  if ($found) pudim_file_save_reservas($orders);
  return $found;
}
