<?php
require_once __DIR__ . '/db.php';

function pudim_get_auth(PDO $pdo): array {
  $admin = $pdo->query('SELECT email, password_hash FROM admins ORDER BY id ASC LIMIT 1')->fetch();
  if (!$admin) {
    return ['email' => '', 'password' => ''];
  }
  return [
    'email' => (string) $admin['email'],
    'password' => (string) $admin['password_hash'],
  ];
}

function pudim_products_dir(): string {
  return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'products';
}

function pudim_catalog_path(): string {
  return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'catalog.json';
}

function pudim_uid(string $prefix = 'id'): string {
  return $prefix . '-' . bin2hex(random_bytes(6));
}

function pudim_map_product(array $row): array {
  return [
    'id' => $row['id'],
    'name' => $row['name'],
    'description' => $row['description'] ?? '',
    'price' => (float) $row['price'],
    'categoryId' => $row['category_id'],
    'image' => $row['image'] ?? '',
    'featured' => ((int) ($row['featured'] ?? 0)) === 1,
    'slug' => $row['slug'],
    'promoActive' => ((int) ($row['promo_active'] ?? 0)) === 1,
    'promoPrice' => $row['promo_price'] !== null ? (float) $row['promo_price'] : null,
    'bestSeller' => ((int) ($row['best_seller'] ?? 0)) === 1,
    'active' => ((int) ($row['active'] ?? 1)) === 1,
    'sortOrder' => (int) ($row['sort_order'] ?? 0),
    'stock' => array_key_exists('stock', $row) && $row['stock'] !== null ? (int) $row['stock'] : null,
  ];
}

function pudim_ensure_show_natal(PDO $pdo): void {
  static $done = false;
  if ($done) return;
  $done = true;
  try {
    $stmt = $pdo->prepare(
      'SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
    );
    $stmt->execute(['settings', 'show_natal']);
    if (!$stmt->fetchColumn()) {
      $pdo->exec('ALTER TABLE settings ADD COLUMN show_natal TINYINT(1) NOT NULL DEFAULT 1');
    }
  } catch (Throwable $e) { /* coluna já existe ou sem permissão */ }
}

