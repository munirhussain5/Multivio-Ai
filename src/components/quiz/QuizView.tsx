import React, { useState } from 'react';
import { QuizData, QuizQuestion } from '../../types';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface QuizViewProps {
  quiz: QuizData;
  onUpdateQuiz: (updated: QuizData) => void;
  onBackToLesson?: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  onUpdateQuiz,
  onBackToLesson,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(quiz.completed);
  const [showReviewOnly, setShowReviewOnly] = useState(false);

  const handleSelectOption = (questionId: string, option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = () => {
    let score = 0;
    const evaluatedQuestions: QuizQuestion[] = quiz.questions.map(q => {
      const userAns = (answers[q.id] || '').trim();
      let isCorrect = false;

      if (q.type === 'short_answer') {
        // Tolerant matching
        const cleanUser = userAns.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanCorrect = q.correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
        isCorrect = cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
      } else {
        isCorrect = userAns.toLowerCase() === q.correctAnswer.toLowerCase();
      }

      if (isCorrect) score += 1;

      return {
        ...q,
        userAnswer: userAns,
        isCorrect,
      };
    });

    const updated: QuizData = {
      ...quiz,
      questions: evaluatedQuestions,
      completed: true,
      score,
      total: quiz.questions.length,
    };

    setIsSubmitted(true);
    onUpdateQuiz(updated);
  };

  const handleReset = () => {
    setAnswers({});
    setIsSubmitted(false);
    setShowReviewOnly(false);
    const resetQuestions = quiz.questions.map(q => ({
      ...q,
      userAnswer: undefined,
      isCorrect: undefined,
    }));
    onUpdateQuiz({
      ...quiz,
      questions: resetQuestions,
      completed: false,
      score: undefined,
      total: undefined,
    });
  };

  const totalQuestions = quiz.questions.length;
  const currentScore = quiz.score ?? 0;
  const correctCount = quiz.questions.filter(q => q.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Interactive Topic Assessment
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Quiz: {quiz.topic}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Test and cement your understanding with multiple-choice, true/false, and short-answer questions.
          </p>
        </div>

        {onBackToLesson && (
          <button
            onClick={onBackToLesson}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Return to Lesson</span>
          </button>
        )}
      </div>

      {/* Results Banner (when submitted) */}
      {isSubmitted && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  Score: {currentScore} / {totalQuestions}
                </h3>
                <div className="flex items-center gap-3 text-xs text-indigo-200 mt-1">
                  <span className="text-emerald-300 font-medium">
                    ✓ {correctCount} Correct
                  </span>
                  <span>·</span>
                  <span className="text-rose-300 font-medium">
                    ✗ {incorrectCount} Incorrect
                  </span>
                  <span>·</span>
                  <span>
                    {Math.round((currentScore / totalQuestions) * 100)}% Mastery
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReviewOnly(!showReviewOnly)}
                type="button"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                {showReviewOnly ? 'Show All Questions' : 'Review Mistakes Only'}
              </button>
              <button
                onClick={handleReset}
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {quiz.questions
          .filter(q => !showReviewOnly || (isSubmitted && !q.isCorrect))
          .map((q, qIndex) => {
            const isAnswered = Boolean(answers[q.id]);
            const isEvaluated = isSubmitted;
            const isCorrect = q.isCorrect;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border p-5 transition-all ${
                  isEvaluated
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      Q{qIndex + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                      · {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'true_false' ? 'True / False' : 'Short Answer'}
                    </span>
                  </div>

                  {isEvaluated && (
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug mb-4">
                  {q.question}
                </h4>

                {/* Question Options or Input */}
                {q.type === 'mcq' || q.type === 'true_false' ? (
                  <div className="space-y-2">
                    {q.options?.map((option, optIdx) => {
                      const isSelected = answers[q.id] === option || q.userAnswer === option;
                      const isCorrectChoice = isEvaluated && option.toLowerCase() === q.correctAnswer.toLowerCase();
                      const isWrongChoice = isEvaluated && isSelected && !isCorrect;

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, option)}
                          className={`p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all select-none cursor-pointer flex items-center justify-between ${
                            isEvaluated
                              ? isCorrectChoice
                                ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-bold'
                                : isWrongChoice
                                ? 'bg-rose-100/70 border-rose-400 text-rose-950'
                                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                              : isSelected
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-300'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span>{option}</span>
                          {isEvaluated && isCorrectChoice && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {isEvaluated && isWrongChoice && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      disabled={isEvaluated}
                      value={answers[q.id] || q.userAnswer || ''}
                      onChange={e => handleTextAnswer(q.id, e.target.value)}
                      placeholder="Type your concise answer here..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100"
                    />
                  </div>
                )}

                {/* Explanation on evaluation */}
                {isEvaluated && (
                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-700 bg-white/70 p-3 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-1">
                      Explanation:
                    </p>
                    <p>{q.explanation}</p>
                    {!isCorrect && (
                      <p className="mt-1.5 text-indigo-700 font-medium">
                        Correct Answer: <span className="underline">{q.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Submit Button */}
      {!isSubmitted && (
        <div className="pt-2 pb-6 flex items-center justify-end">
          <button
            onClick={handleSubmit}
            type="button"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <span>Submit Quiz & Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
