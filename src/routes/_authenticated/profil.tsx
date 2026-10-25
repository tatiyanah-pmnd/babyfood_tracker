import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { BabyForm } from "@/components/BabyForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatAge, membershipsQuery, ROLE_LABELS, useSelectedBaby, type Baby } from "@/lib/babies";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Profil — BabyFood Tracker" },
      { name: "description", content: "Profils des bébés, famille et compte." },
      { property: "og:title", content: "Profil — BabyFood Tracker" },
      { property: "og:description", content: "Gérez les profils et votre compte." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { babies, baby: current, select } = useSelectedBaby();
  const { data: memberships } = useQuery(membershipsQuery);
  const [editing, setEditing] = useState<Baby | "new" | null>(null);
  const [deleting, setDeleting] = useState<Baby | null>(null);
  const roleFor = (fid: string) => memberships?.find((m) => m.family_id === fid)?.role;
  const ownFamily = memberships?.find((m) => m.role === "owner")?.family_id ?? memberships?.[0]?.family_id;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("babies").delete().eq("id", deleting.id);
    setDeleting(null);
    if (error) return void toast.error("Suppression impossible");
    await qc.invalidateQueries({ queryKey: ["babies"] });
    toast.success("Profil supprimé");
  }

  return (
    <AppShell>
      <PageHeader title="Profil" />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bébés</h2>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
        <ul className="space-y-3">
          {babies.map((b) => {
            const role = roleFor(b.family_id);
            const canEdit = role && role !== "readonly";
            return (
              <li key={b.id} className="flex items-center gap-4 rounded-3xl bg-card p-4 shadow-soft">
                <button onClick={() => select(b.id)} className="flex flex-1 items-center gap-4 text-left">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft font-display text-xl">
                    {b.first_name[0]?.toUpperCase()}
                  </span>
                  <span>
                    <span className="block font-medium">
                      {b.first_name} {current?.id === b.id && <span className="ml-1 text-xs text-muted-foreground">· sélectionné</span>}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatAge(b.birth_date)}{role ? ` · ${ROLE_LABELS[role]}` : ""}</span>
                  </span>
                </button>
                {canEdit && (
                  <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></Button>
                )}
                {role === "owner" && (
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => setDeleting(b)}><Trash2 className="h-4 w-4" /></Button>
                )}
              </li>
            );
          })}
          {babies.length === 0 && <li className="text-sm text-muted-foreground">Aucun profil pour l'instant.</li>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Compte</h2>
        <div className="rounded-3xl bg-card p-2 shadow-soft">
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-muted">
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Invitations familiales, rappels, export et suppression des données arrivent dans les prochaines étapes.
        </p>
      </section>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing === "new" ? "Nouveau bébé" : "Modifier le profil"}</DialogTitle>
          </DialogHeader>
          {editing && ownFamily && (
            <BabyForm
              familyId={editing === "new" ? ownFamily : editing.family_id}
              baby={editing === "new" ? undefined : editing}
              onSaved={(b) => { if (editing === "new") select(b.id); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le profil de {deleting?.first_name} ?</AlertDialogTitle>
            <AlertDialogDescription>Toutes les données associées seront définitivement effacées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
