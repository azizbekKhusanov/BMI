import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, FileText, Loader2, Target, Check, Clock, 
  Pencil, Trash2, ClipboardList, Sparkles, Brain,
  ChevronLeft, ChevronRight, BrainCircuit, Play, Zap,
  ArrowRight, Lock, Layers, Globe, Activity, Plus
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateLessonTests, getMetacognitiveFeedback, getGroqChatResponse } from "@/lib/groq";
import { motion, AnimatePresence } from "framer-motion";

interface Course { id: string; title: string; }
interface Lesson { id: string; title: string; content_type: string; content_url: string; content_text?: string; course_id: string; order_index: number; courses?: Course; }
interface Test { id: string; lesson_id: string; question: string; options: string[]; correct_answer: string; }

const formatInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic text-slate-700">{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
};

const FormattedText = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-4 text-slate-700 leading-relaxed text-lg">
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-bold text-slate-900 mt-8 mb-4">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-bold text-slate-900 mt-6 mb-3">{line.slice(3)}</h2>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={idx} className="flex items-start gap-3 py-1"><div className="h-2 w-2 rounded-full bg-blue-600 mt-2.5 shrink-0" /><span>{formatInline(line.slice(2))}</span></div>;
        return <p key={idx}>{formatInline(line)}</p>;
      })}
    </div>
  );
};