function pudim_load_all(PDO $pdo, string $mode = 'full'): ?array {
  if (!pudim_db_ready($pdo)) {
    return null;
  }
  pudim_ensure_show_natal($pdo);

  $settingsRow = $pdo->query('SELECT * FROM settings WHERE id = 1 LIMIT 1')->fetch();
  if (!$settingsRow) {
    return null;
  }

  $categories = [];
  foreach ($pdo->query('SELECT id, name, slug, sort_order FROM categories ORDER BY sort_order ASC, name ASC') as $row) {
    $categories[] = [
      'id' => $row['id'],
      'name' => $row['name'],
      'slug' => $row['slug'],
      'sortOrder' => (int) $row['sort_order'],
    ];
  }

  $products = [];
  foreach ($pdo->query('SELECT * FROM products ORDER BY sort_order ASC, name ASC') as $row) {
    $products[] = pudim_map_product($row);
  }

  $gallery = [];
  foreach ($pdo->query('SELECT image FROM gallery WHERE active = 1 ORDER BY sort_order ASC, id ASC') as $row) {
    $gallery[] = $row['image'];
  }

  $reviews = [];
  foreach ($pdo->query('SELECT * FROM reviews WHERE active = 1 ORDER BY created_at DESC') as $row) {
    $reviews[] = [
      'id' => $row['id'],
      'author' => $row['author'],
      'text' => $row['text'],
      'rating' => (int) ($row['rating'] ?? 5),
    ];
  }

  $settings = [
    'name' => $settingsRow['name'] ?? '',
    'tagline' => $settingsRow['tagline'] ?? '',
    'logo' => $settingsRow['logo'] ?? '',
    'banner' => $settingsRow['banner'] ?? '',
    'sobreImage' => $settingsRow['sobre_image'] ?? '',
    'whatsapp' => $settingsRow['whatsapp'] ?? '',
    'instagram' => $settingsRow['instagram'] ?? '',
    'instagramUser' => $settingsRow['instagram_user'] ?? '',
    'facebook' => $settingsRow['facebook'] ?? '',
    'email' => $settingsRow['email'] ?? '',
    'address' => $settingsRow['address'] ?? '',
    'hours' => $settingsRow['hours'] ?? '',
    'heroBadge' => $settingsRow['hero_badge'] ?? '',
    'sobreText1' => $settingsRow['sobre_text1'] ?? '',
    'sobreText2' => $settingsRow['sobre_text2'] ?? '',
    'whatsappMessage' => $settingsRow['whatsapp_message'] ?? 'Olá! Gostaria de fazer um pedido.',
    'hidePrices' => ((int) ($settingsRow['hide_prices'] ?? 1)) === 1,
    'showNatal' => array_key_exists('show_natal', $settingsRow) ? ((int) $settingsRow['show_natal'] === 1) : true,
  ];

  $base = [
    'version' => (int) ($settingsRow['data_version'] ?? 1),
    'settings' => $settings,
    'categories' => $categories,
    'products' => $products,
    'reviews' => $reviews,
    'gallery' => $gallery,
    'clients' => [],
    'orders' => [],
    'finance' => [],
    'auth' => ['email' => '', 'password' => ''],
    'partners' => function_exists('pudim_load_partners') ? pudim_load_partners() : ['pudins' => [], 'gelatos' => []],
  ];

  if ($mode === 'public') {
    return $base;
  }

  $auth = pudim_get_auth($pdo);
  $base['auth'] = $auth;

  $clients = [];
  foreach ($pdo->query('SELECT * FROM clients ORDER BY created_at DESC') as $row) {
    $clients[] = [
      'id' => $row['id'],
      'name' => $row['name'],
      'email' => $row['email'] ?? '',
      'phone' => $row['phone'] ?? '',
      'address' => $row['address'] ?? '',
    ];
  }

  $orders = [];
  $orderRows = $pdo->query('SELECT * FROM orders ORDER BY ordered_at DESC')->fetchAll();
  $itemsByOrder = [];
  if ($orderRows) {
    $itemRows = $pdo->query('SELECT * FROM order_items')->fetchAll();
    foreach ($itemRows as $item) {
      $oid = $item['order_id'];
      if (!isset($itemsByOrder[$oid])) $itemsByOrder[$oid] = [];
      $itemsByOrder[$oid][] = [
        'productId' => $item['product_id'],
        'name' => $item['product_name'],
        'qty' => (int) $item['qty'],
        'price' => (float) $item['price'],
      ];
    }
  }
  foreach ($orderRows as $row) {
    $orders[] = [
      'id' => $row['id'],
      'number' => $row['number'],
      'clientId' => $row['client_id'],
      'clientName' => $row['client_name'],
      'clientWhatsapp' => $row['client_whatsapp'],
      'total' => (float) $row['total'],
      'status' => $row['status'],
      'notes' => $row['notes'] ?? '',
      'orderedAt' => $row['ordered_at'],
      'items' => $itemsByOrder[$row['id']] ?? [],
    ];
  }

  $finance = [];
  foreach ($pdo->query('SELECT * FROM finance ORDER BY entry_date DESC, created_at DESC') as $row) {
    $finance[] = [
      'id' => $row['id'],
      'type' => $row['type'],
      'amount' => (float) $row['amount'],
      'description' => $row['description'] ?? '',
      'date' => $row['entry_date'],
      'orderId' => $row['order_id'],
    ];
  }

  $base['clients'] = $clients;
  $base['orders'] = array_merge(pudim_load_reservas($pdo), $orders);
  $base['finance'] = $finance;
  return $base;
}

