import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const groq = new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true 
});

export const getMetacognitiveFeedback = async (
  studentAction: string,
  performanceData: Record<string, unknown>
) => {
  if (!apiKey) {
    console.error("GROQ API Key topilmadi! .env faylini tekshiring.");
    return "Kechirasiz, API kalit topilmadi. .env faylini tekshirib ko'ring.";
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Siz "IDROK" platformasining metakognitiv mentorsiz. 
          Sizning vazifangiz talabaga bilim berish emas, balki uning o'rganish jarayonini (Planning, Monitoring, Evaluation) tahlil qilishga yordam berishdir.
          
          Muloqot strategiyasi:
          1. PLANNING (Darsdan oldin): Talabaning maqsadini eshitib, unga mos metakognitiv strategiya tavsiya qiling (masalan: "Eslatma olish", "Vizualizatsiya").
          2. MONITORING (Dars paytida): Talabaga o'zini kuzatishni eslatib turing.
          3. EVALUATION (Darsdan keyin): Talabaning "Before vs After" natijasini va "Calibration" (aniqlik) darajasini tahlil qilib bering. 
          
          Qoidalar:
          - Sokratik metod: To'g'ridan-to'g'ri javob bermang, savol bering.
          - Qisqa va londa gapiring (3-4 gap).
          - O'zbek tilida gapiring.`
        },
        {
          role: "user",
          content: `Talaba harakati: ${studentAction}. 
          Natijalar: ${JSON.stringify(performanceData)}. 
          Ushbu holat yuzasidan talabaga metakognitiv feedback bering.`
        }
      ],
      model: "llama-3.3-70b-versatile", 
      temperature: 0.7,
      max_tokens: 500,
    });

    return chatCompletion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Kechirasiz, hozirda feedback bera olmayman. Lekin o'z ustingizda ishlashda davom eting!";
  }
};

export const getGroqChatResponse = async (
  messages: {role: "system" | "user" | "assistant", content: string}[]
) => {
  if (!apiKey) {
    return "API kalit o'rnatilmagan (VITE_GROQ_API_KEY). Iltimos o'rnating.";
  }
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Siz "IDROK" dasturlash platformasining shaxsiy sun'iy intellekt yordamchisisiz. 
          Sizning VAZIFANGIZ FAQAT DASTURLASH, IT, TEXNOLOGIYALAR VA O'QUV JARAYONIGA OID savollarga javob berish.
          QAT'IY QOIDA: Agar foydalanuvchi dasturlashdan yoki platformadan tashqari mavzularda (masalan: ob-havo, tarix, siyosat, kino, sport va hokazo) savol bersa, muloyimlik bilan rad eting va darsga qaytarishga harakat qiling.
          Rad etish namunasi: "Kechirasiz, men faqat dasturlash va IDROK platformasiga oid savollarga javob bera olaman. Dars yuzasidan qanday yordam bera olaman?"
          Talaba bilan o'zbek tilida, qisqa, do'stona va motivatsion ruhda gaplashing.`
        },
        ...messages
      ],
      model: "llama-3.3-70b-versatile", 
      temperature: 0.7,
      max_tokens: 600,
    });

    return chatCompletion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Groq Chat API Error:", error);
    return "Kechirasiz, ulanishda xatolik yuz berdi.";
  }
};

export const generateLessonTests = async (topic: string, courseName: string, count: number = 10) => {
  if (!apiKey) return null;
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Sen IDROK platformasining test tuzuvchi yordamchisisan.
          Sening vazifang "${courseName}" kursi doirasidagi "${topic}" mavzusi bo'yicha ${count} ta test (multiple choice) yaratish. Dasturlash tili yoki texnologiya nima ekanligi kurs nomidan ('${courseName}') kelib chiqishi shart. Boshqa til yoki mavzuga aslo adashib ketma!
          Har bir testda 4 ta variant (options) va 1 ta to'g'ri javob (correct_answer) bo'lishi shart.
          Faqat va faqat quyidagi JSON formatida javob ber (hech qanday qo'shimcha matnsiz):
          {
            "tests": [
              {
                "question": "Savol matni",
                "options": ["A variant", "B variant", "C variant", "D variant"],
                "correct_answer": "To'g'ri variant matni"
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Kurs nomi: ${courseName}\nMavzu: ${topic}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return parsed.tests;
  } catch (e) {
    console.error("Test generation error:", e);
    return null;
  }
};

export const analyzeReflection = async (
  studentName: string,
  lessonTitle: string,
  courseName: string,
  reflection: string,
  rating: number,
  calibration: number | null
): Promise<string> => {
  if (!apiKey) return "API kalit topilmadi.";

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Siz IDROK platformasining metakognitiv tahlil ekspertisiz.
Vazifangiz: talabaning refleksiyasini o'qib, o'qituvchiga qisqa va aniq tahlil berish.

Javob FAQAT quyidagi JSON formatida bo'lsin:
{
  "depth": "sirtaki" | "o'rtacha" | "chuqur",
  "mainIssue": "talabaning asosiy muammosi 1 gapda",
  "recommendation": "o'qituvchiga tavsiya 1-2 gapda",
  "positives": "refleksiyaning kuchli tomoni 1 gapda"
}

Qoidalar:
- Faqat JSON qaytaring, boshqa matn yo'q
- O'zbek tilida yozing
- Qisqa va aniq bo'ling`
        },
        {
          role: "user",
          content: `Talaba: ${studentName}
Kurs: ${courseName}
Dars: ${lessonTitle}
Baho (1-5): ${rating}
Aniqlik farqi: ${calibration !== null ? calibration : "Ma'lumot yo'q"}
Refleksiya matni: ${reflection}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });

    return chatCompletion.choices[0]?.message?.content || "{}";
  } catch (error) {
    console.error("Reflection analysis error:", error);
    return "{}";
  }
};
