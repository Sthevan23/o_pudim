# O! Pudim

Site + painel admin para Hostinger (HTML/CSS/JS + PHP + MySQL). Sem Node.

## Estrutura

- `index.html`, `style.css`, `script.js` — site público
- Pedidos pelo WhatsApp (sem carrinho no site)
- `products/` — fotos
- `js/` — dados padrão e sync com a API
- `admin/` — painel
- `api/` — API PHP ligada ao MySQL da Hostinger
- `catalog.json` — cardápio público (o site abre mesmo se o MySQL estiver lento)

## Subir na Hostinger

1. No hPanel, crie um banco MySQL (anote usuário, senha e nome).
2. phpMyAdmin → SQL → importe `api/o_pudim_mysql.sql`.
3. Copie `api/config.local.example.php` para `api/config.local.php` e preencha a senha.
4. Envie **esta pasta** para `public_html`.
5. Teste: `seusite.com/api/ping.php`

Painel: `seusite.com/admin/login.html`

| E-mail | Senha |
|---|---|
| `ana@pudins.com` | `pudim123` |

Troque a senha depois no banco (`admins.password_hash`) ou pelo painel.

WhatsApp: `(37) 9119-4019` · Instagram: [@opudimgold](https://www.instagram.com/opudimgold) · Cidade: Lagoa da Prata — MG

Os preços ficam no painel. No site público eles não aparecem.
