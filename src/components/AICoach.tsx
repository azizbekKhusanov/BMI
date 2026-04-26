import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, MessageSquare, X, Brain, Zap, ArrowRight, Bot } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMetacognitiveFeedback } from '@/lib/groq';
import { motion, AnimatePresence } from 'framer-motion';

interface AICoachProps {
  studentAction?: string;
  performanceData?: Record<string, unknown>;
  triggerOpen?: boolean;
}

const AICoach: React.FC<AICoachProps> = ({ studentAction, performanceData, triggerOpen = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInitialTrigger = useCallback(async () => {
    setIsOpen(true);
    if (studentAction) {
      setLoading(true);
      const feedback = await getMetacognitiveFeedback(studentAction, performanceData || {});
      setMessage(feedback);
      setLoading(false);
    }
  }, [studentAction, performanceData]);

  useEffect(() => {
    if (triggerOpen) {
      handleInitialTrigger();
    }
  }, [triggerOpen, handleInitialTrigger]);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4"
          >
            <Card className="w-80 lg:w-96 border-none shadow-[0_20px_50px_rgba(79,70,229,0.2)] rounded-[2.5rem] bg-white/90 backdrop-blur-2xl overflow-hidden border border-white/20">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest">AI Mentor</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-white/70 font-medium uppercase tracking-tighter">Onlayn Tahlilchi</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <CardContent className="p-8 space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center py-10 space-y-4">
                    <div className="relative">
                       <Zap className="h-10 w-10 text-indigo-600 animate-pulse" />
                       <div className="absolute inset-0 h-10 w-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Tahlil qilinmoqda...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative">
                       <div className="absolute -left-2 top-0 h-full w-1 bg-indigo-600 rounded-full" />
                       <p className="text-slate-700 text-sm font-medium leading-relaxed pl-4">
                         {message || "Salom! Bugun nimalarni o'rganishni rejalashtiryapsiz? Sizning o'rganish jarayoningizni tahlil qilishga tayyorman."}
                       </p>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Siz uchun tavsiya:</p>
                       <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-between group cursor-pointer hover:bg-indigo-100 transition-colors">
                          <span className="text-[11px] font-bold text-indigo-700">Metakognitiv testni boshlash</span>
                          <ArrowRight className="h-4 w-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-16 w-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 ${
          isOpen ? 'bg-white text-indigo-600 rotate-90' : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-indigo-200'
        }`}
      >
        {isOpen ? <X className="h-8 w-8" /> : <Bot className="h-8 w-8" />}
      </motion.button>
    </div>
  );
};

export default AICoach;
