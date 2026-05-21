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
  const [messagesLoading, setMessagesLoading] = useState(false); // Faqat xabarlar uchun alohida loading
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1 — O'qituvchilar bilan suhbatlarni yuklash (OPTIMIZED: bitta bulk so'rov)
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Talaba yozilgan kurslarni ol
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select(`course_id, courses!inner(id, title, teacher_id)`)
        .eq("user_id", user.id);

      if (enrollError || !enrollments?.length) { setLoading(false); return; }

      const teacherIds = [...new Set(enrollments.map(e => (e.courses as any).teacher_id))];

      // 2. Barcha o'qituvchilar profillarini VA barcha xabarlarni PARALLEL yuk
      const [profilesRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", teacherIds),
        supabase.from("messages").select("*")
          .or(teacherIds.map(tid => `and(sender_id.eq.${user.id},recipient_id.eq.${tid}),and(sender_id.eq.${tid},recipient_id.eq.${user.id})`).join(","))
          .order("created_at", { ascending: false })
      ]);

      const profiles = profilesRes.data || [];
      const allMessages = messagesRes.data || [];

      // 3. Xabarlarni teacher bo'yicha guruhlash (DB so'rovsiz)
      const convList: Conversation[] = profiles.map(teacher => {
        const teacherMessages = allMessages.filter(m =>
          (m.sender_id === user.id && m.recipient_id === teacher.user_id) ||
          (m.sender_id === teacher.user_id && m.recipient_id === user.id)
        );
        const lastMessage = teacherMessages[0] || null;
        const unreadCount = teacherMessages.filter(m => m.sender_id === teacher.user_id && !m.is_read).length;
        const enrollment = (enrollments as any[]).find(e => e.courses.teacher_id === teacher.user_id);
        return {
          teacher: { ...teacher, courseName: enrollment?.courses?.title || null, courseId: enrollment?.courses?.id || null },
          lastMessage,
          unreadCount
        };
      });

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

  // 2 — Xabarlarni yuklash (alohida messagesLoading, sahifani qayta render qilmaydi)
  const fetchMessages = useCallback(async (teacher: Profile) => {
    if (!user) return;
    setMessagesLoading(true);
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${teacher.user_id}),and(sender_id.eq.${teacher.user_id},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      setMessages((data as Message[]) || []);

      await supabase.from("messages").update({ is_read: true })
        .eq("sender_id", teacher.user_id).eq("recipient_id", user.id).eq("is_read", false);

      setConversations(prev =>
        prev.map(c => c.teacher.user_id === teacher.user_id ? { ...c, unreadCount: 0 } : c)
      );
    } catch (error) {
      toast.error("Xabarlarni yuklashda xatolik");
    } finally {
      setMessagesLoading(false);
    }
  }, [user]);

  // 3 — Xabar yuborish
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTeacher || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // selectedTeacher o'zgarganda conversations qayta yuklanmaydi — faqat xabarlar
  useEffect(() => {
    if (selectedTeacher) fetchMessages(selectedTeacher);
  }, [selectedTeacher]); // fetchMessages dependency olib tashlandi — cheksiz loop oldini olish uchun

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

  const filteredConversations = conversations.filter(c =>
    c.teacher.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full px-6 py-8 space-y-8 pb-20 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Xabarlar</h1>
            <p className="text-xs font-semibold text-slate-400">O'qituvchilar bilan bevosita muloqot</p>
          </div>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-xl shadow-slate-100/60"
        style={{ height: "calc(100vh - 240px)", minHeight: "560px" }}
      >
        {/* LEFT PANEL — Conversations */}
        <div className="border-r border-slate-100 flex flex-col bg-slate-50/40">

          {/* Search */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidirish..."
                className="h-11 pl-10 rounded-xl border-slate-100 bg-slate-50 text-sm focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 p-3 animate-pulse">
                    <div className="h-11 w-11 rounded-2xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-3/4 bg-slate-100 rounded" />
                      <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <Users className="h-10 w-10 text-slate-200" />
                <p className="text-sm font-semibold text-slate-400">Suhbatlar mavjud emas</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedTeacher?.user_id === conv.teacher.user_id;
                return (
                  <button
                    key={conv.teacher.user_id}
                    onClick={() => setSelectedTeacher(conv.teacher)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-slate-50 last:border-0 ${
                      isSelected
                        ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                        : "hover:bg-white"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={conv.teacher.avatar_url || undefined} />
                        <AvatarFallback className={`font-bold text-sm ${isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                          {conv.teacher.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-bold text-slate-900 truncate">{conv.teacher.full_name}</p>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(conv.lastMessage.created_at)}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-indigo-500 font-semibold truncate mb-0.5">{conv.teacher.courseName}</p>
                      <p className="text-xs text-slate-400 truncate">{conv.lastMessage?.content || "Suhbat boshlang"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </ScrollArea>
        </div>

        {/* RIGHT PANEL — Chat */}
        <div className="col-span-2 flex flex-col bg-white">
          {selectedTeacher ? (
            <div className="flex flex-col h-full">

              {/* Chat Header */}
              <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedTeacher.avatar_url || undefined} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">{selectedTeacher.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{selectedTeacher.full_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-400">{selectedTeacher.courseName}</span>
                  </div>
                </div>
                <Badge className="bg-indigo-50 text-indigo-600 border-none text-xs font-semibold">Ustoz</Badge>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 px-6 py-4 bg-slate-50/30">
                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
                      <p className="text-xs text-slate-400">Xabarlar yuklanmoqda...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-1">Savollaringiz bormi?</p>
                      <p className="text-xs text-slate-400 max-w-[220px]">O'qituvchingizga dars yuzasidan savollaringizni yuboring.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[72%] space-y-1">
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              isOwn
                                ? "bg-indigo-600 text-white rounded-br-md"
                                : "bg-white border border-slate-100 text-slate-800 rounded-bl-md shadow-sm"
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                              <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                              {isOwn && <CheckCheck className="h-3 w-3 text-indigo-400" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Xabar yozing..."
                    className="flex-1 h-11 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="h-10 w-10 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0 shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-5">
              <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <GraduationCap className="h-10 w-10" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-700 mb-2">O'qituvchini tanlang</p>
                <p className="text-sm text-slate-400 max-w-[260px]">Mavzular bo'yicha savollaringiz bo'lsa, ustozingizga murojaat qiling.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMessages;


