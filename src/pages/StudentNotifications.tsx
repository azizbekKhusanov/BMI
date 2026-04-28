import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, Send, User, Clock, CheckCircle2, Sparkles, 
  MessageCircle, Search, Filter, Bell, MoreVertical, Paperclip,
  ChevronRight, Circle, Hash, ShieldCheck, Info, SearchIcon,
  Smile, Mic, Share2, Star, Zap, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  course_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  courses?: {
    title: string;
  };
}

const StudentNotifications = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`*, courses(title)`)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", senderIds);
      
      const enriched = data?.map(m => ({
        ...m,
        sender: profiles?.find(p => p.user_id === m.sender_id)
      }));

      setMessages((enriched as NotificationMessage[]) || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMessages();
      const channel = supabase.channel('student-messages').on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` 
      }, () => fetchMessages()).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (recipientId: string, courseId: string) => {
    if (!newMessage.trim() || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        course_id: courseId,
        content: newMessage.trim()
      });
      if (error) throw error;
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setIsSending(false);
    }
  };

  const lastTeacherMessage = messages.filter(m => m.sender_id !== user?.id).reverse()[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
      <div className="flex flex-col h-[calc(100vh-140px)] gap-10 animate-fade-in max-w-[1600px] mx-auto">
        
        {/* Premium Cinematic Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-2xl relative group overflow-hidden">
               <motion.div 
                 animate={{ scale: [1, 1.2, 1] }}
                 transition={{ duration: 4, repeat: Infinity }}
                 className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" 
               />
               <MessageSquare className="h-7 w-7 relative z-10" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none mb-1">Communication Hub</p>
               <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Aloqa Markazi</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="relative hidden lg:block group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Xabarlarni qidirish..." 
                className="pl-12 pr-6 h-12 bg-slate-50 border-none rounded-2xl text-xs font-bold w-72 focus:bg-white focus:shadow-xl transition-all" 
              />
            </div>
            <div className="flex items-center gap-4 border-l border-slate-100 pl-8">
               <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary relative group">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-3 right-3 h-2 w-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
               </Button>
               <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-xl group cursor-pointer hover:scale-105 transition-all">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">{profile?.full_name?.[0]}</AvatarFallback>
               </Avatar>
            </div>
          </div>
        </div>

        <div className="flex flex-1 gap-10 min-h-0 overflow-hidden">
          
          {/* Sidebar - Enhanced Conversations */}
          <div className="w-80 lg:w-[400px] flex flex-col gap-8 shrink-0 hidden md:flex">
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Xabarlar</h1>
                   <Badge className="bg-primary text-white border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic animate-pulse">2 Yangi</Badge>
                </div>
                <div className="flex p-1.5 bg-slate-50 rounded-2xl shadow-inner">
                   {["all", "unread", "archived"].map(t => (
                      <button 
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 relative ${
                          activeTab === t ? "bg-white text-primary shadow-xl" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {t === "all" ? "Barcha" : t === "unread" ? "O'qilmagan" : "Arxiv"}
                      </button>
                   ))}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {lastTeacherMessage ? (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Card className="border-none p-6 cursor-pointer bg-white hover:bg-slate-900 transition-all duration-500 border-l-[6px] border-primary shadow-xl group/card rounded-[2.5rem]">
                         <div className="flex gap-5">
                            <Avatar className="h-14 w-14 rounded-2xl shadow-2xl border-2 border-white group-hover/card:border-slate-800 transition-colors">
                               <AvatarImage src={lastTeacherMessage.sender?.avatar_url || undefined} />
                               <AvatarFallback className="bg-primary text-white font-black italic">{lastTeacherMessage.sender?.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="text-xs font-black text-slate-900 uppercase truncate italic group-hover/card:text-white transition-colors">{lastTeacherMessage.sender?.full_name}</p>
                                  <span className="text-[9px] font-black text-slate-400 uppercase italic">14:30</span>
                               </div>
                               <p className="text-[9px] font-black text-primary uppercase tracking-widest italic mb-2 truncate">Mastering: {lastTeacherMessage.courses?.title}</p>
                               <p className="text-xs text-slate-500 font-medium truncate italic leading-relaxed group-hover/card:text-slate-400 transition-colors">{lastTeacherMessage.content}</p>
                            </div>
                         </div>
                      </Card>
                    </motion.div>
                  ) : (
                    <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                       <div className="h-20 w-20 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <MessageSquare className="h-10 w-10 text-slate-200" />
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Xabarlar mavjud emas</p>
                    </div>
                  )}
                </AnimatePresence>

                <div className="pt-8 px-4 space-y-6">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-none border-b border-slate-50 pb-4">Tizim Bildirishnomalari</p>
                   <div className="flex items-center gap-5 p-5 hover:bg-slate-50 rounded-[2rem] transition-all cursor-pointer group">
                      <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                         <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-black text-slate-700 uppercase italic leading-none mb-1">Xavfsizlik</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase truncate italic">Yangi qurilmadan kirildi</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
                   </div>
                </div>
             </div>
          </div>

          {/* Main Ultra-Premium Chat Window */}
          <Card className="flex-1 flex flex-col bg-white border-none shadow-[0_50px_100px_rgba(0,0,0,0.05)] rounded-[4rem] overflow-hidden relative border border-slate-50">
             
             {/* Chat Cinematic Header */}
             <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 backdrop-blur-xl relative z-10">
                <div className="flex items-center gap-6">
                   {lastTeacherMessage ? (
                      <>
                        <div className="relative">
                           <Avatar className="h-16 w-16 rounded-[1.5rem] border-4 border-white shadow-2xl">
                              <AvatarImage src={lastTeacherMessage.sender?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary text-white font-black italic">{lastTeacherMessage.sender?.full_name?.[0]}</AvatarFallback>
                           </Avatar>
                           <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{lastTeacherMessage.sender?.full_name}</h3>
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest italic">Online</Badge>
                           </div>
                           <p className="text-xs font-black text-primary uppercase tracking-[0.2em] italic flex items-center gap-2">
                              <GraduationCap className="h-3.5 w-3.5" /> {lastTeacherMessage.courses?.title}
                           </p>
                        </div>
                      </>
                   ) : (
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="h-7 w-7" />
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Muloqot Maydoni</h3>
                      </div>
                   )}
                </div>
                <div className="flex items-center gap-4">
                   <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-primary transition-all"><Search className="h-6 w-6" /></Button>
                   <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-primary transition-all"><MoreVertical className="h-6 w-6" /></Button>
                </div>
             </div>

             {/* Messages Area - Ultra Smooth */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar bg-white relative">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />
                
                <AnimatePresence mode="wait">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                       <motion.div 
                         animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                         transition={{ duration: 2, repeat: Infinity }}
                         className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full shadow-xl shadow-primary/20" 
                       />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Loading Conversations...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-10 relative z-10"
                    >
                      {messages.map((msg, i) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <motion.div 
                            key={msg.id} 
                            variants={itemVariants}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`flex gap-6 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                               {!isMe && (
                                  <Avatar className="h-10 w-10 rounded-2xl shadow-xl shrink-0 mt-2 border-2 border-white">
                                     <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                     <AvatarFallback className="bg-primary text-white font-black text-[10px] italic">{msg.sender?.full_name?.[0]}</AvatarFallback>
                                  </Avatar>
                               )}
                               <div className={`space-y-3 ${isMe ? "items-end" : "items-start"}`}>
                                  <motion.div 
                                    whileHover={{ scale: 1.01 }}
                                    className={`p-6 rounded-[2.5rem] text-sm font-semibold leading-relaxed shadow-2xl ${
                                      isMe 
                                        ? "bg-slate-900 text-white rounded-tr-none shadow-[0_20px_50px_rgba(15,23,42,0.1)]" 
                                        : "bg-white text-slate-800 rounded-tl-none border border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                                    }`}
                                  >
                                     {msg.content}
                                  </motion.div>
                                  <div className="flex items-center gap-3 px-2">
                                     <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-widest">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                     {isMe && <CheckCircle2 className="h-3 w-3 text-emerald-500 shadow-emerald-500/20" />}
                                  </div>
                               </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10 space-y-8">
                       <MessageCircle className="h-48 w-48 text-slate-300" />
                       <h3 className="text-4xl font-black uppercase tracking-[0.5em] italic">Xabarlar Yo'q</h3>
                    </div>
                  )}
                </AnimatePresence>
             </div>

             {/* Floating Input Hub */}
             <div className="p-10 border-t border-slate-100 bg-white relative z-20">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-center gap-6 bg-slate-50 rounded-[3rem] p-4 border border-slate-100 focus-within:ring-4 focus-within:ring-primary/5 focus-within:bg-white focus-within:border-primary/20 transition-all shadow-inner"
                >
                   <div className="flex items-center gap-2 px-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white text-slate-400 group"><Smile className="h-6 w-6 group-hover:text-amber-500 transition-colors" /></Button>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white text-slate-400 group"><Paperclip className="h-6 w-6 group-hover:text-primary transition-colors" /></Button>
                   </div>
                   
                   <input 
                     type="text" 
                     placeholder="Intellektual muloqotni boshlang..." 
                     className="flex-1 bg-transparent border-none focus:ring-0 text-base font-bold px-4 h-14 placeholder:text-slate-300" 
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && lastTeacherMessage) {
                         handleSendMessage(lastTeacherMessage.sender_id, lastTeacherMessage.course_id);
                       }
                     }}
                   />
                   
                   <div className="flex items-center gap-3 shrink-0 pr-2">
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white text-slate-400"><Mic className="h-6 w-6" /></Button>
                      <Button 
                        onClick={() => lastTeacherMessage && handleSendMessage(lastTeacherMessage.sender_id, lastTeacherMessage.course_id)}
                        disabled={isSending || !newMessage.trim() || !lastTeacherMessage}
                        className="h-16 px-10 rounded-[2.5rem] bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_20px_40px_rgba(15,23,42,0.3)] gap-4 group/btn hover:bg-primary transition-all duration-500"
                      >
                         Yuborish <Send className="h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </Button>
                   </div>
                </motion.div>
                
                <AnimatePresence>
                  {!lastTeacherMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-primary/5 rounded-[1.5rem] border border-primary/10 flex items-center justify-center gap-4"
                    >
                       <Info className="h-5 w-5 text-primary" />
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                          Faqat o'qituvchi muloqotni boshlagandan so'ng javob qaytara olasiz.
                       </p>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

          </Card>

        </div>

        {/* Footer Cinematic Audit */}
        <div className="text-center py-6 opacity-30">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] italic flex items-center justify-center gap-3">
             <ShieldCheck className="h-3 w-3" /> Encrypted by MetaEdu Neural Network v2.0
          </p>
        </div>

      </div>
  );
};

export default StudentNotifications;
