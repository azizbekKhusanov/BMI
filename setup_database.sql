-- Tizimdagi rollarni yaratish 
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Foydalanuvchi profillari 
CREATE TABLE public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rollar jadvali
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role public.app_role DEFAULT 'student'::public.app_role NOT NULL
);

-- Ustozlar ko'shadigan kurslar
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Darslar (Har bir kurs ichidagi)
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_text TEXT,
    content_url TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kursga obuna (Talabaning obunalari va foizlari)
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    progress FLOAT DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_id)
);

-- Testlar bazasi (Darslar ichidagi testlar)
CREATE TABLE public.tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Test Natijalari (Talaba javoblari)
CREATE TABLE public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    answer TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- O'zlashtirish va shaxsiy tahlil
CREATE TABLE public.self_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL,
    reflection TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- AVTOMATIK PROFIL VA ROL TEKSHIRUV (TRIGGER)
-- Yomon muammolarni oldini oladi (qachonki yangi ro'yhatdan otsa ishlaydi)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  selected_role public.app_role;
BEGIN
  -- Profil kiritish
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Foydalanuvchi'));
  
  -- Rol tanlash yoki "student" qo'yish
  selected_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', '')::public.app_role,
    'student'::public.app_role
  );
  
  -- Rolni kiritish
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger ni ishga solish
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Vaqtni yangilovchi funksiya
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Vaqt uchun triggerlar qo'shish
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_lessons_updated BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
