import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, CheckCircle, Star, Video, FileText, Lock, Unlock, 
  PlayCircle, Loader2, Play, Settings2, Gauge, MonitorPlay, ChevronRight,
  Maximize, Volume2, Pause, FastForward, Trash2, Plus, HelpCircle, Edit
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const LessonPage = () => {
  const { id } = useParams();
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editQuestionOpen, setEditQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [newQuestion, setNewQuestion] = useState({ question: "", options: ["", "", "", ""], correct_answer: "" });
  const [selfRating, setSelfRating] = useState(3);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Video & Player states
  const [videoFinished, setVideoFinished] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const playerRef = useRef<any>(null);

  const isTeacher = roles.includes('teacher') || roles.includes('admin');
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const standardQualities = ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'];

  useEffect(() => {
    if (!id || !user) return;
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
      setProfile(pData);
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", id)
        .single();
      
      if (lessonError) throw lessonError;

      if (lessonData) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("title")
          .eq("id", lessonData.course_id)
          .single();
        
        setLesson({ ...lessonData, courses: courseData });
      }
      
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData || []);
    } catch (error) {
      console.error("Error fetching lesson:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && lesson?.content_type === 'video' && lesson?.content_url) {
      const timer = setTimeout(() => { loadYoutubeAPI(); }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, lesson]);

  const loadYoutubeAPI = () => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    }
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const initPlayer = () => {
    const videoId = getYoutubeId(lesson.content_url);
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
  };

  const updateQualities = () => {
    if (playerRef.current && playerRef.current.getAvailableQualityLevels) {
      const levels = playerRef.current.getAvailableQualityLevels();
      if (levels && levels.length > 0) {
        setAvailableQualities(levels);
      } else {
        // Fallback if API hasn't loaded levels yet
        setAvailableQualities(standardQualities);
      }
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === 1) { // Playing
      setIsPlaying(true);
      updateQualities(); // Refresh qualities when playing starts
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
  };

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
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question || !newQuestion.correct_answer) return toast.error("Barcha maydonlarni to'ldiring");
    const { error } = await supabase.from("tests").insert({
      lesson_id: id, question: newQuestion.question, options: newQuestion.options, correct_answer: newQuestion.correct_answer
    });
    if (!error) {
      toast.success("Savol qo'shildi");
      setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: "" });
      setAddQuestionOpen(false);
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData || []);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    const { error } = await supabase.from("tests").delete().eq("id", questionToDelete);
    if (!error) {
      toast.success("Savol o'chirildi");
      setDeleteConfirmOpen(false);
      setQuestionToDelete(null);
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData || []);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion.question || !editingQuestion.correct_answer) return toast.error("Barcha maydonlarni to'ldiring");
    const { error } = await supabase.from("tests").update({
      question: editingQuestion.question, options: editingQuestion.options, correct_answer: editingQuestion.correct_answer
    }).eq("id", editingQuestion.id);
    if (!error) {
      toast.success("Savol yangilandi");
      setEditQuestionOpen(false);
      setEditingQuestion(null);
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData || []);
    }
  };
  const updateProgress = async () => {
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
      <div className="max-w-7xl mx-auto space-y-10 py-10 px-4 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Lesson Header Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 p-8 lg:p-10 shadow-xl shadow-blue-100">
           <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
              <Sparkles className="w-full h-full text-white" />
           </div>
           
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                 <Button 
                   variant="outline" 
                   size="icon" 
                   onClick={() => navigate(`/courses/${lesson.courses?.id}`)} 
                   className="h-12 w-12 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md shrink-0 transition-all active:scale-90"
                 >
                   <ArrowLeft className="h-5 w-5" />
                 </Button>
                 <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                       <Badge className="bg-white/20 text-blue-100 border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">
                          {lesson.courses?.title || "Kurs nomi"}
                       </Badge>
                       <div className="h-1 w-1 rounded-full bg-white/30" />
                       <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
                          {lesson.content_type === 'video' ? 'Video dars' : 'Matnli dars'}
                       </span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold font-serif text-white uppercase tracking-tight leading-none">
                       {lesson.title}
                    </h1>
                 </div>
              </div>

              {isTeacher && (
                <div className="flex items-center gap-3">
                   <Button 
                     variant="outline" 
                     className="rounded-xl h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md px-5 font-black text-[9px] uppercase tracking-widest transition-all"
                     onClick={() => setAddQuestionOpen(true)}
                   >
                     <Plus className="h-4 w-4 mr-2" /> Savol qo'shish
                   </Button>
                </div>
              )}
           </div>
        </div>

        {lesson.content_type === "video" && (
          <div className="relative group/player">
             <div className="aspect-video rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl ring-8 ring-slate-100/50 relative cursor-pointer">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" onClick={togglePlay}>
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
                           <DropdownMenuPortal>
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
                           </DropdownMenuPortal>
                        </DropdownMenu>
                        <Maximize className="h-6 w-6 text-white" />
                     </div>
                  </div>
               </div>

               {!videoFinished && playerReady && profile && !isTeacher && (
                  <div className="absolute top-10 right-10 bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 text-white flex items-center gap-3 border border-white/10 z-10 animate-in slide-in-from-top-4"><Lock className="h-4 w-4 text-amber-400" /><span className="text-[11px] font-black uppercase tracking-[0.1em]">Darsni yakunlang</span></div>
               )}
             </div>
          </div>
        )}

        {/* Quiz Section (Yagona Quiz Obyekti sifatida) */}
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
           <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden">
              <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                       <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold font-serif uppercase tracking-tight">Dars Testi</h2>
                       <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-1">Bilimingizni sinovdan o'tkazing {tests.length > 0 && `(${tests.length} ta savol)`}</p>
                    </div>
                 </div>
                 {isTeacher && (
                    <Button 
                       onClick={() => setAddQuestionOpen(true)}
                       className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-black text-[10px] uppercase px-6 py-4 h-auto rounded-2xl backdrop-blur-md transition-all active:scale-95 gap-3 border"
                    >
                       <Plus className="h-4 w-4" /> Savol qo'shish
                    </Button>
                 )}
              </div>

              <CardContent className="p-10 space-y-12">
                 {/* Student logic: faqat video tugasa yoki o'qituvchi bo'lsa ko'rinadi */}
                 {(!isTeacher && !videoFinished && lesson?.content_type === 'video') ? (
                    <div className="py-20 text-center space-y-6">
                       <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-4 border-dashed border-slate-200 animate-pulse">
                          <Lock className="h-8 w-8 text-slate-300" />
                       </div>
                       <div className="space-y-2">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Test bloklangan</p>
                          <p className="text-[11px] text-slate-300 font-medium">Testni yechish uchun videdarsni oxirigacha ko'ring</p>
                       </div>
                    </div>
                 ) : (
                    <>
                       {tests.length === 0 ? (
                          <div className="py-20 text-center space-y-4">
                             <HelpCircle className="h-14 w-14 text-slate-100 mx-auto" />
                             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Hozircha test savollari qo'shilmagan</p>
                          </div>
                       ) : (
                          <div className="space-y-6">
                             {isTeacher ? (
                                <Accordion type="single" collapsible className="space-y-4">
                                   {tests.map((test, idx) => (
                                      <AccordionItem key={test.id} value={test.id} className="border-none">
                                         <div className="group relative">
                                            <AccordionTrigger className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-white data-[state=open]:shadow-lg data-[state=open]:border-transparent">
                                               <div className="flex items-center gap-4 text-left">
                                                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-indigo-100">{idx + 1}</div>
                                                  <p className="text-sm font-bold text-slate-700 leading-tight pr-20">{test.question}</p>
                                               </div>
                                            </AccordionTrigger>
                                            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                               <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={(e) => { e.stopPropagation(); setEditingQuestion({...test}); setEditQuestionOpen(true); }}
                                                  className="h-8 w-8 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                               >
                                                  <Edit className="h-3.5 w-3.5" />
                                               </Button>
                                               <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={(e) => { e.stopPropagation(); setQuestionToDelete(test.id); setDeleteConfirmOpen(true); }}
                                                  className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50"
                                               >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                               </Button>
                                            </div>
                                         </div>
                                         <AccordionContent className="p-6 pt-0 bg-white border-x border-b border-slate-100 rounded-b-2xl shadow-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                               {(test.options as string[]).map((option: string, i: number) => (
                                                  <div key={i} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${option === test.correct_answer ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}>
                                                     <div className={`h-3 w-3 rounded-full border ${option === test.correct_answer ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`} />
                                                     <Label className={`text-[11px] font-bold flex-1 ${option === test.correct_answer ? 'text-emerald-700' : 'text-slate-600'}`}>{option}</Label>
                                                     {option === test.correct_answer && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                                  </div>
                                               ))}
                                            </div>
                                         </AccordionContent>
                                      </AccordionItem>
                                   ))}
                                </Accordion>
                             ) : (
                                <div className="space-y-12">
                                   {tests.map((test, idx) => (
                                      <div key={test.id} className="p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 relative group transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
                                         <div className="flex gap-6">
                                            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-indigo-100">{idx + 1}</div>
                                            <div className="space-y-8 flex-1">
                                               <p className="text-xl font-bold text-slate-800 leading-snug">{test.question}</p>
                                               <RadioGroup value={answers[test.id] || ""} onValueChange={(val) => setAnswers(prev => ({ ...prev, [test.id]: val }))} disabled={submitted} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  {(test.options as string[]).map((option: string, i: number) => (
                                                     <div key={i} className={`flex items-center space-x-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${answers[test.id] === option ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
                                                        <RadioGroupItem value={option} id={`q-${test.id}-${i}`} className="text-indigo-600 border-2" />
                                                        <Label htmlFor={`q-${test.id}-${i}`} className="text-sm font-bold text-slate-600 cursor-pointer flex-1">{option}</Label>
                                                        {submitted && option === test.correct_answer && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                                                     </div>
                                                  ))}
                                               </RadioGroup>
                                            </div>
                                         </div>
                                      </div>
                                   ))}
                                   
                                   {!submitted && tests.length > 0 && (
                                      <Button onClick={handleSubmitTests} className="h-16 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-100 transition-all active:scale-95">Testlarni Tekshirish</Button>
                                   )}
                                </div>
                             )}
                          </div>
                       )}
                    </>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      {/* Add/Edit Question Dialog */}
      <Dialog open={addQuestionOpen || editQuestionOpen} onOpenChange={(open) => {
         if (!open) {
            setAddQuestionOpen(false);
            setEditQuestionOpen(false);
            setEditingQuestion(null);
            setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: "" });
         }
      }}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl border-none shadow-2xl bg-white">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-slate-800 font-serif uppercase tracking-tight">
               {editQuestionOpen ? "Savolni tahrirlash" : "Yangi savol qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Savol matni</Label>
              <Input 
                value={editQuestionOpen ? editingQuestion?.question : newQuestion.question}
                onChange={(e) => editQuestionOpen 
                  ? setEditingQuestion({ ...editingQuestion, question: e.target.value })
                  : setNewQuestion({ ...newQuestion, question: e.target.value })
                }
                placeholder="Misol: 2+2 nechiga teng?"
                className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold text-lg" 
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              {(editQuestionOpen ? editingQuestion?.options : newQuestion.options).map((opt: string, i: number) => {
                const isCorrect = (editQuestionOpen ? editingQuestion.correct_answer : newQuestion.correct_answer) === opt && opt !== "";
                return (
                  <div key={i} className="space-y-2 relative">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{i+1}-variant</Label>
                    <div className="relative">
                      <Input 
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(editQuestionOpen ? editingQuestion.options : newQuestion.options)];
                          newOpts[i] = e.target.value;
                          editQuestionOpen 
                            ? setEditingQuestion({ ...editingQuestion, options: newOpts })
                            : setNewQuestion({ ...newQuestion, options: newOpts });
                        }}
                        placeholder={`Variant-${i+1}`}
                        className={`h-14 rounded-2xl border-2 transition-all px-6 pr-14 font-bold ${isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'}`} 
                      />
                      <button
                        onClick={() => {
                          if (!opt) return toast.error("Oldin variant matnini kiriting");
                          editQuestionOpen
                            ? setEditingQuestion({ ...editingQuestion, correct_answer: opt })
                            : setNewQuestion({ ...newQuestion, correct_answer: opt });
                        }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center transition-all ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button 
               onClick={editQuestionOpen ? handleUpdateQuestion : handleAddQuestion} 
               disabled={
                 (editQuestionOpen ? !editingQuestion?.question || !editingQuestion?.correct_answer : !newQuestion.question || !newQuestion.correct_answer)
               }
               className="h-16 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-30 transition-all"
            >
               {editQuestionOpen ? "O'zgarishlarni saqlash" : "Savolni qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-md border-none shadow-2xl bg-white text-center">
          <DialogHeader className="space-y-4">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-2">
               <Trash2 className="h-10 w-10" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-800 font-serif uppercase">Savolni o'chirish</DialogTitle>
            <DialogDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
               Rostan ham ushbu savolni o'chirmoqchimisiz? <br />Bu amalni ortga qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)} 
              className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200"
            >
               Bekor qilish
            </Button>
            <Button 
              onClick={handleDeleteQuestion} 
              className="h-14 flex-1 rounded-2xl bg-red-500 hover:bg-red-600 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100 text-white"
            >
               O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default LessonPage;
