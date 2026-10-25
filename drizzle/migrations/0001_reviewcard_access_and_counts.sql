CREATE FUNCTION public.reviewcard_slug_available(candidate text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT NOT EXISTS(SELECT 1 FROM public.businesses WHERE slug=candidate); $$;
REVOKE ALL ON FUNCTION public.reviewcard_slug_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reviewcard_slug_available(text) TO authenticated;
CREATE FUNCTION public.reviewcard_stats() RETURNS TABLE(business_id uuid,views bigint,clicks bigint,reviews bigint) LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT b.id,count(e.id) FILTER(WHERE e.kind='view'),count(e.id) FILTER(WHERE e.kind='click'),count(e.id) FILTER(WHERE e.kind='review') FROM public.businesses b LEFT JOIN public.scan_events e ON e.business_id=b.id WHERE b.owner_id=auth.uid() GROUP BY b.id; $$;
REVOKE ALL ON FUNCTION public.reviewcard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reviewcard_stats() TO authenticated;
DROP POLICY media_public_read ON storage.objects;
CREATE POLICY media_business_image_read ON storage.objects FOR SELECT TO anon,authenticated USING(bucket_id='business-media' AND ((storage.foldername(name))[1]=auth.uid()::text OR EXISTS(SELECT 1 FROM public.businesses b WHERE b.status='published' AND (b.data->>'logoPath'=name OR b.data->>'coverPath'=name))));