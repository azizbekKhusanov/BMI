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
  Pencil, Trash2, ClipboardList, Sparkles, Brain
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateLessonTests, getMetacognitiveFeedback } from "@/lib/groq";

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
    <div className="space-y-2 text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) return <h1 key={idx} className="text-2xl font-bold text-slate-900 mt-8 mb-3 first:mt-0">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={idx} className="text-xl font-bold text-slate-900 mt-6 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={idx} className="flex items-start gap-3 py-0.5"><div className="h-1.5 w-1.5 rounded-full bg-[#0056d2] mt-2.5 shrink-0" /><span className="text-slate-600 text-base leading-relaxed">{formatInline(line.slice(2))}</span></div>;
        if (!line.trim()) return <div key={idx} className="h-2" />;
        return <p key={idx} className="text-base text-slate-600 leading-relaxed">{formatInline(line)}</p>;
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
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [reflection1, setReflection1] = useState("");
  const [aiReflectionResult, setAiReflectionResult] = useState("");
  const [isAnalyzingReflection, setIsAnalyzingReflection] = useState(false);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [editForm, setEditForm] = useState({ question: "", options: ["", "", "", ""], correct_answer: "" });
  const [isSavingTest, setIsSavingTest] = useState(false);

  const playerRef = useRef<any>(null);
  const testsRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!id || !user) return;

    // Eski YouTube player'ni yo'q qilish va state'larni tozalash
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
      playerRef.current = null;
    }
    setAnswers({});
    setResults({});
    setSubmitted(false);
    setReflection1("");
    setAiReflectionResult("");
    setLoading(true);

    try {
      const { data: lessonData } = await supabase.from("lessons").select(`*, courses (id, title)`).eq("id", id).single();
      setLesson(lessonData as any);
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData as Test[] || []);
      const { data: assessments } = await supabase.from("self_assessments").select("*").eq("lesson_id", id).eq("user_id", user.id).maybeSingle();
      if (assessments) { setSubmitted(true); setReflection1(assessments.reflection || ""); }
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
  }, [id, user?.id]);

  useEffect(() => { window.scrollTo(0, 0); fetchData(); }, [fetchData]);

  const getYoutubeId = (url: string) => {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const initPlayer = useCallback(() => {
    const videoId = getYoutubeId(lesson?.content_url || "");
    if (!videoId || !document.getElementById('youtube-player') || playerRef.current) return;
    playerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId, playerVars: { 'modestbranding': 1, 'rel': 0, 'controls': 1, 'enablejsapi': 1 },
      events: { 'onStateChange': (event: any) => { if (event.data === 0 && !isTeacher) toast.success("Dars yakunlandi!"); } }
    });
  }, [lesson, isTeacher]);

  useEffect(() => {
    if (!loading && (lesson?.content_type === 'video' || lesson?.content_type === 'mixed')) {
      const timer = setTimeout(() => {
        if (!(window as any).YT) {
          const tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
          (window as any).onYouTubeIframeAPIReady = initPlayer;
        } else initPlayer();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, lesson, initPlayer]);

  const handleGenerateTests = async () => {
    if (!lesson?.title || !id) return;
    setIsGeneratingTests(true);
    try {
      const generated = await generateLessonTests(lesson.title, lesson.courses?.title || "Umumiy Kurs", 10);
      if (generated && generated.length > 0) {
        const inserts = generated.map((t: any) => ({ lesson_id: id, question: t.question, options: t.options, correct_answer: t.correct_answer }));
        const { data, error } = await supabase.from('tests').insert(inserts).select();
        if (!error && data) { setTests(data as unknown as Test[]); toast.success("AI o'n ta testni yaratdi!"); }
      }
    } catch (e) { console.error(e); } finally { setIsGeneratingTests(false); }
  };

  const handleSubmitTests = async () => {
    if (!user || Object.keys(answers).length < tests.length) { toast.error("Barcha savollarga javob bering!"); return; }
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
      await supabase.from('self_assessments').insert({ user_id: user.id, lesson_id: id, rating: 5, reflection: reflection1 });
      toast.success("Tahlil yakunlandi!");
    } catch (error) { console.error(error); } finally { setIsAnalyzingReflection(false); }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-10 w-10 text-indigo-600" /></div>;

  return (
    <>
      <div className="flex-1 w-full p-6 lg:p-8 space-y-8 animate-fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all group">
           <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
           <span className="text-sm">Darslarga qaytish</span>
        </button>

        <div className="border-b border-slate-100 pb-4">
           <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight w-full">
              {lesson?.title}
           </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8 space-y-8">
              <Card className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border-none relative group">
                 {(lesson?.content_type === 'video' || lesson?.content_type === 'mixed') ? (
                    <div className="aspect-video bg-slate-900 relative"><div id="youtube-player" className="w-full h-full" /></div>
                 ) : (
                    <div className="p-12 text-center bg-indigo-50"><FileText className="h-16 w-16 text-indigo-400 mx-auto mb-4" /><h3 className="text-xl font-bold text-indigo-900">Matnli dars materiali</h3></div>
                 )}
              </Card>

              {lesson?.content_text && <Card className="rounded-[2rem] p-10 shadow-sm border border-slate-100"><FormattedText content={lesson.content_text} /></Card>}
           </div>

           <div className="lg:col-span-4 lg:sticky lg:top-8">
              <Card className="rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col" style={{height: 'calc((100vw - 260px - 4rem) * 8 / 12 * 9 / 16)'}}>  
                 <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex-none"><h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Kurs mundarijasi</h3></div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {courseLessons.map((l, i) => {
                       const isActive = l.id === id;
                       return (
                          <button key={l.id} onClick={() => navigate(`/lessons/${l.id}`)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${isActive ? "bg-[#00A3FF]/10 border border-[#00A3FF]/20" : "hover:bg-slate-50 border border-transparent"}`}>
                             <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${isActive ? "bg-[#00A3FF] text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-400"}`}>{i + 1}</div>
                             <span className={`text-sm font-bold line-clamp-1 ${isActive ? "text-[#00A3FF]" : "text-slate-600"}`}>{l.title}</span>
                          </button>
                       );
                    })}
                 </div>
                 <div className="p-4 border-t border-slate-50 text-center"><div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Umumiy progress: {Math.round((courseLessons.findIndex(l => l.id === id) + 1) / courseLessons.length * 100)}%</div></div>
              </Card>
           </div>

           <div ref={testsRef} className="lg:col-span-12 mt-12 space-y-12">
              <div className="text-center space-y-4">
                 <div className="h-16 w-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-indigo-600 border border-slate-100"><ClipboardList className="h-8 w-8" /></div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight">Bilimni tekshirish</h2>
                 <p className="text-slate-500 font-medium max-w-2xl mx-auto">Mavzu bo'yicha tayyorlangan testlarni yechib, o'zlashtirish darajangizni aniqlang.</p>
                 {isTeacher && <Button onClick={handleGenerateTests} disabled={isGeneratingTests} className="mt-4 h-12 px-8 rounded-2xl bg-indigo-600 text-white font-bold gap-2 shadow-lg shadow-indigo-200"><Sparkles className="h-5 w-5" /> AI yordamida test yaratish</Button>}
              </div>

              <div className="space-y-8 max-w-4xl mx-auto pb-20">
                 {tests.map((test, idx) => (
                    <Card key={test.id} className="rounded-2xl p-6 shadow-sm border border-slate-100 bg-white group relative">
                       <div className="flex items-start gap-4 mb-6">
                          <span className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center text-sm font-bold border border-slate-100 shrink-0">
                             {idx + 1}
                          </span>
                          <p className="text-lg font-bold text-slate-800 pt-1">{test.question}</p>
                       </div>

                       <RadioGroup value={answers[test.id]} onValueChange={v => setAnswers(p => ({...p, [test.id]: v}))} className="space-y-3">
                          {test.options.map((opt, i) => (
                             <div key={i} className={`flex items-center space-x-3 p-3 rounded-xl transition-all border ${answers[test.id] === opt ? 'bg-blue-50 border-blue-200' : 'border-transparent hover:bg-slate-50'}`}>
                                <RadioGroupItem value={opt} id={`${test.id}-${i}`} className="text-blue-600 border-slate-300" />
                                <Label htmlFor={`${test.id}-${i}`} className="text-base font-medium text-slate-700 cursor-pointer w-full">{opt}</Label>
                             </div>
                          ))}
                       </RadioGroup>

                       {isTeacher && (
                          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setEditingTest(test); setEditForm({ question: test.question, options: [...test.options], correct_answer: test.correct_answer }); setEditDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600" onClick={() => supabase.from('tests').delete().eq('id', test.id).then(() => fetchData())}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                       )}
                    </Card>
                 ))}
                 
                 {tests.length > 0 && !submitted && (
                    <Button onClick={handleSubmitTests} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all shadow-lg">
                       Testni yakunlash
                    </Button>
                 )}
                 {submitted && (
                    <Card className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl space-y-8 relative overflow-hidden">
                       <Brain className="absolute -top-10 -right-10 h-64 w-64 text-white/10" /><div className="space-y-4 relative z-10"><h3 className="text-3xl font-black">Metakognitiv tahlil</h3><p className="text-indigo-100 font-medium">Dars bo'yicha fikrlaringizni yozing, AI sizga tavsiya beradi.</p></div>
                       <Textarea value={reflection1} onChange={e => setReflection1(e.target.value)} placeholder="Bugun nimalarni o'rgandingiz?" className="min-h-[150px] bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-[2rem] p-8 text-lg" />
                       <Button onClick={handleAnalyzeReflection} disabled={isAnalyzingReflection || reflection1.length < 10} className="w-full h-16 bg-white text-indigo-600 font-black text-lg rounded-2xl hover:bg-indigo-50">{isAnalyzingReflection ? "Analiz qilinmoqda..." : "AI Tahlilni boshlash"}</Button>
                       {aiReflectionResult && <p className="p-8 bg-white/10 rounded-[2rem] border border-white/20 text-lg font-bold leading-relaxed">{aiReflectionResult}</p>}
                    </Card>
                 )}
              </div>
           </div>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-3xl p-8 max-w-xl">
           <DialogHeader><DialogTitle>Testni tahrirlash</DialogTitle></DialogHeader>
           <div className="space-y-6 mt-4">
              <div className="space-y-2"><Label>Savol matni</Label><Textarea value={editForm.question} onChange={e => setEditForm({...editForm, question: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-3">
                 <Label>Variantlar</Label>
                 {editForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                       <Input value={opt} onChange={e => { const o = [...editForm.options]; o[i] = e.target.value; setEditForm({...editForm, options: o}); }} className="rounded-xl" />
                       <Button variant={editForm.correct_answer === opt ? "default" : "outline"} className="rounded-xl" onClick={() => setEditForm({...editForm, correct_answer: opt})}>{editForm.correct_answer === opt ? <Check className="h-4 w-4" /> : "To'g'ri"}</Button>
                    </div>
                 ))}
              </div>
              <Button onClick={async () => { if(!editingTest) return; setIsSavingTest(true); await supabase.from('tests').update({ question: editForm.question, options: editForm.options, correct_answer: editForm.correct_answer }).eq('id', editingTest.id); setEditDialogOpen(false); fetchData(); setIsSavingTest(false); }} className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold">{isSavingTest ? "Saqlanmoqda..." : "Saqlash"}</Button>
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LessonPage;
