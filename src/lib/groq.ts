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
          content: `Siz "MetaEdu" platformasining metakognitiv mentorsiz. 
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
      model: "llama3-70b-8192", 
      temperature: 0.7,
      max_tokens: 500,
    });

    return chatCompletion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Kechirasiz, hozirda feedback bera olmayman. Lekin o'z ustingizda ishlashda davom eting!";
  }
};
