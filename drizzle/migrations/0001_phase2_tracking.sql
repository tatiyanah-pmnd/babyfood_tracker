CREATE TABLE public.meals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
 meal_date date NOT NULL DEFAULT CURRENT_DATE, meal_time time NOT NULL DEFAULT '12:00', kind text NOT NULL DEFAULT 'lunch' CHECK(kind IN ('lunch','snack')),
 dish text NOT NULL DEFAULT '', dessert text NOT NULL DEFAULT '', ingredients text[] NOT NULL DEFAULT '{}', notes text NOT NULL DEFAULT '',
 created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,baby_id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read meals" ON public.meals FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.is_family_member(b.family_id)));
CREATE POLICY "editors add meals" ON public.meals FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE POLICY "editors update meals" ON public.meals FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id))) WITH CHECK(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE POLICY "editors delete meals" ON public.meals FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE TRIGGER meals_updated BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX meals_baby_date ON public.meals(baby_id,meal_date DESC);
CREATE TABLE public.observations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
 meal_id uuid, observed_at timestamptz NOT NULL DEFAULT now(), no_reaction boolean NOT NULL DEFAULT false,
 skin text NOT NULL DEFAULT '', stool text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(meal_id,baby_id) REFERENCES public.meals(id,baby_id) ON DELETE SET NULL (meal_id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.observations TO authenticated;
GRANT ALL ON public.observations TO service_role;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read observations" ON public.observations FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.is_family_member(b.family_id)));
CREATE POLICY "editors add observations" ON public.observations FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE POLICY "editors update observations" ON public.observations FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id))) WITH CHECK(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE POLICY "editors delete observations" ON public.observations FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE INDEX observations_baby_date ON public.observations(baby_id,observed_at DESC);
CREATE TABLE public.baby_food_statuses (
 baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE, food_id text NOT NULL, status text NOT NULL DEFAULT 'discovered' CHECK(status IN ('discovered','review','planned')),
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(baby_id,food_id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.baby_food_statuses TO authenticated;
GRANT ALL ON public.baby_food_statuses TO service_role;
ALTER TABLE public.baby_food_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read food statuses" ON public.baby_food_statuses FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.is_family_member(b.family_id)));
CREATE POLICY "editors add food statuses" ON public.baby_food_statuses FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE POLICY "editors update food statuses" ON public.baby_food_statuses FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id))) WITH CHECK(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE POLICY "editors delete food statuses" ON public.baby_food_statuses FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.babies b WHERE b.id=baby_id AND public.can_edit_family(b.family_id)));
CREATE TRIGGER food_status_updated BEFORE UPDATE ON public.baby_food_statuses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE FUNCTION public.validate_observation() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.no_reaction AND (NEW.skin<>'' OR NEW.stool<>'') THEN RAISE EXCEPTION 'Une observation sans réaction ne peut contenir de symptômes'; END IF; RETURN NEW; END $$;
CREATE TRIGGER validate_observation BEFORE INSERT OR UPDATE ON public.observations FOR EACH ROW EXECUTE FUNCTION public.validate_observation();