import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, BellOff, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Delta } from "@/components/app/bits";
import { Sparkline } from "@/components/app/charts";
import { MultiSelect } from "@/components/app/multi-select";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { matchesWatchlist, pctChange, timeSeries } from "@/lib/analytics";
import { articlesQuery, sourcesQuery, watchlistsQuery, type Watchlist } from "@/lib/data";
import { useFilters } from "@/lib/filters";
import { TEXT_TYPES } from "@/lib/pipeline/types";

export const Route = createFileRoute("/veilles")({
  head: () => ({
    meta: [
      { title: "Veilles par mots-clés — Revue" },
      { name: "description", content: "Créez et suivez des veilles médiatiques par mots-clés." },
      { property: "og:title", content: "Veilles par mots-clés — Revue" },
      { property: "og:description", content: "Créez et suivez des veilles médiatiques par mots-clés." },
    ],
  }),
  component: Watchlists,
});

type Form = { id?: string; name: string; include: string; exclude: string; source_ids: string[]; text_types: string[]; languages: string[]; frequency: string; is_active: boolean };
const empty: Form = { name: "", include: "", exclude: "", source_ids: [], text_types: [], languages: ["fr"], frequency: "quotidienne", is_active: true };
const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const FREQ: Record<string, string> = { temps_reel: "Temps réel", quotidienne: "Quotidienne", hebdomadaire: "Hebdomadaire" };

// Fenêtre fixe pour les indicateurs : 7 derniers jours vs 7 précédents, courbe sur 30 jours.
const now = new Date();
const winFrom = subDays(now, 30);

