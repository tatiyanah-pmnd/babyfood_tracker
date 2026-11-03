CREATE TABLE public.family_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE, email text NOT NULL, role public.family_role NOT NULL DEFAULT 'readonly', token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE, expires_at timestamptz NOT NULL DEFAULT (now()+interval '7 days'), accepted_at timestamptz, revoked_at timestamptz, created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT invitation_role CHECK(role <> 'owner')
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.family_invitations TO authenticated;
GRANT ALL ON public.family_invitations TO service_role;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners read invitations" ON public.family_invitations FOR SELECT TO authenticated USING(public.is_family_owner(family_id));
CREATE POLICY "owners create invitations" ON public.family_invitations FOR INSERT TO authenticated WITH CHECK(public.is_family_owner(family_id) AND created_by=auth.uid());
CREATE POLICY "owners revoke invitations" ON public.family_invitations FOR UPDATE TO authenticated USING(public.is_family_owner(family_id)) WITH CHECK(public.is_family_owner(family_id));
CREATE FUNCTION public.accept_family_invitation(_token uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE invitation public.family_invitations; BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'email','')='' THEN RAISE EXCEPTION 'Connexion requise'; END IF;
 SELECT * INTO invitation FROM public.family_invitations WHERE token=_token FOR UPDATE;
 IF NOT FOUND OR invitation.revoked_at IS NOT NULL OR invitation.accepted_at IS NOT NULL OR invitation.expires_at<=now() THEN RAISE EXCEPTION 'Invitation indisponible ou expirée'; END IF;
 IF lower(invitation.email)<>lower(auth.jwt()->>'email') THEN RAISE EXCEPTION 'Connectez-vous avec l’adresse invitée'; END IF;
 IF NOT public.is_family_owner(invitation.family_id) AND EXISTS(SELECT 1 FROM public.family_members WHERE family_id=invitation.family_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Vous faites déjà partie de cette famille'; END IF;
 IF EXISTS(SELECT 1 FROM public.family_members WHERE family_id=invitation.family_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Vous faites déjà partie de cette famille'; END IF;
 INSERT INTO public.family_members(family_id,user_id,role) VALUES(invitation.family_id,auth.uid(),invitation.role);
 UPDATE public.family_invitations SET accepted_at=now() WHERE id=invitation.id;
 RETURN invitation.family_id;
END $$;
REVOKE ALL ON FUNCTION public.accept_family_invitation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_family_invitation(uuid) TO authenticated;
CREATE FUNCTION public.family_member_labels(_family_id uuid) RETURNS TABLE(id uuid,user_id uuid,role public.family_role,display_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT m.id,m.user_id,m.role,p.display_name FROM public.family_members m LEFT JOIN public.profiles p ON p.id=m.user_id WHERE m.family_id=_family_id AND public.is_family_member(_family_id) $$;
REVOKE ALL ON FUNCTION public.family_member_labels(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.family_member_labels(uuid) TO authenticated;
CREATE TABLE public.reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), title text NOT NULL, due_at timestamptz NOT NULL, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders" ON public.reminders FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.entry_photos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE, meal_id uuid REFERENCES public.meals(id) ON DELETE CASCADE, observation_id uuid REFERENCES public.observations(id) ON DELETE CASCADE,
 path text NOT NULL UNIQUE, created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT one_photo_entry CHECK((meal_id IS NULL)<>(observation_id IS NULL))
);
GRANT SELECT,INSERT,DELETE ON public.entry_photos TO authenticated;
GRANT ALL ON public.entry_photos TO service_role;
ALTER TABLE public.entry_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read photos" ON public.entry_photos FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.is_family_member(b.family_id)));
CREATE POLICY "editors add photos" ON public.entry_photos FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE POLICY "editors delete photos" ON public.entry_photos FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE FUNCTION public.validate_entry_photo() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.meal_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.meals WHERE id=NEW.meal_id AND baby_id=NEW.baby_id) THEN RAISE EXCEPTION 'Repas incompatible'; END IF;
 IF NEW.observation_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.observations WHERE id=NEW.observation_id AND baby_id=NEW.baby_id) THEN RAISE EXCEPTION 'Observation incompatible'; END IF;
 IF split_part(NEW.path,'/',1)<>NEW.baby_id::text THEN RAISE EXCEPTION 'Photo incompatible'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER validate_entry_photo BEFORE INSERT ON public.entry_photos FOR EACH ROW EXECUTE FUNCTION public.validate_entry_photo();
CREATE FUNCTION public.can_access_photo(_path text,_edit boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.babies b WHERE b.id::text=split_part(_path,'/',1) AND CASE WHEN _edit THEN public.can_edit_family(b.family_id) ELSE public.is_family_member(b.family_id) END) $$;
REVOKE ALL ON FUNCTION public.can_access_photo(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_access_photo(text,boolean) TO authenticated;
CREATE POLICY "family photo read" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='family-photos' AND public.can_access_photo(name,false));
CREATE POLICY "family photo upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='family-photos' AND public.can_access_photo(name,true));
CREATE POLICY "family photo delete" ON storage.objects FOR DELETE TO authenticated USING(bucket_id='family-photos' AND public.can_access_photo(name,true));