const OPUDIM_DEFAULT_DATA = {
  version: 1,
  settings: {
    name: "O! Pudim",
    tagline: "Um pedacinho de felicidade em cada colherada",
    logo: "products/logo.png",
    banner: "products/protein.png",
    sobreImage: "products/lotus.png",
    whatsapp: "553791194019",
    instagram: "https://www.instagram.com/opudimgold",
    instagramUser: "@opudimgold",
    facebook: "",
    email: "ana@pudins.com",
    address: "Lagoa da Prata — MG",
    hours: "Segunda a sábado, das 9h às 18h",
    heroBadge: "Pudins artesanais · Lagoa da Prata — MG",
    sobreText1: "A O! Pudim nasceu em Lagoa da Prata — MG da vontade de transformar um doce clássico em uma experiência. Trabalhamos com receitas artesanais, ingredientes escolhidos a dedo e um acabamento que faz o produto parecer — e ser — especial.",
    sobreText2: "Do tradicional ao sabor da estação, cada unidade é feita para encantar no primeiro olhar e no último gole.",
    whatsappMessage: "Olá! Gostaria de fazer um pedido.",
    hidePrices: true
  },
  auth: {
    email: "ana@pudins.com",
    password: "pudim123"
  },
  categories: [
    { id: "cat-copo", name: "Copos", slug: "copos" },
    { id: "cat-trad", name: "Tradicionais", slug: "tradicionais" },
    { id: "cat-choc", name: "Chocolates", slug: "chocolates" },
    { id: "cat-esp", name: "Especiais", slug: "especiais" },
    { id: "cat-fru", name: "Frutas", slug: "frutas" },
    { id: "cat-edi", name: "Edições especiais", slug: "edicoes-especiais" }
  ],
  products: [
    { id: "p-joao", name: "Que Ele cresça", description: "Copo especial com a mensagem de João 3:30. Cremoso, com calda de caramelo e tampa dourada.", price: 12, categoryId: "cat-copo", image: "products/joao-330.png", featured: true, slug: "que-ele-cresca", bestSeller: true, active: true },
    { id: "p-trem", name: "Uai, que trem bão!", description: "Edição mineira, no copo, com calda de caramelo. Sabor da casa com sotaque de Minas.", price: 12, categoryId: "cat-copo", image: "products/trem-bao.png", featured: true, slug: "uai-que-trem-bao", bestSeller: true, active: true },
    { id: "p-protein", name: "O! Pudim Protein", description: "Zero adição de açúcares, 19g de proteína e whey. Rico em proteínas e cálcio.", price: 14, categoryId: "cat-copo", image: "products/protein.png", featured: true, slug: "pudim-protein", bestSeller: true, active: true },
    { id: "p-trad", name: "Pudim Tradicional", description: "Nosso clássico, cremoso e irresistível.", price: 8, categoryId: "cat-trad", image: "products/icedim.png", featured: true, slug: "pudim-tradicional", bestSeller: true, active: true },
    { id: "p-choc", name: "Pudim de Chocolate", description: "Cacau intenso, textura aveludada e um toque de biscoito.", price: 9, categoryId: "cat-choc", image: "products/chocolate-biscoito.png", featured: true, slug: "pudim-chocolate", bestSeller: true, active: true },
    { id: "p-ninho", name: "Pudim de Leite Ninho", description: "Doce de leite em pó no ponto certo, leve e cremoso.", price: 9.5, promoActive: true, promoPrice: 8.5, categoryId: "cat-trad", image: "products/nozes.png", featured: true, slug: "pudim-leite-ninho", bestSeller: true, active: true },
    { id: "p-coco", name: "Pudim de Coco", description: "Coco fresco, cobertura branca e um sabor que lembra infância.", price: 9, categoryId: "cat-trad", image: "products/caju-goiabada.png", featured: false, slug: "pudim-coco", active: true },
    { id: "p-morango", name: "Pudim de Morango", description: "Chocolate branco e morango em pedaços. Leve, bonito e viciante.", price: 10, categoryId: "cat-fru", image: "products/morango.png", featured: true, slug: "pudim-morango", bestSeller: true, active: true },
    { id: "p-ferrero", name: "Paleta Ferrero Gold", description: "Chocolate, avelã e folha dourada. Uma edição para ocasiões especiais.", price: 16, categoryId: "cat-edi", image: "products/ferrero-gold.png", featured: true, slug: "paleta-ferrero-gold", bestSeller: true, active: true },
    { id: "p-maracuja", name: "Gelato de Maracujá", description: "Cremoso, cítrico e feito com polpa selecionada.", price: 14, categoryId: "cat-fru", image: "products/maracuja.png", featured: false, slug: "gelato-maracuja", active: true },
    { id: "p-lotus", name: "Paleta Lotus", description: "Biscoito caramelizado e recheio cremoso. Irresistível do primeiro ao último mordisco.", price: 12, categoryId: "cat-esp", image: "products/lotus.png", featured: true, slug: "paleta-lotus", bestSeller: true, active: true },
    { id: "p-secas", name: "Gelato de Frutas Secas", description: "Creme suave com pedaços de frutas e um toque artesanal.", price: 14, categoryId: "cat-fru", image: "products/frutas-secas.png", featured: false, slug: "gelato-frutas-secas", active: true },
    { id: "p-donut", name: "Paleta Donut de Chocolate", description: "Formato donut, cobertura de chocolate e crocante por cima.", price: 13, categoryId: "cat-choc", image: "products/donut.png", featured: false, slug: "paleta-donut-chocolate", active: true },
    { id: "p-vermelhas", name: "Paleta Frutas Vermelhas", description: "Morango, blueberry e calda vermelha em uma paleta de festa.", price: 12, categoryId: "cat-fru", image: "products/frutas-vermelhas.png", featured: false, slug: "paleta-frutas-vermelhas", active: true },
    { id: "p-avela", name: "Paleta Avelã", description: "Chocolate profundo com crocante de avelã e amêndoas.", price: 13, categoryId: "cat-choc", image: "products/avela.png", featured: false, slug: "paleta-avela", active: true },
    { id: "p-caramelo", name: "Paleta Caramelo Salgado", description: "Caramelo, flor de sal e chocolate. Equilíbrio perfeito.", price: 12, promoActive: true, promoPrice: 10.9, categoryId: "cat-esp", image: "products/caramelo-salgado.png", featured: false, slug: "paleta-caramelo-salgado", active: true }
  ],
  gallery: [
    "products/joao-330.png",
    "products/trem-bao.png",
    "products/protein.png",
    "products/morango.png",
    "products/lotus.png",
    "products/ferrero-gold.png",
    "products/maracuja.png",
    "products/icedim.png",
    "products/donut.png",
    "products/frutas-vermelhas.png",
    "products/avela.png"
  ],
  reviews: [
    { id: "r1", author: "Camila Ferreira", text: "O pudim tradicional é o melhor que já comi. Cremoso, no ponto, e a apresentação é linda.", rating: 5 },
    { id: "r2", author: "Rafael Mendes", text: "Pedi a paleta Lotus para um aniversário. Todo mundo perguntou de onde era.", rating: 5 },
    { id: "r3", author: "Juliana Costa", text: "Atendimento rápido no WhatsApp e o gelato de maracujá é viciante.", rating: 5 },
    { id: "r4", author: "Bruno Almeida", text: "A edição Ferrero Gold vale cada centavo. Parece presente.", rating: 4 }
  ],
  clients: [],
  orders: [],
  finance: []
};
