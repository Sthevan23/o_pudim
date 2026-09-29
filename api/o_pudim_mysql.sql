-- O! Pudim — schema MySQL (Hostinger / phpMyAdmin)
-- 1) Crie o banco no hPanel (ex.: u586160337_opudim)
-- 2) phpMyAdmin > SQL > cole este arquivo e Execute
-- 3) Preencha api/config.local.php com usuário/senha

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `reservas_natal`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `finance`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `gallery`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `visits`;

CREATE TABLE `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `settings` (
  `id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `name` VARCHAR(190) NOT NULL,
  `tagline` VARCHAR(255) DEFAULT NULL,
  `logo` VARCHAR(500) DEFAULT NULL,
  `banner` VARCHAR(500) DEFAULT NULL,
  `sobre_image` VARCHAR(500) DEFAULT NULL,
  `whatsapp` VARCHAR(30) DEFAULT NULL,
  `instagram` VARCHAR(255) DEFAULT NULL,
  `instagram_user` VARCHAR(120) DEFAULT NULL,
  `facebook` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(190) DEFAULT NULL,
  `address` VARCHAR(500) DEFAULT NULL,
  `hours` VARCHAR(255) DEFAULT NULL,
  `hero_badge` VARCHAR(255) DEFAULT NULL,
  `sobre_text1` TEXT,
  `sobre_text2` TEXT,
  `whatsapp_message` VARCHAR(255) DEFAULT NULL,
  `hide_prices` TINYINT(1) NOT NULL DEFAULT 1,
  `show_natal` TINYINT(1) NOT NULL DEFAULT 1,
  `data_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `category_id` VARCHAR(64) NOT NULL,
  `image` VARCHAR(500) DEFAULT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `slug` VARCHAR(190) NOT NULL,
  `promo_active` TINYINT(1) NOT NULL DEFAULT 0,
  `promo_price` DECIMAL(10,2) DEFAULT NULL,
  `best_seller` TINYINT(1) NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `stock` INT DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gallery` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `image` VARCHAR(500) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reviews` (
  `id` VARCHAR(64) NOT NULL,
  `author` VARCHAR(120) NOT NULL,
  `text` TEXT NOT NULL,
  `rating` TINYINT UNSIGNED DEFAULT 5,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `clients` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `email` VARCHAR(190) DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `address` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clients_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` VARCHAR(64) NOT NULL,
  `number` VARCHAR(40) NOT NULL,
  `client_id` VARCHAR(64) DEFAULT NULL,
  `client_name` VARCHAR(190) NOT NULL,
  `client_whatsapp` VARCHAR(30) DEFAULT NULL,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('novo','preparo','entrega','finalizado','cancelado') NOT NULL DEFAULT 'novo',
  `notes` TEXT NULL,
  `ordered_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_number` (`number`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_client` (`client_id`),
  CONSTRAINT `fk_orders_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) DEFAULT NULL,
  `product_name` VARCHAR(190) NOT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `finance` (
  `id` VARCHAR(64) NOT NULL,
  `type` ENUM('entrada','saida') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `entry_date` DATE NOT NULL,
  `order_id` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_finance_date` (`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reservas_natal` (
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

CREATE TABLE `product_images` (
  `filename` VARCHAR(190) NOT NULL,
  `mime` VARCHAR(64) NOT NULL DEFAULT 'image/png',
  `data` LONGBLOB NOT NULL,
  `bytes` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `visits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(64) NOT NULL,
  `path` VARCHAR(190) NOT NULL DEFAULT '/',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_visits_created` (`created_at`),
  KEY `idx_visits_session` (`session_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`email`, `password_hash`) VALUES ('ana@pudins.com', 'pudim123');

INSERT INTO `settings` (
  `id`, `name`, `tagline`, `logo`, `banner`, `sobre_image`, `whatsapp`,
  `instagram`, `instagram_user`, `email`, `address`, `hours`, `hero_badge`,
  `sobre_text1`, `sobre_text2`, `whatsapp_message`, `hide_prices`, `show_natal`, `data_version`
) VALUES (
  1,
  'O! Pudim',
  'Um pedacinho de felicidade em cada colherada',
  'products/logo.png',
  'products/protein.png',
  'products/lotus.png',
  '553791194019',
  'https://www.instagram.com/opudimgold',
  '@opudimgold',
  'ana@pudins.com',
  'Lagoa da Prata — MG',
  'Segunda a sábado, das 9h às 18h',
  'Pudins artesanais · Lagoa da Prata — MG',
  'A O! Pudim nasceu em Lagoa da Prata, Minas Gerais, com fé, gratidão e o desejo de transformar doces momentos em experiências especiais. Em cada etapa, buscamos honrar a Deus com dedicação, cuidado e amor pelo que fazemos.',
  'Preparamos nossas receitas artesanalmente, com ingredientes selecionados e atenção a cada detalhe — do sabor à apresentação. Do pudim tradicional às criações da estação, cada delícia é feita para encantar, compartilhar e adoçar bons momentos. Que cada criação leve consigo um pouco do nosso carinho e da nossa fé. Para a honra e a glória de Deus.',
  'Olá! Gostaria de fazer um pedido.',
  1,
  1,
  1
);

