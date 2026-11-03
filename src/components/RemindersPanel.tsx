import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Plus, Check, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { engagementQuery } from "@/lib/engagement";
import { saveReminder, updateReminder } from "@/lib/engagement.functions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
export function RemindersPanel({ compact = false }: { compact?: boolean }) {
  const { data } = useSuspenseQuery(engagementQuery); const client = useQueryClient(); const [title, setTitle] = useState("Noter les observations"); const [time, setTime] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const save = useServerFn(saveReminder); const update = useServerFn(updateReminder); const refresh = () => client.invalidateQueries({ queryKey: ["engagement"] });
  const create = useMutation({ mutationFn: () => save({ data: { title, due_at: new Date(time).toISOString() } }), onSuccess: () => { refresh(); toast.success("Rappel enregistré"); }, onError: () => toast.error("Rappel non enregistré. Vérifiez les champs.") });
  const change = useMutation({ mutationFn: (data: { id: string; action: "complete" | "reopen" | "delete" }) => update({ data }), onSuccess: refresh, onError: () => toast.error("Modification impossible") });
  const reminders = compact ? data.reminders.filter(r => !r.completed_at && new Date(r.due_at) <= new Date()) : data.reminders;
  if (compact && !reminders.length) return null;
  return <section className="mt-8 border-t pt-6"><h2 className="flex items-center gap-2 font-display text-2xl"><Bell className="h-5 w-5" />{compact ? "Rappels à consulter" : "Mes rappels"}</h2><ul className="mt-3 divide-y">{reminders.map(r => <li key={r.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0 break-words"><p className={`text-sm ${r.completed_at ? "line-through text-muted-foreground" : ""}`}>{r.title}</p><p className="text-xs text-muted-foreground">{format(new Date(r.due_at), "d MMMM yyyy · HH:mm", { locale: fr })}{!r.completed_at && new Date(r.due_at) <= new Date() ? " · À consulter" : ""}</p></div><div className="flex"><Button variant="ghost" size="icon" aria-label={r.completed_at ? "Réactiver le rappel" : "Terminer le rappel"} disabled={change.isPending} onClick={() => change.mutate({ id: r.id, action: r.completed_at ? "reopen" : "complete" })}>{r.completed_at ? <Undo2 /> : <Check />}</Button>{!compact && <Button variant="ghost" size="icon" aria-label="Supprimer le rappel" disabled={change.isPending} onClick={() => change.mutate({ id: r.id, action: "delete" })}><Trash2 /></Button>}</div></li>)}</ul>{!compact && <><form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); create.mutate(); }}><Label htmlFor="reminder-title">Rappel</Label><Input id="reminder-title" value={title} maxLength={120} required onChange={e => setTitle(e.target.value)} /><Label htmlFor="reminder-time">Quand</Label><Input id="reminder-time" type="datetime-local" required value={time} onChange={e => setTime(e.target.value)} /><Button disabled={create.isPending}><Plus />Ajouter un rappel</Button></form><p className="mt-3 text-xs text-muted-foreground">Vos rappels apparaissent à l’ouverture de l’application. Les notifications en dehors de l’application ne sont pas activées.</p></>}</section>;
}