"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Zap, Calculator, LayoutDashboard, Users, DollarSign,
  Package, MessageCircle, Globe, Bell, CreditCard,
  ArrowRight, Check, ChevronRight, Star, Clock,
  TrendingUp, Shield, Smartphone,
} from "lucide-react";

// ─── Animação por scroll ──────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── Dados ───────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: "orcamentos",
    icon: Calculator,
    label: "Orçamentos",
    headline: "Calcule o preço certo. Sem achismo.",
    description: "A calculadora leva em conta custo do filamento, energia elétrica, desgaste da impressora e margem de lucro. Gere múltiplas opções (básico, com pintura, premium) e envie um link para o cliente aprovar online.",
    bullets: ["Custo real por impressão", "Múltiplas versões no mesmo orçamento", "Link público com validade configurável", "Rastreia visualizações do cliente"],
    mockup: <QuoteMockup />,
  },
  {
    id: "kanban",
    icon: LayoutDashboard,
    label: "Produção",
    headline: "Do pedido à entrega, tudo no painel.",
    description: "Kanban visual com 7 colunas: da fila de espera até a entrega. Mova peças entre etapas com drag-and-drop, adicione notas e prazos. Criado automaticamente quando o cliente aprova.",
    bullets: ["7 colunas de status", "Criado ao aprovar o orçamento", "Notas e prazos por card", "Visão geral da produção em tempo real"],
    mockup: <KanbanMockup />,
  },
  {
    id: "clientes",
    icon: Users,
    label: "Clientes",
    headline: "Histórico completo de cada cliente.",
    description: "CRM simples e eficiente. Veja todos os pedidos de um cliente, adicione tags, anote observações e acompanhe o WhatsApp. Crie clientes direto na tela de orçamento, sem precisar sair.",
    bullets: ["Histórico de pedidos por cliente", "Tags personalizadas", "Criar cliente durante o orçamento", "NPS automático pós-entrega"],
    mockup: <ClientMockup />,
  },
  {
    id: "financeiro",
    icon: DollarSign,
    label: "Financeiro",
    headline: "Saiba quanto você está ganhando de verdade.",
    description: "Registre receitas e despesas, categorize seus gastos e veja o lucro líquido do mês. Sem planilhas, sem contas de cabeça.",
    bullets: ["Receitas e despesas categorizadas", "Lucro líquido por venda", "Visão mensal", "Registro rápido de venda"],
    mockup: <FinanceMockup />,
  },
  {
    id: "estoque",
    icon: Package,
    label: "Estoque",
    headline: "Nunca fique sem filamento em produção.",
    description: "Controle o saldo de cada rolo em gramas. O sistema deduz automaticamente ao concluir uma impressão e avisa quando o estoque está abaixo do mínimo que você configurar.",
    bullets: ["Saldo em gramas por rolo", "Alerta de estoque baixo", "Dedução automática", "Custo por kg vinculado ao orçamento"],
    mockup: <StockMockup />,
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    headline: "Automatize o follow-up sem esforço.",
    description: "Conecte seu WhatsApp por QR Code e ative lembretes automáticos: orçamento prestes a expirar, follow-up 7 dias após entrega e resposta fora do horário. Tudo configurável.",
    bullets: ["Lembrete de orçamento expirando", "Follow-up automático pós-entrega", "Resposta fora do horário", "Horário silencioso configurável"],
    mockup: <WhatsAppMockup />,
  },
];

const STEPS = [
  { n: "01", title: "Crie o orçamento", desc: "Informe os dados da peça, escolha o filamento e a impressora. O sistema calcula o custo real e a margem automaticamente.", icon: Calculator },
  { n: "02", title: "Cliente aprova online", desc: "Envie um link público. O cliente vê o orçamento, escolhe a versão que preferir e aprova com um clique — sem criar conta.", icon: Globe },
  { n: "03", title: "Produza e entregue", desc: "O kanban é criado automaticamente. Mova o card pelas etapas da produção e o sistema atualiza o status do pedido em tempo real.", icon: LayoutDashboard },
];

const PROOF = [
  { label: "Orçamentos em segundos", value: "< 60s" },
  { label: "Sem planilhas", value: "100%" },
  { label: "Aprovação online", value: "1 link" },
  { label: "Suporte via WhatsApp", value: "Incluso" },
];

