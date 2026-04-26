import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, User, Clock, CheckCircle2, Sparkles, Brain, GraduationCap, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useCallback } from "react";

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

/**
 * StudentNotifications Page
 * Now acts as the central hub for Student-Teacher communication (Chat).
 */
const StudentNotifications = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          courses(title)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Enrich with sender profiles
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

  const enrichAndAddMessage = useCallback(async (msg: NotificationMessage) => {
    const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", msg.sender_id).single();
    const { data: course } = await supabase.from("courses").select("title").eq("id", msg.course_id).single();
    
    const enriched = { ...msg, sender: profile, courses: course };
    setMessages((prev) => [...prev, enriched]);
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
      
      // Realtime subscription for incoming messages
      const channel = supabase
        .channel('student-messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `recipient_id=eq.${user.id}` 
        }, (payload) => {
          // Fetch sender profile to show the correct avatar/name
          enrichAndAddMessage(payload.new);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchMessages, enrichAndAddMessage]);

  const handleSendMessage = async (recipientId: string, courseId: string) => {
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    try {
      const { data, error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        course_id: courseId,
        content: newMessage.trim()
      }).select().single();

      if (error) throw error;
      
      const { data: myProfile } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single();
      const { data: course } = await supabase.from("courses").select("title").eq("id", courseId).single();
      const enrichedMsg = { ...data, sender: myProfile, courses: course };
      
      setMessages((prev) => [...prev, enrichedMsg]);
      setNewMessage("");
    } catch (error) {
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setIsSending(false);
    }
  };

  const lastTeacherMessage = messages.filter(m => m.sender_id !== user?.id).reverse()[0];

  return (
    <Layout>
      <div className="container py-10 space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black font-serif tracking-tight flex items-center gap-4 text-slate-800 uppercase">
              <MessageCircle className="h-10 w-10 text-indigo-600" /> Muloqot va Xabarlar
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">O'qituvchilaringizdan kelgan tavsiya va ko'rsatmalar</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
               <User className="h-3.5 w-3.5" /> O'qituvchilar
             </h3>
             <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden p-2">
                {lastTeacherMessage ? (
                  <div className="p-4 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center gap-4">
                     <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                        <AvatarImage src={lastTeacherMessage.sender?.avatar_url} />
                        <AvatarFallback className="bg-indigo-600 text-white font-black">{lastTeacherMessage.sender?.full_name?.charAt(0)}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">{lastTeacherMessage.sender?.full_name}</p>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase truncate">{lastTeacherMessage.courses?.title}</p>
                     </div>
                     <Badge className="bg-indigo-600 rounded-full h-2 w-2 p-0 animate-pulse" />
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-400 italic text-sm">Hali o'qituvchilardan xabar kelmagan.</div>
                )}
             </Card>

             <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[2.5rem] overflow-hidden p-8 relative">
                <Sparkles className="absolute top-4 right-4 h-6 w-6 opacity-20" />
                <div className="relative z-10">
                   <h4 className="text-3xl font-black leading-none mb-1">{messages.length}</h4>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Jami xabarlar</p>
                   <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/10">
                      <CheckCircle2 className="h-3 w-3" /> Faol aloqa
                   </div>
                </div>
                <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
             </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-none shadow-2xl bg-white rounded-[3.5rem] overflow-hidden flex flex-col h-[700px] border">
               <CardHeader className="border-b bg-slate-50/50 p-8 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Muloqot oynasi</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">O'qituvchi bilan jonli muloqot</CardDescription>
                  </div>
                  {lastTeacherMessage && (
                    <Badge variant="outline" className="rounded-full border-2 border-indigo-100 bg-white px-4 py-1.5 text-[10px] font-black uppercase text-indigo-600 animate-in fade-in zoom-in">
                       {lastTeacherMessage.courses?.title}
                    </Badge>
                  )}
               </CardHeader>
               
               <CardContent className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/20">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                       <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                       <p className="text-xs font-black uppercase tracking-widest text-slate-400">Yuklanmoqda...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, index) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                          <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isMe && (
                              <Avatar className="h-8 w-8 shrink-0 mt-1 shadow-sm">
                                <AvatarImage src={msg.sender?.avatar_url} />
                                <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-black">{msg.sender?.full_name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                               <div className={`p-4 rounded-[1.5rem] tracking-tight font-medium ${
                                 isMe 
                                   ? 'bg-slate-900 text-white rounded-tr-none shadow-xl shadow-slate-100' 
                                   : 'bg-white text-slate-800 rounded-tl-none border shadow-sm'
                               }`}>
                                 {msg.content}
                               </div>
                               <div className="flex items-center gap-2 px-1">
                                  {!isMe && <span className="text-[9px] font-black uppercase text-indigo-500 tracking-tighter">{msg.sender?.full_name}</span>}
                                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                     <Clock className="h-2.5 w-2.5" /> {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                               </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-10">
                       <MessageCircle className="h-20 w-20 mb-4 text-slate-300" />
                       <h3 className="text-2xl font-black uppercase tracking-widest text-slate-400">Xabarlar yo'q</h3>
                       <p className="text-sm font-bold text-slate-400 mt-2">O'qituvchingiz biror tavsiya berganda bu yerda ko'rinadi.</p>
                    </div>
                  )}
               </CardContent>

               <div className="p-8 border-t bg-white">
                  <div className="flex gap-4 items-center bg-slate-100 p-2 rounded-[2rem] border focus-within:ring-2 focus-within:ring-indigo-600 focus-within:bg-white transition-all">
                     <Input 
                       placeholder="Javob yozing..." 
                       className="border-none bg-transparent focus-visible:ring-0 text-base font-medium px-4 h-12"
                       value={newMessage}
                       onChange={(e) => setNewMessage(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && lastTeacherMessage) {
                           handleSendMessage(lastTeacherMessage.sender_id, lastTeacherMessage.course_id);
                         }
                       }}
                     />
                     <Button 
                       onClick={() => lastTeacherMessage && handleSendMessage(lastTeacherMessage.sender_id, lastTeacherMessage.course_id)}
                       disabled={isSending || !newMessage.trim() || !lastTeacherMessage}
                       className="rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 h-12 px-6 shadow-lg shadow-indigo-100 gap-2 shrink-0"
                     >
                        <span className="font-black uppercase tracking-widest text-[10px]">Yuborish</span>
                        <Send className="h-4 w-4" />
                     </Button>
                  </div>
                  {!lastTeacherMessage && (
                    <p className="text-center text-[9px] font-black uppercase text-slate-400 mt-3 tracking-widest">
                       Faqat o'qituvchi sizga xabar yuborgandan so'ng javob qaytara olasiz.
                    </p>
                  )}
               </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentNotifications;
