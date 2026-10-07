
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'rss', -- rss | api | web
  url text NOT NULL,
  category text NOT NULL DEFAULT 'Généraliste',
  language text NOT NULL DEFAULT 'fr',
  is_active boolean NOT NULL DEFAULT true,
  sync_status text NOT NULL DEFAULT 'non_connecte', -- non_connecte | ok | erreur | demo
  last_synced_at timestamptz,
  last_error text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  keywords text[] NOT NULL DEFAULT '{}',
  color text,
  detection_method text NOT NULL DEFAULT 'keywords', -- keywords | semantic | ai
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  external_id text,
  title text NOT NULL,
  summary text,
  content text,
  url text,
  author text,
  language text NOT NULL DEFAULT 'fr',
  text_type text NOT NULL DEFAULT 'Actualité',
  type_confidence real,
  keywords text[] NOT NULL DEFAULT '{}',
  importance smallint NOT NULL DEFAULT 1,
  is_demo boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  search tsvector GENERATED ALWAYS AS (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(summary,''))) STORED
);
CREATE INDEX articles_published_idx ON public.articles(published_at DESC);
CREATE INDEX articles_source_idx ON public.articles(source_id);
CREATE INDEX articles_type_idx ON public.articles(text_type);
CREATE INDEX articles_search_idx ON public.articles USING gin(search);
CREATE UNIQUE INDEX articles_external_uidx ON public.articles(source_id, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE public.article_topics (
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  score real NOT NULL DEFAULT 1,
  PRIMARY KEY (article_id, topic_id)
);
CREATE INDEX article_topics_topic_idx ON public.article_topics(topic_id);

CREATE TABLE public.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  include_keywords text[] NOT NULL DEFAULT '{}',
  exclude_keywords text[] NOT NULL DEFAULT '{}',
  source_ids uuid[] NOT NULL DEFAULT '{}',
  text_types text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  frequency text NOT NULL DEFAULT 'quotidienne',
  is_active boolean NOT NULL DEFAULT true,
  alerts_configured boolean NOT NULL DEFAULT false,
  last_analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  watchlist_id uuid REFERENCES public.watchlists(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_created_idx ON public.reports(created_at DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sources','topics','articles','article_topics','watchlists','reports'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Espace démo accessible" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ===== Données de démonstration =====
INSERT INTO public.sources (name, source_type, url, category, language, is_active, sync_status, last_synced_at) VALUES
('Le Courrier du Matin (démo)','rss','https://demo.example/flux/courrier-du-matin.xml','Quotidien national','fr',true,'demo',now() - interval '2 hours'),
('L''Écho économique (démo)','rss','https://demo.example/flux/echo-economique.xml','Économie','fr',true,'demo',now() - interval '3 hours'),
('Radio Métropole Info (démo)','rss','https://demo.example/flux/radio-metropole.xml','Radio','fr',true,'demo',now() - interval '1 hours'),
('Hebdo des Régions (démo)','rss','https://demo.example/flux/hebdo-regions.xml','Régional','fr',true,'demo',now() - interval '1 day'),
('Agence Francophone de Presse (démo)','api','https://demo.example/api/afp-demo','Agence','fr',true,'demo',now() - interval '30 minutes'),
('Le Journal Numérique (démo)','rss','https://demo.example/flux/journal-numerique.xml','Pure player','fr',true,'demo',now() - interval '5 hours'),
('Revue Politique & Société (démo)','web','https://demo.example/revue-politique','Magazine','fr',true,'demo',now() - interval '2 days'),
('Metro Daily Wire (demo)','rss','https://demo.example/feeds/metro-daily.xml','Quotidien anglophone','en',false,'demo',now() - interval '12 days');

INSERT INTO public.topics (name, slug, keywords, color) VALUES
('Intelligence artificielle','ia',ARRAY['intelligence artificielle','IA','algorithme','données'],'chart-1'),
('Crise du logement','logement',ARRAY['logement','loyer','locataires','construction'],'chart-2'),
('Énergie et climat','energie-climat',ARRAY['climat','énergie','carbone','hydroélectricité'],'chart-3'),
('Santé publique','sante',ARRAY['santé','hôpital','urgences','vaccination'],'chart-4'),
('Transport collectif','transport',ARRAY['transport','tramway','métro','autobus'],'chart-5'),
('Économie et inflation','economie',ARRAY['inflation','taux','économie','emploi'],'chart-1'),
('Élections municipales','elections',ARRAY['élections','scrutin','candidat','mairie'],'chart-2'),
('Éducation','education',ARRAY['école','enseignants','élèves','université'],'chart-3'),
('Agriculture','agriculture',ARRAY['agriculteurs','récolte','agroalimentaire','sécheresse'],'chart-4'),
('Culture et médias','culture',ARRAY['culture','festival','médias','cinéma'],'chart-5');

DO $$
DECLARE
  src uuid[]; src_w int[] := ARRAY[18,14,12,9,22,13,7,5];
  tp record; i int; n int; d int; day_ts timestamptz; art uuid; s uuid; ttype text; title text; summ text;
  types text[] := ARRAY['Actualité','Actualité','Actualité','Actualité','Actualité','Analyse','Analyse','Opinion','Opinion','Éditorial','Entrevue','Communiqué','Communiqué','Autre'];
  subjects jsonb := '{
   "ia":["Le gouvernement dévoile un cadre pour encadrer l''intelligence artificielle","Des hôpitaux testent des algorithmes de triage","Les PME face au virage de l''IA générative","Protection des données : la commissaire tire la sonnette d''alarme","Une université lance un institut en intelligence artificielle"],
   "logement":["Les loyers bondissent encore dans les grands centres","Pénurie de logements : les villes réclament des fonds","Des locataires dénoncent des rénovictions","La construction résidentielle ralentit au troisième trimestre","Un programme d''accès à la propriété remanié"],
   "energie-climat":["Nouveau plan de réduction des émissions de carbone","Hydroélectricité : des projets de barrages relancés","Vague de chaleur record : les experts s''inquiètent","Les entreprises et la tarification du carbone","Transition énergétique : le coût de l''inaction"],
   "sante":["Les urgences débordent encore cet hiver","Campagne de vaccination saisonnière lancée","Pénurie d''infirmières : des mesures annoncées","Santé mentale des jeunes : un rapport alarmant","Réforme de la première ligne en santé"],
   "transport":["Le projet de tramway franchit une nouvelle étape","Grève appréhendée dans le transport collectif","Le métro prolongé vers l''est : échéancier revu","Autobus électriques : la flotte s''agrandit","Financement du transport collectif : bras de fer"],
   "economie":["L''inflation ralentit pour un troisième mois","La banque centrale maintient son taux directeur","Le marché de l''emploi montre des signes de fatigue","Panier d''épicerie : les prix restent élevés","Les exportations reculent au deuxième trimestre"],
   "elections":["Élections municipales : la campagne s''intensifie","Un nouveau candidat à la mairie","Taux de participation au scrutin : inquiétudes","Débat des chefs à l''hôtel de ville","Résultats du scrutin : un changement de garde"],
   "education":["Rentrée scolaire sous le signe de la pénurie d''enseignants","Les universités réclament un meilleur financement","Réussite des élèves : nouveau plan ministériel","Écrans en classe : le débat relancé","Négociations avec les enseignants"],
   "agriculture":["Sécheresse : les agriculteurs inquiets pour la récolte","L''agroalimentaire mise sur l''exportation","Relève agricole : un défi grandissant","Prix des intrants : les producteurs à bout","Accord commercial et agriculteurs : réactions"],
   "culture":["Le festival d''été annonce sa programmation","Financement des médias régionaux en péril","Le cinéma francophone brille à l''étranger","Plateformes numériques et contenu local","Une institution culturelle fête ses 50 ans"]
  }';
  -- poids relatifs et tendance (multiplicateur récent)
  base_w jsonb := '{"ia":1.0,"logement":1.2,"energie-climat":1.0,"sante":1.3,"transport":0.8,"economie":1.2,"elections":0.9,"education":0.8,"agriculture":0.5,"culture":0.6}';
  arr jsonb; w real; k int; tsum int := 0;
BEGIN
  PERFORM setseed(0.42);
  SELECT array_agg(id ORDER BY created_at, name) INTO src FROM public.sources;
  SELECT sum(x) INTO tsum FROM unnest(src_w) x;
  FOR tp IN SELECT * FROM public.topics LOOP
    arr := subjects -> tp.slug;
    FOR d IN 0..364 LOOP
      w := (base_w ->> tp.slug)::real;
      -- profils de tendance
      IF tp.slug = 'ia' THEN w := w * (0.4 + 2.2 * (1 - d/364.0)^2);
      ELSIF tp.slug = 'logement' THEN w := w * (0.6 + 1.2 * (1 - d/364.0));
      ELSIF tp.slug = 'elections' THEN w := w * (CASE WHEN d BETWEEN 60 AND 120 THEN 3.5 WHEN d < 30 THEN 0.3 ELSE 0.6 END);
      ELSIF tp.slug = 'energie-climat' THEN w := w * (CASE WHEN d < 14 THEN 2.2 ELSE 1 END);
      ELSIF tp.slug = 'sante' THEN w := w * (0.7 + 0.6 * cos(d/58.0));
      ELSIF tp.slug = 'transport' THEN w := w * (CASE WHEN d < 21 THEN 0.4 ELSE 1 END);
      END IF;
      IF extract(dow FROM now() - d * interval '1 day') IN (0,6) THEN w := w * 0.45; END IF;
      n := floor(random() * w * 1.6 + random() * 0.6)::int;
      FOR i IN 1..n LOOP
        -- choix pondéré de source
        k := floor(random() * tsum)::int; s := NULL;
        FOR j IN 1..array_length(src,1) LOOP
          k := k - src_w[j];
          IF k < 0 THEN s := src[j]; EXIT; END IF;
        END LOOP;
        ttype := types[1 + floor(random() * array_length(types,1))::int];
        title := arr ->> floor(random() * jsonb_array_length(arr))::int;
        IF ttype = 'Opinion' THEN title := 'Opinion — ' || title;
        ELSIF ttype = 'Éditorial' THEN title := 'Éditorial : ' || title;
        ELSIF ttype = 'Entrevue' THEN title := 'Entrevue — « ' || title || ' »';
        ELSIF ttype = 'Analyse' THEN title := 'Analyse : ' || title;
        ELSIF ttype = 'Communiqué' THEN title := 'Communiqué — ' || title;
        END IF;
        summ := 'Texte de démonstration (' || lower(ttype) || ') portant sur « ' || tp.name || ' ». Mots-clés : ' || array_to_string(tp.keywords, ', ') || '. Contenu fictif généré pour illustrer la veille médiatique.';
        day_ts := date_trunc('day', now()) - d * interval '1 day' + (6 + random() * 15) * interval '1 hour';
        IF day_ts > now() THEN day_ts := now() - random() * interval '3 hours'; END IF;
        INSERT INTO public.articles (source_id, title, summary, url, author, language, text_type, type_confidence, keywords, importance, is_demo, published_at)
        VALUES (s, title, summ, 'https://demo.example/article/' || substr(md5(random()::text),1,12), 'Rédaction (démo)',
          CASE WHEN s = src[8] THEN 'en' ELSE 'fr' END, ttype, 0.6 + random()*0.4, tp.keywords,
          CASE WHEN random() < 0.08 THEN 3 WHEN random() < 0.3 THEN 2 ELSE 1 END, true, day_ts)
        RETURNING id INTO art;
        INSERT INTO public.article_topics (article_id, topic_id, score) VALUES (art, tp.id, 1);
      END LOOP;
    END LOOP;
  END LOOP;
  -- quelques co-thématiques
  INSERT INTO public.article_topics (article_id, topic_id, score)
  SELECT a.id, (SELECT id FROM public.topics WHERE slug='economie'), 0.5
  FROM public.articles a JOIN public.article_topics at ON at.article_id=a.id JOIN public.topics t ON t.id=at.topic_id
  WHERE t.slug IN ('logement','agriculture') AND random() < 0.3 ON CONFLICT DO NOTHING;
END $$;

INSERT INTO public.watchlists (name, include_keywords, exclude_keywords, text_types, languages, frequency, alerts_configured, last_analyzed_at) VALUES
('IA et réglementation', ARRAY['intelligence artificielle','IA','algorithme'], ARRAY['jeu vidéo'], ARRAY['Actualité','Analyse','Éditorial'], ARRAY['fr'], 'quotidienne', false, now() - interval '1 day'),
('Logement abordable', ARRAY['logement','loyer'], ARRAY[]::text[], ARRAY[]::text[], ARRAY['fr'], 'quotidienne', true, now() - interval '3 hours'),
('Climat & énergie', ARRAY['climat','carbone','énergie'], ARRAY[]::text[], ARRAY[]::text[], ARRAY['fr','en'], 'hebdomadaire', false, NULL);

INSERT INTO public.reports (title, watchlist_id, period_start, period_end, filters)
SELECT 'Bilan mensuel — ' || w.name, w.id, now() - interval '30 days', now(), '{}'::jsonb FROM public.watchlists w WHERE w.name <> 'Climat & énergie';
