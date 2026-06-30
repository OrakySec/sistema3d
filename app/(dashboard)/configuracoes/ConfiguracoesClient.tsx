"use client";

import { useState, useTransition } from "react";
import {
  User, DollarSign, FileText, MessageCircle,
  Bell, Shield, Save, Loader2, Zap,
  Copy, CheckCircle2, Plug, ExternalLink,
} from "lucide-react";
import { SettingToggle } from "@/components/shared/SettingToggle";
import { InfoTip }        from "@/components/shared/InfoTip";
import { WhatsAppConnect } from "@/components/whatsapp/WhatsAppConnect";
import { BillingSection } from "@/components/shared/BillingSection";
import { inputCls }       from "@/components/shared/CrudDialog";
import { saveSettings }   from "@/lib/actions/settings";
import type { Plan } from "@/lib/plans";
type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID";

// ─── Tipos ───────────────────────────────────────────────────

interface UserData {
  businessName: string;
  whatsapp: string;
  city: string;
}

interface SettingsData {
  energyCostKwh: number;
  defaultProfitMargin: number;
  paintingHourlyRate: number;
  quoteExpirationEnabled: boolean;
  quoteExpirationDays: number;
  quoteReminderEnabled: boolean;
  paymentLinkEnabled: boolean;
  paymentDepositPercent: number;
  viewTrackingEnabled: boolean;
  whatsappAutoEnabled: boolean;
  silentHoursEnabled: boolean;
  silentHoursStart: string;
  silentHoursEnd: string;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  followupEnabled: boolean;
  followup7DaysEnabled: boolean;
  followup30DaysEnabled: boolean;
  npsEnabled: boolean;
  npsDaysAfterDelivery: number;
  autoDeductStock: boolean;
  lowStockAlertEnabled: boolean;
  portfolioEnabled: boolean;
  portfolioLeadFormEnabled: boolean;
  portfolioTestimonialsEnabled: boolean;
}

interface Props {
  initialUser: UserData;
  initialSettings: SettingsData;
  infinitypayHandle?: string;
  whatsappConnected: boolean;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  hasStripeId: boolean;
}

// ─── Componentes auxiliares ───────────────────────────────────

type TabId = "perfil" | "custos" | "orcamentos" | "whatsapp" | "estoque" | "portfolio" | "integracoes" | "assinatura";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "perfil",       label: "Perfil",       icon: User },
  { id: "custos",       label: "Custos",       icon: DollarSign },
  { id: "orcamentos",   label: "Orçamentos",   icon: FileText },
  { id: "whatsapp",     label: "WhatsApp",     icon: MessageCircle },
  { id: "estoque",      label: "Estoque",      icon: Bell },
  { id: "portfolio",    label: "Portfólio",    icon: Shield },
  { id: "integracoes",  label: "Integrações",  icon: Plug },
  { id: "assinatura",   label: "Assinatura",   icon: Zap },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({ label, tip, children, className }: {
  label: string; tip?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        {tip && <InfoTip content={tip} />}
      </div>
      {children}
    </div>
  );
}

