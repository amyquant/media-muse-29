import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { sourceCountsQuery, sourcesQuery, type Source } from "@/lib/data";
import { SYNC_STATUS_LABEL, adapters } from "@/lib/pipeline/ingestion";
import type { SourceType } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Sources — Revue" },
      { name: "description", content: "Gérez les flux RSS, API et pages web surveillés." },
      { property: "og:title", content: "Sources — Revue" },
      { property: "og:description", content: "Gérez les flux RSS, API et pages web surveillés." },
    ],
  }),
  component: SourcesPage,
});

type Form = { id?: string; name: string; url: string; source_type: SourceType; category: string; language: string; is_active: boolean };
const empty: Form = { name: "", url: "", source_type: "rss", category: "Généraliste", language: "fr", is_active: true };

function SourcesPage() {
  const qc = useQueryClient();
  const sources = useQuery(sourcesQuery);
  const counts = useQuery(sourceCountsQuery);
  const [form, setForm] = useState<Form | null>(null);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sources"] });
    qc.invalidateQueries({ queryKey: ["source-counts"] });
  };

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const err = adapters[f.source_type].validate(f.url);
      if (!f.name.trim()) throw new Error("Le nom est requis.");
      if (err) throw new Error(err);
      const payload = { name: f.name.trim(), url: f.url.trim(), source_type: f.source_type, category: f.category, language: f.language, is_active: f.is_active, updated_at: new Date().toISOString() };
      const { error } = f.id
        ? await supabase.from("sources").update(payload).eq("id", f.id)
        : await supabase.from("sources").insert({ ...payload, sync_status: "non_connecte" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Source enregistrée");
      setForm(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (s: Source) => {
      const { error } = await supabase.from("sources").update({ is_active: !s.is_active }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Source supprimée");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        kicker="Sources"
        title="Sources surveillées"
        description="Flux RSS, API et pages web. La récupération automatique n'est pas encore connectée : les sources sont prêtes pour une future ingestion."
        actions={<Button onClick={() => setForm(empty)}><Plus /> Ajouter une source</Button>}
      />
      {sources.error ? (
        <ErrorState error={sources.error} onRetry={() => sources.refetch()} />
      ) : sources.isLoading ? (
        <LoadingState rows={5} />
      ) : !sources.data?.length ? (
        <div className="panel"><EmptyState title="Aucune source" action={<Button onClick={() => setForm(empty)}>Ajouter une source</Button>} /></div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {["Source", "Type", "Catégorie", "Langue", "Statut", "Dernière synchro", "Articles", "Active", ""].map((h) => (
                  <th key={h} className="kicker px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.data.map((s) => (
                <tr key={s.id} className={cn("border-t", !s.is_active && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{s.url}</div>
                  </td>
                  <td className="px-4 py-3 uppercase text-xs font-medium">{s.source_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                  <td className="px-4 py-3 uppercase text-xs">{s.language}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", s.sync_status === "erreur" ? "bg-destructive/10 text-destructive" : s.sync_status === "ok" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground")}>
                      {SYNC_STATUS_LABEL[s.sync_status] ?? s.sync_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {s.last_synced_at ? formatDistanceToNow(new Date(s.last_synced_at), { locale: fr, addSuffix: true }) : "Jamais"}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium">{counts.data?.[s.id] ?? "…"}</td>
                  <td className="px-4 py-3"><Switch checked={s.is_active} onCheckedChange={() => toggle.mutate(s)} aria-label="Activer la source" /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => setForm({ id: s.id, name: s.name, url: s.url, source_type: s.source_type as SourceType, category: s.category, language: s.language, is_active: s.is_active })}><Pencil /></Button>
                      <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => confirm(`Supprimer « ${s.name} » ? Ses articles seront conservés sans source.`) && remove.mutate(s.id)}><Trash2 /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Modifier la source" : "Nouvelle source"}</DialogTitle></DialogHeader>
          {form && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
              <div className="space-y-1.5"><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Le Quotidien" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type de source</Label>
                  <Select value={form.source_type} onValueChange={(v) => setForm({ ...form, source_type: v as SourceType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.values(adapters).map((a) => <SelectItem key={a.type} value={a.type}>{a.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Langue</Label>
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="en">Anglais</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>{form.source_type === "rss" ? "URL du flux" : "URL"}</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://exemple.com/rss.xml" /></div>
              <div className="space-y-1.5"><Label>Catégorie</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Source active</Label></div>
              <p className="text-xs text-muted-foreground rounded-md bg-muted p-3">La récupération automatique des articles sera activée quand l'ingestion sera connectée. D'ici là, la source est enregistrée avec le statut « Ingestion non connectée ».</p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setForm(null)}>Annuler</Button>
                <Button type="submit" disabled={save.isPending}>Enregistrer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
