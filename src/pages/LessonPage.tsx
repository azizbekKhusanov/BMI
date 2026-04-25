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
  Maximize, Volume2, Pause, FastForward, Trash2, Plus, HelpCircle
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

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const LessonPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
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

  const isTeacher = profile?.role === 'teacher';
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
      const { data, error } = await supabase.from("lessons").select("*, courses(title, id, image_url)").eq("id", id).single();
      if (error) throw error;
      setLesson(data);
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
      if (!isTeacher) toast.success("Dars yakunlandi!");
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
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData || []);
    }
  };

  const handleDeleteQuestion = async (testId: string) => {
    const { error } = await supabase.from("tests").delete().eq("id", testId);
    if (!error) {
      toast.success("Savol o'chirildi");
      const { data: testsData } = await supabase.from("tests").select("*").eq("lesson_id", id);
      setTests(testsData || []);
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
      <div className="max-w-5xl mx-auto space-y-10 py-10 pb-32">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-5">
              <Button variant="outline" onClick={() => navigate(`/courses/${lesson.courses?.id}`)} className="rounded-2xl h-14 w-14 p-0"><ArrowLeft className="h-6 w-6 text-slate-600" /></Button>
              <div>
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{lesson.courses?.title}</p>
                 <h1 className="text-3xl font-bold text-slate-800 font-serif uppercase tracking-tight">{lesson.title}</h1>
              </div>
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

        {/* Content & Tests */}
        {(videoFinished || lesson?.content_type === 'text' || (profile && isTeacher)) && (
          <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
             <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10 space-y-10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><FileText className="h-6 w-6" /></div><h2 className="text-2xl font-bold text-slate-800 font-serif uppercase tracking-tight">BILIMNI TEKSHIRISH</h2></div>
                   {isTeacher && <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[10px] uppercase px-4 py-1.5 rounded-full">O'qituvchi Boshqaruvi</Badge>}
                </div>
                {tests.length === 0 ? (
                   <div className="py-20 text-center space-y-4"><HelpCircle className="h-12 w-12 text-slate-100 mx-auto" /><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Hozircha savollar yo'q</p></div>
                ) : (
                   <div className="space-y-12">
                      {tests.map((test, idx) => (
                        <div key={test.id} className="space-y-6 relative group">
                           {isTeacher && <Button onClick={() => handleDeleteQuestion(test.id)} variant="ghost" className="absolute -right-4 -top-4 h-10 w-10 p-0 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="h-5 w-5" /></Button>}
                           <p className="text-lg font-bold text-slate-700">{idx + 1}. {test.question}</p>
                           <RadioGroup value={answers[test.id] || ""} onValueChange={(v) => setAnswers({ ...answers, [test.id]: v })} disabled={submitted || isTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(test.options as string[]).map((opt: string) => (
                                <div key={opt}><RadioGroupItem value={opt} id={`${test.id}-${opt}`} className="peer sr-only" /><Label htmlFor={`${test.id}-${opt}`} className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer font-bold text-xs uppercase ${isTeacher ? (opt === test.correct_answer ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-slate-50 border-slate-100") : submitted ? (opt === test.correct_answer ? "bg-emerald-50 border-emerald-500 text-emerald-700" : answers[test.id] === opt ? "bg-red-50 border-red-500 text-red-700" : "bg-slate-50 opacity-50") : "border-slate-100 bg-slate-50/50 hover:border-indigo-400 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700"}`}>{opt}</Label></div>
                              ))}
                           </RadioGroup>
                        </div>
                      ))}
                   </div>
                )}
                {!submitted && !isTeacher && tests.length > 0 && <Button onClick={handleSubmitTests} disabled={Object.keys(answers).length < tests.length} className="w-full h-14 rounded-2xl bg-indigo-600 font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Javoblarni topshirish</Button>}
             </Card>
             {isTeacher && (
                <Card className="rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 space-y-8">
                   <div className="flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600"><Plus className="h-6 w-6" /></div><h2 className="text-xl font-bold text-slate-800 font-serif uppercase tracking-tight">YANGI SAVOL QO'SHISH</h2></div>
                   <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Savol matni</Label><Input value={newQuestion.question} onChange={e => setNewQuestion({...newQuestion, question: e.target.value})} placeholder="Savolni kiriting..." className="h-14 rounded-2xl border-white bg-white shadow-sm" /></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{newQuestion.options.map((opt, idx) => (<div key={idx} className="space-y-2"><Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{idx + 1}-variant</Label><Input value={opt} onChange={e => { const newOpts = [...newQuestion.options]; newOpts[idx] = e.target.value; setNewQuestion({...newQuestion, options: newOpts}); }} placeholder="Variantni yozing..." className="h-12 rounded-xl border-white bg-white shadow-sm" /></div>))}</div>
                      <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To'g'ri javob</Label><select value={newQuestion.correct_answer} onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})} className="w-full h-14 rounded-2xl border border-white bg-white shadow-sm px-4 text-sm font-bold"><option value="">To'g'ri javobni tanlang...</option>{newQuestion.options.filter(o => o !== "").map((opt, idx) => (<option key={idx} value={opt}>{opt}</option>))}</select></div>
                      <Button onClick={handleAddQuestion} className="h-14 rounded-2xl bg-indigo-600 font-bold text-xs uppercase tracking-widest gap-2"><Plus className="h-4 w-4" /> Savolni darsga qo'shish</Button>
                   </div>
                </Card>
             )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LessonPage;
