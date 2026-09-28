import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { hashPassword } from "../utils/password";
import { slugify } from "../utils/slug";
import { Prisma } from "@prisma/client";

const DEFAULT_CATEGORIES = [
  { name: "Tradicionais", slug: "tradicionais", description: "Os clássicos de sempre." },
  { name: "Chocolates", slug: "chocolates", description: "Para quem não resiste ao chocolate." },
  { name: "Especiais", slug: "especiais", description: "Receitas autorais e combinações exclusivas." },
  { name: "Frutas", slug: "frutas", description: "Frescor e doçura na medida certa." },
  { name: "Edições especiais", slug: "edicoes-especiais", description: "Lançamentos e edições limitadas." },
];

const DEFAULT_DIFFS = [
  { title: "Produção artesanal", description: "Cada receita é feita em pequenos lotes, com atenção a cada detalhe.", icon: "HandHeart", sortOrder: 1 },
  { title: "Ingredientes selecionados", description: "Leite, ovos e essências escolhidos com rigor para um sabor memorável.", icon: "Leaf", sortOrder: 2 },
  { title: "Feitos com carinho", description: "O mesmo cuidado de uma confeitaria de família, em cada copinho.", icon: "Heart", sortOrder: 3 },
  { title: "Sabores irresistíveis", description: "Do clássico ao especial, sempre com textura cremosa e acabamento bonito.", icon: "Sparkles", sortOrder: 4 },
  { title: "Atendimento personalizado", description: "Pedidos pelo WhatsApp, com carinho e agilidade no que você precisa.", icon: "MessageCircle", sortOrder: 5 },
];

export type CreateCompanyInput = {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  slug?: string;
  logoUrl?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export const companyService = {
  async assertUniqueSlug(slug: string, ignoreId?: string) {
    const existing = await prisma.company.findUnique({ where: { slug } });
    if (existing && existing.id !== ignoreId) {
      throw new AppError("Este slug já está em uso. Escolha outro endereço.", 409);
    }
  },

  async createWithDefaults(input: CreateCompanyInput) {
    const slug = slugify(input.slug || input.name);
    if (!slug) throw new AppError("Informe um nome ou slug válido.", 400);
    await this.assertUniqueSlug(slug);

    const email = input.email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError("Já existe um usuário com este e-mail.", 409);

    const passwordHash = await hashPassword(input.password);

    return prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.name,
          slug,
          ownerName: input.ownerName,
          email,
          phone: input.phone,
          logoUrl: input.logoUrl,
          status: input.status ?? "ACTIVE",
        },
      });

      await tx.companySettings.create({
        data: {
          companyId: company.id,
          description: "Pudins artesanais preparados com carinho, qualidade e aquele sabor que dá vontade de repetir.",
          whatsapp: input.phone.replace(/\D/g, ""),
          phone: input.phone,
          instagram: "",
          address: "",
          businessHours: "Segunda a sábado, das 9h às 18h",
        },
      });

      await tx.siteContent.create({ data: { companyId: company.id } });

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((c, index) => ({
          ...c,
          companyId: company.id,
          sortOrder: index + 1,
        })),
      });

      await tx.differentiator.createMany({
        data: DEFAULT_DIFFS.map((item) => ({ ...item, companyId: company.id })),
      });

      await tx.user.create({
        data: {
          email,
          passwordHash,
          name: input.ownerName,
          role: "ADMIN",
          phone: input.phone,
          companyId: company.id,
        },
      });

      return company;
    });
  },

  async update(id: string, data: Prisma.CompanyUpdateInput) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new AppError("Empresa não encontrada.", 404);
    if (typeof data.slug === "string") {
      await this.assertUniqueSlug(slugify(data.slug), id);
      data.slug = slugify(data.slug);
    }
    return prisma.company.update({ where: { id }, data });
  },
};
