import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, ChevronRight, Award, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizViewProps {
  quizId: number;
  onComplete: (result: any) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ quizId, onComplete }) => {
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock user ID
  const userId = 1;

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/training/quizzes/${quizId}`);
      setQuiz(await res.json());
    } catch (err) {
      console.error("Failed to fetch quiz", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    try {
      const res = await fetch(`/api/training/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, answers })
      });
      const data = await res.json();
      setResult(data);
      onComplete(data);
    } catch (err) {
      console.error("Failed to submit quiz", err);
    }
  };

  if (loading || !quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === quiz.questions.length - 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-slate-900">{quiz.title}</h2>
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase">
          Question {currentQuestionIdx + 1} of {quiz.questions.length}
        </div>
      </div>

      <div className="p-8">
        {!result ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">{currentQuestion.question_text}</h3>
              <div className="grid gap-3">
                {(currentQuestion.options || []).map((option: string) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(currentQuestion.id, option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${answers[currentQuestion.id] === option ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                  >
                    <span className="font-medium">{option}</span>
                    {answers[currentQuestion.id] === option && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                Back
              </button>
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < quiz.questions.length}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                  disabled={!answers[currentQuestion.id]}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 py-4"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {result.passed ? <Award className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
            </div>
            
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                {result.passed ? 'Assessment Passed!' : 'Assessment Failed'}
              </h3>
              <p className="text-slate-500 mt-1">
                You scored <strong>{result.score}%</strong>. 
                {result.passed ? ' Great job!' : ' Please review the material and try again.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 flex justify-around">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Correct</p>
                <p className="text-2xl font-black text-emerald-600">{result.correctCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
                <p className="text-2xl font-black text-slate-900">{result.total}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                <p className={`text-2xl font-black ${result.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </p>
              </div>
            </div>

            {!result.passed && (
              <button
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setCurrentQuestionIdx(0);
                  setAnswers({});
                }}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Retry Assessment
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuizView;