// ─── Mockups de feature ───────────────────────────────────────────────────────
function QuoteMockup() {
  return (
    <div style={{ background: "#111113", borderRadius: 12, border: "1px solid #27272A", padding: "16px", fontSize: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: "#FAFAFA", fontWeight: 600 }}>Escultura Dragão — 340g</span>
        <span style={{ background: "#22C55E20", color: "#22C55E", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>APROVADO</span>
      </div>
      {[
        { label: "Filamento (340g × R$85/kg)", val: "R$ 28,90" },
        { label: "Energia elétrica (18h)", val: "R$ 2,43" },
        { label: "Desgaste da impressora", val: "R$ 7,20" },
      ].map((r) => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #27272A", color: "#A1A1AA" }}>
          <span>{r.label}</span><span>{r.val}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 8 }}>
        <span style={{ color: "#A1A1AA" }}>Margem (40%)</span>
        <span style={{ color: "#F97316", fontWeight: 600 }}>R$ 15,41</span>
      </div>
      <div style={{ background: "#F97316", borderRadius: 8, padding: "10px 14px", marginTop: 12, textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>
        Total: R$ 54,00
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
        {["Básico", "Com pintura", "Premium"].map((v, i) => (
          <span key={v} style={{ flex: 1, textAlign: "center", borderRadius: 6, border: i === 0 ? "1px solid #F97316" : "1px solid #27272A", color: i === 0 ? "#F97316" : "#A1A1AA", padding: "4px 0", fontSize: 11 }}>{v}</span>
        ))}
      </div>
    </div>
  );
}

function KanbanMockup() {
  const cols = [
    { label: "Fila", color: "#EAB308", cards: ["Copo Stan Lee", "Vaso Geométrico"] },
    { label: "Imprimindo", color: "#F97316", cards: ["Dragão G."] },
    { label: "Pronto", color: "#22C55E", cards: ["Chaveiro R2D2"] },
  ];
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
      {cols.map((c) => (
        <div key={c.label} style={{ flex: 1, background: "#111113", border: "1px solid #27272A", borderRadius: 8, padding: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, display: "inline-block" }} />
            <span style={{ color: "#A1A1AA", fontWeight: 600 }}>{c.label}</span>
          </div>
          {c.cards.map((card) => (
            <div key={card} style={{ background: "#18181B", border: "1px solid #27272A", borderRadius: 6, padding: "6px 8px", color: "#FAFAFA", marginBottom: 5 }}>{card}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ClientMockup() {
  const clients = [
    { name: "Marcos Oliveira", tag: "Frequente", orders: 8 },
    { name: "Ana Souza", tag: "VIP", orders: 14 },
    { name: "Pedro Lima", tag: "Novo", orders: 1 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
      {clients.map((c) => (
        <div key={c.name} style={{ background: "#111113", border: "1px solid #27272A", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F9731620", display: "flex", alignItems: "center", justifyContent: "center", color: "#F97316", fontWeight: 700, fontSize: 12 }}>
              {c.name[0]}
            </div>
            <div>
              <div style={{ color: "#FAFAFA", fontWeight: 500 }}>{c.name}</div>
              <div style={{ color: "#A1A1AA", fontSize: 10 }}>{c.orders} pedidos</div>
            </div>
          </div>
          <span style={{ background: "#F9731615", color: "#F97316", borderRadius: 20, padding: "2px 8px", fontSize: 10 }}>{c.tag}</span>
        </div>
      ))}
    </div>
  );
}

function FinanceMockup() {
  const months = ["Mar", "Abr", "Mai", "Jun"];
  const vals = [60, 80, 55, 95];
  return (
    <div style={{ fontSize: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ background: "#22C55E15", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ color: "#22C55E", fontWeight: 700, fontSize: 16 }}>R$ 3.840</div>
          <div style={{ color: "#A1A1AA", fontSize: 10 }}>Receitas</div>
        </div>
        <div style={{ background: "#EF444415", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ color: "#EF4444", fontWeight: 700, fontSize: 16 }}>R$ 620</div>
          <div style={{ color: "#A1A1AA", fontSize: 10 }}>Despesas</div>
        </div>
        <div style={{ background: "#F9731615", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ color: "#F97316", fontWeight: 700, fontSize: 16 }}>R$ 3.220</div>
          <div style={{ color: "#A1A1AA", fontSize: 10 }}>Lucro</div>
        </div>
      </div>
      <div style={{ background: "#111113", border: "1px solid #27272A", borderRadius: 8, padding: "10px", display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 70 }}>
        {months.map((m, i) => (
          <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 28, background: i === 3 ? "#F97316" : "#F9731640", borderRadius: 4, height: vals[i] * 0.5 }} />
            <span style={{ color: "#A1A1AA", fontSize: 10 }}>{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockMockup() {
  const items = [
    { name: "PETG Preto 1kg", grams: 820, max: 1000, color: "#3B82F6" },
    { name: "PLA Branco 1kg", grams: 145, max: 1000, color: "#EF4444" },
    { name: "Resin Clear 500g", grams: 380, max: 500, color: "#22C55E" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
      {items.map((f) => (
        <div key={f.name} style={{ background: "#111113", border: "1px solid #27272A", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#FAFAFA" }}>{f.name}</span>
            <span style={{ color: f.grams < 200 ? "#EF4444" : "#A1A1AA" }}>{f.grams}g</span>
          </div>
          <div style={{ height: 4, background: "#27272A", borderRadius: 2 }}>
            <div style={{ height: 4, background: f.color, borderRadius: 2, width: `${(f.grams / f.max) * 100}%` }} />
          </div>
          {f.grams < 200 && <div style={{ color: "#EF4444", fontSize: 10, marginTop: 4 }}>⚠ Estoque baixo</div>}
        </div>
      ))}
    </div>
  );
}

function WhatsAppMockup() {
  const msgs = [
    { from: "system", text: "🔔 Olá Marcos! Seu orçamento expira em 2 dias. Quer aprovar agora?" },
    { from: "client", text: "Sim, pode aprovar!" },
    { from: "system", text: "✅ Perfeito! Seu pedido foi confirmado. Em breve entraremos em contato." },
  ];
  return (
    <div style={{ background: "#111113", border: "1px solid #27272A", borderRadius: 12, padding: "10px", display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
      <div style={{ color: "#A1A1AA", fontSize: 10, textAlign: "center", marginBottom: 2 }}>Automação ativa</div>
      {msgs.map((m, i) => (
        <div key={i} style={{ display: "flex", justifyContent: m.from === "system" ? "flex-start" : "flex-end" }}>
          <div style={{ maxWidth: "80%", background: m.from === "system" ? "#18181B" : "#F9731620", border: m.from === "system" ? "1px solid #27272A" : "1px solid #F9731640", borderRadius: 8, padding: "6px 10px", color: m.from === "system" ? "#FAFAFA" : "#F97316", lineHeight: 1.4 }}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ActiveIcon = FEATURES[activeFeature].icon;

  return (
    <div style={{ background: "#09090B", color: "#FAFAFA", fontFamily: "var(--font-sans, system-ui)", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px #F9731630} 50%{box-shadow:0 0 40px #F9731660} }
        @keyframes fade-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .hero-title { animation: fade-up 0.8s ease both; }
        .hero-sub { animation: fade-up 0.8s 0.15s ease both; }
        .hero-cta { animation: fade-up 0.8s 0.3s ease both; }
        .hero-badge { animation: fade-up 0.8s 0.05s ease both; }
        .float-card { animation: float 4s ease-in-out infinite; }
        .glow-btn { animation: pulse-glow 2.5s ease-in-out infinite; }
        .feature-tab { transition: all 0.2s; cursor: pointer; }
        .feature-tab:hover { background: #18181B !important; }
        .feature-tab.active { background: #F9731615 !important; border-color: #F9731640 !important; }
        .shimmer-text {
          background: linear-gradient(90deg, #FAFAFA 0%, #F97316 50%, #FAFAFA 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, transition: "all 0.3s", background: scrolled ? "#09090Bdd" : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: scrolled ? "1px solid #27272A" : "1px solid transparent", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #F97316, #EA6C0A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>3D Print Manager</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{ color: "#A1A1AA", textDecoration: "none", fontSize: 14, padding: "6px 12px" }}>
              Entrar
            </Link>
            <Link href="/register" style={{ background: "linear-gradient(135deg, #F97316, #EA6C0A)", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "7px 16px", fontSize: 14, fontWeight: 600 }}>
              Criar conta grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, #F9731615 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F9731615", border: "1px solid #F9731630", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: "#F97316", marginBottom: 24 }}>
          <Zap size={12} />
          Gestão completa para makers de impressão 3D
        </div>

        <h1 className="hero-title" style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 800, lineHeight: 1.1, maxWidth: 820, margin: "0 auto 24px", letterSpacing: "-0.02em" }}>
          Seu estúdio 3D,{" "}
          <span className="shimmer-text">gerenciado com precisão.</span>
        </h1>

        <p className="hero-sub" style={{ fontSize: "clamp(15px, 2.5vw, 19px)", color: "#A1A1AA", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Calcule orçamentos com custo real, envie um link para o cliente aprovar online, controle a produção e o financeiro — tudo sem planilha.
        </p>

        <div className="hero-cta" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/register" className="glow-btn" style={{ background: "linear-gradient(135deg, #F97316, #EA6C0A)", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            Começar grátis
            <ArrowRight size={16} />
          </Link>
          <Link href="/login" style={{ background: "#111113", color: "#FAFAFA", textDecoration: "none", borderRadius: 10, padding: "14px 24px", fontSize: 15, fontWeight: 600, border: "1px solid #27272A", display: "flex", alignItems: "center", gap: 8 }}>
            Já tenho conta
          </Link>
        </div>

        <p style={{ marginTop: 16, color: "#52525B", fontSize: 13 }}>
          Sem cartão de crédito · Sem burocracia · Cancele quando quiser
        </p>

        {/* Social proof numbers */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center", marginTop: 64, paddingTop: 40, borderTop: "1px solid #27272A", width: "100%", maxWidth: 700 }}>
          {PROOF.map((p) => (
            <div key={p.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#F97316" }}>{p.value}</div>
              <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ color: "#F97316", fontSize: 13, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Como funciona</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em" }}>Do orçamento à entrega em 3 passos</h2>
            <p style={{ color: "#A1A1AA", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              O sistema foi desenhado para eliminar trabalho manual. Você cria uma vez, o resto acontece automaticamente.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 2, position: "relative" }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.n} delay={i * 100}>
                <div style={{ background: "#111113", border: "1px solid #27272A", borderRadius: i === 0 ? "12px 0 0 12px" : i === STEPS.length - 1 ? "0 12px 12px 0" : "0", padding: "32px 28px", position: "relative" }}>
                  <div style={{ fontSize: 11, color: "#F97316", fontWeight: 700, marginBottom: 12, letterSpacing: "0.1em" }}>{s.n}</div>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F9731615", border: "1px solid #F9731630", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <Icon size={18} color="#F97316" />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ color: "#A1A1AA", fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <ChevronRight style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", zIndex: 1, color: "#F97316" }} size={20} />
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Features interativas ────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#0D0D0F" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ color: "#F97316", fontSize: 13, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Funcionalidades</div>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em" }}>Tudo que você precisa, integrado</h2>
            </div>
          </Reveal>

          {/* Tabs de navegação */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <button key={f.id} className={`feature-tab${i === activeFeature ? " active" : ""}`} onClick={() => setActiveFeature(i)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, border: "1px solid #27272A", background: "#111113", color: i === activeFeature ? "#F97316" : "#A1A1AA", fontSize: 13, fontWeight: 500 }}>
                  <Icon size={14} />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Conteúdo da feature ativa */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center", background: "#111113", border: "1px solid #27272A", borderRadius: 16, padding: "40px 36px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F9731615", border: "1px solid #F9731630", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ActiveIcon size={20} color="#F97316" />
                </div>
                <span style={{ color: "#F97316", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{FEATURES[activeFeature].label}</span>
              </div>
              <h3 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, marginBottom: 14, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                {FEATURES[activeFeature].headline}
              </h3>
              <p style={{ color: "#A1A1AA", lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>
                {FEATURES[activeFeature].description}
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {FEATURES[activeFeature].bullets.map((b) => (
                  <li key={b} style={{ display: "flex", alignItems: "center", gap: 10, color: "#FAFAFA", fontSize: 14 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#22C55E20", border: "1px solid #22C55E40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={10} color="#22C55E" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="float-card">
              {FEATURES[activeFeature].mockup}
            </div>
          </div>
        </div>
      </section>

      {/* ── Diferenciais ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Feito para quem vive de impressão 3D
            </h2>
            <p style={{ color: "#A1A1AA", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Cada funcionalidade foi pensada para a realidade do maker brasileiro.
            </p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { icon: Globe, title: "Portfólio público", desc: "Página de apresentação do seu estúdio com formulário de captação de leads e depoimentos de clientes." },
            { icon: CreditCard, title: "Pagamento InfinityPay", desc: "Receba a entrada direto no link de aprovação. O cliente paga sem precisar criar conta." },
            { icon: Bell, title: "Central de alertas", desc: "Filamento em falta, orçamentos sem resposta, aprovações recentes — tudo numa central de notificações." },
            { icon: Smartphone, title: "Funciona no celular", desc: "100% responsivo. Acompanhe pedidos, aprove orçamentos e veja o financeiro de onde estiver." },
            { icon: Shield, title: "Dados seus, só seus", desc: "Multi-tenant — cada conta tem seus dados isolados. Nenhum concorrente acessa suas informações." },
            { icon: TrendingUp, title: "Relatório de lucro real", desc: "Veja exatamente quanto você lucrou por venda, descontando todos os custos operacionais." },
          ].map((d, i) => {
            const Icon = d.icon;
            return (
              <Reveal key={d.title} delay={i * 60}>
                <div style={{ background: "#111113", border: "1px solid #27272A", borderRadius: 12, padding: "20px 20px" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: "#F9731615", border: "1px solid #F9731630", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <Icon size={16} color="#F97316" />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{d.title}</h3>
                  <p style={{ color: "#A1A1AA", fontSize: 13, lineHeight: 1.6 }}>{d.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Depoimentos ────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#0D0D0F" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ color: "#F97316", fontSize: 13, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quem usa</div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Makers que pararam de usar planilha
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { name: "Rafael M.", role: "Maker · São Paulo", text: "Antes eu ficava calculando no Excel e sempre errava a margem. Agora o sistema faz tudo e meu cliente aprova pelo link. Muito mais profissional." },
              { name: "Camila R.", role: "Estúdio 3D · Curitiba", text: "O kanban transformou minha produção. Sei exatamente o que tá imprimindo, o que tá esperando e o que já foi entregue. Sem esquecimento." },
              { name: "Thiago L.", role: "Maker · Belo Horizonte", text: "O que me convenceu foi o link de orçamento. O cliente vê, compara as versões e aprova na hora. Taxa de conversão dobrou." },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div style={{ background: "#111113", border: "1px solid #27272A", borderRadius: 12, padding: "24px 20px" }}>
                  <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
                    {[...Array(5)].map((_, s) => <Star key={s} size={12} color="#F97316" fill="#F97316" />)}
                  </div>
                  <p style={{ color: "#A1A1AA", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#F9731620", display: "flex", alignItems: "center", justifyContent: "center", color: "#F97316", fontWeight: 700, fontSize: 13 }}>{t.name[0]}</div>
                    <div>
                      <div style={{ color: "#FAFAFA", fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ color: "#52525B", fontSize: 11 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ─────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#0D0D0F" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ color: "#F97316", fontSize: 13, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Planos</div>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>Simples e sem surpresa</h2>
              <p style={{ color: "#A1A1AA", fontSize: 15, lineHeight: 1.7 }}>
                Comece grátis. Faça upgrade quando precisar de mais.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#22C55E15", border: "1px solid #22C55E30", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: "#22C55E", marginTop: 12 }}>
                <Star size={12} />
                90% de desconto no primeiro mês — aplicado automaticamente
              </div>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {/* Grátis */}
            <Reveal delay={0}>
              <div style={{ background: "#111113", border: "1px solid #27272A", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
                <div>
                  <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 6 }}>Grátis</p>
                  <p style={{ fontSize: 36, fontWeight: 800, color: "#FAFAFA", lineHeight: 1 }}>R$ 0<span style={{ fontSize: 14, fontWeight: 400, color: "#A1A1AA" }}>/mês</span></p>
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {[
                    "20 orçamentos por mês",
                    "5 clientes cadastrados",
                    "1 impressora",
                    "1 versão por orçamento",
                    "Kanban de produção",
                    "Financeiro completo",
                    "3 filamentos no estoque",
                  ].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#A1A1AA" }}>
                      <Check size={13} color="#22C55E" />
                      {f}
                    </li>
                  ))}
                  {["WhatsApp automático", "Pagamento no link", "Portfólio público"].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3F3F46" }}>
                      <span style={{ width: 13, height: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#3F3F46", fontSize: 11 }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{ display: "block", textAlign: "center", background: "#18181B", color: "#A1A1AA", textDecoration: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, border: "1px solid #27272A" }}>
                  Começar grátis
                </Link>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal delay={80}>
              <div style={{ background: "#111113", border: "2px solid #F97316", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20, height: "100%", position: "relative" }}>
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #F97316, #EA6C0A)", color: "#fff", borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                  MAIS POPULAR
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 6 }}>Pro</p>
                  <p style={{ fontSize: 36, fontWeight: 800, color: "#FAFAFA", lineHeight: 1 }}>R$ 49<span style={{ fontSize: 14, fontWeight: 400, color: "#A1A1AA" }}>/mês</span></p>
                  <p style={{ fontSize: 12, color: "#22C55E", marginTop: 4 }}>R$ 4,90 no primeiro mês</p>
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {[
                    "Orçamentos ilimitados",
                    "20 clientes cadastrados",
                    "3 impressoras",
                    "2 versões por orçamento",
                    "Kanban de produção",
                    "Financeiro completo",
                    "10 filamentos no estoque",
                    "WhatsApp automático",
                    "Pagamento no link",
                  ].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#A1A1AA" }}>
                      <Check size={13} color="#22C55E" />
                      {f}
                    </li>
                  ))}
                  {["Portfólio público"].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3F3F46" }}>
                      <span style={{ width: 13, height: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11 }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg, #F97316, #EA6C0A)", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700 }}>
                  Assinar Pro
                </Link>
              </div>
            </Reveal>

            {/* Estúdio */}
            <Reveal delay={160}>
              <div style={{ background: "#111113", border: "1px solid #27272A", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
                <div>
                  <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 6 }}>Estúdio</p>
                  <p style={{ fontSize: 36, fontWeight: 800, color: "#FAFAFA", lineHeight: 1 }}>R$ 99<span style={{ fontSize: 14, fontWeight: 400, color: "#A1A1AA" }}>/mês</span></p>
                  <p style={{ fontSize: 12, color: "#22C55E", marginTop: 4 }}>R$ 9,90 no primeiro mês</p>
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {[
                    "Tudo do Pro, ilimitado",
                    "Clientes ilimitados",
                    "Impressoras ilimitadas",
                    "Versões ilimitadas",
                    "Filamentos ilimitados",
                    "WhatsApp automático",
                    "Pagamento no link",
                    "Portfólio público",
                  ].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#A1A1AA" }}>
                      <Check size={13} color="#F97316" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{ display: "block", textAlign: "center", background: "#18181B", color: "#F97316", textDecoration: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, border: "1px solid #F9731640" }}>
                  Assinar Estúdio
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────── */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <Reveal>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #F97316, #EA6C0A)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <Zap size={26} color="#fff" />
            </div>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>
              Comece a gerir com precisão
            </h2>
            <p style={{ color: "#A1A1AA", fontSize: 17, lineHeight: 1.7, marginBottom: 40 }}>
              Sem cartão de crédito. Cancele quando quiser. Configure em menos de 5 minutos.
            </p>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg, #F97316, #EA6C0A)", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "16px 36px", fontSize: 17, fontWeight: 700, boxShadow: "0 0 40px #F9731650" }}>
              Criar minha conta grátis
              <ArrowRight size={18} />
            </Link>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
              {["Sem cartão de crédito", "Cancele quando quiser", "Suporte via WhatsApp"].map((f) => (
                <span key={f} style={{ display: "flex", alignItems: "center", gap: 6, color: "#52525B", fontSize: 13 }}>
                  <Check size={12} color="#22C55E" /> {f}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #27272A", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #F97316, #EA6C0A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={12} color="#fff" />
          </div>
          <span style={{ color: "#52525B", fontSize: 13 }}>3D Print Manager © 2025</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/login" style={{ color: "#52525B", textDecoration: "none", fontSize: 13 }}>Entrar</Link>
          <Link href="/register" style={{ color: "#52525B", textDecoration: "none", fontSize: 13 }}>Cadastrar</Link>
        </div>
      </footer>
    </div>
  );
}
