# MetaEdu — Metakognitiv Ta'lim Platformasi
## Texnik Topshiriqnoma (Technical Specification)

### 1. Loyiha Haqida Umumiy Ma'lumot
**MetaEdu** — bu zamonaviy o'qitish metodologiyasi (metakognitiv yondashuv) va sun'iy intellekt (AI) imkoniyatlarini birlashtirgan innovatsion ta'lim platformasi. Platforma nafaqat bilim berish, balki talabaning qanday o'rganayotganini tahlil qilishga qaratilgan.

### 2. Maqsad va Vazifalar
- **Maqsad**: Talabalar uchun immersiv (sho'ng'ituvchi) va samarali ta'lim muhitini yaratish.
- **Vazifalar**:
  - Kurslarni oson boshqarish (O'qituvchilar uchun).
  - O'zlashtirishni AI orqali tahlil qilish.
  - Premium darajadagi UI/UX dizayn orqali foydalanuvchi jalb qilish qobiliyatini oshirish.

### 3. Dizayn Konsepsiyasi (Yangi Yo'nalish)
Sayt dizayni to'liq yangilanadi va quyidagi tamoyillarga asoslanadi:
- **Rich Aesthetics**: Foydalanuvchi birinchi ko'rgandayoq "WOW" effektini his qilishi kerak.
- **Ranglar Palitrasi**: Vibrant Indigo, Deep Blue, va Slate tonlari. Gradiyentlardan keng foydalanish.
- **Tipografika**: Zamonaviy Sans-serif shriftlari (Outfit yoki Inter).
- **Shakl**: Yumshoq burchaklar (`rounded-[2.5rem]`), "Glassmorphism" effektlari.
- **Interaktivlik**: Har bir tugma va karta uchun jonli hover effektlar, mikro-animatsiyalar.

### 4. Foydalanuvchi Rollari
1. **Talaba (Student)**:
   - Kurslarni qidirish va yozilish.
   - Darslarni ko'rish (video/matn).
   - O'z-o'zini baholash (Self-assessment) va metakognitiv testlardan o'tish.
   - Shaxsiy natijalar va AI tahlilini ko'rish.
2. **O'qituvchi (Teacher)**:
   - Kurs yaratish va tahrirlash (Settings, Cover Image).
   - Darslar mundarijasini boshqarish.
   - Talabalar o'zlashtirishini nazorat qilish.
   - AI yordamida kurs samaradorligini tahlil qilish.
3. **Admin**:
   - Foydalanuvchilarni boshqarish.
   - Platforma statistikasini ko'rish.

### 5. Texnik Stek (Technology Stack)
- **Frontend**: React.js + Vite + TypeScript.
- **Styling**: Tailwind CSS (maxsus konfiguratsiya bilan).
- **Backend/Database**: Supabase (PostgreSQL).
- **Authentication**: Supabase Auth (Role-based access).
- **Storage**: Supabase Storage (Kurs muqovalari va media fayllar uchun).
- **Icons**: Lucide React.
- **Notifications**: Sonner (Premium toastlar).

### 6. Asosiy Funksional Modullar
- **Course Manager**: Kurslarni yaratish, o'chirish, tahrirlash va e'lon qilish (Publishing system).
- **Content Engine**: Video darslar (YouTube integratsiyasi) va interaktiv matnli kontent.
- **AI Analytics**: Talabalarning o'z-o'zini baholash natijalari asosida metakognitiv tahlil chiqarish.
- **Monitoring Dashboard**: O'qituvchi uchun real vaqtda talabalar progressini ko'rish tizimi.

### 7. Xavfsizlik va Sifat Nazorati
- **Submission Locking**: Ma'lumotlarni qayta-qayta yuborishning oldini olish (Anti-spam).
- **Role Protection**: Sahifalarga faqat tegishli ruxsatnomasi bor foydalanuvchilarni kiritish.
- **Real-time Sync**: Ma'lumotlarning real vaqt rejimida yangilanishi (State management optimallashuvi).

---
*Ushbu hujjat MetaEdu platformasining rivojlanish bosqichlari uchun asosiy qo'llanma hisoblanadi.*