function pudim_load_reservas(PDO $pdo): array {
  if (!pudim_table_exists($pdo, 'reservas_natal')) return [];
  $out = [];
  foreach ($pdo->query('SELECT * FROM reservas_natal ORDER BY created_at DESC') as $row) {
    $out[] = [
      'id' => $row['id'],
      'number' => $row['number'],
      'clientName' => $row['customer_name'],
      'clientWhatsapp' => $row['phone'],
      'total' => (float) $row['total'],
      'status' => $row['status'] === 'confirmado' ? 'preparo' : ($row['status'] === 'entregue' ? 'entrega' : $row['status']),
      'notes' => trim('Natal · ' . $row['payment'] . ' · ' . $row['desired_date'] . ' · ' . $row['receive_method'] . (!empty($row['delivery_address']) ? ' · ' . $row['delivery_address'] : '')),
      'orderedAt' => $row['created_at'],
      'kind' => 'natal',
      'payment' => $row['payment'],
      'desiredDate' => $row['desired_date'],
      'receiveMethod' => $row['receive_method'],
      'items' => [[
        'productId' => $row['product_id'],
        'name' => $row['product_name'],
        'qty' => (int) $row['qty'],
        'price' => (float) $row['price'],
      ]],
    ];
  }
  return $out;
}

function pudim_ensure_reserva_delivery(PDO $pdo): void {
  if (!pudim_table_exists($pdo, 'reservas_natal')) return;
  try {
    $stmt = $pdo->prepare(
      'SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
    );
    $stmt->execute(['reservas_natal', 'delivery_address']);
    if (!$stmt->fetchColumn()) {
      $pdo->exec('ALTER TABLE reservas_natal ADD COLUMN delivery_address VARCHAR(500) NULL');
    }
  } catch (Throwable $e) { /* coluna já existe ou sem permissão */ }
}

function pudim_format_delivery_address(array $reserva): string {
  $ready = trim((string) ($reserva['deliveryAddress'] ?? ''));
  if ($ready !== '') {
    return function_exists('mb_substr') ? mb_substr($ready, 0, 500) : substr($ready, 0, 500);
  }
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
  $out = implode(' · ', $parts);
  return function_exists('mb_substr') ? mb_substr($out, 0, 500) : substr($out, 0, 500);
}

function pudim_ensure_reservas_natal(PDO $pdo): void {
  static $done = false;
  if ($done) return;
  $done = true;
  if (!pudim_table_exists($pdo, 'reservas_natal')) {
  try {
    $pdo->exec(
      "CREATE TABLE reservas_natal (
        id VARCHAR(64) NOT NULL,
        number VARCHAR(40) NOT NULL,
        customer_name VARCHAR(190) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        qty INT NOT NULL DEFAULT 1,
        payment VARCHAR(40) NOT NULL,
        desired_date VARCHAR(20) NOT NULL,
        receive_method VARCHAR(120) NOT NULL,
        delivery_address VARCHAR(500) NULL,
        product_id VARCHAR(64) NOT NULL DEFAULT 'p-natal',
        product_name VARCHAR(190) NOT NULL DEFAULT 'Pudim Tradicional Família',
        price DECIMAL(10,2) NOT NULL DEFAULT 65.00,
        total DECIMAL(10,2) NOT NULL DEFAULT 65.00,
        status ENUM('novo','confirmado','entregue','cancelado') NOT NULL DEFAULT 'novo',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_reservas_natal_number (number),
        KEY idx_reservas_natal_status (status),
        KEY idx_reservas_natal_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
  } catch (Throwable $e) { /* sem permissão CREATE */ }
  }
  pudim_ensure_reserva_delivery($pdo);
}

function pudim_create_reserva(PDO $pdo, array $reserva): array {
  pudim_ensure_show_natal($pdo);
  pudim_ensure_reservas_natal($pdo);
  try {
    $show = $pdo->query('SELECT show_natal FROM settings WHERE id = 1 LIMIT 1')->fetchColumn();
    if ($show !== false && (int) $show !== 1) {
      throw new InvalidArgumentException('A reserva de Natal não está disponível no momento.');
    }
  } catch (InvalidArgumentException $e) {
    throw $e;
  } catch (Throwable $e) { /* coluna ainda não existe: reserva segue */ }
  if (!pudim_table_exists($pdo, 'reservas_natal')) {
    throw new RuntimeException('Importe api/reservas_natal.sql no phpMyAdmin.');
  }
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
    $address = pudim_format_delivery_address($reserva);
  }
  $price = 65.00;
  $total = $price * $qty;
  $id = pudim_uid('rn');
  $number = 'NT' . date('ymd') . '-' . strtoupper(substr($id, -4));
  $stmt = $pdo->prepare(
    'INSERT INTO reservas_natal (id, number, customer_name, phone, qty, payment, desired_date, receive_method, delivery_address, product_id, product_name, price, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  try {
    $stmt->execute([
      $id, $number, $name, $phone, $qty, $payment, $date, $receive, $address !== '' ? $address : null,
      'p-natal', 'Pudim Tradicional Família', $price, $total, 'novo',
    ]);
  } catch (Throwable $e) {
    $stmt = $pdo->prepare(
      'INSERT INTO reservas_natal (id, number, customer_name, phone, qty, payment, desired_date, receive_method, product_id, product_name, price, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
      $id, $number, $name, $phone, $qty, $payment, $date, $receive,
      'p-natal', 'Pudim Tradicional Família', $price, $total, 'novo',
    ]);
  }
  try {
    $fin = $pdo->prepare(
      'INSERT INTO finance (id, type, amount, description, entry_date, order_id) VALUES (?, ?, ?, ?, CURDATE(), ?)'
    );
    $fin->execute([pudim_uid('f'), 'entrada', $total, 'Reserva Natal ' . $number, $id]);
  } catch (Throwable $e) { /* finance é opcional */ }
  try {
    pudim_find_or_create_client($pdo, ['phone' => $phone, 'address' => $address], $name, $phone);
  } catch (Throwable $e) { /* cliente é opcional */ }
  return ['ok' => true, 'id' => $id, 'number' => $number, 'total' => $total];
}

