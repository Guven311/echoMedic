// Importer React-hooks
import { useEffect, useState } from "react";
// Importer Supabase-klient
import { supabase } from "@/lib/supabase";
// Importer UI-komponenter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
// Importer ikoner
import { CheckCircle2, Circle, GraduationCap, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
// Importer hooks for toast og auth
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
// Importer markdown-renderer
import ReactMarkdown from "react-markdown";
// Importer kursbilde-assets
import complianceIntroImg from "@/assets/course-compliance-intro.jpg";
import responsibilityImg from "@/assets/course-responsibility.jpg";
import gettingStartedImg from "@/assets/course-getting-started.jpg";
import securityGdprImg from "@/assets/course-security-gdpr.jpg";
import gdprImg from "@/assets/course-gdpr.jpg";
import practicalSecurityImg from "@/assets/course-practical-security.jpg";
import riskAssessmentImg from "@/assets/course-risk-assessment.jpg";
import riskManagementImg from "@/assets/course-risk-management.jpg";
import practicalUsageImg from "@/assets/course-practical-usage.jpg";

// Interface for quiz-spørsmål
interface Quiz {
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

// Interface for kurs med moduler
interface Course {
  id: string;
  title: string;
  description: string;
  content: {
    modules: Array<{
      id: string;
      title: string;
      content: string;
      quiz?: Quiz;
    }>;
  };
  sort_order: number;
  is_required: boolean;
}

// Interface for brukerens kurs-progresjon
interface UserProgress {
  id: string;
  course_id: string;
  completed_modules: string[];
  is_completed: boolean;
}

// Onboarding-side: viser obligatorisk opplæring for nye brukere
export default function Onboarding() {
  // State for alle kurser
  const [courses, setCourses] = useState<Course[]>([]);
  // State for brukerens progresjon på hver kurs
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  // State for valgt kurs (null = oversikt-visning)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  // State for nåværende modul-indeks
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  // Loading-state
  const [loading, setLoading] = useState(true);
  // State for valgte quiz-svar
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  // State for om quiz er sendt inn
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  // State for om quiz-svar er riktig
  const [quizPassed, setQuizPassed] = useState(false);
  // Toast-hook for meldinger
  const { toast } = useToast();
  // Auth-hook for nåværende bruker
  const { user } = useAuth();

  // Kjør lastData når brukeren endrer seg
  useEffect(() => {
    loadData();
  }, [user]);

  // Hent kurser og brukerens progresjon fra Supabase
  const loadData = async () => {
    if (!user) return;

    try {
      // Last inn alle kurser
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .order("sort_order");

      setCourses((coursesData as unknown as Course[]) || []);

      // Last inn brukerens progresjon
      const { data: progressData } = await supabase
        .from("user_course_progress")
        .select("*")
        .eq("user_id", user.id);

      // Konverter til map for rask oppslag
      const progressMap: Record<string, UserProgress> = {};
      progressData?.forEach((p) => {
        progressMap[p.course_id] = {
          id: p.id,
          course_id: p.course_id,
          completed_modules: p.completed_modules as string[],
          is_completed: p.is_completed,
        };
      });
      setProgress(progressMap);
    } catch (error) {
      console.error("Error loading onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hjelpe-funksjon: beregn progresjon for en kurs i prosent
  const getCourseProgress = (course: Course) => {
    const userProgress = progress[course.id];
    if (!userProgress) return 0;
    
    const totalModules = course.content.modules.length;
    const completedModules = userProgress.completed_modules.length;
    return (completedModules / totalModules) * 100;
  };

  // Hjelpe-funksjon: sjekk om en modul er fullført
  const isModuleCompleted = (courseId: string, moduleId: string) => {
    const userProgress = progress[courseId];
    return userProgress?.completed_modules.includes(moduleId) || false;
  };

  // Hjelpe-funksjon: fullført en modul og oppdater progresjon
  const handleCompleteModule = async (courseId: string, moduleId: string) => {
    if (!user) return;

    try {
      const currentProgress = progress[courseId];
      const completedModules = currentProgress 
        ? [...currentProgress.completed_modules, moduleId]
        : [moduleId];

      const course = courses.find(c => c.id === courseId);
      const isFullyCompleted = course && completedModules.length === course.content.modules.length;

      if (currentProgress) {
        // Update existing progress
        const { error } = await supabase
          .from("user_course_progress")
          .update({
            completed_modules: completedModules,
            is_completed: isFullyCompleted,
            completed_at: isFullyCompleted ? new Date().toISOString() : null,
          })
          .eq("id", currentProgress.id);

        if (error) throw error;
      } else {
        // Create new progress
        const { error } = await supabase
          .from("user_course_progress")
          .insert({
            user_id: user.id,
            course_id: courseId,
            completed_modules: completedModules,
            is_completed: isFullyCompleted,
            completed_at: isFullyCompleted ? new Date().toISOString() : null,
          });

        if (error) throw error;
      }

      toast({
        title: "Modul fullført!",
        description: isFullyCompleted ? "Gratulerer! Du har fullført kurset." : "Bra jobbet!",
      });

      await loadData();
    } catch (error) {
      console.error("Error completing module:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke markere modul som fullført",
        variant: "destructive",
      });
    }
  };

  // Hjelpe-funksjon: start et nytt kurs
  const startCourse = (course: Course) => {
    setSelectedCourse(course);
    const userProgress = progress[course.id];
    if (userProgress) {
      // Find first incomplete module
      const firstIncomplete = course.content.modules.findIndex(
        m => !userProgress.completed_modules.includes(m.id)
      );
      setCurrentModuleIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    } else {
      setCurrentModuleIndex(0);
    }
    resetQuiz();
  };

  // Hjelpe-funksjon: nullstill quiz
  const resetQuiz = () => {
    setSelectedAnswers([]);
    setQuizSubmitted(false);
    setQuizPassed(false);
  };

  // Hjelpe-funksjon: håndter quiz svar-valg
  const handleAnswerToggle = (optionIndex: number) => {
    if (quizSubmitted) return;
    
    const currentModule = selectedCourse?.content.modules[currentModuleIndex];
    if (!currentModule?.quiz) return;

    const isMultipleChoice = currentModule.quiz.correctAnswers.length > 1;

    if (isMultipleChoice) {
      setSelectedAnswers(prev => 
        prev.includes(optionIndex)
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setSelectedAnswers([optionIndex]);
    }
  };

  // Hjelpe-funksjon: send inn quiz og sjekk svar
  const handleSubmitQuiz = () => {
    const currentModule = selectedCourse?.content.modules[currentModuleIndex];
    if (!currentModule?.quiz) return;

    const correctAnswers = currentModule.quiz.correctAnswers;
    const isCorrect = 
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every(ans => correctAnswers.includes(ans));

    setQuizSubmitted(true);
    setQuizPassed(isCorrect);

    if (isCorrect) {
      toast({
        title: "Riktig svar!",
        description: "Du kan nå gå videre til neste modul.",
      });
    } else {
      toast({
        title: "Feil svar",
        description: "Les forklaringen og prøv igjen.",
        variant: "destructive",
      });
    }
  };

  // Vis loading-spinner mens data lastes inn
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Vis valgt kurs med moduler og quiz
  if (selectedCourse) {
    const currentModule = selectedCourse.content.modules[currentModuleIndex];
    const isCurrentModuleCompleted = isModuleCompleted(selectedCourse.id, currentModule.id);
    const courseProgressPercent = getCourseProgress(selectedCourse);

    return (
      <div className="space-y-6">
        {/* Kurstittel og tilbake-knapp */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{selectedCourse.title}</h1>
            <p className="text-muted-foreground">{selectedCourse.description}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedCourse(null)}>
            Tilbake til oversikt
          </Button>
        </div>

        {/* Progresjonbar for kursen */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                Kursfremdrift
                <Badge variant="secondary">{Math.round(courseProgressPercent)}%</Badge>
              </CardTitle>
              <Progress value={courseProgressPercent} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Module Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {selectedCourse.content.modules.map((module, index) => (
            <Button
              key={module.id}
              variant={currentModuleIndex === index ? "default" : "outline"}
              className="justify-start gap-2"
              onClick={() => {
                setCurrentModuleIndex(index);
                resetQuiz();
              }}
            >
              {isModuleCompleted(selectedCourse.id, module.id) ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              Modul {index + 1}
            </Button>
          ))}
        </div>

        {/* Module Content */}
        {/* Modulinnhold med quiz */}
        <Card>
          <CardHeader>
            <CardTitle>{currentModule.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Modulbeskrivelse som markdown */}
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  img: ({ node, ...props }) => {
                    const src = props.src || '';
                    let imgSrc = src;
                    
                    if (src.includes('course-compliance-intro')) imgSrc = complianceIntroImg;
                    else if (src.includes('course-responsibility')) imgSrc = responsibilityImg;
                    else if (src.includes('course-getting-started')) imgSrc = gettingStartedImg;
                    else if (src.includes('course-security-gdpr')) imgSrc = securityGdprImg;
                    else if (src.includes('course-gdpr')) imgSrc = gdprImg;
                    else if (src.includes('course-practical-security')) imgSrc = practicalSecurityImg;
                    else if (src.includes('course-risk-assessment')) imgSrc = riskAssessmentImg;
                    else if (src.includes('course-risk-management')) imgSrc = riskManagementImg;
                    else if (src.includes('course-practical-usage')) imgSrc = practicalUsageImg;
                    
                    return (
                      <img
                        {...props}
                        src={imgSrc}
                        alt={props.alt || ''}
                        className="rounded-lg max-w-2xl w-full mx-auto my-6"
                      />
                    );
                  },
                }}
              >
                {currentModule.content}
              </ReactMarkdown>
            </div>

            {currentModule.quiz && (
              // Quiz-seksjon: spørsmål med flertall-/enkelt-valg
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">{currentModule.quiz.question}</CardTitle>
                  <CardDescription>
                    {currentModule.quiz.correctAnswers.length > 1 
                      ? "Velg alle riktige svar" 
                      : "Velg riktig svar"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {currentModule.quiz.options.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                          quizSubmitted
                            ? currentModule.quiz!.correctAnswers.includes(index)
                              ? 'bg-green-50 dark:bg-green-950 border-green-500'
                              : selectedAnswers.includes(index)
                              ? 'bg-red-50 dark:bg-red-950 border-red-500'
                              : 'bg-background border-border'
                            : selectedAnswers.includes(index)
                            ? 'bg-primary/10 border-primary'
                            : 'bg-background border-border hover:border-primary/50 cursor-pointer'
                        }`}
                        onClick={() => handleAnswerToggle(index)}
                      >
                        <Checkbox
                          checked={selectedAnswers.includes(index)}
                          disabled={quizSubmitted}
                          className="mt-1"
                        />
                        <label className="flex-1 cursor-pointer text-sm leading-relaxed">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>

                  {quizSubmitted && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 ${
                      quizPassed 
                        ? 'bg-green-50 dark:bg-green-950 border-2 border-green-500' 
                        : 'bg-orange-50 dark:bg-orange-950 border-2 border-orange-500'
                    }`}>
                      <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        quizPassed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                      }`} />
                      <div className="flex-1">
                        <p className="font-semibold mb-2 text-sm">
                          {quizPassed ? 'Riktig! 🎉' : 'Ikke helt riktig'}
                        </p>
                        <p className="text-sm opacity-90">
                          {currentModule.quiz.explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {!quizSubmitted && (
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={selectedAnswers.length === 0}
                      className="w-full"
                    >
                      Svar på spørsmålet
                    </Button>
                  )}

                  {quizSubmitted && !quizPassed && (
                    <Button
                      onClick={resetQuiz}
                      variant="outline"
                      className="w-full"
                    >
                      Prøv igjen
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
          
          {/* Navigasjonsknapper: forrige/neste/fullfør */}
          <CardContent className="border-t pt-6">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentModuleIndex(prev => Math.max(0, prev - 1));
                  resetQuiz();
                }}
                disabled={currentModuleIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Forrige
              </Button>

              {currentModuleIndex < selectedCourse.content.modules.length - 1 ? (
                <Button
                  onClick={async () => {
                    // Mark current module as complete before moving to next
                    if (!isCurrentModuleCompleted && (!currentModule.quiz || quizPassed)) {
                      await handleCompleteModule(selectedCourse.id, currentModule.id);
                    }
                    setCurrentModuleIndex(prev => prev + 1);
                    resetQuiz();
                  }}
                  disabled={currentModule.quiz && !quizPassed}
                >
                  Neste
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleCompleteModule(selectedCourse.id, currentModule.id)}
                  disabled={
                    isCurrentModuleCompleted ||
                    (currentModule.quiz && !quizPassed)
                  }
                >
                  {isCurrentModuleCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Fullført
                    </>
                  ) : (
                    'Fullfør kurs'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vis oversikt over alle kurs når intet er valgt
  const totalCourses = courses.length;
  const completedCourses = Object.values(progress).filter(p => p.is_completed).length;
  const overallProgress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Oversikt-tittel */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          Onboarding
        </h1>
        <p className="text-muted-foreground">
          Obligatorisk opplæring for nye ansatte
        </p>
      </div>

      {/* Samlet progresjon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Din fremgang</span>
            <Badge variant={overallProgress === 100 ? "default" : "secondary"}>
              {completedCourses} / {totalCourses} kurs fullført
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Kurskort: hver kurs med progresjon og start-knapp */}
      <div className="grid gap-4">
        {courses.map((course) => {
          const courseProgress = getCourseProgress(course);
          const isCompleted = progress[course.id]?.is_completed || false;

          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {course.title}
                      {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    </CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </div>
                  {course.is_required && (
                    <Badge variant="outline">Obligatorisk</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {course.content.modules.length} moduler
                    </span>
                    <span className="font-medium">{Math.round(courseProgress)}%</span>
                  </div>
                  <Progress value={courseProgress} />
                </div>
                <Button
                  onClick={() => startCourse(course)}
                  className="w-full"
                  variant={isCompleted ? "outline" : "default"}
                >
                  {isCompleted ? "Se gjennom igjen" : courseProgress > 0 ? "Fortsett kurs" : "Start kurs"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}