function Watchlists() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { setFilters } = useFilters();
  const wl = useQuery(watchlistsQuery);
  const sources = useQuery(sourcesQuery);
  const arts = useQuery(articlesQuery(winFrom, now));
  const [form, setForm] = useState<Form | null>(null);

  const stats = useMemo(() => {
    const out: Record<string, { recent: number; prev: number; last: string | null; spark: { v: number }[] }> = {};
    const t7 = subDays(now, 7).getTime();
    const t14 = subDays(now, 14).getTime();
    for (const w of wl.data ?? []) {
      const m = (arts.data ?? []).filter((a) => matchesWatchlist(a, w));
      const ts = (a: { published_at: string }) => new Date(a.published_at).getTime();
      out[w.id] = {
        recent: m.filter((a) => ts(a) >= t7).length,
        prev: m.filter((a) => ts(a) >= t14 && ts(a) < t7).length,
        last: m[0]?.published_at ?? null,
        spark: timeSeries(m, { from: winFrom, to: now }, "day").map((r) => ({ v: r["total"] as number })),
      };
    }
    return out;
  }, [wl.data, arts.data]);

  const save = useMutation({
    mutationFn: async (f: Form) => {
      if (!f.name.trim()) throw new Error("Le nom est requis.");
      if (!split(f.include).length) throw new Error("Ajoutez au moins un mot-clé inclus.");
      const payload = { name: f.name.trim(), include_keywords: split(f.include), exclude_keywords: split(f.exclude), source_ids: f.source_ids, text_types: f.text_types, languages: f.languages, frequency: f.frequency, is_active: f.is_active, updated_at: new Date().toISOString() };
      const { error } = f.id ? await supabase.from("watchlists").update(payload).eq("id", f.id) : await supabase.from("watchlists").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Veille enregistrée"); setForm(null); qc.invalidateQueries({ queryKey: ["watchlists"] }); },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("watchlists").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Veille supprimée"); qc.invalidateQueries({ queryKey: ["watchlists"] }); },
  });

  const analyze = async (w: Watchlist) => {
    await supabase.from("watchlists").update({ last_analyzed_at: new Date().toISOString() }).eq("id", w.id);
    qc.invalidateQueries({ queryKey: ["watchlists"] });
    setFilters((f) => ({ ...f, preset: "30d", keyword: "", topicIds: [], sourceIds: w.source_ids, types: w.text_types, language: w.languages.length === 1 ? (w.languages[0] as "fr" | "en") : "all" }));
    navigate({ to: "/rapports", search: { veille: w.id } });
  };

  const err = wl.error ?? arts.error;
  return (
    <>
      <PageHeader
        kicker="Veilles"
        title="Surveillance de mots-clés"
        description="Volume des 7 derniers jours comparé aux 7 jours précédents."
        actions={<Button onClick={() => setForm(empty)}><Plus /> Nouvelle veille</Button>}
      />
      {err ? <ErrorState error={err} onRetry={() => { wl.refetch(); arts.refetch(); }} /> : wl.isLoading || arts.isLoading ? <LoadingState rows={3} /> : !wl.data?.length ? (
        <div className="panel"><EmptyState title="Aucune veille" description="Créez votre première veille pour suivre un sujet." action={<Button onClick={() => setForm(empty)}>Créer une veille</Button>} /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {wl.data.map((w) => {
            const s = stats[w.id];
            return (
              <section key={w.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-semibold">{w.name}</h2>
                      {!w.is_active && <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">En pause</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Fréquence {FREQ[w.frequency]?.toLowerCase() ?? w.frequency}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => setForm({ id: w.id, name: w.name, include: w.include_keywords.join(", "), exclude: w.exclude_keywords.join(", "), source_ids: w.source_ids, text_types: w.text_types, languages: w.languages, frequency: w.frequency, is_active: w.is_active })}><Pencil /></Button>
                    <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => confirm(`Supprimer la veille « ${w.name} » ?`) && remove.mutate(w.id)}><Trash2 /></Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {w.include_keywords.map((k) => <span key={k} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{k}</span>)}
                  {w.exclude_keywords.map((k) => <span key={k} className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground line-through">{k}</span>)}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 items-end">
                  <div><p className="kicker">Volume 7 j</p><p className="text-2xl font-semibold tabular-nums">{s?.recent ?? 0}</p></div>
                  <div><p className="kicker">Variation</p><Delta value={pctChange(s?.recent ?? 0, s?.prev ?? 0)} className="text-sm" /></div>
                  <div><p className="kicker">Dernière activité</p><p className="text-xs">{s?.last ? formatDistanceToNow(new Date(s.last), { locale: fr, addSuffix: true }) : "—"}</p></div>
                </div>
                <div className="mt-3"><Sparkline data={s?.spark ?? []} /></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" title="Les alertes seront disponibles dans une prochaine version">
                    {w.alerts_configured ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
                    Alertes : {w.alerts_configured ? "configurées (envoi bientôt disponible)" : "non configurées"}
                  </span>
                  <Button size="sm" onClick={() => analyze(w)}><Play /> Lancer une analyse</Button>
                </div>
                {w.last_analyzed_at && <p className="mt-2 text-[11px] text-muted-foreground">Dernière analyse {formatDistanceToNow(new Date(w.last_analyzed_at), { locale: fr, addSuffix: true })}</p>}
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form?.id ? "Modifier la veille" : "Nouvelle veille"}</DialogTitle></DialogHeader>
          {form && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
              <div className="space-y-1.5"><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Transition énergétique" /></div>
              <div className="space-y-1.5"><Label>Mots-clés inclus (séparés par des virgules)</Label><Input value={form.include} onChange={(e) => setForm({ ...form, include: e.target.value })} placeholder="climat, carbone" /></div>
              <div className="space-y-1.5"><Label>Mots-clés exclus</Label><Input value={form.exclude} onChange={(e) => setForm({ ...form, exclude: e.target.value })} /></div>
              <div className="flex flex-wrap gap-2">
                <MultiSelect label="Sources" options={(sources.data ?? []).map((s) => ({ value: s.id, label: s.name }))} value={form.source_ids} onChange={(v) => setForm({ ...form, source_ids: v })} />
                <MultiSelect label="Types" options={TEXT_TYPES.map((t) => ({ value: t, label: t }))} value={form.text_types} onChange={(v) => setForm({ ...form, text_types: v })} />
                <MultiSelect label="Langues" options={[{ value: "fr", label: "Français" }, { value: "en", label: "Anglais" }]} value={form.languages} onChange={(v) => setForm({ ...form, languages: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label>Fréquence</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(FREQ).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pb-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              </div>
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
