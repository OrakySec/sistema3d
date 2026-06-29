"use client";

import { useState } from "react";
import {
  User, DollarSign, FileText, MessageCircle,
  Bell, Shield, Save, Loader2, Zap,
  ExternalLink, Copy, CheckCircle2,
} from "lucide-react";
import { SettingToggle } from "@/components/shared/SettingToggle";
import { InfoTip } from "@/components/shared/InfoTip";
import { WhatsAppConnect } from "@/components/whatsapp/WhatsAppConnect";
import { inputCls, selectCls } from "@/components/shared/CrudDialog";

// ─── Tipos ───────────────────────────────────────────────────

interface Settings {
  // Perfil
  businessName: string;
  whatsapp: string;
  city: string;

  // Custos
  energyCostKwh: number;
  defaultProfitMargin: number;
  paintingHourlyRate: number;

  // Orçamentos
  quoteExpirationEnabled: boolean;
  quoteExpirationDays: number;
  quoteReminderEnabled: boolean;
  paymentLinkEnabled: boolean;
  paymentDepositPercent: number;
  viewTrackingEnabled: boolean;

  // WhatsApp
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

  // Estoque
  autoDeductStock: boolean;
  lowStockAlertEnabled: boolean;

  // Portfólio
  portfolioEnabled: boolean;
  portfolioLeadFormEnabled: boolean;
  portfolioTestimonialsEnabled: boolean;
}

const DEFAULTS: Settings = {
  businessName: "Meu Estúdio 3D",
  whatsapp: "(11) 99999-9999",
  city: "São Paulo",
  energyCostKwh: 0.75,
  defaultProfitMargin: 30,
  paintingHourlyRate: 50,
  quoteExpirationEnabled: true,
  quoteExpirationDays: 5,
  quoteReminderEnabled: true,
  paymentLinkEnabled: false,
  paymentDepositPercent: 50,
  viewTrackingEnabled: true,
  whatsappAutoEnabled: false,
  silentHoursEnabled: false,
  silentHoursStart: "22:00",
  silentHoursEnd: "08:00",
  autoReplyEnabled: false,
  autoReplyMessage: "Oi! Recebi sua mensagem e responderei em breve. 😊",
  followupEnabled: false,
  followup7DaysEnabled: true,
  followup30DaysEnabled: true,
  npsEnabled: false,
  npsDaysAfterDelivery: 7,
  autoDeductStock: true,
  lowStockAlertEnabled: true,
  portfolioEnabled: true,
  portfolioLeadFormEnabled: false,
  portfolioTestimonialsEnabled: false,
};

// ─── Componentes auxiliares ───────────────────────────────────

type TabId = "perfil" | "custos" | "orcamentos" | "whatsapp" | "estoque" | "portfolio";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "perfil",     label: "Perfil",      icon: User },
  { id: "custos",     label: "Custos",      icon: DollarSign },
  { id: "orcamentos", label: "Orçamentos",  icon: FileText },
  { id: "whatsapp",   label: "WhatsApp",    icon: MessageCircle },
  { id: "estoque",    label: "Estoque",     icon: Bell },
  { id: "portfolio",  label: "Portfólio",   icon: Shield },
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

