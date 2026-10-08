import React from 'react';
import { 
  Brain, 
  Mail, 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  Lightbulb, 
  Compass,
  Heart
} from 'lucide-react';
import founderImage from '../../assets/images/founder_munir_hussain_1791037943176.jpg';

interface AboutViewProps {
  onStartStudy: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onStartStudy }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto pt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
          About StudyMind & Our Mission
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4 leading-tight">
          One Question. Multiple Minds. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-900">
            One Clear Understanding.
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed font-medium">
          StudyMind was born from a fundamental observation: no single AI model holds the complete truth. By triangulating ChatGPT, Gemini, Claude, and DeepSeek, we transform fragmented AI chat into an organized, distraction-free educational sanctuary.
        </p>
      </div>

      {/* Founder Spotlight Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Portrait Column */}
          <div className="md:col-span-5 bg-gradient-to-b from-sky-100 via-sky-50 to-white p-6 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
            <div className="relative group">
              {/* Outer decorative ring */}
              <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 opacity-60 blur-xs group-hover:opacity-80 transition duration-300" />
              <img
                src={founderImage}
                alt="Munir Hussain, Founder of StudyMind"
                className="relative w-full max-w-[260px] sm:max-w-[280px] aspect-[3/4] object-cover object-center rounded-xl shadow-md border-2 border-white"
              />
            </div>

            <div className="text-center mt-5">
              <h2 className="text-xl font-extrabold text-slate-900">Munir Hussain</h2>
              <p className="text-xs font-semibold text-sky-700 mt-0.5">Founder & Creator of StudyMind</p>
              
              <div className="flex items-center justify-center gap-2 mt-3">
                <a
                  href="mailto:munii11khan@gmail.com"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-sky-300 hover:bg-sky-50 text-xs font-medium text-sky-800 transition-colors shadow-2xs"
                  title="Send email to Munir Hussain"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>munii11khan@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Founder Story Column */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#e0f2fe] border border-sky-300 flex items-center justify-center text-sky-700">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  A Message from the Founder
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                "Why I built StudyMind for curious students everywhere."
              </h3>

              <div className="text-slate-700 text-sm leading-relaxed space-y-3.5 mt-4">
                <p>
                  Hello! I’m <strong>Munir Hussain</strong>. As a passionate developer, learner, and technologist, I frequently found myself learning cutting-edge topics in software engineering, systems design, and mathematics by opening multiple browser tabs: one for ChatGPT, one for Claude, one for Gemini, and one for DeepSeek.
                </p>
                <p>
                  Every model offered a slightly different angle. ChatGPT gave structured hierarchies; Gemini offered brilliant real-world analogies; Claude brought deep academic and etymological rigor; and DeepSeek unveiled the low-level machine mechanics. But copying and pasting between tabs, filtering out fluff, and spotting discrepancies was exhausting.
                </p>
                <p className="italic text-slate-800 bg-sky-50/70 p-3.5 rounded-xl border-l-3 border-sky-500">
                  "I asked myself: why shouldn’t a student be able to ask one question, receive multiple trusted perspectives in parallel, and get one unified, verified answer built specifically for learning and exam mastery?"
                </p>
                <p>
                  That vision is <strong>StudyMind</strong>. It is built to turn AI from a passive answer generator into an active, transparent tutor that fosters critical thinking, self-testing, and lasting retention.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Munir Hussain</span>
                <span>·</span>
                <span>Engineering & Product</span>
              </div>
              <span className="text-sky-700 font-medium">Built with care for learners worldwide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Principles */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Our Architectural Pillars
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            How StudyMind Changes Learning
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center font-bold mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Multi-Perspective Triangulation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rather than trusting a single AI output blindly, StudyMind gathers diverse viewpoints simultaneously. When four independent architectures converge on an idea, your confidence in that knowledge skyrockets.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-sky-700">
              Zero tab switching required
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Consensus & Contrast Engine
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our synthesis pipeline strips repetitive boilerplate, reconciles terminology differences, and explicitly flags when models present contrasting technical viewpoints or distinct trade-offs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-indigo-700">
              Transparent side-by-side analysis
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Active Recall & Exam Readiness
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Understanding is only half the journey; remembering is the other. StudyMind generates instant quizzes (MCQs, True/False, Short answers) and concise, downloadable study sheets directly from every explanation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-700">
              Built for real test preparation
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden shadow-sm">
        <div className="max-w-2xl mx-auto relative z-10 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
            Start Exploring Today
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to experience education through multiple AI lenses?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
            Ask any question—from object-oriented polymorphism and operating systems to quantum physics and history.
          </p>
          <div className="pt-2">
            <button
              onClick={onStartStudy}
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e0f2fe] text-sky-950 font-bold text-sm hover:bg-white transition-colors cursor-pointer shadow-sm"
            >
              <span>Ask Your First Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
