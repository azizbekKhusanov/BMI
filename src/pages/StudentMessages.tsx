import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Search, Send, Users, 
         Clock, CheckCheck, ChevronRight, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  courseName?: string;
  courseId?: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  course_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  teacher: Profile;
  lastMessage: Message | null;
  unreadCount: number;
}

const StudentMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1 — O'qituvchilar bilan suhbatlarni yuklash
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Talaba yozilgan kurslarni ol va o'qituvchilarni aniqla
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          course_id,
          courses!inner(id, title, teacher_id)
        `)
        .eq("user_id", user.id);

      if (enrollError || !enrollments) {
        console.error("Enrollments error:", enrollError);
        return;
      }

      // 2. O'qituvchilar profillarini ol
      const teacherIds = [...new Set(enrollments.map(e => (e.courses as any).teacher_id))];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", teacherIds);

      if (profileError || !profiles) {
        console.error("Profiles error:", profileError);
        return;
      }

      // 3. Har bir o'qituvchi bilan oxirgi xabar va o'qilmagan sonini ol
      const convList: Conversation[] = await Promise.all(
        profiles.map(async (teacher) => {
          const { data: lastMsgs } = await supabase
            .from("messages")
            .select("*")
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${teacher.user_id}),and(sender_id.eq.${teacher.user_id},recipient_id.eq.${user.id})`)
            .order("created_at", { ascending: false })
            .limit(1);

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("sender_id", teacher.user_id)
            .eq("recipient_id", user.id)
            .eq("is_read", false);

          const enrollment = (enrollments as any[]).find(
            e => e.courses.teacher_id === teacher.user_id
          );

          return {
            teacher: {
              ...teacher,
              courseName: enrollment?.courses?.title || null,
              courseId: enrollment?.courses?.id || null,
            },
            lastMessage: lastMsgs?.[0] || null,
            unreadCount: unreadCount || 0
          };
        })
      );

      // Oxirgi xabar vaqtiga qarab tartiblash
      convList.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });

      setConversations(convList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2 — Xabarlarni yuklash
  const fetchMessages = useCallback(async (teacher: Profile) => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${teacher.user_id}),and(sender_id.eq.${teacher.user_id},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      setMessages((data as Message[]) || []);

      // O'qilmagan xabarlarni o'qilgan deb belgilash
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", teacher.user_id)
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      setConversations(prev =>
        prev.map(c => c.teacher.user_id === teacher.user_id ? { ...c, unreadCount: 0 } : c)
      );
    } catch (error) {
      toast.error("Xabarlarni yuklashda xatolik");
    }
  }, [user]);

  // 3 — Xabar yuborish
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTeacher || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: selectedTeacher.user_id,
          content: newMessage.trim(),
          is_read: false
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setIsSending(false);
    }
  };

  // 4 — Real-time
  useEffect(() => {
    if (!user || !selectedTeacher) return;

    const channel = supabase
      .channel(`student_messages_${user.id}_${selectedTeacher.user_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.sender_id === selectedTeacher.user_id) {
          setMessages(prev => [...prev, newMsg]);
          supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${user.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedTeacher]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedTeacher) fetchMessages(selectedTeacher);
  }, [selectedTeacher, fetchMessages]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Kecha";
    return date.toLocaleDateString("uz-UZ");
  };

  if (loading) return (
    <div className="w-full pt-8 px-8 space-y-8 animate-pulse">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-3 gap-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm h-[600px]">
        <div className="border-r border-slate-200 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          {[1,2,3].map(i => <div key={i} className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-2 w-2/3" /></div></div>)}
        </div>
        <div className="col-span-2 flex items-center justify-center"><Skeleton className="h-20 w-20 rounded-full" /></div>
      </div>
    </div>
  );

  return (
    <div className="w-full pt-8 px-8 space-y-8 pb-20 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-[#0056d2]" />
          Xabarlar
        </h1>
        <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">
          O'qituvchilar bilan bevosita muloqot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xl shadow-slate-200/50" style={{ height: "calc(100vh - 220px)", minHeight: "550px" }}>
        
        {/* CHAP PANEL — O'qituvchilar */}
        <div className="border-r border-slate-100 flex flex-col bg-slate-50/30">
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O'qituvchini qidirish..."
                className="h-10 pl-10 rounded-xl border-slate-100 text-sm font-bold bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4"><Users className="h-8 w-8 text-slate-200" /></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Suhbatlar mavjud emas</p>
              </div>
            ) : (
              conversations
                .filter(c => c.teacher.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((conv) => (
                  <div
                    key={conv.teacher.user_id}
                    onClick={() => setSelectedTeacher(conv.teacher)}
                    className={`flex items-center gap-4 p-5 cursor-pointer border-b border-slate-50 transition-all ${
                      selectedTeacher?.user_id === conv.teacher.user_id ? "bg-white shadow-sm border-l-4 border-l-[#0056d2]" : "hover:bg-white"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={conv.teacher.avatar_url || undefined} />
                        <AvatarFallback className="bg-blue-50 text-[#0056d2] font-black text-sm">
                          {conv.teacher.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{conv.teacher.full_name}</p>
                        {conv.lastMessage && <span className="text-[10px] font-bold text-slate-400">{formatTime(conv.lastMessage.created_at)}</span>}
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 truncate leading-none mb-1.5 uppercase tracking-wider">{conv.teacher.courseName}</p>
                      <p className="text-xs text-slate-500 truncate font-medium">{conv.lastMessage?.content || "Yangi suhbat boshlang"}</p>
                    </div>
                  </div>
                ))
            )}
          </ScrollArea>
        </div>

        {/* O'NG PANEL — Chat */}
        <div className="col-span-2 flex flex-col bg-white">
          {selectedTeacher ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-5 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border-2 border-slate-50">
                    <AvatarImage src={selectedTeacher.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#0056d2] text-white font-black text-sm">{selectedTeacher.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedTeacher.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-blue-50 text-[#0056d2] border-none text-[10px] font-black px-2 py-0">USTOZ</Badge>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{selectedTeacher.courseName}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl hover:bg-slate-50 text-slate-400"><ChevronRight className="h-5 w-5" /></Button>
              </div>

              <ScrollArea className="flex-1 p-6 bg-slate-50/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="h-20 w-20 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-100"><MessageSquare className="h-10 w-10" /></div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Savollaringiz bormi?</p>
                    <p className="text-xs text-slate-400 font-bold max-w-[250px] mx-auto leading-relaxed">O'qituvchingizga dars yuzasidan savollaringizni yuboring.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] space-y-1.5`}>
                             <div className={`rounded-2xl px-5 py-3 shadow-sm ${isOwn ? "bg-[#0056d2] text-white rounded-br-none" : "bg-white border border-slate-100 text-slate-800 rounded-bl-none"}`}>
                               <p className="text-[13px] font-bold leading-relaxed">{msg.content}</p>
                             </div>
                             <div className={`flex items-center gap-1.5 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{formatTime(msg.created_at)}</span>
                               {isOwn && <CheckCheck className="h-3 w-3 text-blue-400" />}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="p-5 border-t border-slate-50 bg-white">
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Xabar yozing..."
                    className="flex-1 h-12 border-none bg-transparent font-bold text-sm shadow-none focus-visible:ring-0"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="h-12 w-12 rounded-xl bg-[#0056d2] hover:bg-[#00419e] p-0 shrink-0 shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200 shadow-inner">
                <GraduationCap className="h-12 w-12" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 uppercase tracking-tight">O'qituvchini tanlang</p>
                <p className="text-sm text-slate-400 font-bold mt-2 max-w-[300px]">Mavzular bo'yicha tushunmovchiliklar bo'lsa, ustozingizga murojaat qiling.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMessages;
