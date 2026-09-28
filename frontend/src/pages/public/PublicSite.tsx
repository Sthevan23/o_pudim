import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock3,
  HandHeart,
  Heart,
  Instagram,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { api } from "../../services/api";
import { instagramUrl, mediaUrl, whatsappLink } from "../../utils/format";
import type { Product, PublicSite } from "../../types";

const ICONS: Record<string, typeof Heart> = { Heart, HandHeart, Leaf, Sparkles, MessageCircle };

function applyTheme(site: PublicSite) {
  const s = site.settings;
  const root = document.documentElement;
  root.style.setProperty("--c-bg", s.colorBackground);
  root.style.setProperty("--c-primary", s.colorPrimary);
  root.style.setProperty("--c-secondary", s.colorSecondary);
  root.style.setProperty("--c-cream", s.colorCream);
  root.style.setProperty("--c-text", s.colorText);
  document.title = `Pudins artesanais | ${site.name}`;
  const setMeta = (attr: string, key: string, value: string) => {
    let tag = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", value);
  };
  setMeta("name", "description", s.description || site.siteContent.heroSubtitle);
  setMeta("property", "og:title", `Pudins artesanais | ${site.name}`);
  setMeta("property", "og:description", s.description || site.siteContent.heroSubtitle);
  setMeta("property", "og:type", "website");
  if (s.bannerUrl) setMeta("property", "og:image", mediaUrl(s.bannerUrl));
}

const fade = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