function pudim_mysql_save_reserva(PDO $pdo, array $order): void {
  pudim_ensure_show_natal($pdo);
  pudim_ensure_reservas_natal($pdo);
  if (!pudim_table_exists($pdo, 'reservas_natal')) return;
  $id = (string) ($order['id'] ?? '');
  $number = (string) ($order['number'] ?? '');
  $name = (string) ($order['clientName'] ?? '');
  $phone = preg_replace('/\D+/', '', (string) ($order['clientWhatsapp'] ?? ''));
  $qty = max(1, (int) ($order['qty'] ?? ($order['items'][0]['qty'] ?? 1)));
  $payment = (string) ($order['payment'] ?? '');
  $date = (string) ($order['desiredDate'] ?? '');
  $receive = (string) ($order['receiveMethod'] ?? '');
  $address = (string) ($order['deliveryAddress'] ?? '');
  $price = 65.00;
  $total = (float) ($order['total'] ?? ($price * $qty));
  if ($id === '' || $number === '' || $name === '') return;
  $stmt = $pdo->prepare(
    'INSERT INTO reservas_natal (id, number, customer_name, phone, qty, payment, desired_date, receive_method, delivery_address, product_id, product_name, price, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       customer_name = VALUES(customer_name),
       phone = VALUES(phone),
       qty = VALUES(qty),
       payment = VALUES(payment),
       desired_date = VALUES(desired_date),
       receive_method = VALUES(receive_method),
       delivery_address = VALUES(delivery_address),
       total = VALUES(total)'
  );
  try {
    $stmt->execute([
      $id, $number, $name, $phone, $qty, $payment, $date, $receive, $address !== '' ? $address : null,
      'p-natal', 'Pudim Tradicional Família', $price, $total, 'novo',
    ]);
  } catch (Throwable $e) {
    $stmt = $pdo->prepare(
      'INSERT INTO reservas_natal (id, number, customer_name, phone, qty, payment, desired_date, receive_method, product_id, product_name, price, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         customer_name = VALUES(customer_name),
         phone = VALUES(phone),
         qty = VALUES(qty),
         total = VALUES(total)'
    );
    $stmt->execute([
      $id, $number, $name, $phone, $qty, $payment, $date, $receive,
      'p-natal', 'Pudim Tradicional Família', $price, $total, 'novo',
    ]);
  }
}

