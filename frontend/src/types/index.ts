export type UserRole = "MASTER" | "ADMIN" | "EMPLOYEE";
export type CompanyStatus = "ACTIVE" | "INACTIVE";
export type OrderStatus = "NEW" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "CASH" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "OTHER";
export type TransactionType = "INCOME" | "EXPENSE";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  realRole?: UserRole;
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
  logoUrl: string | null;
  impersonating?: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number | null;
  imageUrl?: string | null;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  categoryId: string;
  category?: Category;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  ordersCount?: number;
  totalSpent?: number;
  lastOrderAt?: string | null;
  orders?: Order[];
};

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: Product;
};

export type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  subtotal: number;
  total: number;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
};

export type Transaction = {
  id: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string | null;
};

export type CompanySettings = {
  description: string;
  whatsapp: string;
  instagram: string;
  phone: string;
  address: string;
  businessHours: string;
  colorBackground: string;
  colorPrimary: string;
  colorSecondary: string;
  colorCream: string;
  colorText: string;
  bannerUrl?: string | null;
  whatsappMessage: string;
};

export type SiteContent = {
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  productsTitle: string;
  productsSubtitle: string;
  differentiatorsTitle: string;
  testimonialsTitle: string;
  instagramTitle: string;
  galleryTitle: string;
  contactTitle: string;
};

export type Differentiator = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

export type GalleryImage = {
  id: string;
  imageUrl: string;
  caption?: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type Testimonial = {
  id: string;
  name: string;
  photoUrl?: string | null;
  text: string;
  rating: number;
  isActive: boolean;
};

export type PublicSite = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  settings: CompanySettings;
  siteContent: SiteContent;
  categories: Category[];
  products: Product[];
  gallery: GalleryImage[];
  testimonials: Testimonial[];
  differentiators: Differentiator[];
};

export type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  email: string;
  phone: string;
  status: CompanyStatus;
  createdAt: string;
  logoUrl?: string | null;
  _count: { products: number; orders: number; customers: number };
};
