
-- Update trigger to respect role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  selected_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  selected_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', '')::app_role,
    'student'::app_role
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
