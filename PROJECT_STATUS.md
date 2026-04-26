# MetaEdu: Loyiha holati va Metakognitiv tizim tahlili

## 🎯 Loyiha mavzusi
**"Talabalarda raqamli metakognitiv ko‘nikmalarni rivojlantiruvchi web-o‘quv platformasini yaratish"**

## 🛠 Texnologik stek
- **Frontend:** React, Vite, Tailwind CSS, Framer Motion.
- **Backend/DB:** Supabase (Auth, Database, Storage).
- **Sun'iy Intellekt:** Groq API (Llama 3.1 70B modeli).
- **Dizayn:** Premium Glassmorphism, Responsive UI.

---

## 🧠 Metakognitiv Siklning Amalga Oshirilishi

Hozirgi kunda platformada metakognitsiyaning to'liq sikli (Metacognitive Cycle) talaba uchun ishchi holatda:

### 1. Kuzatuv va Qo'llab-quvvatlash (Monitoring)
- **AICoach komponenti:** Har bir sahifada talabaga hamrohlik qiluvchi "Aqlli Mentor" o'rnatildi.
- **Vazifasi:** Talabaning harakatlariga qarab yo'nalish berish va muloqot qilish.

### 2. O'quv Jarayoni va Sinov
- **LessonPage:** 
    - Video va matnli darslarni ko'rish imkoniyati.
    - **Dars testi:** Fan doirasidagi bilimlarni tekshirish uchun savol-javoblar.
    - **Progress:** Har bir dars yakunlanganda umumiy kurs progressi avtomatik yangilanadi.

### 3. Refleksiya va Baholash (Reflection & Self-Assessment)
- **Yangi funksiya:** Dars testi yakunlanganda "Metakognitiv Refleksiya" bloki ochiladi.
- **Elementlari:**
    - **Self-Rating:** Talaba o'zlashtirish darajasini 5 ballik tizimda baholaydi.
    - **Reflection Text:** Qaysi qism qiyin bo'lgani haqida yozma fikr qoldiradi.
- **Saqlash:** Ma'lumotlar Supabase'dagi `self_assessments` jadvaliga real vaqtda saqlanadi.

### 4. AI Feedback (Tahliliy munosabat)
- Talaba refleksiyani yakunlashi bilan AI Mentor talabaning natijasini, o'ziga bergan bahosini va yozgan fikrini tahlil qiladi.
- **Metod:** Socratic Method (AI o'ylashga undovchi savollar beradi).

---

## 📊 Dashboard va Analitika

**StudentMetacognition** sahifasi haqiqiy ma'lumotlar bilan bog'landi:
- **Diqqat Indeksi:** Testlardagi to'g'ri javoblar foizi asosida.
- **Refleksiya Sifati:** Refleksiyalar soni va muntazamligi asosida.
- **O'sish Tezligi:** Talabaning aktivligi asosida AI tomonidan hisoblanadigan koeffitsiyent.
- **AI Insights:** Oxirgi refleksiya asosida AI tomonidan berilgan shaxsiy tavsiya.

---

## 📂 Muhim fayllar strukturasi
- `src/lib/groq.ts`: AI xizmati sozlamasi.
- `src/components/AICoach.tsx`: Global AI Mentor interfeysi.
- `src/pages/LessonPage.tsx`: Dars o'tish va refleksiya jarayoni.
- `src/pages/StudentMetacognition.tsx`: Metakognitiv dashboard.

---

## 🚀 Keyingi rejalashtirish uchun nuqtalar
1. **Rejalashtirish (Goal Setting):** Dars boshida maqsad qo'yish tizimi.
2. **Learning Journal:** Barcha o'tmishdagi refleksiyalarni ko'rish.
3. **Gamification:** Metakognitiv yutuqlar (Badges).
4. **O'qituvchi Nazorati:** Talabalarni o'qituvchi panelida kuzatish.