function Field({
  label, tip, children, className,
}: {
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

export default function ConfiguracoesPage() {
  const [tab, setTab]           = useState<TabId>("perfil");
  const [s, setS]               = useState<Settings>(DEFAULTS);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [copied, setCopied]     = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await new Promise((r) => setTimeout(r, 800)); // TODO: Server Action
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
          disabled={saving}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-7 flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary"
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
                <input value={s.businessName} onChange={(e) => set("businessName", e.target.value)} className={inputCls} />
              </Field>
              <Field label="WhatsApp">
                <input value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
              </Field>
              <Field label="Cidade">
                <input value={s.city} onChange={(e) => set("city", e.target.value)} placeholder="São Paulo" className={inputCls} />
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
            <InputRow
              label="Custo de energia (R$/kWh)"
              tip="Valor do kWh na sua conta de energia. Veja na sua fatura ou site da distribuidora. Esse valor impacta diretamente o custo de energia de cada impressão."
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
                <input
                  type="number" step={0.01} min={0}
                  value={s.energyCostKwh}
                  onChange={(e) => set("energyCostKwh", Number(e.target.value))}
                  className={`${inputCls} pl-8`}
                />
              </div>
            </InputRow>

            <InputRow
              label="Margem de lucro padrão (%)"
              tip="Percentual de lucro pré-preenchido ao criar um novo orçamento. Você pode alterar por orçamento individualmente."
            >
              <div className="relative">
                <input
                  type="number" step={1} min={0} max={500}
                  value={s.defaultProfitMargin}
                  onChange={(e) => set("defaultProfitMargin", Number(e.target.value))}
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
              </div>
            </InputRow>

            <InputRow
              label="Taxa de pintura / pós-produção (R$/h)"
              tip="Valor cobrado por hora de trabalho manual (pintura, lixamento, montagem). Usado nos orçamentos que incluem pós-produção."
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
                <input
                  type="number" step={1} min={0}
                  value={s.paintingHourlyRate}
                  onChange={(e) => set("paintingHourlyRate", Number(e.target.value))}
                  className={`${inputCls} pl-8`}
                />
              </div>
            </InputRow>
          </Section>

          <div className="rounded-xl border border-info/20 bg-info-subtle px-5 py-4 text-sm text-text-secondary">
            💡 O custo por hora de cada impressora é configurado individualmente na página <a href="/impressoras" className="font-medium text-primary hover:underline">Impressoras</a>.
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
              info="Orçamentos com prazo de validade evitam que clientes aprovem preços desatualizados semanas depois. Quando expira, o cliente vê uma mensagem pedindo para solicitar novo orçamento."
              enabled={s.quoteExpirationEnabled}
              onChange={(v) => set("quoteExpirationEnabled", v)}
            >
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary">Prazo padrão:</label>
                <div className="relative w-28">
                  <input
                    type="number" min={1} max={30}
                    value={s.quoteExpirationDays}
                    onChange={(e) => set("quoteExpirationDays", Number(e.target.value))}
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">dias</span>
                </div>
              </div>
            </SettingToggle>

            <SettingToggle
              label="Lembrete automático via WhatsApp"
              description="Envia uma mensagem 24h antes do orçamento expirar."
              info="Funciona junto com a integração WhatsApp. O lembrete é enviado pelo número conectado na aba WhatsApp."
              enabled={s.quoteReminderEnabled}
              onChange={(v) => set("quoteReminderEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative a integração WhatsApp para usar este recurso."
            />

            <SettingToggle
              label="Rastreamento de visualizações"
              description="Registra quando e quantas vezes o cliente abriu o link do orçamento."
              info="Você pode ver na lista de orçamentos se o cliente visualizou. Útil para decidir quando fazer follow-up: se ele abriu mas não respondeu, vale mandar uma mensagem."
              enabled={s.viewTrackingEnabled}
              onChange={(v) => set("viewTrackingEnabled", v)}
            />
          </Section>

          <Section title="Link de pagamento">
            <SettingToggle
              label="Link de pagamento embutido"
              description="O cliente pode pagar uma entrada diretamente no link de aprovação via InfinityPay."
              info="Quando ativado, o link de aprovação inclui um botão de pagamento. Você define o percentual de entrada. O restante é combinado na entrega."
              enabled={s.paymentLinkEnabled}
              onChange={(v) => set("paymentLinkEnabled", v)}
            >
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary whitespace-nowrap">Entrada de:</label>
                <div className="relative w-28">
                  <input
                    type="number" min={10} max={100} step={5}
                    value={s.paymentDepositPercent}
                    onChange={(e) => set("paymentDepositPercent", Number(e.target.value))}
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
                </div>
                <span className="text-xs text-text-muted">do valor total</span>
              </div>
              <div className="mt-3 rounded-lg border border-warning/20 bg-warning-subtle px-3 py-2">
                <p className="text-xs text-text-secondary">
                  Requer chave da API InfinityPay configurada em{" "}
                  <a href="#" className="font-medium text-primary hover:underline">Integrações</a>.
                </p>
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
              info="Quando desativado, nenhuma mensagem é enviada automaticamente. Você ainda pode enviar manualmente pelo Kanban."
              enabled={s.whatsappAutoEnabled}
              onChange={(v) => set("whatsappAutoEnabled", v)}
            />

            <SettingToggle
              label="Horário silencioso"
              description="Não envia mensagens automáticas neste período."
              info="Mensagens programadas fora do horário silencioso são enfileiradas e enviadas na próxima janela disponível."
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
              info="Útil para confirmar recebimento fora do horário comercial. A mensagem é enviada uma única vez por contato a cada 24h."
              enabled={s.autoReplyEnabled}
              onChange={(v) => set("autoReplyEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative as mensagens automáticas primeiro."
            >
              <textarea
                rows={3}
                value={s.autoReplyMessage}
                onChange={(e) => set("autoReplyMessage", e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Digite sua mensagem automática..."
              />
              <p className="mt-1 text-xs text-text-muted">
                Variáveis disponíveis: <code className="text-primary">{"{{nome}}"}</code>
              </p>
            </SettingToggle>
          </Section>

          <Section title="Follow-up e NPS">
            <SettingToggle
              label="Follow-up pós-entrega"
              description="Envia mensagens de acompanhamento após marcar um pedido como entregue."
              info="Follow-ups aumentam as chances de recompra e avaliações positivas. Os templates são editáveis na seção de mensagens."
              enabled={s.followupEnabled}
              onChange={(v) => set("followupEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative as mensagens automáticas primeiro."
            >
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={s.followup7DaysEnabled} onChange={(e) => set("followup7DaysEnabled", e.target.checked)}
                    className="h-4 w-4 rounded accent-primary" />
                  <span className="text-sm text-text-secondary">Após 7 dias — verificar satisfação</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={s.followup30DaysEnabled} onChange={(e) => set("followup30DaysEnabled", e.target.checked)}
                    className="h-4 w-4 rounded accent-primary" />
                  <span className="text-sm text-text-secondary">Após 30 dias — oferta de recompra</span>
                </label>
              </div>
            </SettingToggle>

            <SettingToggle
              label="Pesquisa NPS automática"
              description="Envia uma mensagem pedindo nota de 1 a 10 após a entrega."
              info="NPS (Net Promoter Score) mede a satisfação do cliente. Clientes que dão 9 ou 10 são promotores e tendem a indicar seus serviços. Os resultados aparecem no módulo financeiro."
              enabled={s.npsEnabled}
              onChange={(v) => set("npsEnabled", v)}
              disabled={!s.whatsappAutoEnabled}
              disabledReason="⚠ Ative as mensagens automáticas primeiro."
            >
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary whitespace-nowrap">Enviar</label>
                <div className="relative w-24">
                  <input
                    type="number" min={1} max={30}
                    value={s.npsDaysAfterDelivery}
                    onChange={(e) => set("npsDaysAfterDelivery", Number(e.target.value))}
                    className={inputCls}
                  />
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
            info="Quando ativado, ao clicar em 'Concluir' no Kanban, o sistema subtrai os gramas do orçamento do filamento selecionado. Se desativado, você controla o estoque manualmente."
            enabled={s.autoDeductStock}
            onChange={(v) => set("autoDeductStock", v)}
          />

          <SettingToggle
            label="Alertas de estoque baixo"
            description="Notificação quando um filamento ficar abaixo do limite configurado."
            info="O limite de alerta é configurado por filamento na página de Estoque. Quando atingido, aparece no Dashboard e na lista de notificações."
            enabled={s.lowStockAlertEnabled}
            onChange={(v) => set("lowStockAlertEnabled", v)}
          />
        </Section>
      )}

      {/* ─── Portfólio ─────────────────────────────────────── */}
      {tab === "portfolio" && (
        <>
          <Section title="Página pública">
            <SettingToggle
              label="Portfólio público ativado"
              description="Sua página de portfólio fica acessível para clientes."
              info="Uma página pública com suas peças, depoimentos e formulário de contato. Você pode compartilhar o link nas redes sociais ou no WhatsApp."
              enabled={s.portfolioEnabled}
              onChange={(v) => set("portfolioEnabled", v)}
            >
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                <span className="flex-1 text-sm text-text-secondary truncate">
                  {typeof window !== "undefined" ? window.location.origin : "https://seudominio.com"}/p/meu-estudio-3d
                </span>
                <button
                  onClick={copyPortfolioUrl}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </SettingToggle>

            <SettingToggle
              label="Formulário de captação de leads"
              description="Exibe um formulário de contato na página pública para captar novos clientes."
              info="Os leads capturados ficam disponíveis no módulo de Clientes com a tag 'Lead portfólio'. Você recebe uma notificação por WhatsApp a cada novo lead."
              enabled={s.portfolioLeadFormEnabled}
              onChange={(v) => set("portfolioLeadFormEnabled", v)}
              disabled={!s.portfolioEnabled}
              disabledReason="⚠ Ative o portfólio público primeiro."
            />

            <SettingToggle
              label="Depoimentos de clientes"
              description="Mostra a seção de avaliações na sua página pública."
              info="Depoimentos coletados via NPS (com nota 8+) podem ser aprovados para aparecer no portfólio. Você controla quais ficam visíveis."
              enabled={s.portfolioTestimonialsEnabled}
              onChange={(v) => set("portfolioTestimonialsEnabled", v)}
              disabled={!s.portfolioEnabled}
              disabledReason="⚠ Ative o portfólio público primeiro."
            />
          </Section>
        </>
      )}
    </div>
  );
}
