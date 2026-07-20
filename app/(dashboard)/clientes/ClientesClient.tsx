"use client";

import { useState, useTransition, useCallback } from "react";
import { Plus, Search, Users, Phone, Mail, MapPin, Tag, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CrudDialog, FormField, DialogActions, inputCls } from "@/components/shared/CrudDialog";
import { createClient, updateClient, deleteClient } from "@/lib/actions/clients";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { LockedCard } from "@/components/shared/LockedCard";
import { PLAN_LIMITS, type Plan, type LimitKey } from "@/lib/plans";

const clientSchema = z.object({
  name:     z.string().min(2, "Mínimo 2 caracteres"),
  whatsapp: z.string()
    .optional()
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Número incompleto — inclua o DDD"),
  email:    z.string().email("Email inválido").optional().or(z.literal("")),
  city:     z.string().optional(),
  notes:    z.string().optional(),
  tags:     z.string().optional(),
});

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2)  return d.length ? `(${d}` : "";
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
type ClientForm = z.infer<typeof clientSchema>;

interface Client {
  id: string; name: string; whatsapp?: string | null; email?: string | null;
  city?: string | null; notes?: string | null; tags: string[];
  createdAt: Date;
  _count?: { quotes: number };
}

function ClientDialog({ client, onClose, onLimitExceeded }: {
  client?: Client; onClose: () => void; onLimitExceeded: (key: LimitKey) => void;
}) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? { name: client.name, whatsapp: client.whatsapp ? maskPhone(client.whatsapp) : "",
          email: client.email ?? "", city: client.city ?? "",
          notes: client.notes ?? "", tags: client.tags.join(", ") }
      : {},
  });

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("whatsapp", maskPhone(e.target.value), { shouldValidate: true });
  }, [setValue]);

  function onSubmit(data: ClientForm) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, v));
    startTransition(async () => {
      if (client) { await updateClient(client.id, fd); onClose(); return; }
      const res = await createClient(fd);
      if (res?.error === "LIMIT_EXCEEDED") { onClose(); onLimitExceeded(res.key as LimitKey); return; }
      onClose();
    });
  }

  return (
    <CrudDialog title={client ? "Editar Cliente" : "Novo Cliente"}
      subtitle={client ? client.name : "Cadastre um novo cliente"} icon={Users} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" error={errors.name?.message} className="sm:col-span-2">
            <input {...register("name")} placeholder="Nome completo" className={inputCls} />
          </FormField>
          <FormField label="WhatsApp" error={errors.whatsapp?.message}>
            <input
              {...register("whatsapp")}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              inputMode="numeric"
              maxLength={15}
              className={inputCls}
            />
          </FormField>
          <FormField label="E-mail" error={errors.email?.message}>
            <input {...register("email")} type="email" placeholder="email@exemplo.com" className={inputCls} />
          </FormField>
          <FormField label="Cidade">
            <input {...register("city")} placeholder="São Paulo" className={inputCls} />
          </FormField>
          <FormField label="Tags">
            <input {...register("tags")} placeholder="VIP, atacado (separadas por vírgula)" className={inputCls} />
          </FormField>
          <FormField label="Observações" className="sm:col-span-2">
            <textarea {...register("notes")} rows={2} placeholder="Preferências, histórico relevante..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </FormField>
        </div>
        <DialogActions onClose={onClose} loading={pending}
          submitLabel={client ? "Salvar alterações" : "Cadastrar cliente"} />
      </form>
    </CrudDialog>
  );
}

export function ClientesClient({
  initialClients, plan, isFirstSubscriber,
}: {
  initialClients: Client[];
  plan: Plan;
  isFirstSubscriber: boolean;
}) {
  const [search, setSearch]         = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<Client | undefined>();
  const [upgradeOpen, setUpgradeOpen]     = useState(false);
  const [upgradeLimitKey, setUpgradeLimitKey] = useState<LimitKey>("clients");
  const [, startTransition]         = useTransition();

  const clientLimit = PLAN_LIMITS[plan].clients;
  const lockedIds = clientLimit === -1
    ? new Set<string>()
    : new Set(initialClients.slice(clientLimit).map((c) => c.id));

  const filtered = initialClients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  function handleDelete(id: string) {
    if (!confirm("Remover este cliente?")) return;
    startTransition(() => deleteClient(id));
  }

  function openEdit(c: Client) { setEditing(c); setDialogOpen(true); }
  function openNew()            { setEditing(undefined); setDialogOpen(true); }
  function closeDialog()        { setDialogOpen(false); setEditing(undefined); }

  function handleLimitExceeded(key: LimitKey) {
    setUpgradeLimitKey(key);
    setUpgradeOpen(true);
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Clientes</h1>
          <p className="mt-0.5 text-sm text-text-secondary">{initialClients.length} clientes cadastrados</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input type="text" placeholder="Buscar por nome, cidade ou tag..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const locked = lockedIds.has(c.id);
          const card = (
          <div
            className="group rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/40 hover:shadow-card">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{c.name}</p>
                  <p className="text-xs text-text-muted">
                    Cliente desde {new Date(c.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                <button onClick={() => openEdit(c)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-primary transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(c.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-error-subtle hover:text-error transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-col gap-1.5">
              {c.whatsapp && <div className="flex items-center gap-2 text-xs text-text-secondary"><Phone className="h-3.5 w-3.5 text-text-muted" />{c.whatsapp}</div>}
              {c.email    && <div className="flex items-center gap-2 text-xs text-text-secondary"><Mail className="h-3.5 w-3.5 text-text-muted" />{c.email}</div>}
              {c.city     && <div className="flex items-center gap-2 text-xs text-text-secondary"><MapPin className="h-3.5 w-3.5 text-text-muted" />{c.city}</div>}
            </div>

            {c.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                    <Tag className="h-2.5 w-2.5" />{t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3 border-t border-border pt-3">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-text-primary">{c._count?.quotes ?? 0}</p>
                <p className="text-xs text-text-muted">orçamentos</p>
              </div>
            </div>
          </div>
          );
          return locked
            ? <LockedCard key={c.id} label="cliente">{card}</LockedCard>
            : <div key={c.id}>{card}</div>;
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
            <Users className="mb-4 h-10 w-10 text-text-muted" />
            <p className="font-semibold text-text-primary">Nenhum cliente encontrado</p>
            <p className="mt-1 text-sm text-text-muted">Tente outra busca ou cadastre um novo.</p>
          </div>
        )}
      </div>

      {dialogOpen && (
        <ClientDialog client={editing} onClose={closeDialog} onLimitExceeded={handleLimitExceeded} />
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        limitKey={upgradeLimitKey}
        currentPlan={plan}
        isFirstSubscriber={isFirstSubscriber}
      />
    </>
  );
}
