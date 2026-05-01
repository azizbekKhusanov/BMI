import { motion } from "framer-motion";
import { MessageSquare, Search, Send, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TeacherMessages = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-[#0056d2]" />
            Xabarlar
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Talabalar bilan muloqot va tizim xabarlari</p>
        </div>
      </div>

      <Card className="border-none shadow-md bg-white/60 backdrop-blur-xl">
        <CardContent className="p-16 flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="h-10 w-10 text-[#0056d2]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tez orada ishga tushadi</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Ushbu bo'lim orqali siz talabalar bilan to'g'ridan-to'g'ri muloqot qilishingiz, vazifalar bo'yicha fikr-mulohazalar qoldirishingiz va muhim xabarlarni yuborishingiz mumkin bo'ladi.
          </p>
          <Button className="bg-[#0056d2] hover:bg-blue-700">
            Bosh sahifaga qaytish
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeacherMessages;
