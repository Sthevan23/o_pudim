-- Rode no phpMyAdmin se o banco já existir (a API também cria sozinha).
CREATE TABLE IF NOT EXISTS `visits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(64) NOT NULL,
  `path` VARCHAR(190) NOT NULL DEFAULT '/',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_visits_created` (`created_at`),
  KEY `idx_visits_session` (`session_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