INSERT INTO `categories` (`id`, `name`, `slug`, `sort_order`) VALUES
('cat-copo', 'Copos', 'copos', 0),
('cat-trad', 'Tradicionais', 'tradicionais', 1),
('cat-choc', 'Chocolates', 'chocolates', 2),
('cat-esp', 'Especiais', 'especiais', 3),
('cat-fru', 'Frutas', 'frutas', 4),
('cat-edi', 'Edições especiais', 'edicoes-especiais', 5);

INSERT INTO `products` (`id`, `name`, `description`, `price`, `category_id`, `image`, `featured`, `slug`, `promo_active`, `promo_price`, `best_seller`, `active`, `sort_order`) VALUES
('p-natal', 'Pudim Tradicional Família', 'Edição de Natal. Pudim tradicional de 1,1 kg, serve até 10 pessoas. Vai em bag térmica presenteável e cartão de papel-semente.', 65.00, 'cat-edi', 'products/natal-familia.png', 1, 'pudim-tradicional-familia-natal', 0, NULL, 1, 1, -1),
('p-joao', 'Que Ele cresça', 'Copo especial com a mensagem de João 3:30. Cremoso, com calda de caramelo e tampa dourada.', 12.00, 'cat-copo', 'products/joao-330.png', 1, 'que-ele-cresca', 0, NULL, 1, 1, 0),
('p-trem', 'Uai, que trem bão!', 'Edição mineira, no copo, com calda de caramelo. Sabor da casa com sotaque de Minas.', 12.00, 'cat-copo', 'products/trem-bao.png', 1, 'uai-que-trem-bao', 0, NULL, 1, 1, 1),
('p-protein', 'O! Pudim Protein', 'Zero adição de açúcares, 19g de proteína e whey. Rico em proteínas e cálcio.', 14.00, 'cat-copo', 'products/protein.png', 1, 'pudim-protein', 0, NULL, 1, 1, 2),
('p-trad', 'Pudim Tradicional', 'Nosso clássico, cremoso e irresistível.', 8.00, 'cat-trad', 'products/icedim.png', 1, 'pudim-tradicional', 0, NULL, 1, 1, 3),
('p-choc', 'Pudim de Chocolate', 'Cacau intenso, textura aveludada e um toque de biscoito.', 9.00, 'cat-choc', 'products/chocolate-biscoito.png', 1, 'pudim-chocolate', 0, NULL, 1, 1, 2),
('p-ninho', 'Pudim de Leite Ninho', 'Doce de leite em pó no ponto certo, leve e cremoso.', 9.50, 'cat-trad', 'products/nozes.png', 1, 'pudim-leite-ninho', 1, 8.50, 1, 1, 3),
('p-coco', 'Pudim de Coco', 'Coco fresco, cobertura branca e um sabor que lembra infância.', 9.00, 'cat-trad', 'products/caju-goiabada.png', 0, 'pudim-coco', 0, NULL, 0, 1, 4),
('p-morango', 'Pudim de Morango', 'Chocolate branco e morango em pedaços. Leve, bonito e viciante.', 10.00, 'cat-fru', 'products/morango.png', 1, 'pudim-morango', 0, NULL, 1, 1, 5),
('p-ferrero', 'Paleta Ferrero Gold', 'Chocolate, avelã e folha dourada. Uma edição para ocasiões especiais.', 16.00, 'cat-edi', 'products/ferrero-gold.png', 1, 'paleta-ferrero-gold', 0, NULL, 1, 1, 6),
('p-maracuja', 'Gelato de Maracujá', 'Cremoso, cítrico e feito com polpa selecionada.', 14.00, 'cat-fru', 'products/maracuja.png', 0, 'gelato-maracuja', 0, NULL, 0, 1, 7),
('p-lotus', 'Paleta Lotus', 'Biscoito caramelizado e recheio cremoso. Irresistível do primeiro ao último mordisco.', 12.00, 'cat-esp', 'products/lotus.png', 1, 'paleta-lotus', 0, NULL, 1, 1, 8),
('p-secas', 'Gelato de Frutas Secas', 'Creme suave com pedaços de frutas e um toque artesanal.', 14.00, 'cat-fru', 'products/frutas-secas.png', 0, 'gelato-frutas-secas', 0, NULL, 0, 1, 9),
('p-donut', 'Paleta Donut de Chocolate', 'Formato donut, cobertura de chocolate e crocante por cima.', 13.00, 'cat-choc', 'products/donut.png', 0, 'paleta-donut-chocolate', 0, NULL, 0, 1, 10),
('p-vermelhas', 'Paleta Frutas Vermelhas', 'Morango, blueberry e calda vermelha em uma paleta de festa.', 12.00, 'cat-fru', 'products/frutas-vermelhas.png', 0, 'paleta-frutas-vermelhas', 0, NULL, 0, 1, 11),
('p-avela', 'Paleta Avelã', 'Chocolate profundo com crocante de avelã e amêndoas.', 13.00, 'cat-choc', 'products/avela.png', 0, 'paleta-avela', 0, NULL, 0, 1, 12),
('p-caramelo', 'Paleta Caramelo Salgado', 'Caramelo, flor de sal e chocolate. Equilíbrio perfeito.', 12.00, 'cat-esp', 'products/caramelo-salgado.png', 0, 'paleta-caramelo-salgado', 1, 10.90, 0, 1, 13);