const LessonPage = () => {
  const { id } = useParams();
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const isTeacher = roles?.includes('teacher') || roles?.includes('admin') || false;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
  
  // Student States
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [reflection1, setReflection1] = useState("");
  const [aiReflectionResult, setAiReflectionResult] = useState("");
  const [isAnalyzingReflection, setIsAnalyzingReflection] = useState(false);
  const [planningStarted, setPlanningStarted] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(true);
  const [planningStep, setPlanningStep] = useState(1);
  const [planGoal, setPlanGoal] = useState("");
  const [planLevel, setPlanLevel] = useState("");
  const [planTime, setPlanTime] = useState("");
  const [aiSmartPlan, setAiSmartPlan] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);

  // Chat States
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // Teacher Edit States
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [editForm, setEditForm] = useState({ question: "", options: ["", "", "", ""], correct_answer: "" });
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [editLessonOpen, setEditLessonOpen] = useState(false);
  const [editLessonData, setEditLessonData] = useState({ title: "", content_type: "video", video_url: "", content: "", video_content: "" });
  const [isUpdatingLesson, setIsUpdatingLesson] = useState(false);

  const playerRef = useRef<any>(null);
  const testsRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!id || !user) return;
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (e) { }
      playerRef.current = null;
    }
    setLoading(true);
    try {
      const { data: lessonData } = await supabase.from("lessons").select(`*, courses (id, title)`).eq("id", id).single();
      setLesson(lessonData as any);
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData as Test[] || []);
      const { data: assessments } = await supabase.from("self_assessments").select("*").eq("lesson_id", id).eq("user_id", user.id).maybeSingle();
      if (assessments) { setSubmitted(true); setReflection1(assessments.reflection || ""); setPlanningStarted(true); setVideoFinished(true); }
      if (isTeacher) { setPlanningStarted(true); setVideoFinished(true); }
      
      // Fetch completed lessons for locking logic
      const { data: allAssessments } = await supabase.from('self_assessments').select('lesson_id').eq('user_id', user.id);
      if (allAssessments) setCompletedLessonIds(allAssessments.map(a => a.lesson_id));

      if (lessonData) {
        const { data: allLessons } = await supabase.from("lessons").select("id, title, order_index").eq("course_id", lessonData.course_id).order("order_index", { ascending: true });
        if (allLessons) {
          setCourseLessons(allLessons as any);
          const currentIndex = allLessons.findIndex(l => l.id === id);
          setPrevLessonId(currentIndex > 0 ? allLessons[currentIndex - 1].id : null);
          setNextLessonId(currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null);
        }
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [id, user?.id, isTeacher]);

  useEffect(() => { window.scrollTo(0, 0); fetchData(); }, [fetchData]);

  const initPlayer = useCallback(() => {
    const match = (lesson?.content_url || "").match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    if (!videoId || !document.getElementById('youtube-player') || playerRef.current) return;
    playerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId, playerVars: { 'modestbranding': 1, 'rel': 0, 'controls': 1, 'enablejsapi': 1 },
      events: { 'onStateChange': (event: any) => { if (event.data === 0 && !isTeacher) { setVideoFinished(true); toast.success("Dars yakunlandi!"); } } }
    });
  }, [lesson, isTeacher]);

  useEffect(() => {
    if (!loading && (isTeacher || planningStarted) && (lesson?.content_type === 'video' || lesson?.content_type === 'mixed')) {
      const timer = setTimeout(() => {
        if (!(window as any).YT) {
          const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api"; document.body.appendChild(tag);
          (window as any).onYouTubeIframeAPIReady = initPlayer;
        } else initPlayer();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, planningStarted, isTeacher, lesson, initPlayer]);

  const handleGeneratePlan = async () => {
    if (!planGoal || !planTime || !planLevel) { toast.error("Barcha savollarga javob bering!"); return; }
    setIsGeneratingPlan(true);
    try {
      const prompt = `Talaba darsni boshlamoqchi. Maqsad: ${planGoal}. Daraja: ${planLevel}. Vaqt: ${planTime}. Dars: ${lesson?.title}. SMART reja va metakognitiv tavsiya bering.`;
      const response = await getGroqChatResponse([{ role: "user", content: prompt }]);
      setAiSmartPlan(response || "Xatolik."); setPlanningStep(2);
    } catch (e) { toast.error("AI xatolik"); } finally { setIsGeneratingPlan(false); }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isAiTyping) return;
    const msg = chatMessage.trim(); setChatMessage("");
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]); setIsAiTyping(true);
    try {
      const response = await getGroqChatResponse([{ role: 'user', content: msg }]);
      setChatHistory(prev => [...prev, { role: 'ai', text: response || "..." }]);
    } catch (e) { } finally { setIsAiTyping(false); }
  };

  const handleGenerateTests = async () => {
    if (!lesson?.title || !id) return;
    setIsGeneratingTests(true);
    try {
      const generated = await generateLessonTests(lesson.title, lesson.courses?.title || "Kurs", 10);
      if (generated) {
        const inserts = generated.map((t: any) => ({ lesson_id: id, question: t.question, options: t.options, correct_answer: t.correct_answer }));
        await supabase.from('tests').delete().eq('lesson_id', id);
        const { data, error } = await supabase.from('tests').insert(inserts).select();
        if (!error && data) { setTests(data as any); toast.success("Testlar yangilandi!"); }
      }
    } catch (e) { } finally { setIsGeneratingTests(false); }
  };

  const handleSubmitTests = async () => {
    if (!user || Object.keys(answers).length < tests.length) { toast.error("Barcha testlarni yeching!"); return; }
    const newResults: Record<string, boolean> = {};
    const inserts = tests.map(t => {
      const isCorrect = answers[t.id] === t.correct_answer;
      newResults[t.id] = isCorrect;
      return { user_id: user.id, test_id: t.id, answer: answers[t.id], is_correct: isCorrect };
    });
    setResults(newResults); setSubmitted(true);
    await supabase.from("test_results").insert(inserts);
    toast.success("Testlar topshirildi!");
  };

  const handleAnalyzeReflection = async () => {
    if (!user || !id) return;
    setIsAnalyzingReflection(true);
    try {
      const correctCount = Object.values(results).filter(Boolean).length;
      const feedback = await getMetacognitiveFeedback(reflection1, { score: `${correctCount}/${tests.length}` });
      setAiReflectionResult(feedback || "");
      await supabase.from('self_assessments').upsert({ user_id: user.id, lesson_id: id, rating: 5, reflection: reflection1 });
      toast.success("Tahlil yakunlandi!");
    } catch (error) { } finally { setIsAnalyzingReflection(false); }
  };

  const handleUpdateLesson = async () => {
    if (!lesson) return;
    setIsUpdatingLesson(true);
    try {
      const { error } = await supabase.from("lessons").update({
        title: editLessonData.title, content_type: editLessonData.content_type,
        content_url: editLessonData.video_url, content_text: editLessonData.content_type === 'text' ? editLessonData.content : editLessonData.video_content
      }).eq("id", lesson.id);
      if (error) throw error;
      toast.success("Dars muvaffaqiyatli yangilandi!");
      setEditLessonOpen(false);
      fetchData();
    } catch (error) { toast.error("Saqlashda xatolik yuz berdi"); } finally { setIsUpdatingLesson(false); }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-10 w-10 text-indigo-600" /></div>;

  // --- RENDER TEACHER UI ---
  if (isTeacher) {
    return (
      <div className="flex-1 w-full p-6 lg:p-10 space-y-8 animate-fade-in max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-100 pb-6">
           <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-100 bg-indigo-50/30">Modul {lesson?.order_index || 1}</Badge>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{lesson?.title}</h1>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <Button onClick={() => { setEditLessonData({ title: lesson?.title || "", content_type: lesson?.content_type || "video", video_url: lesson?.content_url || "", content: lesson?.content_text || "", video_content: lesson?.content_text || "" }); setEditLessonOpen(true); }} variant="outline" className="h-10 px-5 rounded-xl text-slate-600 font-semibold border-slate-200 hover:bg-slate-50 gap-2">
                <Pencil className="h-4 w-4" /> Darsni Tahrirlash
              </Button>
              <div className="h-8 w-[1px] bg-slate-100 mx-1" />
              <Button variant="ghost" disabled={!prevLessonId} onClick={() => navigate(`/lessons/${prevLessonId}`)} className="h-10 px-4 rounded-xl text-slate-500 font-bold hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4 mr-1" /> Oldingi
              </Button>
              <Button disabled={!nextLessonId} onClick={() => navigate(`/lessons/${nextLessonId}`)} className="h-10 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm shadow-indigo-100">
                Keyingi <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8 space-y-8">
              <Card className="rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 bg-slate-900 aspect-video relative">
                 {(lesson?.content_type === 'video' || lesson?.content_type === 'mixed') ? (
                    <div id="youtube-player" className="w-full h-full" />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/30">
                       <FileText className="h-16 w-16 text-indigo-200 mb-4" />
                       <p className="text-indigo-900/40 font-bold">Matnli dars materiali</p>
                    </div>
                 )}
              </Card>
              {lesson?.content_text && <Card className="rounded-[1.5rem] p-8 md:p-12 shadow-sm border border-slate-100 bg-white"><FormattedText content={lesson.content_text} /></Card>}
           </div>

           <div className="lg:col-span-4 lg:h-full">
              <div className="lg:sticky lg:top-8 h-full relative min-h-[450px]">
                <Card className="rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col bg-white lg:absolute lg:inset-0">  
                   <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-none">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Kurs mundarijasi</h3>
                      <span className="text-[10px] font-bold text-slate-400">{courseLessons.length} dars</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                      {courseLessons.map((l, i) => (
                         <button key={l.id} onClick={() => navigate(`/lessons/${l.id}`)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${l.id === id ? "bg-indigo-50 border border-indigo-100 shadow-sm" : "hover:bg-slate-50 border border-transparent"}`}>
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${l.id === id ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 text-slate-400"}`}>{i + 1}</div>
                            <span className={`text-xs font-bold line-clamp-1 ${l.id === id ? "text-indigo-900" : "text-slate-600"}`}>{l.title}</span>
                         </button>
                      ))}
                   </div>
                   <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex-none">
                      <div className="flex justify-between items-center mb-1.5">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                         <span className="text-[9px] font-bold text-indigo-600">{Math.round((courseLessons.findIndex(l => l.id === id) + 1) / courseLessons.length * 100)}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 rounded-full" style={{width: `${(courseLessons.findIndex(l => l.id === id) + 1) / courseLessons.length * 100}%`}} />
                      </div>
                   </div>
                </Card>
              </div>
           </div>

           <div ref={testsRef} className="lg:col-span-12 mt-12 space-y-8 pb-20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><ClipboardList className="h-5 w-5" /></div>
                    <div><h2 className="text-xl font-bold text-slate-900">Testlar Boshqaruvi</h2><p className="text-xs text-slate-400 font-medium">Jami {tests.length} ta savol</p></div>
                 </div>
                 <Button onClick={handleGenerateTests} disabled={isGeneratingTests} className="h-10 px-6 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 font-bold gap-2 shadow-sm">
                    {isGeneratingTests ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-indigo-500" />} AI yordamida yangilash
                 </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {tests.map((test, idx) => (
                    <Card key={test.id} className="rounded-2xl p-5 border border-slate-100 bg-white hover:border-indigo-100 transition-all group">
                       <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                             <span className="h-6 w-6 rounded-md bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
                             <p className="text-sm font-bold text-slate-800 leading-snug">{test.question}</p>
                          </div>
                          <div className="flex gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600" onClick={() => { setEditingTest(test); setEditForm({ question: test.question, options: [...test.options], correct_answer: test.correct_answer }); setEditDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600" onClick={() => supabase.from('tests').delete().eq('id', test.id).then(() => fetchData())}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                       </div>
                       <div className="space-y-2 pl-9">
                          {test.options.map((opt, i) => (
                             <div key={i} className={`text-xs p-2 rounded-lg border flex items-center justify-between ${opt === test.correct_answer ? "bg-emerald-50 border-emerald-100 text-emerald-700 font-bold" : "bg-slate-50/50 border-transparent text-slate-500"}`}>
                                <span>{opt}</span>{opt === test.correct_answer && <Check className="h-3 w-3" />}
                             </div>
                          ))}
                       </div>
                    </Card>
                 ))}
                 <button onClick={() => { setEditingTest(null); setEditForm({ question: "", options: ["", "", "", ""], correct_answer: "" }); setEditDialogOpen(true); }} className="rounded-2xl p-5 border-2 border-dashed border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-400 transition-all flex flex-col items-center justify-center gap-2 min-h-[150px]">
                    <Plus className="h-6 w-6" /><span className="text-xs font-bold uppercase tracking-widest">Yangi savol qo'shish</span>
                 </button>
              </div>
           </div>
        </div>

        <Dialog open={editLessonOpen} onOpenChange={setEditLessonOpen}>
          <DialogContent className="rounded-3xl p-8 max-w-xl">
             <DialogHeader><DialogTitle>Darsni tahrirlash</DialogTitle></DialogHeader>
             <div className="space-y-6 mt-4">
                <div className="space-y-2"><Label>Dars sarlavhasi</Label><Input value={editLessonData.title} onChange={e => setEditLessonData({...editLessonData, title: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Kontent</Label><Textarea value={editLessonData.content_type === 'text' ? editLessonData.content : editLessonData.video_content} onChange={e => setEditLessonData({...editLessonData, [editLessonData.content_type === 'text' ? 'content' : 'video_content']: e.target.value})} className="rounded-xl min-h-[150px]" /></div>
                <Button onClick={handleUpdateLesson} disabled={isUpdatingLesson} className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold">{isUpdatingLesson ? "Saqlanmoqda..." : "Saqlash"}</Button>
             </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="rounded-3xl p-8 max-w-xl">
             <DialogHeader><DialogTitle>Testni tahrirlash</DialogTitle></DialogHeader>
             <div className="space-y-6 mt-4">
                <div className="space-y-2"><Label>Savol matni</Label><Textarea value={editForm.question} onChange={e => setEditForm({...editForm, question: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Variantlar va to'g'ri javobni tanlang</Label>
                   <RadioGroup 
                     value={editForm.options.indexOf(editForm.correct_answer).toString()} 
                     onValueChange={(idx) => {
                       const selectedIndex = parseInt(idx);
                       setEditForm({...editForm, correct_answer: editForm.options[selectedIndex]});
                     }}
                     className="space-y-4"
                   >
                      {editForm.options.map((opt, i) => (
                         <div key={i} className="flex items-center gap-4">
                            <RadioGroupItem 
                              value={i.toString()} 
                              id={`opt-${i}`} 
                              className="h-5 w-5 text-indigo-600 border-slate-300" 
                            />
                            <div className="flex-1">
                               <Input 
                                 placeholder={`Variant ${i + 1}`}
                                 value={opt} 
                                 onChange={e => { 
                                   const o = [...editForm.options]; 
                                   const oldVal = o[i];
                                   const newVal = e.target.value;
                                   o[i] = newVal; 
                                   // Agar hozirgi o'zgartirilayotgan variant to'g'ri javob bo'lsa, uni ham yangilaymiz
                                   const newCorrect = editForm.correct_answer === oldVal ? newVal : editForm.correct_answer;
                                   setEditForm({...editForm, options: o, correct_answer: newCorrect}); 
                                 }} 
                                 className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all font-medium"
                               />
                            </div>
                         </div>
                      ))}
                   </RadioGroup>
                </div>
                <Button onClick={async () => { 
                  setIsSavingTest(true); 
                  try {
                    if(editingTest) {
                      await supabase.from('tests').update({ 
                        question: editForm.question, 
                        options: editForm.options, 
                        correct_answer: editForm.correct_answer 
                      }).eq('id', editingTest.id);
                    } else {
                      await supabase.from('tests').insert({ 
                        lesson_id: id,
                        question: editForm.question, 
                        options: editForm.options, 
                        correct_answer: editForm.correct_answer 
                      });
                    }
                    setEditDialogOpen(false); 
                    fetchData(); 
                    toast.success(editingTest ? "Test yangilandi" : "Yangi test qo'shildi");
                  } catch (e) {
                    toast.error("Xatolik yuz berdi");
                  } finally {
                    setIsSavingTest(false); 
                  }
                }} className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold">
                  {isSavingTest ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- RENDER STUDENT UI (MAY 1st ORIGINAL WITH IMPROVED LAYOUT) ---
  const isVideoOnly = lesson?.content_type === 'video';

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 py-8 px-6 lg:px-10 animate-fade-in pb-32">
      <AnimatePresence>
        {isPlanningModalOpen && !planningStarted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-start justify-center pt-6 sm:pt-10 p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative max-h-[85vh] overflow-y-auto scrollbar-hide">
              <div className="text-center space-y-4 relative z-10">
                 <div className="bg-indigo-50 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-2"><BrainCircuit className="h-8 w-8" /></div>
                 <h2 className="text-2xl font-bold text-slate-900">Neural Planning</h2>
                 <p className="text-sm text-slate-500">Darsni boshlashdan oldin o'rganish rejangizni tuzib oling</p>
              </div>
              <div className="space-y-10 relative z-10">
                 <AnimatePresence mode="wait">
                   {planningStep === 1 ? (
                      <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                         <div className="space-y-5">
                            <div>
                              <Label className="text-sm font-semibold text-slate-700 mb-3 block">Bugun nimaga e'tibor qaratmoqchisiz?</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                 {["Tushunish", "Chuqur o'zlashtirish", "Amaliy qo'llash"].map(v => (
                                   <button key={v} onClick={() => setPlanGoal(v)} className={`p-3 rounded-xl border text-xs font-semibold transition-all ${planGoal === v ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'}`}>{v}</button>
                                 ))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-semibold text-slate-700 mb-3 block">Bu mavzuni qanchalik bilasiz?</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                 {["Boshlovchi", "O'rtacha", "Yaxshi"].map(v => (
                                   <button key={v} onClick={() => setPlanLevel(v)} className={`p-3 rounded-xl border text-xs font-semibold transition-all ${planLevel === v ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'}`}>{v}</button>
                                 ))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-semibold text-slate-700 mb-3 block">Bu darsga qancha vaqt ajratasiz?</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                 {["10 daqiqa", "20 daqiqa", "30+ daqiqa"].map(v => (
                                   <button key={v} onClick={() => setPlanTime(v)} className={`p-3 rounded-xl border text-xs font-semibold transition-all ${planTime === v ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'}`}>{v}</button>
                                 ))}
                              </div>
                            </div>
                         </div>
                         <Button disabled={!planGoal || !planLevel || !planTime || isGeneratingPlan} onClick={handleGeneratePlan} className="h-12 w-full rounded-xl mt-6 bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all gap-2">
                            {isGeneratingPlan ? "AI Reja Tuzmoqda..." : "AI Reja Tuzish"}
                         </Button>
                      </motion.div>
                   ) : (
                      <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                         <div className="p-6 rounded-2xl bg-indigo-50/80 border border-indigo-100">
                            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4" /> AI O'quv Rejangiz</h3>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiSmartPlan}</p>
                         </div>
                         <Button onClick={() => { setPlanningStarted(true); setIsPlanningModalOpen(false); }} className="h-14 w-full rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition-all gap-2"><Play className="h-4 w-4" /> Darsni Boshlash</Button>
                      </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`space-y-8 ${!planningStarted ? 'blur-md pointer-events-none' : ''}`}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-100 pb-6">
           <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider">Modul {lesson?.order_index || 1}</Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">{lesson?.title}</h1>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <Button variant="outline" disabled={!prevLessonId} onClick={() => navigate(`/lessons/${prevLessonId}`)} className="h-11 px-6 rounded-xl text-slate-600 font-bold border-slate-200 hover:bg-slate-50">
                <ChevronLeft className="h-5 w-5 mr-1" /> Oldingi
              </Button>
              <Button 
                disabled={!nextLessonId || (!isTeacher && !submitted)} 
                onClick={() => navigate(`/lessons/${nextLessonId}`)} 
                className={`h-11 px-6 rounded-xl font-bold transition-all shadow-lg ${(!nextLessonId || (!isTeacher && !submitted)) ? "bg-slate-100 text-slate-400 shadow-none" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"}`}
              >
                Keyingi <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
           </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           {/* Left Side: Video or Text */}
           <div className="lg:col-span-8 space-y-8">
              {isVideoOnly ? (
                <Card className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border-none bg-slate-900 aspect-video relative">
                   <div id="youtube-player" className="w-full h-full" />
                </Card>
              ) : (
                <div className="space-y-8">
                   {(lesson?.content_type === "video" || lesson?.content_type === "mixed") && (
                      <Card className="rounded-[2.5rem] overflow-hidden bg-slate-900 aspect-video shadow-2xl shadow-slate-200/50 border-none relative">
                         <div id="youtube-player" className="w-full h-full" />
                      </Card>
                   )}
                   {(lesson?.content_type === "text" || lesson?.content_type === "mixed") && lesson?.content_text && (
                      <Card className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-10 md:p-16">
                         <FormattedText content={lesson.content_text} />
                      </Card>
                   )}
                </div>
              )}

              {/* Tests Section */}
              <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white p-8 md:p-12 mt-8">
                 <div className="flex items-center gap-3 mb-10">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                       <Target className="h-6 w-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bilimni tekshirish</h2>
                       <p className="text-sm text-slate-400 font-medium">Mavzu yuzasidan o'zlashtirgan bilimlaringizni sinab ko'ring</p>
                    </div>
                 </div>
                 
                 {videoFinished || isTeacher ? (
                    <div className="space-y-12">
                       {tests.map((test, idx) => (
                          <div key={test.id} className="space-y-6">
                             <div className="flex items-start gap-4">
                                <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center text-sm font-black shrink-0">{idx + 1}</div>
                                <p className="text-lg font-bold text-slate-800 pt-1.5 leading-snug">{test.question}</p>
                             </div>
                             <RadioGroup value={answers[test.id]} onValueChange={val => setAnswers(prev => ({...prev, [test.id]: val}))} className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-13">
                                {test.options.map((opt, i) => (
                                   <Label key={i} htmlFor={`${test.id}-${i}`} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${answers[test.id] === opt ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-md shadow-indigo-100' : 'bg-white border-slate-50 text-slate-700 hover:border-slate-200 hover:bg-slate-50'}`}>
                                      <RadioGroupItem value={opt} id={`${test.id}-${i}`} className="sr-only" />
                                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[test.id] === opt ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>{answers[test.id] === opt && <div className="h-2 w-2 bg-white rounded-full" />}</div>
                                      <span className="font-bold text-base">{opt}</span>
                                   </Label>
                                ))}
                             </RadioGroup>
                          </div>
                       ))}
                       {!submitted ? <Button onClick={handleSubmitTests} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">Testlarni Yakunlash</Button> : (
                          <div className="mt-12 pt-10 border-t border-slate-100 space-y-8 animate-fade-in">
                             <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                   <Brain className="h-7 w-7" />
                                </div>
                                <div>
                                   <h2 className="text-xl font-black text-slate-900 tracking-tight">Metakognitiv Tahlil (Refleksiya)</h2>
                                   <p className="text-sm text-slate-400 font-medium">AI sizning fikrlaringiz asosida shaxsiy tavsiya beradi</p>
                                </div>
                             </div>
                             <Textarea value={reflection1} onChange={e => setReflection1(e.target.value)} placeholder="Bugun nimalarni o'rgandingiz? Qaysi qismlar qiyin bo'ldi?" className="min-h-[150px] rounded-2xl bg-slate-50 border-none p-6 text-slate-700 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                             {!aiReflectionResult ? <Button onClick={handleAnalyzeReflection} disabled={isAnalyzingReflection} className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700">{isAnalyzingReflection ? "AI Tahlil qilinmoqda..." : "AI Tahlilni Boshlash"}</Button> : (
                                <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] animate-fade-in relative overflow-hidden">
                                   <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-indigo-600/5 rotate-12" />
                                   <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-bold relative z-10">{aiReflectionResult}</p>
                                </div>
                             )}
                          </div>
                       )}
                    </div>
                 ) : (
                    <div className="py-24 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center gap-4">
                       <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-300 mb-2"><Lock className="h-10 w-10" /></div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">Test bloklangan</h3>
                       <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">Testlarni yechish uchun avval dars videosini to'liq ko'rib chiqishingiz kerak.</p>
                    </div>
                 )}
              </Card>
           </div>

           {/* Right Side: AI Chat and Syllabus */}
           <div className="lg:col-span-4 space-y-8">
              {/* GROQ AI Chat */}
              <div className={isVideoOnly ? "lg:h-full relative min-h-[450px]" : "h-[500px]"}>
                <Card className={`rounded-[2.5rem] border-indigo-100 shadow-xl shadow-indigo-500/5 bg-indigo-50/30 flex flex-col ${isVideoOnly ? "lg:absolute lg:inset-0" : "h-full"}`}>
                   <div className="p-6 flex items-center gap-3 border-b border-indigo-100/50 bg-white/50 backdrop-blur-sm rounded-t-[2.5rem] flex-none">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0"><BrainCircuit className="h-5 w-5" /></div>
                      <div>
                         <h3 className="text-sm font-black text-slate-900 leading-tight tracking-tight uppercase tracking-widest">IDROK AI Mentor</h3>
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Suhbatga tayyor</p>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-4 p-6 custom-scrollbar scroll-smooth">
                      {chatHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                           <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Zap className="h-6 w-6" /></div>
                           <p className="text-xs font-bold text-slate-500 leading-relaxed">Assalomu alaykum! Ushbu dars yuzasidan savollaringiz bo'lsa, bemalol so'rashingiz mumkin.</p>
                        </div>
                      )}
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                           <div className={`max-w-[85%] p-4 text-sm font-bold leading-relaxed shadow-sm ${msg.role === 'ai' ? 'bg-white text-slate-700 rounded-[1.5rem] rounded-tl-none border border-indigo-50' : 'bg-indigo-600 text-white rounded-[1.5rem] rounded-tr-none shadow-indigo-200'}`}>{msg.text}</div>
                        </div>
                      ))}
                      {isAiTyping && <div className="flex justify-start"><div className="bg-white/80 p-4 rounded-[1.5rem] rounded-tl-none border border-indigo-50 shadow-sm animate-pulse text-xs font-black text-indigo-600 uppercase tracking-widest">AI yozmoqda...</div></div>}
                      <div ref={chatEndRef} />
                   </div>
                   <div className="p-5 border-t border-indigo-100/50 bg-white/50 backdrop-blur-sm rounded-b-[2.5rem] flex gap-3 flex-none">
                      <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Savolingizni yozing..." className="flex-1 h-12 rounded-xl px-5 text-sm font-bold bg-white shadow-inner border-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" />
                      <Button onClick={handleSendMessage} className="h-12 w-12 p-0 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"><ArrowRight className="h-5 w-5" /></Button>
                   </div>
                </Card>
              </div>

              {/* Syllabus Card */}
              <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col h-[500px]">  
                 <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-none">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Kurs mundarijasi</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{courseLessons.length} dars</span>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {courseLessons.map((l, i) => {
                       const isActive = l.id === id;
                       const isCompleted = completedLessonIds.includes(l.id);
                       // Birinchi dars har doim ochiq, qolganlari esa oldingi dars tugatilgan bo'lsa ochiq bo'ladi
                       const isUnlocked = isTeacher || i === 0 || completedLessonIds.includes(courseLessons[i-1].id);
                       
                       return (
                          <button 
                            key={l.id} 
                            disabled={!isUnlocked}
                            onClick={() => navigate(`/lessons/${l.id}`)} 
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${isActive ? "bg-indigo-50 border border-indigo-100 shadow-sm" : !isUnlocked ? "opacity-50 grayscale cursor-not-allowed" : "hover:bg-slate-50 border border-transparent"}`}
                          >
                             <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                                {isCompleted ? <Check className="h-4 w-4" /> : !isUnlocked ? <Lock className="h-3.5 w-3.5" /> : i + 1}
                             </div>
                             <div className="flex-1 min-w-0">
                                <span className={`text-sm font-bold line-clamp-1 ${isActive ? "text-indigo-900" : !isUnlocked ? "text-slate-400" : "text-slate-600"}`}>{l.title}</span>
                                {isCompleted && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mt-0.5">Tugallangan</span>}
                             </div>
                             {!isUnlocked && <Lock className="h-4 w-4 text-slate-300" />}
                          </button>
                       );
                    })}
                 </div>
                 <div className="p-5 border-t border-slate-50 bg-slate-50/30 flex-none">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O'zlashtirish progressi</span>
                       <span className="text-[10px] font-black text-indigo-600 uppercase">{Math.round((courseLessons.findIndex(l => l.id === id) + 1) / courseLessons.length * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full shadow-lg" style={{width: `${(courseLessons.findIndex(l => l.id === id) + 1) / courseLessons.length * 100}%`}} />
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
