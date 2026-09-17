import React from "react";
import { ShieldCheck, FileText, HelpCircle, Building2, Sparkles } from "lucide-react";

interface HeaderProps {
  onOpenHelp: () => void;
  onReset: () => void;
  hasActiveData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelp, onReset, hasActiveData }) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group"
              title="메인 화면으로 이동"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-blue-800 transition-colors">
                <Building2 className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                    회의자료 생성기
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    지자체 보건소 특화
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  보건소 공문·회의자료 9종 패키지 자동 생성 시스템
                </p>
              </div>
            </button>
          </div>

          {/* Security Badges & Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Zero-Data Retention Security Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Zero-Data Retention (세션 종료 시 즉시 파기)</span>
            </div>

            {hasActiveData && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                id="btn-new-meeting"
              >
                <FileText className="w-3.5 h-3.5" />
                새 회의 작성
              </button>
            )}

            <button
              onClick={onOpenHelp}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              id="btn-open-help"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>업무 활용 가이드</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
