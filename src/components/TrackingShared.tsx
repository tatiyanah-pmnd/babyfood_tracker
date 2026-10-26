import { useMutation, useQueryClient, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { AppShell } from "./AppShell";
import { deleteEntry } from "@/lib/tracking.functions";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { useState } from "react";
import { Trash2 } from "lucide-react";
export const selectClass = "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm";
export function TrackingError({ error }: ErrorComponentProps) {
  const router = useRouter(); const boundary = useQueryErrorResetBoundary();
  return <AppShell showFab={false}><h1 className="font-display text-2xl">Suivi indisponible</h1><p className="my-4 text-muted-foreground">{error instanceof Error ? error.message : "Une erreur est survenue."}</p><Button onClick={() => { boundary.reset(); router.invalidate(); }}>Réessayer</Button></AppShell>;
}
export function TrackingNotFound() { return <AppShell><p>Ce suivi est introuvable.</p></AppShell>; }
export function EmptyState({ title, text }: { title: string; text: string }) { return <div className="py-14 text-center"><h2 className="font-display text-2xl">{title}</h2><p className="mt-3 text-sm text-muted-foreground">{text}</p></div>; }
export function DeleteEntry({ table, id, babyId }: { table: "meals" | "observations"; id: string; babyId: string }) {
  const [open, setOpen] = useState(false); const queryClient = useQueryClient(); const remove = useServerFn(deleteEntry);
  const mutation = useMutation({ mutationFn: () => remove({ data: { table, id, baby_id: babyId } }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["tracking"] }); setOpen(false); toast.success("Entrée supprimée"); }, onError: () => toast.error("Suppression impossible. Réessayez.") });
  return <><Button variant="ghost" size="icon" aria-label="Supprimer" title="Supprimer" onClick={() => setOpen(true)}><Trash2 /></Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Supprimer cette entrée ?</DialogTitle><DialogDescription>Cette action est définitive. Les observations associées à un repas supprimé sont conservées.</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Supprimer</Button></div></DialogContent></Dialog></>;
}