INSERT INTO `gallery` (`image`, `sort_order`) VALUES
('products/natal-familia.png', 0),
('products/joao-330.png', 1),
('products/trem-bao.png', 2),
('products/protein.png', 3),
('products/morango.png', 4),
('products/lotus.png', 5),
('products/ferrero-gold.png', 6),
('products/maracuja.png', 7),
('products/icedim.png', 8),
('products/donut.png', 9),
('products/frutas-vermelhas.png', 10),
('products/avela.png', 11);

INSERT INTO `reviews` (`id`, `author`, `text`, `rating`) VALUES
('r1', 'Camila Ferreira', 'O pudim tradicional é o melhor que já comi. Cremoso, no ponto, e a apresentação é linda.', 5),
('r2', 'Rafael Mendes', 'Pedi a paleta Lotus para um aniversário. Todo mundo perguntou de onde era.', 5),
('r3', 'Juliana Costa', 'Atendimento rápido no WhatsApp e o gelato de maracujá é viciante.', 5),
('r4', 'Bruno Almeida', 'A edição Ferrero Gold vale cada centavo. Parece presente.', 4);

SET FOREIGN_KEY_CHECKS = 1;

-- Se o banco já foi importado, rode só isto no phpMyAdmin:
-- CREATE TABLE IF NOT EXISTS `visits` (
--   `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
--   `session_id` VARCHAR(64) NOT NULL,
--   `path` VARCHAR(190) NOT NULL DEFAULT '/',
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   PRIMARY KEY (`id`),
--   KEY `idx_visits_created` (`created_at`),
--   KEY `idx_visits_session` (`session_id`, `created_at`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- INSERT IGNORE INTO `categories` (`id`, `name`, `slug`, `sort_order`) VALUES ('cat-copo', 'Copos', 'copos', 0);
-- INSERT IGNORE INTO `products` (`id`, `name`, `description`, `price`, `category_id`, `image`, `featured`, `slug`, `promo_active`, `promo_price`, `best_seller`, `active`, `sort_order`) VALUES
-- ('p-joao', 'Que Ele cresça', 'Copo especial com a mensagem de João 3:30. Cremoso, com calda de caramelo e tampa dourada.', 12.00, 'cat-copo', 'products/joao-330.png', 1, 'que-ele-cresca', 0, NULL, 1, 1, 0),
-- ('p-trem', 'Uai, que trem bão!', 'Edição mineira, no copo, com calda de caramelo. Sabor da casa com sotaque de Minas.', 12.00, 'cat-copo', 'products/trem-bao.png', 1, 'uai-que-trem-bao', 0, NULL, 1, 1, 1),
-- ('p-protein', 'O! Pudim Protein', 'Zero adição de açúcares, 19g de proteína e whey. Rico em proteínas e cálcio.', 14.00, 'cat-copo', 'products/protein.png', 1, 'pudim-protein', 0, NULL, 1, 1, 2);
-- INSERT IGNORE INTO `gallery` (`image`, `sort_order`) VALUES ('products/joao-330.png', 0), ('products/trem-bao.png', 1), ('products/protein.png', 2);
-- UPDATE `settings` SET `banner` = 'products/protein.png', `address` = 'Lagoa da Prata — MG', `hero_badge` = 'Pudins artesanais · Lagoa da Prata — MG' WHERE `id` = 1;
