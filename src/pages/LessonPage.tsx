import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, CheckCircle, Star, Video, FileText, Lock, 
  Loader2, Play, Settings2, Gauge, MonitorPlay, ChevronRight,
  Maximize, Volume2, Pause, Sparkles, Brain, Target, 
  Zap, MessageSquare, Check, ArrowRight, Info, Clock, 
  Lightbulb, ChevronLeft, RefreshCcw, BookOpen, ShieldCheck,
  Trophy, Award, LayoutGrid, Layers, Globe, Activity,
  ZapOff, Zap as ZapIcon, BrainCircuit, Pencil, Trash2, Plus, Save, X, ClipboardList
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getGroqChatResponse, generateLessonTests, getMetacognitiveFeedback } from "@/lib/groq";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import AICoach from "@/components/AICoach";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
  }
}

interface Course { id: string; title: string; }
interface Lesson { id: string; title: string; content_type: string; content_url: string; content_text?: string; course_id: string; order_index: number; courses?: Course; }
interface Test { id: string; lesson_id: string; question: string; options: string[]; correct_answer: string; }

const formatInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const FormattedText = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) {
          return (
            <h1 key={idx}
                className="text-2xl font-bold text-slate-900 mt-8 mb-3 first:mt-0">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx}
                className="text-xl font-bold text-slate-900 mt-6 mb-2">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx}
                className="text-lg font-semibold text-slate-900 mt-4 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-3 py-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#0056d2]
                              mt-2.5 shrink-0" />
              <span className="text-slate-600 text-base leading-relaxed">
                {formatInline(line.slice(2))}
              </span>
            </div>
          );
        }
        const numberedMatch = line.match(/^(\d+)\. (.+)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-3 py-0.5">
              <span className="text-xs font-bold text-[#0056d2] bg-blue-50
                               rounded-full h-5 w-5 flex items-center
                               justify-center shrink-0 mt-0.5">
                {numberedMatch[1]}
              </span>
              <span className="text-slate-600 text-base leading-relaxed">
                {formatInline(numberedMatch[2])}
              </span>
            </div>
          );
        }
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }
        return (
          <p key={idx} className="text-base text-slate-600 leading-relaxed">
            {formatInline(line)}
          </p>
        );
      })}
    </div>
  );
};

