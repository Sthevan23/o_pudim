import { PrismaClient, PaymentMethod, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (name: string) => `/uploads/seed/${name}`;

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.differentiator.deleteMany();
  await prisma.siteContent.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.user.create({
    data: {
      email: "admin@sistema.com",
      passwordHash,
      name: "Administrador Master",
      role: "MASTER",
    },
  });

  const company = await prisma.company.create({
    data: {
      name: "Pudins da Ana",
      slug: "pudins-da-ana",
      ownerName: "Ana Oliveira",
      email: "ana@pudins.com",
      phone: "11987654321",
      logoUrl: img("lotus.png"),
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      email: "ana@pudins.com",
      passwordHash,
      name: "Ana Oliveira",
      role: "ADMIN",
      phone: "11987654321",
      companyId: company.id,
    },
  });

  await prisma.companySettings.create({
    data: {
      companyId: company.id,
      description:
        "Pudins artesanais, paletas e gelatos preparados com carinho. Uma confeitaria feita para despertar vontade à primeira olhada — e à primeira colherada.",
      whatsapp: "5511987654321",
      instagram: "opudimgold",
      phone: "(11) 98765-4321",
      address: "São Paulo — SP",
      businessHours: "Segunda a sábado, das 9h às 18h",
      colorBackground: "#FFF9F5",
      colorPrimary: "#5A3825",
      colorSecondary: "#C58B5C",
      colorCream: "#F5E6D3",
      colorText: "#241A15",
      bannerUrl: img("morango.png"),
      whatsappMessage: "Olá! Gostaria de fazer um pedido.",
    },
  });

  await prisma.siteContent.create({
    data: {
      companyId: company.id,
      heroTitle: "Um pedacinho de felicidade em cada colherada.",
      heroSubtitle:
        "Pudins artesanais preparados com carinho, qualidade e aquele sabor que dá vontade de repetir.",
      aboutTitle: "Feito com carinho, pensado para você.",
      aboutText:
        "A Pudins da Ana nasceu da vontade de transformar um doce clássico em uma experiência. Trabalhamos com receitas artesanais, ingredientes escolhidos a dedo e um acabamento que faz o produto parecer — e ser — especial. Do tradicional ao sabor da estação, cada unidade é feita para encantar no primeiro olhar e no último gole.",
      productsTitle: "Nossos Pudins",
      productsSubtitle: "Clássicos cremosos, paletas especiais e gelatos artesanais.",
      differentiatorsTitle: "Por que escolher nossos pudins?",
      testimonialsTitle: "Quem prova, recomenda",
      instagramTitle: "Siga a gente no Instagram",
      galleryTitle: "Um pouco do nosso universo",
      contactTitle: "Vamos adoçar o seu dia?",
    },
  });

  await prisma.differentiator.createMany({
    data: [
      { companyId: company.id, title: "Produção artesanal", description: "Pequenos lotes, receitas cuidadas e textura cremosa em cada unidade.", icon: "HandHeart", sortOrder: 1 },
      { companyId: company.id, title: "Ingredientes selecionados", description: "Leite, chocolate, frutas e essências escolhidos pelo sabor — não pelo atalho.", icon: "Leaf", sortOrder: 2 },
      { companyId: company.id, title: "Feitos com carinho", description: "O mesmo cuidado de uma confeitaria de família, do preparo à entrega.", icon: "Heart", sortOrder: 3 },
      { companyId: company.id, title: "Sabores irresistíveis", description: "Do clássico de caramelo às edições especiais que a gente ama criar.", icon: "Sparkles", sortOrder: 4 },
      { companyId: company.id, title: "Atendimento personalizado", description: "Peça pelo WhatsApp e receba orientação de verdade, sem pressa e sem robotização.", icon: "MessageCircle", sortOrder: 5 },
    ],
  });

  const [trad, choc, esp, fru, edi] = await Promise.all([
    prisma.category.create({ data: { companyId: company.id, name: "Tradicionais", slug: "tradicionais", description: "Os clássicos de sempre.", sortOrder: 1 } }),
    prisma.category.create({ data: { companyId: company.id, name: "Chocolates", slug: "chocolates", description: "Para quem não resiste.", sortOrder: 2 } }),
    prisma.category.create({ data: { companyId: company.id, name: "Especiais", slug: "especiais", description: "Receitas autorais.", sortOrder: 3 } }),
    prisma.category.create({ data: { companyId: company.id, name: "Frutas", slug: "frutas", description: "Frescor na medida.", sortOrder: 4 } }),
    prisma.category.create({ data: { companyId: company.id, name: "Edições especiais", slug: "edicoes-especiais", description: "Lançamentos e edições limitadas.", sortOrder: 5 } }),
  ]);

  const productsData = [
    { name: "Pudim Tradicional", description: "Nosso clássico, cremoso e irresistível.", price: 8, categoryId: trad.id, imageUrl: img("icedim.png"), stock: 80, isFeatured: true },
    { name: "Pudim de Chocolate", description: "Cacau intenso, textura aveludada e um toque de biscoito.", price: 9, categoryId: choc.id, imageUrl: img("chocolate-biscoito.png"), stock: 60, isFeatured: true },
    { name: "Pudim de Leite Ninho", description: "Doce de leite em pó no ponto certo, leve e cremoso.", price: 9.5, promotionalPrice: 8.5, categoryId: trad.id, imageUrl: img("nozes.png"), stock: 45, isFeatured: true },
    { name: "Pudim de Coco", description: "Coco fresco, cobertura branca e um sabor que lembra infância.", price: 9, categoryId: trad.id, imageUrl: img("caju-goiabada.png"), stock: 40 },
    { name: "Pudim de Morango", description: "Chocolate branco e morango em pedaços. Leve, bonito e viciante.", price: 10, categoryId: fru.id, imageUrl: img("morango.png"), stock: 50, isFeatured: true },
    { name: "Paleta Ferrero Gold", description: "Chocolate, avelã e folha dourada. Uma edição para ocasiões especiais.", price: 16, categoryId: edi.id, imageUrl: img("ferrero-gold.png"), stock: 20, isFeatured: true },
    { name: "Gelato de Maracujá", description: "Cremoso, cítrico e feito com polpa selecionada.", price: 14, categoryId: fru.id, imageUrl: img("maracuja.png"), stock: 30 },
    { name: "Paleta Lotus", description: "Biscoito caramelizado e recheio cremoso. Irresistível do primeiro ao último mordisco.", price: 12, categoryId: esp.id, imageUrl: img("lotus.png"), stock: 35, isFeatured: true },
    { name: "Gelato de Frutas Secas", description: "Creme suave com pedaços de frutas e um toque artesanal.", price: 14, categoryId: fru.id, imageUrl: img("frutas-secas.png"), stock: 22 },
    { name: "Paleta Donut de Chocolate", description: "Formato donut, cobertura de chocolate e crocante por cima.", price: 13, categoryId: choc.id, imageUrl: img("donut.png"), stock: 18 },
    { name: "Paleta Frutas Vermelhas", description: "Morango, blueberry e calda vermelha em uma paleta de festa.", price: 12, categoryId: fru.id, imageUrl: img("frutas-vermelhas.png"), stock: 28 },
    { name: "Paleta Avelã", description: "Chocolate profundo com crocante de avelã e amêndoas.", price: 13, categoryId: choc.id, imageUrl: img("avela.png"), stock: 26 },
    { name: "Paleta Caramelo Salgado", description: "Caramelo, flor de sal e chocolate. Equilíbrio perfeito.", price: 12, promotionalPrice: 10.9, categoryId: esp.id, imageUrl: img("caramelo-salgado.png"), stock: 24 },
  ];

  const products = [];
  for (const item of productsData) {
    products.push(await prisma.product.create({ data: { companyId: company.id, isAvailable: true, ...item } }));
  }

  await prisma.galleryImage.createMany({
    data: [
      { companyId: company.id, imageUrl: img("morango.png"), caption: "Paleta de morango com chocolate branco", isPrimary: true, sortOrder: 1 },
      { companyId: company.id, imageUrl: img("lotus.png"), caption: "Paleta Lotus com calda de caramelo", sortOrder: 2 },
      { companyId: company.id, imageUrl: img("ferrero-gold.png"), caption: "Edição especial com folha dourada", sortOrder: 3 },
      { companyId: company.id, imageUrl: img("maracuja.png"), caption: "Gelato artesanal de maracujá", sortOrder: 4 },
      { companyId: company.id, imageUrl: img("icedim.png"), caption: "Icedim — gelado de pudim cremoso", sortOrder: 5 },
      { companyId: company.id, imageUrl: img("donut.png"), caption: "Paleta donut de chocolate", sortOrder: 6 },
      { companyId: company.id, imageUrl: img("frutas-vermelhas.png"), caption: "Frutas vermelhas em movimento", sortOrder: 7 },
      { companyId: company.id, imageUrl: img("avela.png"), caption: "Chocolate, avelã e amêndoas", sortOrder: 8 },
    ],
  });

  await prisma.testimonial.createMany({
    data: [
      { companyId: company.id, name: "Camila Ferreira", text: "O pudim tradicional é o melhor que já comi. Cremoso, no ponto, e a apresentação é linda.", rating: 5 },
      { companyId: company.id, name: "Rafael Mendes", text: "Pedi a paleta Lotus para um aniversário. Todo mundo perguntou de onde era.", rating: 5 },
      { companyId: company.id, name: "Juliana Costa", text: "Atendimento rápido no WhatsApp e o gelato de maracujá é viciante.", rating: 5 },
      { companyId: company.id, name: "Bruno Almeida", text: "A edição Ferrero Gold vale cada centavo. Parece presente.", rating: 4 },
    ],
  });

  const customers = await Promise.all(
    [
      { name: "Mariana Souza", phone: "11991001122", email: "mariana@email.com", address: "Rua das Flores, 120" },
      { name: "Pedro Henrique", phone: "11992002233", email: "pedro@email.com", address: "Av. Paulista, 900" },
      { name: "Luciana Martins", phone: "11993003344", email: "luciana@email.com", address: "Rua Augusta, 45" },
      { name: "Thiago Nunes", phone: "11994004455", email: "thiago@email.com" },
      { name: "Fernanda Dias", phone: "11995005566", email: "fernanda@email.com", address: "Rua Harmonia, 310" },
      { name: "Carlos Eduardo", phone: "11996006677", email: "carlos@email.com" },
    ].map((c) => prisma.customer.create({ data: { companyId: company.id, ...c } })),
  );

  const payments: PaymentMethod[] = ["PIX", "CASH", "CREDIT_CARD", "PIX", "DEBIT_CARD"];
  const statuses: OrderStatus[] = ["DELIVERED", "DELIVERED", "DELIVERED", "READY", "PREPARING", "CONFIRMED", "NEW"];

  let orderNumber = 1;
  const today = new Date();

  for (let day = 40; day >= 0; day--) {
    const ordersToday = day % 5 === 0 ? 3 : day % 3 === 0 ? 2 : 1;
    for (let i = 0; i < ordersToday; i++) {
      const createdAt = new Date(today);
      createdAt.setDate(today.getDate() - day);
      createdAt.setHours(10 + (i * 3), 15 + day, 0, 0);

      const customer = customers[(day + i) % customers.length];
      const itemCount = 1 + ((day + i) % 3);
      const chosen = [products[(day + i) % products.length], products[(day + i + 3) % products.length], products[(day + i + 5) % products.length]].slice(0, itemCount);

      const items = chosen.map((product, idx) => {
        const quantity = 1 + ((day + idx) % 3);
        const unitPrice = Number(product.promotionalPrice ?? product.price);
        return { productId: product.id, quantity, unitPrice, total: unitPrice * quantity };
      });
      const total = items.reduce((s, it) => s + it.total, 0);
      const status = day === 0 ? statuses[i % 3 + 4] : day < 2 ? "READY" : "DELIVERED";

      const order = await prisma.order.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          number: orderNumber++,
          status,
          paymentMethod: payments[(day + i) % payments.length],
          subtotal: total,
          total,
          createdAt,
          items: { create: items },
        },
      });

      if (status !== "CANCELLED") {
        await prisma.financialTransaction.create({
          data: {
            companyId: company.id,
            type: "INCOME",
            category: "Vendas",
            description: `Pedido #${String(order.number).padStart(4, "0")}`,
            amount: total,
            date: createdAt,
            orderId: order.id,
          },
        });
      }
    }
  }

  const expenses = [
    { category: "Ingredientes", description: "Leite, ovos e chocolate", amount: 620 },
    { category: "Embalagens", description: "Copos, palitos e caixas", amount: 210 },
    { category: "Marketing", description: "Anúncios Instagram", amount: 180 },
    { category: "Aluguel", description: "Aluguel do ateliê", amount: 1400 },
    { category: "Energia", description: "Conta de energia", amount: 320 },
    { category: "Internet", description: "Internet e maquininha", amount: 129 },
    { category: "Transporte", description: "Entregas da semana", amount: 240 },
    { category: "Funcionários", description: "Ajuda na produção", amount: 900 },
  ];

  for (let m = 0; m < 2; m++) {
    for (const expense of expenses) {
      const date = new Date(today.getFullYear(), today.getMonth() - m, 8 + m);
      await prisma.financialTransaction.create({
        data: {
          companyId: company.id,
          type: "EXPENSE",
          ...expense,
          date,
        },
      });
    }
  }

  console.log("Seed concluído.");
  console.log("Master: admin@sistema.com / 123456");
  console.log("Empresa: ana@pudins.com / 123456");
  console.log("Site: /pudins-da-ana");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
