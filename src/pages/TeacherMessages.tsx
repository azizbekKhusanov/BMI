import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Search, Send, Users, 
         Clock, CheckCheck, ChevronRight } from "lucide-react";
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
  student: Profile;
  lastMessage: Message | null;
  unreadCount: number;
}

const TeacherMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1 — Barcha talabalar bilan suhbatlarni yuklash
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. O'qituvchiga tegishli kurslardagi talabalarni ol
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("user_id, courses!inner(teacher_id)")
        .eq("courses.teacher_id", user.id);

      if (enrollError || !enrollments) {
        console.error("Enrollments error:", enrollError);
        return;
      }

      // 2. Talabalar profillarini alohida ol (chunki relationship yo'q)
      const studentIds = [...new Set(enrollments.map(e => e.user_id))];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", studentIds);

      if (profileError || !profiles) {
        console.error("Profiles error:", profileError);
        return;
      }

      // 3. Har bir talaba bilan oxirgi xabar va o'qilmagan sonini ol
      const convList: Conversation[] = await Promise.all(
        profiles
          .filter(p => p.user_id !== user.id)
          .map(async (student) => {

            const { data: lastMsgs } = await supabase
              .from("messages")
              .select("*")
              .or(`and(sender_id.eq.${user.id},recipient_id.eq.${student.user_id}),and(sender_id.eq.${student.user_id},recipient_id.eq.${user.id})`)
              .order("created_at", { ascending: false })
              .limit(1);

            const { count: unreadCount } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("sender_id", student.user_id)
              .eq("recipient_id", user.id)
              .eq("is_read", false);

            return {
              student,
              lastMessage: lastMsgs?.[0] || null,
              unreadCount: unreadCount || 0
            };
          })
      );

      // Dublikatlarni olib tashlash (user_id bo'yicha)
      const unique = convList.filter((c, i, arr) =>
        arr.findIndex(x => x.student.user_id === c.student.user_id) === i
      );

      // Oxirgi xabar vaqtiga qarab tartiblash
      unique.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at).getTime()
          - new Date(a.lastMessage.created_at).getTime();
      });

      setConversations(unique);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2 — Tanlangan talaba bilan xabarlarni yuklash
  const fetchMessages = useCallback(async (student: Profile) => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${student.user_id}),and(sender_id.eq.${student.user_id},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      setMessages((data as Message[]) || []);

      // O'qilmagan xabarlarni o'qilgan deb belgilash
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", student.user_id)
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      // Unread count ni yangilash
      setConversations(prev =>
        prev.map(c =>
          c.student.user_id === student.user_id ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      toast.error("Xabarlarni yuklashda xatolik");
    }
  }, [user]);

  // 3 — Xabar yuborish
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: selectedStudent.user_id,
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

  // 4 — Real-time xabarlar
  useEffect(() => {
    if (!user || !selectedStudent) return;

    const channel = supabase
      .channel(`messages_${user.id}_${selectedStudent.user_id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.sender_id === selectedStudent.user_id) {
          setMessages(prev => [...prev, newMsg]);
          // O'qilgan deb belgilaymiz
          supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", newMsg.id);
        }
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${user.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedStudent]);

  // 5 — Scroll pastga
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 6 — Talaba tanlanganida
  useEffect(() => {
    if (selectedStudent) fetchMessages(selectedStudent);
  }, [selectedStudent, fetchMessages]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // 7 — Vaqtni formatlash
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return date.toLocaleTimeString("uz-UZ", {
      hour: "2-digit", minute: "2-digit"
    });
    if (days === 1) return "Kecha";
    if (days < 7) return `${days} kun oldin`;
    return date.toLocaleDateString("uz-UZ");
  };

  if (loading) return (
    <div className="w-full pt-8 px-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm" style={{ height: "calc(100vh - 200px)" }}>
        <div className="border-r border-slate-200 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-2 p-8 flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-48 rounded-lg" />
          <Skeleton className="h-3 w-64 rounded-lg" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full pt-8 px-8 space-y-8 pb-20">
      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-[#0056d2]" />
          Xabarlar
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Talabalar bilan to'g'ridan-to'g'ri muloqot
        </p>
      </div>

      {/* Asosiy panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200
                      rounded-xl overflow-hidden bg-white shadow-sm"
           style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>

        {/* CHAP PANEL — Suhbatlar ro'yxati */}
        <div className="border-r border-slate-200 flex flex-col">
          {/* Qidiruv */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Talaba qidirish..."
                className="h-9 pl-9 rounded-lg border-slate-200 text-sm font-medium bg-slate-50"
              />
            </div>
          </div>

          {/* Suhbatlar ro'yxati */}
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">
                  Hozircha suhbatlar yo'q
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Talabalar sizga xabar yuborganida bu yerda ko'rinadi
                </p>
              </div>
            ) : (
              conversations
                .filter(c =>
                  c.student.full_name?.toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((conv) => (
                  <div
                    key={conv.student.user_id}
                    onClick={() => setSelectedStudent(conv.student)}
                    className={`flex items-center gap-3 p-4 cursor-pointer
                                border-b border-slate-50 transition-colors ${
                      selectedStudent?.user_id === conv.student.user_id
                        ? "bg-blue-50 border-l-2 border-l-[#0056d2]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.student.avatar_url || undefined} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm">
                          {conv.student.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-4 w-4
                                        rounded-full bg-[#0056d2] text-white
                                        text-[10px] font-bold flex items-center
                                        justify-center">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {conv.student.full_name}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {formatTime(conv.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.content || "Hozircha xabar yo'q"}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </ScrollArea>
        </div>

        {/* O'NG PANEL — Chat */}
        <div className="col-span-2 flex flex-col">
          {selectedStudent ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedStudent.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm">
                    {selectedStudent.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedStudent.full_name}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">Talaba</p>
                </div>
              </div>

              {/* Xabarlar */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center py-12">
                    <div>
                      <MessageSquare className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400">
                        Hozircha xabarlar yo'q
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Birinchi bo'lib xabar yuboring
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isOwn
                              ? "bg-[#0056d2] text-white rounded-br-sm"
                              : "bg-slate-100 text-slate-900 rounded-bl-sm"
                          }`}>
                            <p className="text-sm leading-relaxed">
                              {msg.content}
                            </p>
                            <div className={`flex items-center gap-1 mt-1 justify-end ${
                              isOwn ? "text-blue-200" : "text-slate-400"
                            }`}>
                              <span className="text-[10px]">
                                {formatTime(msg.created_at)}
                              </span>
                              {isOwn && (
                                <CheckCheck className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Xabar yuborish */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Xabar yozing..."
                    className="flex-1 h-10 rounded-xl border-slate-200 font-medium text-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="h-10 w-10 rounded-xl bg-[#0056d2] hover:bg-[#00419e] p-0 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Talaba tanlanmagan holat */
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-base font-semibold text-slate-700">
                  Talaba tanlang
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Chap paneldan talabani tanlang va xabar yuboring
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherMessages;
