import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  FileText, 
  History, 
  LayoutDashboard, 
  Brain, 
  HelpCircle, 
  User, 
  Menu, 
  X, 
  ChevronRight, 
  Mail,
  Sparkles,
  LogOut
} from 'lucide-react';
import { ProviderStatus, AuthUser } from '../../types/index';
import { StudyMindLogo } from '../ui/StudyMindLogo';

export type NavTab = 'study' | 'compare' | 'quiz' | 'notes' | 'history' | 'dashboard' | 'about';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasActiveSession: boolean;
  providerStatus?: ProviderStatus;
  onOpenQuickGuide: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  hasActiveSession,
  providerStatus,
  onOpenQuickGuide,
  currentUser,
  onOpenAuth,
  onSignOut,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close mobile sidebar on escape key or route change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    {
      id: 'study' as NavTab,
      label: 'AI Study',
      description: 'Ask across 4 AI models',
      icon: BookOpen,
      disabled: false,
    },
    {
      id: 'compare' as NavTab,
      label: 'Compare AI',
      description: 'Side-by-side model matrix',
      icon: Layers,
      disabled: !hasActiveSession,
    },
    {
      id: 'quiz' as NavTab,
      label: 'Quiz',
      description: 'Assess & test retention',
      icon: CheckCircle2,
      disabled: false,
    },
    {
      id: 'notes' as NavTab,
      label: 'Notes',
      description: 'Structured revision sheets',
      icon: FileText,
      disabled: false,
    },
    {
      id: 'history' as NavTab,
      label: 'History',
      description: 'Past learning sessions',
      icon: History,
      disabled: false,
    },
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      description: 'Learning stats & activity',
      icon: LayoutDashboard,
      disabled: false,
    },
    {
      id: 'about' as NavTab,
      label: 'About',
      description: 'Munir Hussain & StudyMind',
      icon: User,
      disabled: false,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div 
            onClick={() => handleNavClick('study')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 sm:w-10.5 sm:h-10.5 rounded-xl bg-white border border-blue-200 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-blue-300 transition-all shrink-0 p-1">
              <StudyMindLogo className="w-8 h-8 sm:w-8.5 sm:h-8.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">StudyMind</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden xs:block">Multi-AI Educational Synthesis</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile/tablet < lg) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  disabled={item.disabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    item.disabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : isActive
                      ? item.id === 'about'
                        ? 'bg-sky-100 text-sky-900 font-semibold'
                        : 'bg-indigo-50 text-indigo-700 font-semibold cursor-pointer'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'
                  }`}
                  title={item.disabled ? 'Ask a question first' : item.description}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Status Badge */}
            {providerStatus?.supabase !== false && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-2xs"
                title="Connected to Supabase project uxjlcvmgdnrvbwiczvgx"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase</span>
              </div>
            )}

            {/* How it works button (Hidden on very small screens) */}
            <button
              onClick={onOpenQuickGuide}
              type="button"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="How StudyMind Works"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Guide</span>
            </button>

            {/* Auth User Profile or Login/Sign Up buttons */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[90px] truncate hidden sm:inline">{currentUser.name}</span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-2 py-1.5 border-b border-slate-100">
                        <div className="font-bold text-slate-900 truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email}</div>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Supabase Student Account</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onSignOut?.();
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('signin')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('signup')}
                  className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle (Visible on < lg) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="lg:hidden p-2 -mr-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-800" />
              ) : (
                <Menu className="w-6 h-6 text-slate-800" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
        >
          {/* Slide-out Sidebar Panel */}
          <div 
            onClick={e => e.stopPropagation()}
            className="fixed top-0 right-0 bottom-0 w-72 sm:w-80 bg-white z-50 shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200"
          >
            {/* Sidebar Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div 
                onClick={() => handleNavClick('study')}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-white border border-blue-200 flex items-center justify-center p-0.5 shadow-2xs">
                  <StudyMindLogo className="w-7 h-7" />
                </div>
                <div>
                  <span className="font-bold text-base text-slate-900">StudyMind</span>
                  <p className="text-[10px] text-slate-400">Navigation Menu</p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Navigation Items */}
            <div className="p-3 sm:p-4 space-y-1.5 overflow-y-auto flex-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Menu
              </div>

              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    disabled={item.disabled}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      item.disabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : isActive
                        ? item.id === 'about'
                          ? 'bg-sky-100 text-sky-950 font-semibold ring-1 ring-sky-300/60 shadow-2xs'
                          : 'bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-200 shadow-2xs cursor-pointer'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive 
                          ? item.id === 'about' ? 'bg-sky-200 text-sky-800' : 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`} />
                  </button>
                );
              })}

              {/* Mobile Auth Section */}
              <div className="pt-2 pb-1 border-b border-slate-100">
                {currentUser ? (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onSignOut?.();
                      }}
                      className="w-full text-center py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth?.('signin');
                      }}
                      className="py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs text-center hover:bg-slate-50 cursor-pointer"
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth?.('signup');
                      }}
                      className="py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs text-center hover:bg-indigo-700 shadow-xs cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>

              {/* Guide Button in Mobile Drawer */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenQuickGuide();
                  }}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">How StudyMind Works</div>
                    <div className="text-[11px] text-slate-500">Quick 5-step overview</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Sidebar Footer (Founder Info & Email) */}
            <div className="p-4 border-t border-slate-100 bg-[#e0f2fe]/40">
              <div 
                onClick={() => handleNavClick('about')}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-sky-100/60 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#e0f2fe] border border-sky-300 flex items-center justify-center text-sky-800 shrink-0 shadow-xs">
                  <User className="w-4.5 h-4.5 text-sky-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">Munir Hussain</span>
                    <span className="text-[10px] text-sky-700 bg-sky-200/80 px-1 py-0.2 rounded font-medium">Founder</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">munii11khan@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
