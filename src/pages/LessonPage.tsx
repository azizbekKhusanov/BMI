import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";

const LessonPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [selfRating, setSelfRating] = useState(3);
  const [reflection, setReflection] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase.from("lessons").select("*, courses(title, id)").eq("id", id).single().then(({ data }) => setLesson(data));
    supabase.from("tests").select("*").eq("lesson_id", id).then(({ data }) => setTests(data || []));
  }, [id]);

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

  const handleSelfAssessment = async () => {
    if (!user || !id) return;
    await supabase.from("self_assessments").insert({
      user_id: user.id, lesson_id: id, rating: selfRating, reflection,
    });
    toast.success("O'z-o'zini baholash saqlandi!");
  };

  if (!lesson) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/courses/${lesson.courses?.id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {lesson.courses?.title}
        </Button>

        <div>
          <h1 className="text-2xl font-bold font-serif">{lesson.title}</h1>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{lesson.content_type}</span>
        </div>

        {lesson.content_type === "video" && lesson.content_url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe src={lesson.content_url} className="w-full h-full" allowFullScreen title={lesson.title} />
          </div>
        )}

        {lesson.content_text && (
          <Card>
            <CardContent className="pt-6 prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.content_text }} />
            </CardContent>
          </Card>
        )}

        {tests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Testlar ({tests.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {tests.map((test, idx) => (
                <div key={test.id} className="space-y-3">
                  <p className="font-medium">{idx + 1}. {test.question}</p>
                  <RadioGroup
                    value={answers[test.id] || ""}
                    onValueChange={(v) => setAnswers({ ...answers, [test.id]: v })}
                    disabled={submitted}
                  >
                    {(test.options as string[]).map((opt: string) => (
                      <div key={opt} className={`flex items-center space-x-2 p-2 rounded ${
                        submitted
                          ? opt === test.correct_answer
                            ? "bg-green-50 border border-green-200"
                            : answers[test.id] === opt && !results[test.id]
                              ? "bg-red-50 border border-red-200"
                              : ""
                          : ""
                      }`}>
                        <RadioGroupItem value={opt} id={`${test.id}-${opt}`} />
                        <Label htmlFor={`${test.id}-${opt}`} className="cursor-pointer flex-1">{opt}</Label>
                        {submitted && opt === test.correct_answer && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              {!submitted && (
                <Button onClick={handleSubmitTests} disabled={Object.keys(answers).length < tests.length}>
                  Javoblarni topshirish
                </Button>
              )}
              {submitted && (
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="font-medium">
                    Natija: {Object.values(results).filter(Boolean).length}/{tests.length} to'g'ri
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">O'z-o'zini baholash</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bu darsni qanchalik tushundingiz?</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setSelfRating(n)} className="p-1">
                    <Star className={`h-6 w-6 ${n <= selfRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Fikrlaringiz (ixtiyoriy)</Label>
              <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Bu darsdan nimalarni o'rgandim..." className="mt-2" />
            </div>
            <Button variant="outline" onClick={handleSelfAssessment}>Saqlash</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LessonPage;
