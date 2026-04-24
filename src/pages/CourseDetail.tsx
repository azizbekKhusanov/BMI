import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, PlayCircle, FileText, HelpCircle, CheckCircle } from "lucide-react";

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("courses").select("*").eq("id", id).single().then(({ data }) => setCourse(data));
    supabase.from("lessons").select("*").eq("course_id", id).order("order_index").then(({ data }) => setLessons(data || []));
    if (user) {
      supabase.from("enrollments").select("*").eq("course_id", id).eq("user_id", user.id).single().then(({ data }) => setEnrollment(data));
    }
  }, [id, user]);

  const contentIcon = (type: string) => {
    switch (type) {
      case "video": return <PlayCircle className="h-4 w-4 text-primary" />;
      case "quiz": return <HelpCircle className="h-4 w-4 text-secondary" />;
      default: return <FileText className="h-4 w-4 text-accent" />;
    }
  };

  if (!course) {
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
      <div className="container py-8 space-y-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              {course.image_url && (
                <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden mb-6 bg-muted">
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-3xl font-bold font-serif">{course.title}</h1>
              <p className="text-muted-foreground mt-2">{course.description}</p>
            </div>

            {enrollment && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Kurs progressi</span>
                    <span className="text-sm text-muted-foreground">{Math.round(Number(enrollment.progress))}%</span>
                  </div>
                  <Progress value={Number(enrollment.progress)} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Darslar ({lessons.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessons.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">Hali darslar qo'shilmagan</p>
                ) : (
                  lessons.map((lesson, idx) => (
                    <Link
                      key={lesson.id}
                      to={enrollment ? `/lessons/${lesson.id}` : "#"}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        enrollment ? "hover:bg-muted cursor-pointer" : "opacity-60"
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {idx + 1}
                      </div>
                      {contentIcon(lesson.content_type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{lesson.content_type}</p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;