export function PublicSitePage() {
  const { slug } = useParams();
  const [site, setSite] = useState<PublicSite | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("todos");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PublicSite>(`/public/${slug}`)
      .then(({ data }) => {
        setSite(data);
        applyTheme(data);
      })
      .catch(() => setError("Esta vitrine não foi encontrada."));
  }, [slug]);

  const products = useMemo(() => {
    if (!site) return [];
    if (category === "todos") return site.products;
    return site.products.filter((p) => p.categoryId === category);
  }, [site, category]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff9f5] px-6 text-center">
        <div>
          <p className="font-serif text-4xl">Página não encontrada</p>
          <p className="mt-3 text-stone-500">{error}</p>
          <Link to="/" className="btn-outline mt-6">Voltar</Link>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff9f5]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
      </div>
    );
  }

  const wa = site.settings.whatsapp;
  const heroImg = site.settings.bannerUrl || site.products.find((p) => p.isFeatured)?.imageUrl || site.products[0]?.imageUrl;
  const orderProduct = (product: Product) => {
    const text = `Olá! Gostaria de pedir o ${product.name}.`;
    window.open(whatsappLink(wa, text), "_blank");
  };

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--c-primary)]/10 bg-[var(--c-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#topo" className="flex items-center gap-3">
            {site.logoUrl ? <img src={mediaUrl(site.logoUrl)} alt={site.name} className="h-10 w-10 rounded-full object-cover" /> : null}
            <span className="font-serif text-2xl tracking-wide">{site.name}</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            {["Sobre", "Sabores", "Galeria", "Contato"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-stone-600 transition hover:text-[var(--c-primary)]">
                {item}
              </a>
            ))}
            <a href={whatsappLink(wa, site.settings.whatsappMessage)} target="_blank" className="btn-primary text-xs">
              Peça pelo WhatsApp
            </a>
          </nav>
          <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open ? (
          <div className="space-y-3 px-5 pb-5 md:hidden">
            {["Sobre", "Sabores", "Galeria", "Contato"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setOpen(false)} className="block py-1">
                {item}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <main id="topo">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-28 md:grid-cols-2 md:pt-32">
          <motion.div initial="hidden" animate="show" variants={fade}>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--c-secondary)]">Receitas artesanais</p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] md:text-6xl">{site.siteContent.heroTitle}</h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-stone-600">{site.siteContent.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#sabores" className="btn-primary">Conheça nossos sabores</a>
              <a href={whatsappLink(wa, site.settings.whatsappMessage)} target="_blank" className="btn-outline">
                Peça pelo WhatsApp
              </a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }} className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-[var(--c-cream)]/70 blur-2xl" />
            <img src={mediaUrl(heroImg)} alt={site.name} className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-soft" />
          </motion.div>
        </section>

        <section id="sobre" className="bg-[var(--c-cream)]/50 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
            <motion.img
              src={mediaUrl(site.gallery[0]?.imageUrl || heroImg)}
              alt="Produção artesanal"
              className="h-[520px] w-full rounded-[2rem] object-cover shadow-card"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={fade}
            />
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--c-secondary)]">A casa</p>
              <h2 className="mt-3 font-serif text-4xl md:text-5xl">{site.siteContent.aboutTitle}</h2>
              <p className="mt-6 text-lg leading-relaxed text-stone-600">{site.siteContent.aboutText}</p>
              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                {["Qualidade", "Ingredientes selecionados", "Produção artesanal", "Sabor", "Atendimento"].map((item) => (
                  <div key={item} className="rounded-2xl bg-[var(--c-bg)] px-4 py-3 shadow-card">{item}</div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section id="sabores" className="mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--c-secondary)]">Cardápio</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">{site.siteContent.productsTitle}</h2>
            <p className="mt-4 text-stone-600">{site.siteContent.productsSubtitle}</p>
          </div>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => setCategory("todos")} className={`rounded-full px-4 py-1.5 text-sm ${category === "todos" ? "bg-[var(--c-primary)] text-white" : "bg-white"}`}>
              Todos
            </button>
            {site.categories.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${category === c.id ? "bg-[var(--c-primary)] text-white" : "bg-white"}`}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {products.map((product, index) => (
                <motion.article
                  key={product.id}
                  className="group overflow-hidden rounded-[1.6rem] bg-white shadow-card"
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fade}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="overflow-hidden">
                    <img src={mediaUrl(product.imageUrl)} alt={product.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="space-y-2 p-4 md:p-5">
                    <p className="text-[11px] uppercase tracking-wider text-[var(--c-secondary)]">{product.category?.name}</p>
                    <h3 className="font-serif text-xl md:text-2xl">{product.name}</h3>
                    <p className="line-clamp-2 text-sm text-stone-500">{product.description}</p>
                    <div className="pt-2">
                      <button onClick={() => orderProduct(product)} className="rounded-full bg-[var(--c-primary)] px-3 py-1.5 text-xs text-white transition hover:scale-105">
                        Quero esse
                      </button>
                    </div>
                  </div>
                </motion.article>
            ))}
          </div>
        </section>

        <section className="bg-[var(--c-cream)]/40 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="max-w-xl font-serif text-4xl md:text-5xl">{site.siteContent.differentiatorsTitle}</h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {site.differentiators.map((item) => {
                const Icon = ICONS[item.icon] ?? Heart;
                return (
                  <motion.article key={item.id} className="rounded-[1.6rem] bg-[var(--c-bg)] p-6 shadow-card" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
                    <Icon className="h-6 w-6 text-[var(--c-secondary)]" />
                    <h3 className="mt-4 font-serif text-2xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="galeria" className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="font-serif text-4xl md:text-5xl">{site.siteContent.galleryTitle}</h2>
          <div className="mt-10 columns-2 gap-4 md:columns-3">
            {site.gallery.map((image) => (
              <button key={image.id} className="mb-4 block w-full overflow-hidden rounded-2xl" onClick={() => setLightbox(image.imageUrl)}>
                <img src={mediaUrl(image.imageUrl)} alt={image.caption ?? site.name} loading="lazy" className="w-full object-cover transition duration-500 hover:scale-[1.03]" />
              </button>
            ))}
          </div>
        </section>

        <section className="bg-[var(--c-primary)] py-24 text-[var(--c-bg)]">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-serif text-4xl md:text-5xl">{site.siteContent.testimonialsTitle}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {site.testimonials.map((item) => (
                <article key={item.id} className="rounded-[1.6rem] bg-white/10 p-6">
                  <div className="flex gap-1 text-[var(--c-secondary)]">
                    {Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="mt-4 font-serif text-2xl leading-snug">“{item.text}”</p>
                  <p className="mt-4 text-sm opacity-80">{item.name}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24 text-center">
          <h2 className="font-serif text-4xl md:text-5xl">{site.siteContent.instagramTitle}</h2>
          <p className="mt-4 text-stone-600">Novidades, bastidores e sabores da semana.</p>
          <a href={instagramUrl(site.settings.instagram)} target="_blank" className="btn-primary mt-8">
            <Instagram className="h-4 w-4" /> @{site.settings.instagram || "instagram"}
          </a>
        </section>

        <section id="contato" className="bg-[var(--c-cream)]/60 py-24">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="font-serif text-4xl md:text-5xl">{site.siteContent.contactTitle}</h2>
            <div className="mt-8 space-y-2 text-stone-600">
              {site.settings.address ? <p className="flex items-center justify-center gap-2"><MapPin className="h-4 w-4" /> {site.settings.address}</p> : null}
              {site.settings.phone ? <p className="flex items-center justify-center gap-2"><Phone className="h-4 w-4" /> {site.settings.phone}</p> : null}
              {site.settings.businessHours ? <p className="flex items-center justify-center gap-2"><Clock3 className="h-4 w-4" /> {site.settings.businessHours}</p> : null}
            </div>
            <a href={whatsappLink(wa, site.settings.whatsappMessage)} target="_blank" className="btn-primary mt-8">
              Fazer pedido pelo WhatsApp
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--c-primary)]/10 px-5 py-8 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} {site.name}. Feito com carinho.
      </footer>

      <a
        href={whatsappLink(wa, site.settings.whatsappMessage)}
        target="_blank"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft"
        aria-label="WhatsApp"
      >
        <MessageCircle />
      </a>

      <AnimatePresence>
        {lightbox ? (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)}>
            <img src={mediaUrl(lightbox)} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
