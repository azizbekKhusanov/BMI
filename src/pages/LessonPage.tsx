import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, CheckCircle, Star, Video, FileText, Lock, 
  Loader2, Play, Settings2, Gauge, MonitorPlay, ChevronRight,
  Maximize, Volume2, Pause, Trash2, Plus, HelpCircle, Edit,
  Sparkles, Brain, TrendingUp, Zap, Target, MessageSquare, 
  LayoutDashboard, Check, ArrowUpRight, Pencil
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuPortal as DropdownMenuPortalComp,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AICoach from "@/components/AICoach";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
    };
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  setPlaybackQuality: (quality: string) => void;
  getAvailableQualityLevels: () => string[];
}

interface YTPlayerOptions {
  videoId: string;
  playerVars: Record<string, unknown>;
  events: {
    onReady: () => void;
    onStateChange: (event: { data: number }) => void;
  };
}

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  content_url: string;
  course_id: string;
  order_index: number;
  courses?: Course;
}

interface Test {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
}

const LessonPage = () => {
  const { id } = useParams();
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  
  // Metacognitive Planning States
  const [planningStarted, setPlanningStarted] = useState(false);
  const [preRating, setPreRating] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(true);
  
  // Reflection States
  const [selfRating, setSelfRating] = useState(0);
  const [reflection1, setReflection1] = useState("");
  const [reflection2, setReflection2] = useState("");
  const [reflection3, setReflection3] = useState("");
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editQuestionOpen, setEditQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Test | null>(null);
  const [newQuestion, setNewQuestion] = useState({ question: "", options: ["", "", "", ""], correct_answer: "" });
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Video & Player states
  const [videoFinished, setVideoFinished] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const playerRef = useRef<YTPlayer | null>(null);

  const isTeacher = roles?.includes('teacher') || roles?.includes('admin') || false;
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const standardQualities = useMemo(() => ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'], []);

  const updateProgress = useCallback(async () => {
    if (!user || !id || !lesson) return;
    try {
      const { data: allLessons } = await supabase.from("lessons").select("id").eq("course_id", lesson.course_id);
      if (!allLessons?.length) return;

      const progressStep = 100 / allLessons.length;
      const { data: currentEnroll } = await supabase.from("enrollments").select("progress").eq("user_id", user.id).eq("course_id", lesson.course_id).maybeSingle();
      
      const newProgress = Math.min(100, (currentEnroll?.progress || 0) + progressStep);

      await supabase
        .from("enrollments")
        .update({ progress: newProgress })
        .eq("user_id", user.id)
        .eq("course_id", lesson.course_id);
      
      setEnrollment(prev => prev ? { ...prev, progress: newProgress } : null);
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  }, [user, id, lesson]);

  const fetchData = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select(`
          *,
          courses (id, title)
        `)
        .eq("id", id)
        .single();
      
      if (lessonError) throw lessonError;
      setLesson(lessonData as unknown as Lesson & { courses: Course });
      
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData as Test[] || []);

      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", lessonData.course_id)
        .maybeSingle();
      setEnrollment(enrollData as Enrollment);
    } catch (error) {
      console.error("Error fetching lesson:", error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getYoutubeId = useCallback((url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, []);

  const updateQualities = useCallback(() => {
    if (playerRef.current && (playerRef.current as unknown as YTPlayer).getAvailableQualityLevels) {
      const levels = (playerRef.current as unknown as YTPlayer).getAvailableQualityLevels();
      if (levels && levels.length > 0) {
        setAvailableQualities(levels);
      } else {
        setAvailableQualities(standardQualities);
      }
    }
  }, [standardQualities]);

  const onPlayerStateChange = useCallback((event: { data: number }) => {
    if (event.data === 1) { // Playing
      setIsPlaying(true);
      updateQualities();
    }
    if (event.data === 2) setIsPlaying(false); // Paused
    if (event.data === 0) { // Ended
      setVideoFinished(true);
      setIsPlaying(false);
      if (!isTeacher) {
        toast.success("Dars yakunlandi!");
        updateProgress();
      }
    }
  }, [isTeacher, updateProgress, updateQualities]);

  const initPlayer = useCallback(() => {
    const videoId = getYoutubeId(lesson?.content_url || "");
    if (!videoId || !document.getElementById('youtube-player')) return;
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoId,
      playerVars: { 'modestbranding': 1, 'rel': 0, 'showinfo': 0, 'controls': 1, 'iv_load_policy': 3, 'enablejsapi': 1, 'color': 'white' },
      events: { 
        'onReady': () => {
          setPlayerReady(true);
          updateQualities();
        }, 
        'onStateChange': onPlayerStateChange 
      }
    });
  }, [lesson, getYoutubeId, onPlayerStateChange, updateQualities]);

  const loadYoutubeAPI = useCallback(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    }
  }, [initPlayer]);

  useEffect(() => {
    if (!loading && lesson?.content_type === 'video' && lesson?.content_url) {
      const timer = setTimeout(() => { loadYoutubeAPI(); }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, lesson, loadYoutubeAPI]);

  const handleSpeedChange = (speed: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
      setCurrentSpeed(speed);
    }
  };

  const handleQualityChange = (quality: string) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackQuality(quality);
      setCurrentQuality(quality);
      toast.info(`Sifat: ${quality.toUpperCase()}`);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSubmitTests = async () => {
    if (!user) return;
    const newResults: Record<string, boolean> = {};
    const inserts = tests.map((test) => {
      const isCorrect = answers[test.id] === test.correct_answer;
      newResults[test.id] = isCorrect;
      return { user_id: user.id, test_id: test.id, answer: answers[test.id] || "", is_correct: isCorrect };
    });
    setResults(newResults);
    setSubmitted(true);
    await supabase.from("test_results").insert(inserts);
    toast.success("Testlar topshirildi!");
    updateProgress();
  };

  if (loading) return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-10 py-10">
        <Skeleton className="h-12 w-64 rounded-2xl" /><Skeleton className="h-[500px] w-full rounded-[3rem]" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10 py-10 px-4 lg:px-8">
        
        {/* Metacognitive Planning Modal */}
        <AnimatePresence>
          {isPlanningModalOpen && !planningStarted && !isTeacher && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-white"
              >
                <div className="bg-indigo-600 p-10 text-white text-center space-y-4">
                  <div className="h-20 w-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl">
                    <Brain className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold font-serif uppercase tracking-tight italic">Darsni Rejalashtirish</h2>
                  <p className="text-indigo-100 font-medium">Metakognitiv strategiya: O'rganishdan oldin maqsad qo'ying</p>
                </div>

                <div className="p-12 space-y-10">
                  <div className="space-y-6">
                    <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                      <Zap className="h-5 w-5 text-amber-500" /> Hozirgi bilim darajangiz:
                    </Label>
                    <div className="flex justify-between gap-4">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button 
                          key={val}
                          onClick={() => setPreRating(val)}
                          className={`flex-1 h-16 rounded-2xl border-2 font-black transition-all ${
                            preRating === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-indigo-200'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                      <Target className="h-5 w-5 text-red-500" /> Bugungi maqsadlar:
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {["Mavzuni tushunish", "Testdan 100% o'tish", "Amaliyotda qo'llash", "Yangi terminlar"].map((goal) => (
                        <div 
                          key={goal}
                          onClick={() => {
                            setSelectedGoals(prev => 
                              prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
                            );
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                            selectedGoals.includes(goal) ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                          }`}
                        >
                          <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${selectedGoals.includes(goal) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                             {selectedGoals.includes(goal) && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-sm font-bold">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    disabled={preRating === 0 || selectedGoals.length === 0}
                    onClick={async () => {
                      if (!user || !id) return;
                      // Metakognitiv sessiyani saqlash
                      await (supabase as unknown as { from: (t: string) => { insert: (d: unknown) => Promise<unknown> } }).from("learning_sessions").insert({
                        user_id: user.id,
                        lesson_id: id,
                        pre_rating: preRating,
                        selected_goals: selectedGoals
                      });
                      setPlanningStarted(true);
                      setIsPlanningModalOpen(false);
                      toast.success("Reja tuzildi! Darsni boshlashingiz mumkin.");
                    }}
                    className="h-16 w-full rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl disabled:opacity-30 transition-all active:scale-95"
                  >
                    Darsni Boshlash
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lesson Content Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 p-8 lg:p-10 shadow-xl shadow-blue-100">
           <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
              <Sparkles className="w-full h-full text-white" />
           </div>
           
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                 <Button 
                   variant="outline" 
                   size="icon" 
                   onClick={() => navigate(`/courses/${lesson?.course_id}`)} 
                   className="h-12 w-12 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md shrink-0 transition-all active:scale-90"
                 >
                   <ArrowLeft className="h-5 w-5" />
                 </Button>
                 <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                       <Badge className="bg-white/20 text-blue-100 border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">
                          {lesson?.courses?.title || "Kurs nomi"}
                       </Badge>
                       <div className="h-1 w-1 rounded-full bg-white/30" />
                       <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
                          {lesson?.content_type === 'video' ? 'Video dars' : 'Matnli dars'}
                       </span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold font-serif text-white uppercase tracking-tight leading-none">
                       {lesson?.title}
                    </h1>
                 </div>
              </div>
           </div>
        </div>

        {lesson?.content_type === "video" && (
          <div className="relative group/player">
             <div className="aspect-video rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl ring-8 ring-slate-100/50 relative cursor-pointer">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  {!isPlaying && playerReady && (
                    <div className="h-24 w-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform"><Play className="h-10 w-10 fill-current" /></div>
                  )}
               </div>
               <div className="absolute top-[-10%] bottom-[-10%] left-0 right-0"><div id="youtube-player" className="w-full h-full" /></div>
               {!playerReady && <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white z-20"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>}

               {/* Bottom Controls */}
               <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-end px-10 pb-8 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 z-30">
                  <div className="w-full flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">{isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}</button>
                        <Volume2 className="h-6 w-6 text-white/60" />
                     </div>

                     <div className="flex items-center gap-6">
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <button className="text-white hover:text-indigo-400 transition-all"><Settings2 className="h-6 w-6" /></button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" side="top" sideOffset={25} className="w-56 rounded-[1.5rem] p-2 border-white/10 bg-black/95 backdrop-blur-3xl text-white shadow-2xl z-[100]">
                              <DropdownMenuSub>
                                 <DropdownMenuSubTrigger className="rounded-xl px-4 py-3 font-bold text-[11px] uppercase tracking-widest gap-3 focus:bg-indigo-600/30 data-[state=open]:bg-indigo-600/30 flex items-center justify-between cursor-pointer text-white">
                                    <div className="flex items-center gap-3"><Gauge className="h-4 w-4 text-indigo-400" /> Tezligi</div>
                                    <ChevronRight className="h-4 w-4 text-white/40" />
                                 </DropdownMenuSubTrigger>
                                 <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="rounded-[1.5rem] p-2 border-white/10 bg-black/95 backdrop-blur-3xl text-white min-w-[120px] z-[101]">
                                       {speedOptions.map(speed => (
                                          <DropdownMenuItem key={speed} onClick={() => handleSpeedChange(speed)} className={`rounded-xl px-4 py-2 font-bold text-xs cursor-pointer ${currentSpeed === speed ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-white/70'}`}>
                                             {speed === 1 ? 'Normal' : `${speed}x`}
                                          </DropdownMenuItem>
                                       ))}
                                    </DropdownMenuSubContent>
                                 </DropdownMenuPortal>
                              </DropdownMenuSub>

                              <DropdownMenuSub>
                                 <DropdownMenuSubTrigger className="rounded-xl px-4 py-3 font-bold text-[11px] uppercase tracking-widest gap-3 focus:bg-indigo-600/30 data-[state=open]:bg-indigo-600/30 flex items-center justify-between cursor-pointer text-white">
                                    <div className="flex items-center gap-3"><MonitorPlay className="h-4 w-4 text-indigo-400" /> Sifati</div>
                                    <ChevronRight className="h-4 w-4 text-white/40" />
                                 </DropdownMenuSubTrigger>
                                 <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="rounded-[1.5rem] p-2 border-white/10 bg-black/95 backdrop-blur-3xl text-white min-w-[120px] z-[101]">
                                       {availableQualities.map(q => (
                                          <DropdownMenuItem key={q} onClick={() => handleQualityChange(q)} className={`rounded-xl px-4 py-2 font-bold text-xs uppercase cursor-pointer ${currentQuality === q ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-white/70'}`}>
                                             {q.replace('hd1080', '1080p').replace('hd720', '720p').replace('large', '480p').replace('medium', '360p').replace('small', '240p').replace('tiny', '144p')}
                                          </DropdownMenuItem>
                                       ))}
                                    </DropdownMenuSubContent>
                                 </DropdownMenuPortal>
                              </DropdownMenuSub>
                           </DropdownMenuContent>
                        </DropdownMenu>
                        <Maximize className="h-6 w-6 text-white" />
                     </div>
                  </div>
               </div>
             </div>
          </div>
        )}

        {/* Quiz Section */}
        <div className="space-y-8">
           <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden">
              <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                       <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold font-serif uppercase tracking-tight">Dars Testi</h2>
                       <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-1">Bilimingizni sinovdan o'tkazing</p>
                    </div>
                 </div>
              </div>

              <CardContent className="p-10 space-y-12">
                 {(!isTeacher && !videoFinished && lesson?.content_type === 'video') ? (
                    <div className="py-20 text-center space-y-6">
                       <Lock className="h-14 w-14 text-slate-100 mx-auto" />
                       <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Testni yechish uchun videoni yakunlang</p>
                    </div>
                 ) : (
                    <div className="space-y-12">
                       {tests.map((test, idx) => (
                          <div key={test.id} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                             <div className="flex gap-6">
                                <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</div>
                                <div className="space-y-8 flex-1">
                                   <p className="text-xl font-bold text-slate-800 leading-snug">{test.question}</p>
                                   <RadioGroup value={answers[test.id] || ""} onValueChange={(val) => setAnswers(prev => ({ ...prev, [test.id]: val }))} disabled={submitted} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {test.options.map((option: string, i: number) => (
                                         <div key={i} className={`flex items-center space-x-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${answers[test.id] === option ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white'}`}>
                                            <RadioGroupItem value={option} id={`q-${test.id}-${i}`} />
                                            <Label htmlFor={`q-${test.id}-${i}`} className="text-sm font-bold text-slate-600 cursor-pointer flex-1">{option}</Label>
                                         </div>
                                      ))}
                                   </RadioGroup>
                                </div>
                             </div>
                          </div>
                       ))}
                       
                       {!submitted && tests.length > 0 && (
                          <Button onClick={handleSubmitTests} className="h-16 w-full rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest">Testlarni Tekshirish</Button>
                       )}
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>

        {/* Structured Reflection Section */}
        {submitted && (
           <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden">
              <div className="bg-emerald-600 p-8 text-white flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                       <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold font-serif uppercase tracking-tight">Metakognitiv Refleksiya</h2>
                       <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mt-1">O'z o'rganish jarayoningizni tahlil qiling</p>
                    </div>
                 </div>
              </div>

              <CardContent className="p-10 space-y-10">
                 <div className="space-y-6">
                    <Label className="text-lg font-bold text-slate-800">Darsdan keyingi bilim darajangiz:</Label>
                    <div className="flex gap-4">
                       {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setSelfRating(star)} className={`h-16 w-16 rounded-2xl flex items-center justify-center ${selfRating >= star ? 'bg-amber-400 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                             <Star className={`h-8 w-8 ${selfRating >= star ? 'fill-current' : ''}`} />
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                       <Label className="text-sm font-bold text-slate-700">Qaysi qism qiyin bo'ldi?</Label>
                       <Textarea value={reflection1} onChange={(e) => setReflection1(e.target.value)} className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 p-4" />
                    </div>
                    <div className="space-y-4">
                       <Label className="text-sm font-bold text-slate-700">Nima uchun?</Label>
                       <Textarea value={reflection2} onChange={(e) => setReflection2(e.target.value)} className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 p-4" />
                    </div>
                    <div className="space-y-4">
                       <Label className="text-sm font-bold text-slate-700">Qanday yaxshilaysiz?</Label>
                       <Textarea value={reflection3} onChange={(e) => setReflection3(e.target.value)} className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 p-4" />
                    </div>
                 </div>

                 <Button 
                    onClick={async () => {
                       if (!user || !id) return;
                       const fullReflection = `Qiyinchilik: ${reflection1} | Sabab: ${reflection2} | Reja: ${reflection3}`;
                       await supabase.from("self_assessments").insert({
                          user_id: user.id,
                          lesson_id: id,
                          rating: selfRating,
                          reflection: fullReflection,
                          predicted_score: preRating,
                          actual_score: Math.round((Object.values(results).filter(Boolean).length / (tests.length || 1)) * 5)
                       });
                       toast.success("Refleksiya saqlandi!");
                    }}
                    className="h-16 w-full rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs tracking-widest shadow-2xl"
                 >
                    Tahlilni Yakunlash
                 </Button>
              </CardContent>
           </Card>
        )}
      </div>

      <AICoach 
        triggerOpen={planningStarted || submitted} 
        studentAction={!submitted ? `"${lesson?.title}" mavzusi uchun reja tuzildi` : `"${lesson?.title}" mavzusi yakunlandi`}
        performanceData={{
          lessonTitle: lesson?.title,
          preRating,
          goals: selectedGoals,
          correctAnswers: Object.values(results).filter(Boolean).length,
          totalQuestions: tests.length,
          studentSelfRating: selfRating,
          studentReflection: `${reflection1} | ${reflection2} | ${reflection3}`
        } as Record<string, unknown>}
      />
    </Layout>
  );
};

export default LessonPage;
