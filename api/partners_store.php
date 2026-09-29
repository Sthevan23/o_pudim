<?php

function pudim_catalog_file(): string {
  return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'catalog.json';
}

function pudim_partners_overlay_candidates(): array {
  return [
    dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'opudim_partners.json',
    __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'partners.json',
  ];
}

function pudim_normalize_partners($raw): array {
  $norm = static function ($list): array {
    $out = [];
    $seen = [];
    foreach (is_array($list) ? $list : [] as $p) {
      if (!is_array($p)) continue;
      $name = trim((string) ($p['name'] ?? ''));
      if ($name === '') continue;
      $id = trim((string) ($p['id'] ?? ''));
      if ($id === '') {
        $id = 'pt-' . substr(sha1($name), 0, 10);
      }
      if (isset($seen[$id])) {
        $id .= '-' . substr(bin2hex(random_bytes(2)), 0, 4);
      }
      $seen[$id] = true;
      $item = ['id' => $id, 'name' => $name];
      $logo = trim((string) ($p['logo'] ?? ''));
      if ($logo !== '') $item['logo'] = $logo;
      $out[] = $item;
    }
    return $out;
  };
  return [
    'pudins' => $norm(is_array($raw) ? ($raw['pudins'] ?? []) : []),
    'gelatos' => $norm(is_array($raw) ? ($raw['gelatos'] ?? []) : []),
  ];
}

function pudim_load_partners(): array {
  foreach (pudim_partners_overlay_candidates() as $path) {
    if (!is_file($path)) continue;
    $raw = json_decode((string) @file_get_contents($path), true);
    if (is_array($raw) && (isset($raw['pudins']) || isset($raw['gelatos']))) {
      return pudim_normalize_partners($raw);
    }
    if (is_array($raw) && isset($raw['partners']) && is_array($raw['partners'])) {
      return pudim_normalize_partners($raw['partners']);
    }
  }
  $path = pudim_catalog_file();
  if (is_file($path)) {
    $cat = json_decode((string) @file_get_contents($path), true);
    if (is_array($cat) && isset($cat['partners']) && is_array($cat['partners'])) {
      return pudim_normalize_partners($cat['partners']);
    }
  }
  return ['pudins' => [], 'gelatos' => []];
}

function pudim_save_partners(array $partners): array {
  $partners = pudim_normalize_partners($partners);
  $json = json_encode($partners, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if (!is_string($json) || $json === '') {
    throw new RuntimeException('Falha ao montar os parceiros.');
  }

  $written = false;
  foreach (pudim_partners_overlay_candidates() as $path) {
    $dir = dirname($path);
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    if (!is_dir($dir) || !is_writable($dir)) continue;
    if (@file_put_contents($path, $json, LOCK_EX) === false) continue;
    @chmod($path, 0640);
    $written = true;
    break;
  }
  if (!$written) {
    throw new RuntimeException('Não foi possível gravar os parceiros no servidor.');
  }

  $catalogPath = pudim_catalog_file();
  $data = [];
  if (is_file($catalogPath)) {
    $decoded = json_decode((string) @file_get_contents($catalogPath), true);
    if (is_array($decoded)) $data = $decoded;
  }
  $data['partners'] = $partners;
  $catJson = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if (is_string($catJson) && $catJson !== '') {
    @file_put_contents($catalogPath, $catJson, LOCK_EX);
    @chmod($catalogPath, 0644);
  }
  return $partners;
}
