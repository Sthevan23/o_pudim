-- O! Pudim — Reserva de Natal (cole no phpMyAdmin se o banco JÁ existe)
-- Não apaga dados. Só cria a tabela e o pudim família.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `reservas_natal` (
  `id` VARCHAR(64) NOT NULL,
  `number` VARCHAR(40) NOT NULL,
  `customer_name` VARCHAR(190) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `payment` VARCHAR(40) NOT NULL,
  `desired_date` VARCHAR(20) NOT NULL,
  `receive_method` VARCHAR(120) NOT NULL,
  `delivery_address` VARCHAR(500) DEFAULT NULL,
  `product_id` VARCHAR(64) NOT NULL DEFAULT 'p-natal',
  `product_name` VARCHAR(190) NOT NULL DEFAULT 'Pudim Tradicional Família',
  `price` DECIMAL(10,2) NOT NULL DEFAULT 65.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 65.00,
  `status` ENUM('novo','confirmado','entregue','cancelado') NOT NULL DEFAULT 'novo',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reservas_natal_number` (`number`),
  KEY `idx_reservas_natal_status` (`status`),
  KEY `idx_reservas_natal_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `categories` (`id`, `name`, `slug`, `sort_order`) VALUES
('cat-edi', 'Edições especiais', 'edicoes-especiais', 5);

INSERT INTO `products` (`id`, `name`, `description`, `price`, `category_id`, `image`, `featured`, `slug`, `promo_active`, `promo_price`, `best_seller`, `active`, `sort_order`)
VALUES (
  'p-natal',
  'Pudim Tradicional Família',
  'Edição de Natal. Pudim tradicional de 1,1 kg, serve até 10 pessoas. Vai em bag térmica presenteável e cartão de papel-semente.',
  65.00,
  'cat-edi',
  'products/natal-familia.png',
  1,
  'pudim-tradicional-familia-natal',
  0,
  NULL,
  1,
  1,
  -1
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  image = VALUES(image),
  featured = VALUES(featured),
  active = VALUES(active);

ALTER TABLE `settings` ADD COLUMN IF NOT EXISTS `show_natal` TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE `reservas_natal` ADD COLUMN IF NOT EXISTS `delivery_address` VARCHAR(500) DEFAULT NULL;