const LessonPage = () => {
  const { id } = useParams();
  const { user, roles, profile } = useAuth();
  const navigate = useNavigate();
  const isTeacher = roles?.includes('teacher') || roles?.includes('admin') || false;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [planningStarted, setPlanningStarted] = useState(false);
  const [planGoal, setPlanGoal] = useState("");
  const [planLevel, setPlanLevel] = useState("");
  const [planTime, setPlanTime] = useState("");
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(true);
  const [planningStep, setPlanningStep] = useState(1);
  const [aiSmartPlan, setAiSmartPlan] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selfRating, setSelfRating] = useState(0);
  const [reflection1, setReflection1] = useState("");
  const [reflection2, setReflection2] = useState("");
  const [aiReflectionResult, setAiReflectionResult] = useState("");
  const [isAnalyzingReflection, setIsAnalyzingReflection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoFinished, setVideoFinished] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [isDeletingTest, setIsDeletingTest] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: ""
  });
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiTyping]);

  const hasTriggeredTestGen = useRef(false);

  const handleGenerateTests = useCallback(async () => {
    if (!lesson?.title || !id) return;
    setIsGeneratingTests(true);
    try {
      const generated = await generateLessonTests(lesson.title, lesson.courses?.title || "Umumiy Kurs", 10);
      if (generated && generated.length > 0) {
        const inserts = generated.map((t: any) => ({
          lesson_id: id,
          question: t.question,
          options: t.options,
          correct_answer: t.correct_answer
        }));
        const { data, error } = await supabase.from('tests').insert(inserts).select();
        if (!error && data) {
          setTests(data as unknown as Test[]);
          toast.success("AI o'n ta testni muvaffaqiyatli yaratdi!");
        } else {
          console.error(error);
          toast.error("Testlarni saqlashda xatolik yuz berdi.");
        }
      } else {
         toast.error("AI test yarata olmadi.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Xatolik yuz berdi.");
    } finally {
      setIsGeneratingTests(false);
    }
  }, [lesson?.title, id]);

  useEffect(() => {
    if (!loading && tests.length === 0 && lesson?.title && id && !hasTriggeredTestGen.current && !isTeacher) {
       hasTriggeredTestGen.current = true;
       handleGenerateTests();
    }
  }, [loading, tests.length, lesson?.title, id, handleGenerateTests, isTeacher]);

  const handleOpenEditTest = (test: Test) => {
    setEditingTest(test);
    setEditForm({
      question: test.question,
      options: [...test.options],
      correct_answer: test.correct_answer
    });
    setEditDialogOpen(true);
  };

  const handleSaveTest = async () => {
    if (!editingTest) return;
    if (!editForm.question.trim()) {
      toast.error("Savol matnini kiriting");
      return;
    }
    if (editForm.options.some(o => !o.trim())) {
      toast.error("Barcha variantlarni to'ldiring");
      return;
    }
    if (!editForm.correct_answer) {
      toast.error("To'g'ri javobni tanlang");
      return;
    }

    setIsSavingTest(true);
    try {
      const { error } = await supabase
        .from("tests")
        .update({
          question: editForm.question,
          options: editForm.options,
          correct_answer: editForm.correct_answer
        })
        .eq("id", editingTest.id);

      if (error) throw error;

      setTests(prev => prev.map(t =>
        t.id === editingTest.id
          ? { ...t, ...editForm, options: editForm.options }
          : t
      ));

      toast.success("Test saqlandi!");
      setEditDialogOpen(false);
      setEditingTest(null);
    } catch (error) {
      toast.error("Saqlashda xatolik");
    } finally {
      setIsSavingTest(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    setIsDeletingTest(testId);
    try {
      const { error } = await supabase
        .from("tests")
        .delete()
        .eq("id", testId);

      if (error) throw error;

      setTests(prev => prev.filter(t => t.id !== testId));
      toast.success("Test o'chirildi");
    } catch (error) {
      toast.error("O'chirishda xatolik");
    } finally {
      setIsDeletingTest(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isAiTyping) return;
    const userMsg = chatMessage.trim();
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setChatMessage("");
    setIsAiTyping(true);
    
    const apiMessages: {role: "system" | "user" | "assistant", content: string}[] = chatHistory.map(msg => ({
      role: msg.role === "ai" ? "assistant" : "user",
      content: msg.text
    }));
    apiMessages.push({ role: "user", content: userMsg });

    const aiResponse = await getGroqChatResponse(apiMessages);
    
    setChatHistory(prev => [...prev, { role: "ai", text: aiResponse || "Kechirasiz, javob olishda xatolik yuz berdi." }]);
    setIsAiTyping(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const standardQualities = ['hd1080', 'hd720', 'large', 'medium', 'auto'];

  const updateProgress = useCallback(async () => {
    if (!user || !id || !lesson) return;
    try {
      // 1. Get total lessons in this course
      const { count: totalLessons } = await supabase
        .from("lessons")
        .select("*", { count: 'exact', head: true })
        .eq("course_id", lesson.course_id);

      // 2. Get unique completed lessons for this user in this course
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", lesson.course_id);
      
      const lessonIds = lessonsData?.map(l => l.id) || [];
      
      const { data: assessmentsData } = await supabase
        .from("self_assessments")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds);

      // Use a Set to get unique lesson IDs that are completed
      const uniqueCompletedIds = new Set(assessmentsData?.map(a => a.lesson_id) || []);
      
      // If the current lesson is not yet in the set, we add it to the count
      const isCurrentLessonAlreadyCounted = uniqueCompletedIds.has(id || "");
      const completedCount = uniqueCompletedIds.size + (isCurrentLessonAlreadyCounted ? 0 : 1);

      // 3. Calculate percentage
      const total = totalLessons || 1;
      const progressPercent = Math.min(Math.round((completedCount / total) * 100), 100);

      // 4. Update enrollment progress
      await supabase
        .from("enrollments")
        .update({ progress: progressPercent })
        .eq("user_id", user.id)
        .eq("course_id", lesson.course_id);
        
      console.log(`Updated progress: ${progressPercent}% (${completedCount}/${total})`);
    } catch (err) { 
      console.error("Error updating progress:", err); 
    }
  }, [user, id, lesson]);

  const fetchData = useCallback(async () => {
    if (!id || !user) return;
    try {
      const { data: lessonData } = await supabase.from("lessons").select(`*, courses (id, title)`).eq("id", id).single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLesson(lessonData as any);
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData as Test[] || []);
      
      const { data: assessments } = await supabase.from("self_assessments").select("*").eq("lesson_id", id).eq("user_id", user.id).maybeSingle();
      if (assessments) {
         setIsLessonCompleted(true);
         setPlanningStarted(true);
         setIsPlanningModalOpen(false);
         setVideoFinished(true);
         setSubmitted(true);
         setReflection1(assessments.reflection || "Dars muvaffaqiyatli yakunlangan.");
         setAiReflectionResult("Dars avval muvaffaqiyatli yakunlangan va AI xulosasi saqlangan.");
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [id, user?.id]);

  useEffect(() => { 
    window.scrollTo(0, 0);
    fetchData(); 
  }, [fetchData]);

  useEffect(() => {
    if (!loading && lesson?.content_type === 'text' && !planningStarted) {
      setPlanningStarted(true);
      setIsPlanningModalOpen(false);
      setChatHistory([{
        role: "ai",
        text: "Salom! O'quv materialini o'qib chiqayotgansiz. Savollaringiz bo'lsa menga yozing!"
      }]);
    }
  }, [loading, lesson?.content_type, planningStarted]);

  useEffect(() => {
    if (isPlanningModalOpen && !planningStarted && !isTeacher && !loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isPlanningModalOpen, planningStarted, isTeacher, loading]);

  const getYoutubeId = useCallback((url: string) => {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  }, []);

  const updateQualities = useCallback(() => {
    if (playerRef.current?.getAvailableQualityLevels) {
      const levels = playerRef.current.getAvailableQualityLevels();
      const defaultQualities = ['hd1080', 'hd720', 'large', 'medium', 'auto'];
      setAvailableQualities(levels?.length > 0 ? levels : defaultQualities);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === 1) { setIsPlaying(true); updateQualities(); }
    if (event.data === 2) setIsPlaying(false);
    if (event.data === 0) {
      setVideoFinished(true);
      setIsPlaying(false);
      if (!isTeacher) { toast.success("Dars yakunlandi!"); updateProgress(); }
    }
  }, [isTeacher, updateProgress, updateQualities]);

  const initPlayer = useCallback(() => {
    const videoId = getYoutubeId(lesson?.content_url || "");
    if (!videoId || !document.getElementById('youtube-player')) return;
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId,
      playerVars: { 'modestbranding': 1, 'rel': 0, 'showinfo': 0, 'controls': 0, 'iv_load_policy': 3, 'enablejsapi': 1 },
      events: { 'onReady': () => { setPlayerReady(true); updateQualities(); }, 'onStateChange': onPlayerStateChange }
    });
  }, [lesson, getYoutubeId, onPlayerStateChange, updateQualities]);

  useEffect(() => {
    if (!loading && lesson?.content_type === 'video') {
      const timer = setTimeout(() => {
        if (!window.YT) {
          const tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
          window.onYouTubeIframeAPIReady = initPlayer;
        } else initPlayer();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, lesson, initPlayer]);

  const togglePlay = () => isPlaying ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo();
  const handleSubmitTests = async () => {
    if (!user) return;
    
    if (Object.keys(answers).length < tests.length) {
      toast.error(`Iltimos, barcha savollarga javob belgilang! (${tests.length} ta savoldan ${Object.keys(answers).length} tasiga javob berdingiz)`);
      return;
    }

    const newResults: Record<string, boolean> = {};
    const inserts = tests.map(t => {
      const isCorrect = answers[t.id] === t.correct_answer;
      newResults[t.id] = isCorrect;
      return { user_id: user.id, test_id: t.id, answer: answers[t.id] || "", is_correct: isCorrect };
    });
    setResults(newResults);
    setSubmitted(true);
    await supabase.from("test_results").insert(inserts);
    toast.success("Testlar topshirildi!");
  };

  const handleAnalyzeReflection = async () => {
    if (!user || !id) return;
    setIsAnalyzingReflection(true);
    try {
      const correctCount = Object.values(results).filter(Boolean).length;
      const feedback = await getMetacognitiveFeedback(
        reflection1, 
        { score: `${correctCount}/${tests.length}` }
      );
      
      setAiReflectionResult(feedback || "Tahlil qilib bo'lmadi.");
      
      await supabase.from('self_assessments').insert({
         user_id: user.id,
         lesson_id: id,
         rating: tests.length ? Math.max(1, Math.round((correctCount / tests.length) * 5)) : 5,
         reflection: reflection1
      });

      setIsLessonCompleted(true);
      updateProgress(); // Ensure progress is updated on reflection submission
      toast.success("AI tahlil muvaffaqiyatli yakunlandi va saqlandi!");
    } catch (error) {
      console.error(error);
      toast.error("Tahlilda xatolik.");
    } finally {
      setIsAnalyzingReflection(false);
    }
  };

  if (loading) {
    return (
        <div className="max-w-[1400px] mx-auto py-20 px-8 space-y-12">
          <div className="flex items-center gap-6">
             <Skeleton className="h-14 w-14 rounded-2xl" />
             <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-10 w-96 rounded-2xl" />
             </div>
          </div>
          <Skeleton className="h-[600px] w-full rounded-[4rem]" />
        </div>
    );
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto space-y-12 py-12 px-6 lg:px-12 animate-fade-in pb-32">
        
        {/* High-Tech Planning Modal */}
        <AnimatePresence>
          {isPlanningModalOpen && !planningStarted && !isTeacher && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[100] flex items-start justify-center pt-6 sm:pt-10 p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative max-h-[85vh] overflow-y-auto scrollbar-hide"
              >
                <div className="text-center space-y-4 relative z-10">
                   <div className="bg-indigo-50 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-2">
                      <BrainCircuit className="h-8 w-8" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900">Neural Planning</h2>
                   <p className="text-sm text-slate-500">Darsni boshlashdan oldin o'rganish rejangizni tuzib oling</p>
                </div>

                <div className="space-y-10 relative z-10">
                   <AnimatePresence mode="wait">
                     {planningStep === 1 && (
                        <motion.div 
                          key="step1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-6"
                        >
                           <div className="space-y-5">
                              {/* Savol 1: Maqsad */}
                              <div>
                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                                   <Target className="h-4 w-4 text-indigo-500" /> Bugun nimaga e'tibor qaratmoqchisiz?
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                   {["Tushunish", "Chuqur o'zlashtirish", "Amaliy qo'llash"].map(v => (
                                     <button 
                                       key={v} 
                                       onClick={() => setPlanGoal(v)} 
                                       className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                                         planGoal === v 
                                           ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                           : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                                       }`}
                                     >
                                        {v}
                                     </button>
                                   ))}
                                </div>
                              </div>

                              {/* Savol 2: Daraja */}
                              <div>
                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                                   <ZapIcon className="h-4 w-4 text-amber-500" /> Bu mavzuni qanchalik bilasiz?
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                   {["Boshlovchi", "O'rtacha", "Yaxshi"].map(v => (
                                     <button 
                                       key={v} 
                                       onClick={() => setPlanLevel(v)} 
                                       className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                                         planLevel === v 
                                           ? 'bg-amber-500 border-amber-500 text-white shadow-md' 
                                           : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'
                                       }`}
                                     >
                                        {v}
                                     </button>
                                   ))}
                                </div>
                              </div>

                              {/* Savol 3: Vaqt */}
                              <div>
                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                                   <Clock className="h-4 w-4 text-emerald-500" /> Bu darsga qancha vaqt ajratasiz?
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                   {["10 daqiqa", "20 daqiqa", "30+ daqiqa"].map(v => (
                                     <button 
                                       key={v} 
                                       onClick={() => setPlanTime(v)} 
                                       className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                                         planTime === v 
                                           ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' 
                                           : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                                       }`}
                                     >
                                        {v}
                                     </button>
                                   ))}
                                </div>
                              </div>
                           </div>

                           <Button 
                             disabled={!planGoal || !planLevel || !planTime || isGeneratingPlan} 
                             onClick={async () => {
                                setIsGeneratingPlan(true);
                                const prompt = `Talaba ushbu dars bo'yicha quyidagilarni belgiladi:\nMaqsad: ${planGoal}\nDaraja: ${planLevel}\nVaqt: ${planTime}\n\nUshbu ma'lumotlar asosida 3-4 gapdan iborat qisqa, motivatsion va moslashtirilgan o'quv rejasi va bitta tavsiya yozib bering. Iltimos, juda qisqa va londa bo'lsin. Markdown qalin (\*\*) ishlatmang, lekin o'rinli emoji qo'shishingiz mumkin.`;
                                
                                const response = await getGroqChatResponse([{ role: "user", content: prompt }]);
                                
                                if (response && !response.includes("Kechirasiz")) {
                                  setAiSmartPlan(`🎯 AI SMART Reja:\n\n${response}`);
                                } else {
                                  setAiSmartPlan(`🎯 AI SMART Reja:\n\n1. Maqsad: Mavzuni ${planGoal.toLowerCase()}.\n2. Daraja: ${planLevel} daraja bo'lgani uchun mos tezlikda.\n3. Vaqt: ${planTime} ichida asosiy qismlarni qamrab olamiz.\n\n💡 AI Tavsiyasi: ${planTime === "10 daqiqa" ? "Faqat eng muhim qismlarini tez ko'ring." : "Har bir qadamni yozib borib, chuqur tahlil qiling."} Omad!`);
                                }
                                
                                setIsGeneratingPlan(false);
                                setPlanningStep(2);
                             }} 
                             className="h-12 w-full rounded-xl mt-6 bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all gap-2"
                           >
                              {isGeneratingPlan ? <><Loader2 className="h-4 w-4 animate-spin" /> AI Reja Tuzmoqda...</> : <><Brain className="h-4 w-4" /> AI Reja Tuzish</>}
                           </Button>
                        </motion.div>
                     )}

                     {planningStep === 2 && (
                        <motion.div 
                          key="step2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-6"
                        >
                           <div className="p-6 rounded-2xl bg-indigo-50/80 border border-indigo-100">
                              <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-3">
                                 <Sparkles className="h-4 w-4 text-indigo-600" /> AI O'quv Rejangiz
                              </h3>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                 {aiSmartPlan}
                              </p>
                           </div>
                           <Button 
                             onClick={() => { 
                                setPlanningStarted(true); 
                                setIsPlanningModalOpen(false);
                                setChatHistory([{ role: "ai", text: `Ajoyib! Siz ${planTime} ichida mavzuni ${planGoal.toLowerCase()}ni maqsad qildingiz. Men Groq AI yordamchingizman, dars davomida savollaringiz bo'lsa beravering!` }]);
                             }} 
                             className="h-14 w-full rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition-all gap-2"
                           >
                              <Play className="h-4 w-4" /> Darsni Boshlash
                           </Button>
                        </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="flex items-center gap-6">
            <motion.button 
              whileHover={{ x: -5 }}
              onClick={() => navigate(-1)} 
              className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all"
            >
               <ArrowLeft className="h-6 w-6" />
            </motion.button>
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 rounded-full font-semibold text-xs">Modul {lesson?.order_index || 1}</Badge>
               </div>
               <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">{lesson?.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-12 px-6 rounded-xl text-slate-600 font-semibold border-slate-200 hover:bg-slate-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Oldingi
             </Button>
             <Button className="h-12 px-6 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all">
                Keyingi <ChevronRight className="ml-2 h-4 w-4" />
             </Button>
          </div>
        </div>

        {/* Video Player */}
        {lesson?.content_type === "video" && (
          <div className="rounded-3xl overflow-hidden bg-slate-900 aspect-video shadow-sm border border-slate-100 relative">
             <div id="youtube-player" className="w-full h-full" />
          </div>
        )}

        {/* Matn dars */}
        {lesson?.content_type === "text" && lesson?.content_text && (
          <div className="bg-white rounded-2xl border border-slate-200
                          shadow-sm overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-3 px-8 py-5
                            border-b border-slate-100 bg-slate-50">
              <div className="h-8 w-8 rounded-lg bg-[#0056d2]/10
                              text-[#0056d2] flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  O'quv materiali
                </p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Taxminan {Math.max(1, Math.ceil(lesson.content_text.length / 1000))} daqiqa o'qish
                </p>
              </div>
            </div>

            {/* Kontent */}
            <div className="px-8 py-8">
              <FormattedText content={lesson.content_text} />
            </div>

            {/* O'qib bo'ldim tugmasi — faqat talaba uchun, faqat yakunlanmagan bo'lsa */}
            {!isTeacher && !videoFinished && (
              <div className="px-8 py-5 border-t border-slate-100 bg-slate-50">
                <Button
                  onClick={() => {
                    setVideoFinished(true);
                    if (!isTeacher) {
                      updateProgress();
                      toast.success("Maqola o'qildi!");
                    }
                  }}
                  className="w-full h-11 rounded-lg bg-[#0056d2] hover:bg-[#00419e]
                             text-white font-semibold shadow-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Maqolani o'qib bo'ldim
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
           {/* Test Content */}
           <div className="lg:col-span-8 space-y-8">
              <Card className="rounded-3xl border-slate-100 shadow-sm bg-white p-8 md:p-12">
                 <div className="flex items-center gap-3 mb-10">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                       <Target className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Bilimni tekshirish</h2>
                 </div>

                 {isTeacher ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">
                            Test Boshqaruvi
                          </h2>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {tests.length} ta savol
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleGenerateTests}
                        disabled={isGeneratingTests}
                        className="h-10 px-4 rounded-lg bg-[#0056d2] hover:bg-[#00419e] text-white font-medium text-sm shadow-sm gap-2"
                      >
                        {isGeneratingTests 
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Yaratilmoqda...</>
                          : <><Sparkles className="h-4 w-4" /> AI bilan qayta yaratish</>
                        }
                      </Button>
                    </div>

                    {isGeneratingTests && (
                      <div className="py-12 text-center bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-[#0056d2] mx-auto" />
                        <p className="text-sm font-medium text-slate-600">
                          AI testlarni tayyorlamoqda...
                        </p>
                      </div>
                    )}

                    {!isGeneratingTests && tests.length === 0 && (
                      <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-4">
                        <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                          <ClipboardList className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            Hozircha testlar yo'q
                          </p>
                          <p className="text-xs text-slate-500">
                            AI yordamida avtomatik test yaratish uchun yuqoridagi tugmani bosing.
                          </p>
                        </div>
                      </div>
                    )}

                    {!isGeneratingTests && tests.length > 0 && (
                      <div className="space-y-3">
                        {tests.map((test, idx) => (
                          <div
                            key={test.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="h-6 w-6 rounded-full bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 leading-snug mb-2">
                                    {test.question}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {test.options.map((opt, i) => (
                                      <span
                                        key={i}
                                        className={`text-xs px-2 py-1 rounded-md font-medium ${
                                          opt === test.correct_answer
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-slate-50 text-slate-600 border border-slate-200"
                                        }`}
                                      >
                                        {opt === test.correct_answer && (
                                          <Check className="h-3 w-3 inline mr-1" />
                                        )}
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEditTest(test)}
                                  className="h-8 w-8 rounded-md text-slate-400 hover:text-[#0056d2] hover:bg-blue-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTest(test.id)}
                                  disabled={isDeletingTest === test.id}
                                  className="h-8 w-8 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  {isDeletingTest === test.id 
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Trash2 className="h-4 w-4" />
                                  }
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {tests.length > 0 && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                          Talabalar bu darsni yakunlaganida aynan shu testlarni ishlaydi. 
                          "AI bilan qayta yaratish" bosilsa barcha testlar o'chirilib, yangilari qo'shiladi.
                        </p>
                      </div>
                    )}
                  </div>
                 ) : (
                    (!isTeacher && !videoFinished) ? (
                       <div className="py-24 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
                             <Lock className="h-8 w-8" />
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-slate-900">Test bloklangan</h3>
                             <p className="text-sm text-slate-500 mt-1">
                                {lesson?.content_type === 'video'
                                  ? "Avval dars videosini to'liq ko'rib chiqing."
                                  : "Avval o'quv materialini o'qib chiqing."
                                }
                             </p>
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-12">
                          {tests.length === 0 && (
                            <div className="py-20 text-center bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-200 flex flex-col items-center gap-4 animate-pulse">
                               <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-400">
                                  <Loader2 className="h-8 w-8 animate-spin" />
                               </div>
                               <div>
                                  <h3 className="text-lg font-bold text-slate-900">Testlar tayyorlanmoqda...</h3>
                                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Sun'iy intellekt "{lesson?.title}" mavzusi bo'yicha maxsus testlar tayyorlamoqda.</p>
                               </div>
                            </div>
                          )}
                          {tests.length > 0 && !isLessonCompleted && tests.map((test, idx) => (
                             <div key={test.id} className="space-y-6">
                                <div className="flex items-start gap-4">
                                   <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                                      {idx + 1}
                                   </div>
                                   <p className="text-lg font-semibold text-slate-900 pt-1">{test.question}</p>
                                </div>
                                
                                <RadioGroup 
                                  value={answers[test.id]} 
                                  onValueChange={val => setAnswers(prev => ({...prev, [test.id]: val}))}
                                  className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12"
                                >
                                   {test.options.map((opt, i) => (
                                      <Label 
                                        key={i}
                                        htmlFor={`${test.id}-${i}`}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                          answers[test.id] === opt 
                                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900' 
                                            : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                         <RadioGroupItem value={opt} id={`${test.id}-${i}`} className="sr-only" />
                                         <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                           answers[test.id] === opt ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                                         }`}>
                                            {answers[test.id] === opt && <div className="h-2 w-2 bg-white rounded-full" />}
                                         </div>
                                         <span className="font-medium text-base">{opt}</span>
                                      </Label>
                                   ))}
                                </RadioGroup>
                             </div>
                          ))}
                          
                          {tests.length > 0 && !submitted ? (
                             <Button 
                               onClick={handleSubmitTests} 
                               className="w-full h-14 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-all shadow-sm"
                             >
                                Testlarni Yakunlash
                             </Button>
                          ) : (
                             <div className="mt-12 pt-10 border-t border-slate-100 space-y-8 animate-fade-in">
                                <div className="flex items-center gap-3 mb-6">
                                   <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                      <Brain className="h-6 w-6" />
                                   </div>
                                   <div>
                                      <h2 className="text-xl font-bold text-slate-900">Metakognitiv Tahlil (Refleksiya)</h2>
                                      <p className="text-sm text-slate-500">Dars yakuni bo'yicha o'zingizni tahlil qiling</p>
                                   </div>
                                </div>

                                <div className="space-y-6">
                                   <div className="space-y-3">
                                      <Label className="text-sm font-semibold text-slate-700">Bugun nimalarni o'rgandingiz va qaysi qismda qiynaldingiz?</Label>
                                      <Textarea 
                                        value={reflection1}
                                        onChange={e => setReflection1(e.target.value)}
                                        disabled={isLessonCompleted}
                                        placeholder="Masalan: Men o'zgaruvchilarni tushundim, lekin sikllar biroz qiyin bo'ldi..."
                                        className="min-h-[120px] resize-none border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50 text-slate-900 text-base p-4 disabled:opacity-50"
                                      />
                                   </div>

                                   {!aiReflectionResult ? (
                                      <Button 
                                         onClick={handleAnalyzeReflection}
                                         disabled={reflection1.length < 10 || isAnalyzingReflection}
                                         className="w-full h-14 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-sm"
                                      >
                                         {isAnalyzingReflection ? (
                                            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analiz qilinmoqda...</>
                                         ) : (
                                            <><Sparkles className="h-5 w-5 mr-2" /> AI Tahlilni Boshlash</>
                                         )}
                                      </Button>
                                   ) : (
                                      <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl animate-fade-in space-y-4">
                                         <div className="flex items-center gap-2 text-indigo-700 font-bold">
                                            <Sparkles className="h-5 w-5" /> AI Reflection Analyzer
                                         </div>
                                         <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                                            {aiReflectionResult}
                                         </p>
                                         <Button 
                                           onClick={() => navigate('/student/metacognition')}
                                           variant="outline" 
                                           className="w-full h-12 mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold"
                                         >
                                           To'liq Metakognitiv Statistikani Ko'rish <ArrowRight className="h-4 w-4 ml-2" />
                                         </Button>
                                      </div>
                                   )}
                                </div>
                             </div>
                          )}
                       </div>
                    )
                 )}
              </Card>
           </div>

           {/* Sidebar Column */}
           <div className="lg:col-span-4 space-y-8">
              <Card className="rounded-3xl border-indigo-100 shadow-sm bg-indigo-50/50 p-6 flex flex-col h-[420px]">
                 <div className="flex items-center gap-3 mb-4 pb-4 border-b border-indigo-100/50">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                       <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-slate-900 leading-tight">Groq AI Yordamchi</h3>
                       <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Muloqotga tayyor
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                         <BrainCircuit className="h-8 w-8 mb-2 opacity-50" />
                         <p className="text-xs text-center italic">Reja tasdiqlangach muloqot boshlanadi...</p>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                         <div className={`max-w-[85%] p-3 text-sm ${msg.role === 'ai' ? 'bg-white text-slate-700 border border-indigo-100/50 rounded-2xl rounded-tl-sm shadow-sm' : 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md'}`}>
                            {msg.text}
                         </div>
                      </div>
                    ))}
                    {isAiTyping && (
                      <div className="flex justify-start">
                         <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-indigo-100/50 shadow-sm flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-75" />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-150" />
                         </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                 </div>

                 <div className="mt-4 pt-4 border-t border-indigo-100/50 flex gap-2 relative">
                    <input 
                      type="text"
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      onKeyDown={e => {
                         if(e.key === 'Enter') {
                            e.preventDefault();
                            handleSendMessage();
                         }
                      }}
                      placeholder={videoFinished && tests.length > 0 && !submitted ? "Test vaqtida AI bloklangan" : "AI ga savol bering..."}
                      className="flex-1 h-10 rounded-xl px-4 text-xs font-medium border-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm disabled:opacity-50"
                      disabled={!planningStarted || isAiTyping || (videoFinished && tests.length > 0 && !submitted)}
                    />
                    <Button 
                      disabled={!planningStarted || !chatMessage.trim() || isAiTyping || (videoFinished && tests.length > 0 && !submitted)}
                      onClick={handleSendMessage}
                      className="h-10 w-10 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                    >
                       <ArrowRight className="h-4 w-4" />
                    </Button>
                 </div>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm bg-white p-8">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Asosiy tayanch nuqtalar</h4>
                 <div className="space-y-4">
                    {[
                       { label: "Mantiqiy fikrlash", icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50" },
                       { label: "O'zaro bog'liqlik", icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50" },
                       { label: "Amaliy tadbiq", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
                    ].map((item, i) => (
                       <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.bg} ${item.color}`}>
                             <item.icon className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                       </div>
                    ))}
                 </div>
              </Card>
           </div>
        </div>
      </div>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-xl p-0 max-w-xl border border-slate-200 shadow-lg bg-white overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Testni Tahrirlash
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Savol matni
              </Label>
              <Textarea
                value={editForm.question}
                onChange={(e) => setEditForm({...editForm, question: e.target.value})}
                className="min-h-[80px] rounded-lg border-slate-200 font-medium text-sm resize-none"
                placeholder="Savol matnini kiriting..."
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Javob variantlari
              </Label>
              {editForm.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <button
                    onClick={() => setEditForm({ ...editForm, correct_answer: opt })}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      editForm.correct_answer === opt
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {editForm.correct_answer === opt && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </button>
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...editForm.options];
                      const oldOpt = newOptions[i];
                      newOptions[i] = e.target.value;
                      setEditForm({
                        ...editForm,
                        options: newOptions,
                        correct_answer: editForm.correct_answer === oldOpt 
                          ? e.target.value 
                          : editForm.correct_answer
                      });
                    }}
                    className="h-9 rounded-lg border-slate-200 font-medium text-sm"
                    placeholder={`${i + 1}-variant`}
                  />
                </div>
              ))}
              <p className="text-[11px] text-slate-400 mt-1">
                ✓ belgisini bosib to'g'ri javobni belgilang
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="h-10 flex-1 rounded-lg font-medium text-slate-600 border-slate-200"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleSaveTest}
              disabled={isSavingTest}
              className="h-10 flex-[2] rounded-lg bg-[#0056d2] hover:bg-[#00419e] text-white font-medium"
            >
              {isSavingTest 
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Save className="h-4 w-4 mr-2" /> Saqlash</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LessonPage;
