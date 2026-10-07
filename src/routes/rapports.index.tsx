import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MultiSelect } from "@/components/app/multi-select";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PRESETS, getRange, type Preset } from "@/lib/analytics";
import { reportsQuery, sourcesQuery, topicsQuery, watchlistsQuery } from "@/lib/data";
import { TEXT_TYPES } from "@/lib/pipeline/types";

export const Route = createFileRoute("/rapports/")({
  head: () => ({
    meta: [
      { title: "Rapports d'analyse — Revue" },
      { name: "description", content: "Générez et exportez des rapports d'analyse médiatique." },
      { property: "og:title", content: "Rapports d'analyse — Revue" },
      { property: "og:description", content: "Générez et exportez des rapports d'analyse médiatique." },
    ],
  }),
  component: Reports,
});

type Form = { title: string; preset: Preset; from: string; to: string; scope: string; sourceIds: string[]; types: string[]; language: string };

function Reports() {
  const search = Route.useSearch() as { veille?: string };
  const qc = useQueryClient();
  const navigate = useNavigate();
  const reports = useQuery(reportsQuery);
  const wls = useQuery(watchlistsQuery);
  const topics = useQuery(topicsQuery);
  const sources = useQuery(sourcesQuery);
  const [form, setForm] = useState<Form | null>(null);

  const open = (scope = "all", title = "") =>
    setForm({ title, preset: "30d", from: "", to: "", scope, sourceIds: [], types: [], language: "all" });

  useEffect(() => {
    if (search.veille && wls.data) {
      const w = wls.data.find((x) => x.id === search.veille);
      if (w) open(`w:${w.id}`, `Analyse — ${w.name}`);
    }
  }, [search.veille, wls.data]);

  const create = useMutation({
    mutationFn: async (f: Form) => {
      const r = getRange({ preset: f.preset, customFrom: f.from || undefined, customTo: f.to || undefined });
      const [kind, id] = f.scope.split(":");
      const { data, error } = await supabase
        .from("reports")
        .insert({
          title: f.title.trim() || "Rapport d'analyse",
          period_start: r.from.toISOString(),
          period_end: r.to.toISOString(),
          watchlist_id: kind === "w" ? id : null,
          topic_id: kind === "t" ? id : null,
          filters: { sourceIds: f.sourceIds, types: f.types, language: f.language },
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      navigate({ to: "/rapports/$id", params: { id } });
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("reports").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
  const d = (s: string) => format(new Date(s), "d MMM yyyy", { locale: fr });

  return (
    <>
      <PageHeader kicker="Rapports" title="Rapports d'analyse" description="Créez un rapport à partir d'une période, d'une veille ou d'une thématique." actions={<Button onClick={() => open()}><Plus /> Nouveau rapport</Button>} />
      {reports.error ? <ErrorState error={reports.error} onRetry={() => reports.refetch()} /> : reports.isLoading ? <LoadingState /> : !reports.data?.length ? (
        <div className="panel"><EmptyState title="Aucun rapport" action={<Button onClick={() => open()}>Créer un rapport</Button>} /></div>
      ) : (
        <div className="panel divide-y">
          {reports.data.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4">
              <FileText className="size-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <Link to="/rapports/$id" params={{ id: r.id }} className="font-medium hover:text-highlight">{r.title}</Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Période {d(r.period_start)} – {d(r.period_end)} · {r.watchlists?.name ? `Veille : ${r.watchlists.name}` : r.topics?.name ? `Thématique : ${r.topics.name}` : "Toute la presse"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground hidden md:block">Créé le {d(r.created_at)}</span>
              <Button variant="outline" size="sm" asChild><Link to="/rapports/$id" params={{ id: r.id }}>Ouvrir</Link></Button>
              <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => confirm("Supprimer ce rapport ?") && remove.mutate(r.id)}><Trash2 /></Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouveau rapport</DialogTitle></DialogHeader>
          {form && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}>
              <div className="space-y-1.5"><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Bilan médiatique mensuel" /></div>
              <div className="space-y-1.5">
                <Label>Période</Label>
                <Select value={form.preset} onValueChange={(v) => setForm({ ...form, preset: v as Preset })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
                {form.preset === "custom" && (
                  <div className="flex gap-2"><Input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /><Input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Périmètre</Label>
                <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute la presse</SelectItem>
                    {wls.data?.map((w) => <SelectItem key={w.id} value={`w:${w.id}`}>Veille — {w.name}</SelectItem>)}
                    {topics.data?.map((t) => <SelectItem key={t.id} value={`t:${t.id}`}>Thématique — {t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <MultiSelect label="Sources" options={(sources.data ?? []).map((s) => ({ value: s.id, label: s.name }))} value={form.sourceIds} onChange={(v) => setForm({ ...form, sourceIds: v })} />
                <MultiSelect label="Types" options={TEXT_TYPES.map((t) => ({ value: t, label: t }))} value={form.types} onChange={(v) => setForm({ ...form, types: v })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setForm(null)}>Annuler</Button>
                <Button type="submit" disabled={create.isPending}>Générer le rapport</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