function InputRow({ label, tip, children }: { label: string; tip?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {tip && <InfoTip content={tip} />}
      </div>
      <div className="w-48 shrink-0">{children}</div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────

export function ConfiguracoesClient({ initialUser, initialSettings, infinitypayHandle, whatsappConnected, plan, subscriptionStatus, currentPeriodEnd, hasStripeId }: Props) {
  const [tab, setTab]             = useState<TabId>("perfil");
  const [u, setU]                 = useState<UserData>(initialUser);
  const [s, setS]                 = useState<SettingsData>(initialSettings);
  const [newHandle, setNewHandle] = useState("");
  const [saved, setSaved]         = useState(false);
  const [copied, setCopied]       = useState(false);
  const [pending, startTransition] = useTransition();

  const setUser = <K extends keyof UserData>(key: K, value: UserData[K]) =>
    setU((prev) => ({ ...prev, [key]: value }));

  const set = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  function handleSave() {
    startTransition(async () => {
      const res = await saveSettings({ ...u, ...s, infinitypayHandle: newHandle || undefined });
      if (!res?.error) {
        setSaved(true);
        setNewHandle("");
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  function copyPortfolioUrl() {
    navigator.clipboard.writeText(`${window.location.origin}/p/meu-estudio-3d`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Configurações</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Personalize o sistema para o seu negócio</p>
        </div>
        <button
          onClick={handleSave}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-7 flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Perfil ────────────────────────────────────────── */}
      {tab === "perfil" && (
        <>
          <Section title="Dados do negócio">
            <div className="rounded-xl border border-border bg-surface p-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nome do estúdio / negócio" className="sm:col-span-2"
                tip="Aparece nos orçamentos enviados e na página pública do portfólio.">
                <input value={u.businessName} onChange={(e) => setUser("businessName", e.target.value)} className={inputCls} />
              </Field>
              <Field label="WhatsApp">
                <input value={u.whatsapp} onChange={(e) => setUser("whatsapp", e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
              </Field>
              <Field label="Cidade">
                <input value={u.city} onChange={(e) => setUser("city", e.target.value)} placeholder="São Paulo" className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Plano de assinatura">
            <div className="rounded-xl border border-primary/20 bg-primary-subtle p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-display text-base font-bold text-text-primary">Trial gratuito</p>
                    <p className="text-xs text-text-muted">Expira em 12 de julho de 2026</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white">
                  Assinar agora
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {["Orçamentos ilimitados", "Kanban de produção", "Integração WhatsApp"].map((f) => (
                  <div key={f} className="rounded-lg border border-primary/20 bg-background/50 px-2 py-2">
                    <p className="text-xs text-text-secondary">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </>
      )}

      {/* ─── Custos ────────────────────────────────────────── */}
      {tab === "custos" && (
        <>
          <Section title="Parâmetros de cálculo">
            <InputRow label="Custo de energia (R$/kWh)"
              tip="Valor do kWh na sua conta de energia. Esse valor impacta diretamente o custo de energia de cada impressão.">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
                <input type="number" step={0.01} min={0} value={s.energyCostKwh}
                  onChange={(e) => set("energyCostKwh", Number(e.target.value))}
                  className={`${inputCls} pl-8`} />
              </div>
            </InputRow>

            <InputRow label="Margem de lucro padrão (%)"
              tip="Percentual de lucro pré-preenchido ao criar um novo orçamento. Você pode alterar por orçamento individualmente.">
              <div className="relative">
                <input type="number" step={1} min={0} max={500} value={s.defaultProfitMargin}
                  onChange={(e) => set("defaultProfitMargin", Number(e.target.value))}
                  className={inputCls} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
              </div>
            </InputRow>

            <InputRow label="Taxa de pintura / pós-produção (R$/h)"
              tip="Valor cobrado por hora de trabalho manual. Usado nos orçamentos com pós-produção.">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
                <input type="number" step={1} min={0} value={s.paintingHourlyRate}
                  onChange={(e) => set("paintingHourlyRate", Number(e.target.value))}
                  className={`${inputCls} pl-8`} />
              </div>
            </InputRow>
          </Section>

          <div className="rounded-xl border border-info/20 bg-info-subtle px-5 py-4 text-sm text-text-secondary">
            💡 O custo por hora de cada impressora é configurado individualmente na página{" "}
            <a href="/impressoras" className="font-medium text-primary hover:underline">Impressoras</a>.
          </div>
        </>
      )}

      {/* ─── Orçamentos ────────────────────────────────────── */}
      {tab === "orcamentos" && (
        <>
          <Section title="Validade e lembretes">
            <SettingToggle
              label="Validade automática de orçamentos"
              description="O link de aprovação expira automaticamente após o prazo definido."
              info="Orçamentos com prazo de validade evitam que clientes aprovem preços desatualizados."
              enabled={s.quoteExpirationEnabled}
              onChange={(v) => set("quoteExpirationEnabled", v)}
            >
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary">Prazo padrão:</label>
                <div className="relative w-28">
                  <input type="number" min={1} max={30} value={s.quoteExpirationDays}
                    onChange={(e) => set("quoteExpirationDays", Number(e.target.value))}
                    className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">dias</span>
                </div>
              </div>
            </SettingToggle>

            <SettingToggle
              label="Lembrete automático via WhatsApp"
              description="Envia uma mensagem 24h antes do orçamento expirar."
              info="Funciona junto com a integração WhatsApp."
              enabled={s.quoteReminderEnabled}
              onChange={(v) => set("quoteReminderEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative a integração WhatsApp para usar este recurso."
            />

            <SettingToggle
              label="Rastreamento de visualizações"
              description="Registra quando e quantas vezes o cliente abriu o link do orçamento."
              info="Você pode ver na lista de orçamentos se o cliente visualizou."
              enabled={s.viewTrackingEnabled}
              onChange={(v) => set("viewTrackingEnabled", v)}
            />
          </Section>

          <Section title="Link de pagamento">
            <SettingToggle
              label="Link de pagamento embutido"
              description="O cliente pode pagar uma entrada diretamente no link de aprovação via InfinityPay."
              info="Quando ativado, o link inclui um botão de pagamento. Você define o percentual de entrada."
              enabled={s.paymentLinkEnabled}
              onChange={(v) => set("paymentLinkEnabled", v)}
              disabled={!infinitypayHandle}
              disabledReason="⚠ Configure seu InfinityTag em Integrações antes de ativar."
            >
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary whitespace-nowrap">Entrada de:</label>
                <div className="relative w-28">
                  <input type="number" min={10} max={100} step={5} value={s.paymentDepositPercent}
                    onChange={(e) => set("paymentDepositPercent", Number(e.target.value))}
                    className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
                </div>
                <span className="text-xs text-text-muted">do valor total</span>
              </div>
            </SettingToggle>
          </Section>
        </>
      )}

      {/* ─── WhatsApp ──────────────────────────────────────── */}
      {tab === "whatsapp" && (
        <>
          <Section title="Conexão">
            <WhatsAppConnect />
          </Section>

          <Section title="Automações">
            <SettingToggle
              label="Mensagens automáticas ativadas"
              description="Habilita todos os envios automáticos abaixo."
              info="Quando desativado, nenhuma mensagem é enviada automaticamente."
              enabled={s.whatsappAutoEnabled}
              onChange={(v) => set("whatsappAutoEnabled", v)}
              disabled={!whatsappConnected}
              disabledReason="⚠ Conecte o WhatsApp primeiro para ativar as automações."
            />

            <SettingToggle
              label="Horário silencioso"
              description="Não envia mensagens automáticas neste período."
              info="Mensagens programadas fora do horário silencioso são enfileiradas."
              enabled={s.silentHoursEnabled}
              onChange={(v) => set("silentHoursEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative as mensagens automáticas primeiro."
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted whitespace-nowrap">Das</label>
                  <input type="time" value={s.silentHoursStart} onChange={(e) => set("silentHoursStart", e.target.value)} className={`${inputCls} w-28`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted whitespace-nowrap">às</label>
                  <input type="time" value={s.silentHoursEnd} onChange={(e) => set("silentHoursEnd", e.target.value)} className={`${inputCls} w-28`} />
                </div>
              </div>
            </SettingToggle>

            <SettingToggle
              label="Resposta automática"
              description="Responde automaticamente quando alguém te envia uma mensagem."
              info="A mensagem é enviada uma única vez por contato a cada 24h."
              enabled={s.autoReplyEnabled}
              onChange={(v) => set("autoReplyEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative as mensagens automáticas primeiro."
            >
              <textarea rows={3} value={s.autoReplyMessage}
                onChange={(e) => set("autoReplyMessage", e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Digite sua mensagem automática..." />
              <p className="mt-1 text-xs text-text-muted">
                Variáveis disponíveis: <code className="text-primary">{"{{nome}}"}</code>
              </p>
            </SettingToggle>
          </Section>

          <Section title="Follow-up e NPS">
            <SettingToggle
              label="Follow-up pós-entrega"
              description="Envia mensagens de acompanhamento após marcar um pedido como entregue."
              info="Follow-ups aumentam as chances de recompra e avaliações positivas."
              enabled={s.followupEnabled}
              onChange={(v) => set("followupEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative as mensagens automáticas primeiro."
            >
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={s.followup7DaysEnabled}
                    onChange={(e) => set("followup7DaysEnabled", e.target.checked)}
                    className="h-4 w-4 rounded accent-primary" />
                  <span className="text-sm text-text-secondary">Após 7 dias — verificar satisfação</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={s.followup30DaysEnabled}
                    onChange={(e) => set("followup30DaysEnabled", e.target.checked)}
                    className="h-4 w-4 rounded accent-primary" />
                  <span className="text-sm text-text-secondary">Após 30 dias — oferta de recompra</span>
                </label>
              </div>
            </SettingToggle>

            <SettingToggle
              label="Pesquisa NPS automática"
              description="Envia uma mensagem pedindo nota de 1 a 10 após a entrega."
              info="NPS mede a satisfação do cliente. Os resultados aparecem no módulo financeiro."
              enabled={s.npsEnabled}
              onChange={(v) => set("npsEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative as mensagens automáticas primeiro."
            >
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary whitespace-nowrap">Enviar</label>
                <div className="relative w-24">
                  <input type="number" min={1} max={30} value={s.npsDaysAfterDelivery}
                    onChange={(e) => set("npsDaysAfterDelivery", Number(e.target.value))}
                    className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">dias</span>
                </div>
                <span className="text-sm text-text-secondary">após entrega</span>
              </div>
            </SettingToggle>
          </Section>
        </>
      )}

      {/* ─── Estoque ───────────────────────────────────────── */}
      {tab === "estoque" && (
        <Section title="Controle de estoque">
          <SettingToggle
            label="Dedução automática de filamento"
            description="Subtrai o filamento usado automaticamente ao concluir uma impressão."
            info="Quando ativado, ao clicar em 'Concluir' no Kanban, o sistema subtrai os gramas do filamento selecionado."
            enabled={s.autoDeductStock}
            onChange={(v) => set("autoDeductStock", v)}
          />

          <SettingToggle
            label="Alertas de estoque baixo"
            description="Notificação quando um filamento ficar abaixo do limite configurado."
            info="O limite de alerta é configurado por filamento na página de Estoque."
            enabled={s.lowStockAlertEnabled}
            onChange={(v) => set("lowStockAlertEnabled", v)}
          />
        </Section>
      )}

      {/* ─── Integrações ───────────────────────────────────── */}
      {tab === "integracoes" && (
        <Section title="Pagamentos">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">InfinityPay Checkout</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Gera links de pagamento via Checkout usando seu InfinityTag.
                </p>
              </div>
              {infinitypayHandle && (
                <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success-subtle px-2.5 py-0.5 text-xs font-medium text-success shrink-0">
                  <CheckCircle2 className="h-3 w-3" /> Configurado
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {infinitypayHandle && (
                <div className="rounded-lg border border-success/20 bg-success-subtle px-3 py-2.5 flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-text-primary">${infinitypayHandle}</span>
                  <span className="text-xs text-success font-medium ml-auto">InfinityTag ativo</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  {infinitypayHandle ? "Alterar InfinityTag" : "Seu InfinityTag"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-muted">$</span>
                  <input
                    type="text"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value.replace(/^\$/, ""))}
                    placeholder={infinitypayHandle ?? "seu-infinitytag"}
                    className={`${inputCls} pl-7`}
                  />
                </div>
                <p className="mt-1.5 text-xs text-text-muted">
                  Seu InfinityTag está no app InfinityPay em{" "}
                  <strong>Perfil → InfinityTag</strong>. É o nome após o <strong>$</strong>.{" "}
                  <a href="https://www.infinitepay.io/checkout-documentacao" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                    Ver documentação
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              {newHandle && (
                <div className="rounded-lg border border-info/20 bg-info-subtle px-3 py-2 text-xs text-text-secondary">
                  💡 Clique em <strong>Salvar alterações</strong> para ativar.
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ─── Portfólio ─────────────────────────────────────── */}
      {tab === "portfolio" && (
        <>
          <Section title="Página pública">
            <SettingToggle
              label="Portfólio público ativado"
              description="Sua página de portfólio fica acessível para clientes."
              info="Uma página pública com suas peças, depoimentos e formulário de contato."
              enabled={s.portfolioEnabled}
              onChange={(v) => set("portfolioEnabled", v)}
            >
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                <span className="flex-1 text-sm text-text-secondary truncate">
                  {typeof window !== "undefined" ? window.location.origin : "https://app.yaromarques.com"}/p/meu-estudio-3d
                </span>
                <button onClick={copyPortfolioUrl}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </SettingToggle>

            <SettingToggle
              label="Formulário de captação de leads"
              description="Exibe um formulário de contato na página pública."
              info="Os leads ficam disponíveis no módulo de Clientes."
              enabled={s.portfolioLeadFormEnabled}
              onChange={(v) => set("portfolioLeadFormEnabled", v)}
              disabled={!s.portfolioEnabled}
              disabledReason="⚠ Ative o portfólio público primeiro."
            />

            <SettingToggle
              label="Depoimentos de clientes"
              description="Mostra a seção de avaliações na sua página pública."
              info="Depoimentos coletados via NPS (nota 8+) podem ser aprovados para aparecer no portfólio."
              enabled={s.portfolioTestimonialsEnabled}
              onChange={(v) => set("portfolioTestimonialsEnabled", v)}
              disabled={!s.portfolioEnabled}
              disabledReason="⚠ Ative o portfólio público primeiro."
            />
          </Section>
        </>
      )}

      {/* ─── Assinatura ────────────────────────────────────── */}
      {tab === "assinatura" && (
        <BillingSection
          plan={plan}
          subscriptionStatus={subscriptionStatus}
          currentPeriodEnd={currentPeriodEnd}
          hasStripeId={hasStripeId}
        />
      )}
    </div>
  );
}