function pudim_public_payload(array $data): array {
  $products = [];
  foreach ($data['products'] ?? [] as $p) {
    if (!is_array($p) || empty($p['active'])) continue;
    $item = $p;
    if (!empty($data['settings']['hidePrices'])) {
      unset($item['price'], $item['promoPrice'], $item['promoActive']);
    }
    $products[] = $item;
  }
  $payload = [
    'version' => $data['version'] ?? 1,
    'settings' => $data['settings'] ?? new stdClass(),
    'categories' => $data['categories'] ?? [],
    'products' => $products,
    'reviews' => $data['reviews'] ?? [],
    'gallery' => $data['gallery'] ?? [],
  ];
  if (!empty($data['partners']) && is_array($data['partners'])) {
    $payload['partners'] = $data['partners'];
  }
  return $payload;
}

function pudim_write_public_catalog(PDO $pdo): bool {
  $data = pudim_load_all($pdo, 'public');
  if ($data === null) return false;
  if (function_exists('pudim_load_partners')) {
    $data['partners'] = pudim_load_partners();
  }
  $json = json_encode(pudim_public_payload($data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if (!is_string($json) || $json === '') return false;
  $ok = @file_put_contents(pudim_catalog_path(), $json) !== false;
  if ($ok) @chmod(pudim_catalog_path(), 0644);
  return $ok;
}

function pudim_save_one_product(PDO $pdo, array $product): array {
  $id = trim((string) ($product['id'] ?? ''));
  if ($id === '') $id = pudim_uid('p');
  $name = trim((string) ($product['name'] ?? ''));
  if ($name === '') throw new InvalidArgumentException('Nome do produto obrigatório');
  $slug = trim((string) ($product['slug'] ?? ''));
  if ($slug === '') {
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', iconv('UTF-8', 'ASCII//TRANSLIT', $name))) ?: $id;
  }
  $categoryId = (string) ($product['categoryId'] ?? '');
  if ($categoryId === '') throw new InvalidArgumentException('Categoria obrigatória');

  $stmt = $pdo->prepare(
    'INSERT INTO products (id, name, description, price, category_id, image, featured, slug, promo_active, promo_price, best_seller, active, stock, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       description = VALUES(description),
       price = VALUES(price),
       category_id = VALUES(category_id),
       image = VALUES(image),
       featured = VALUES(featured),
       slug = VALUES(slug),
       promo_active = VALUES(promo_active),
       promo_price = VALUES(promo_price),
       best_seller = VALUES(best_seller),
       active = VALUES(active),
       stock = VALUES(stock),
       sort_order = VALUES(sort_order)'
  );
  $stmt->execute([
    $id,
    $name,
    (string) ($product['description'] ?? ''),
    (float) ($product['price'] ?? 0),
    $categoryId,
    (string) ($product['image'] ?? ''),
    !empty($product['featured']) ? 1 : 0,
    $slug,
    !empty($product['promoActive']) ? 1 : 0,
    isset($product['promoPrice']) ? (float) $product['promoPrice'] : null,
    !empty($product['bestSeller']) ? 1 : 0,
    isset($product['active']) && $product['active'] === false ? 0 : 1,
    isset($product['stock']) ? (int) $product['stock'] : null,
    (int) ($product['sortOrder'] ?? 0),
  ]);

  $row = $pdo->prepare('SELECT * FROM products WHERE id = ?');
  $row->execute([$id]);
  $saved = $row->fetch();
  return pudim_map_product($saved ?: array_merge($product, ['id' => $id, 'slug' => $slug]));
}

function pudim_delete_one_product(PDO $pdo, string $id): void {
  $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
  $stmt->execute([$id]);
}

function pudim_save_all(PDO $pdo, array $payload): void {
  pudim_ensure_show_natal($pdo);
  $pdo->beginTransaction();
  try {
    $s = $payload['settings'] ?? [];
    $stmt = $pdo->prepare(
      'INSERT INTO settings (id, name, tagline, logo, banner, sobre_image, whatsapp, instagram, instagram_user, facebook, email, address, hours, hero_badge, sobre_text1, sobre_text2, whatsapp_message, hide_prices, show_natal, data_version)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), tagline = VALUES(tagline), logo = VALUES(logo), banner = VALUES(banner),
         sobre_image = VALUES(sobre_image), whatsapp = VALUES(whatsapp), instagram = VALUES(instagram),
         instagram_user = VALUES(instagram_user), facebook = VALUES(facebook), email = VALUES(email),
         address = VALUES(address), hours = VALUES(hours), hero_badge = VALUES(hero_badge),
         sobre_text1 = VALUES(sobre_text1), sobre_text2 = VALUES(sobre_text2),
         whatsapp_message = VALUES(whatsapp_message), hide_prices = VALUES(hide_prices),
         show_natal = VALUES(show_natal), data_version = VALUES(data_version)'
    );
    $stmt->execute([
      $s['name'] ?? 'O! Pudim',
      $s['tagline'] ?? '',
      $s['logo'] ?? '',
      $s['banner'] ?? '',
      $s['sobreImage'] ?? '',
      $s['whatsapp'] ?? '',
      $s['instagram'] ?? '',
      $s['instagramUser'] ?? '',
      $s['facebook'] ?? '',
      $s['email'] ?? '',
      $s['address'] ?? '',
      $s['hours'] ?? '',
      $s['heroBadge'] ?? '',
      $s['sobreText1'] ?? '',
      $s['sobreText2'] ?? '',
      $s['whatsappMessage'] ?? 'Olá! Gostaria de fazer um pedido.',
      !empty($s['hidePrices']) ? 1 : 0,
      !empty($s['showNatal']) ? 1 : 0,
      (int) ($payload['version'] ?? 1),
    ]);

    if (!empty($payload['auth']['email'])) {
      $authStmt = $pdo->prepare('UPDATE admins SET email = ?, password_hash = ? WHERE id = 1');
      $authStmt->execute([
        (string) $payload['auth']['email'],
        (string) ($payload['auth']['password'] ?? ''),
      ]);
    }

    if (isset($payload['categories']) && is_array($payload['categories'])) {
      $keep = [];
      $catIns = $pdo->prepare(
        'INSERT INTO categories (id, name, slug, sort_order) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), sort_order = VALUES(sort_order)'
      );
      foreach ($payload['categories'] as $i => $cat) {
        $id = (string) ($cat['id'] ?? '');
        if ($id === '') continue;
        $keep[] = $id;
        $catIns->execute([$id, $cat['name'] ?? '', $cat['slug'] ?? $id, (int) ($cat['sortOrder'] ?? $i)]);
      }
      if ($keep) {
        $in = implode(',', array_fill(0, count($keep), '?'));
        $pdo->prepare("DELETE FROM categories WHERE id NOT IN ($in)")->execute($keep);
      }
    }

    if (isset($payload['products']) && is_array($payload['products'])) {
      $keep = [];
      foreach ($payload['products'] as $i => $prod) {
        if (!is_array($prod)) continue;
        $prod['sortOrder'] = $prod['sortOrder'] ?? $i;
        $saved = pudim_save_one_product($pdo, $prod);
        $keep[] = $saved['id'];
      }
      if ($keep) {
        $in = implode(',', array_fill(0, count($keep), '?'));
        $pdo->prepare("DELETE FROM products WHERE id NOT IN ($in)")->execute($keep);
      }
    }

    if (isset($payload['gallery']) && is_array($payload['gallery'])) {
      $pdo->exec('DELETE FROM gallery');
      $gal = $pdo->prepare('INSERT INTO gallery (image, sort_order, active) VALUES (?, ?, 1)');
      foreach ($payload['gallery'] as $i => $img) {
        $path = is_array($img) ? ($img['image'] ?? '') : (string) $img;
        if ($path !== '') $gal->execute([$path, $i]);
      }
    }

    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
  }

  try { pudim_write_public_catalog($pdo); } catch (Throwable $e) {}
}

function pudim_find_or_create_client(PDO $pdo, array $client, string $name, string $phone): string {
  $id = trim((string) ($client['id'] ?? ''));
  $phoneDigits = preg_replace('/\D+/', '', $phone);
  if ($id === '') {
    $found = $pdo->prepare('SELECT id FROM clients WHERE phone = ? LIMIT 1');
    $found->execute([$phoneDigits ?: $phone]);
    $id = (string) ($found->fetchColumn() ?: '');
  }
  if ($id === '') $id = pudim_uid('c');

  $stmt = $pdo->prepare(
    'INSERT INTO clients (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone), address = VALUES(address)'
  );
  $stmt->execute([
    $id,
    $name,
    (string) ($client['email'] ?? ''),
    $phoneDigits ?: $phone,
    (string) ($client['address'] ?? ''),
  ]);
  return $id;
}

function pudim_create_order(PDO $pdo, array $order, ?array $client = null): array {
  $name = trim((string) ($order['clientName'] ?? ''));
  $phone = trim((string) ($order['clientWhatsapp'] ?? ''));
  $items = $order['items'] ?? [];
  if ($name === '' || $phone === '' || !is_array($items) || !$items) {
    throw new InvalidArgumentException('Pedido incompleto');
  }

  $clientId = pudim_find_or_create_client($pdo, is_array($client) ? $client : [], $name, $phone);
  $id = pudim_uid('o');
  $number = 'OP' . date('ymd') . '-' . substr($id, -4);
  $total = 0;
  foreach ($items as $item) {
    $qty = max(1, (int) ($item['qty'] ?? $item['quantity'] ?? 1));
    $price = (float) ($item['price'] ?? 0);
    $total += $qty * $price;
  }

  $pdo->beginTransaction();
  try {
    $ins = $pdo->prepare(
      'INSERT INTO orders (id, number, client_id, client_name, client_whatsapp, total, status, notes, ordered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
    );
    $ins->execute([
      $id,
      $number,
      $clientId,
      $name,
      preg_replace('/\D+/', '', $phone),
      $total,
      'novo',
      (string) ($order['notes'] ?? ''),
    ]);
    $itemStmt = $pdo->prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, qty, price) VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($items as $item) {
      $qty = max(1, (int) ($item['qty'] ?? $item['quantity'] ?? 1));
      $price = (float) ($item['price'] ?? 0);
      $itemStmt->execute([
        $id,
        $item['productId'] ?? null,
        (string) ($item['name'] ?? 'Produto'),
        $qty,
        $price,
      ]);
    }
    $fin = $pdo->prepare(
      'INSERT INTO finance (id, type, amount, description, entry_date, order_id) VALUES (?, ?, ?, ?, CURDATE(), ?)'
    );
    $fin->execute([pudim_uid('f'), 'entrada', $total, 'Pedido ' . $number, $id]);
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
  }

  return ['ok' => true, 'id' => $id, 'number' => $number, 'total' => $total];
}

function pudim_ensure_visits(PDO $pdo): void {
  static $done = false;
  if ($done) return;
  $done = true;
  if (pudim_table_exists($pdo, 'visits')) return;
  try {
    $pdo->exec(
      'CREATE TABLE visits (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        session_id VARCHAR(64) NOT NULL,
        path VARCHAR(190) NOT NULL DEFAULT "/",
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_visits_created (created_at),
        KEY idx_visits_session (session_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
  } catch (Throwable $e) { /* já existe ou sem permissão */ }
}

function pudim_record_visit(PDO $pdo, string $sessionId, string $path): void {
  pudim_ensure_visits($pdo);
  if (!pudim_table_exists($pdo, 'visits')) return;
  $sessionId = substr(preg_replace('/[^a-zA-Z0-9_-]/', '', $sessionId), 0, 64);
  if (strlen($sessionId) < 8) return;
  $path = substr(trim($path) !== '' ? $path : '/', 0, 190);
  if (preg_match('#/admin(/|$)#i', $path)) return;

  $tz = new DateTimeZone('America/Sao_Paulo');
  $now = new DateTime('now', $tz);
  $since = (clone $now)->modify('-30 seconds')->format('Y-m-d H:i:s');
  $dup = $pdo->prepare('SELECT 1 FROM visits WHERE session_id = ? AND created_at >= ? LIMIT 1');
  $dup->execute([$sessionId, $since]);
  if ($dup->fetchColumn()) return;

  $ins = $pdo->prepare('INSERT INTO visits (session_id, path, created_at) VALUES (?, ?, ?)');
  $ins->execute([$sessionId, $path, $now->format('Y-m-d H:i:s')]);
}

function pudim_visit_stats(PDO $pdo): array {
  pudim_ensure_visits($pdo);
  $tz = new DateTimeZone('America/Sao_Paulo');
  $today = new DateTime('today', $tz);
  $emptyDays = [];
  for ($i = 6; $i >= 0; $i--) {
    $d = (clone $today)->modify('-' . $i . ' days')->format('Y-m-d');
    $emptyDays[$d] = ['date' => $d, 'views' => 0, 'visitors' => 0];
  }
  $zero = [
    'visitorsToday' => 0,
    'viewsToday' => 0,
    'visitors7d' => 0,
    'views7d' => 0,
    'visitorsTotal' => 0,
    'viewsTotal' => 0,
    'days' => array_values($emptyDays),
  ];
  if (!pudim_table_exists($pdo, 'visits')) return $zero;

  $todayStart = $today->format('Y-m-d 00:00:00');
  $weekStart = (clone $today)->modify('-6 days')->format('Y-m-d 00:00:00');

  $run = static function (PDO $pdo, string $sql, array $params = []): array {
    $st = $pdo->prepare($sql);
    $st->execute($params);
    return $st->fetch() ?: [];
  };

  $todayRow = $run($pdo, 'SELECT COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors FROM visits WHERE created_at >= ?', [$todayStart]);
  $weekRow = $run($pdo, 'SELECT COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors FROM visits WHERE created_at >= ?', [$weekStart]);
  $allRow = $run($pdo, 'SELECT COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors FROM visits');

  $st = $pdo->prepare(
    'SELECT DATE(created_at) AS d, COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors
     FROM visits WHERE created_at >= ? GROUP BY DATE(created_at)'
  );
  $st->execute([$weekStart]);
  while ($row = $st->fetch()) {
    $d = (string) ($row['d'] ?? '');
    if (isset($emptyDays[$d])) {
      $emptyDays[$d]['views'] = (int) $row['views'];
      $emptyDays[$d]['visitors'] = (int) $row['visitors'];
    }
  }

  return [
    'visitorsToday' => (int) ($todayRow['visitors'] ?? 0),
    'viewsToday' => (int) ($todayRow['views'] ?? 0),
    'visitors7d' => (int) ($weekRow['visitors'] ?? 0),
    'views7d' => (int) ($weekRow['views'] ?? 0),
    'visitorsTotal' => (int) ($allRow['visitors'] ?? 0),
    'viewsTotal' => (int) ($allRow['views'] ?? 0),
    'days' => array_values($emptyDays),
  ];
}

function pudim_save_data_url_file(string $dataUrl): string {
  if (!preg_match('#^data:(image/(jpeg|png|webp|gif));base64,(.+)$#s', $dataUrl, $m)) {
    return '';
  }
  $bin = base64_decode($m[3], true);
  if ($bin === false || strlen($bin) < 32) return '';
  $ext = $m[2] === 'jpeg' ? 'jpg' : $m[2];
  $dir = pudim_products_dir();
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $name = 'up-' . bin2hex(random_bytes(6)) . '.' . $ext;
  $path = $dir . DIRECTORY_SEPARATOR . $name;
  if (@file_put_contents($path, $bin) === false) return '';
  @chmod($path, 0644);
  return 'products/' . $name;
}
