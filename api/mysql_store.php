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

function pudim_load_all(PDO $pdo, string $mode = 'full'): ?array {
  if (!pudim_db_ready($pdo)) {
    return null;
  }

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
  $base['orders'] = $orders;
  $base['finance'] = $finance;
  return $base;
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
  return [
    'version' => $data['version'] ?? 1,
    'settings' => $data['settings'] ?? new stdClass(),
    'categories' => $data['categories'] ?? [],
    'products' => $products,
    'reviews' => $data['reviews'] ?? [],
    'gallery' => $data['gallery'] ?? [],
  ];
}

function pudim_write_public_catalog(PDO $pdo): bool {
  $data = pudim_load_all($pdo, 'public');
  if ($data === null) return false;
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
  $pdo->beginTransaction();
  try {
    $s = $payload['settings'] ?? [];
    $stmt = $pdo->prepare(
      'INSERT INTO settings (id, name, tagline, logo, banner, sobre_image, whatsapp, instagram, instagram_user, facebook, email, address, hours, hero_badge, sobre_text1, sobre_text2, whatsapp_message, hide_prices, data_version)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), tagline = VALUES(tagline), logo = VALUES(logo), banner = VALUES(banner),
         sobre_image = VALUES(sobre_image), whatsapp = VALUES(whatsapp), instagram = VALUES(instagram),
         instagram_user = VALUES(instagram_user), facebook = VALUES(facebook), email = VALUES(email),
         address = VALUES(address), hours = VALUES(hours), hero_badge = VALUES(hero_badge),
         sobre_text1 = VALUES(sobre_text1), sobre_text2 = VALUES(sobre_text2),
         whatsapp_message = VALUES(whatsapp_message), hide_prices = VALUES(hide_prices), data_version = VALUES(data_version)'
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
