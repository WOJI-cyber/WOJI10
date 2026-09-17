import React from "react";
import { X, ShieldCheck, FileText, CheckCircle2, Building2, Sparkles } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                회의자료 생성기 실무 활용 가이드
              </h2>
              <p className="text-xs text-slate-500">
                지방자치단체 보건소 공무원을 위한 15분 회의 준비 팁
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: 회의 패키지 9종 구성 안내 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>1회 입력으로 자동 생성되는 맞춤형 회의 패키지 9종</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">1. 회의자료</p>
              <p className="text-[11px] text-slate-500 mt-0.5">개조식(○, -, *) 및 핵심 통계 표</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">2. 1페이지 요약</p>
              <p className="text-[11px] text-slate-500 mt-0.5">보건소장/구청장 대면보고용</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">3. 진행 순서</p>
              <p className="text-[11px] text-slate-500 mt-0.5">시간대별 사회자 타임라인</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">4. 발표 대본</p>
              <p className="text-[11px] text-slate-500 mt-0.5">자연스러운 구어체 낭독문</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">5. 핵심 안건 및 쟁점</p>
              <p className="text-[11px] text-slate-500 mt-0.5">유관기관 이견 및 절충안</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">6. 결정 필요사항</p>
              <p className="text-[11px] text-slate-500 mt-0.5">대안별 Decision Table</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">7. 예상 Q&A</p>
              <p className="text-[11px] text-slate-500 mt-0.5">참석자 질의 대비 4~5선</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">8. 후속조치 체크리스트</p>
              <p className="text-[11px] text-slate-500 mt-0.5">부서/담당/기한별 실행항목</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">9. 개최계획/공문 초안</p>
              <p className="text-[11px] text-slate-500 mt-0.5">표준 공문서 시행문 양식</p>
            </div>
          </div>
        </div>

        {/* Section 2: 보안 및 Zero-Data Retention 안내 */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-xs text-emerald-950">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Zero-Data Retention (데이터 미저장 원칙) 철저 준수</span>
          </div>
          <p className="leading-relaxed">
            - 업로드하신 모든 공문 및 실적 파일은 서버 디스크에 일체 영구 저장되지 않으며, 사용자 브라우저 메모리 상에서만 즉시 처리됩니다.
          </p>
          <p className="leading-relaxed">
            - 브라우저 창을 닫거나 세션이 종료되는 즉시 메모리에서 전량 파기되므로, 공공기관 감사 및 보안 규정을 안전하게 충족합니다.
          </p>
          <p className="text-emerald-800 font-medium">
            * 단, 국가보안법상 비밀문서(1·2·3급) 및 대외비 문서는 본 시스템에 절대 업로드하실 수 없습니다.
          </p>
        </div>

        {/* Section 3: 한글(HWP) 및 온나라 전자결재 연동 팁 */}
        <div className="space-y-2 text-xs text-slate-700">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>한글(HWP) 프로그램 붙여넣기 및 다운로드 팁</span>
          </h3>
          <ul className="space-y-1 list-disc list-inside text-slate-600 leading-relaxed pl-1">
            <li>
              <strong>[클립보드 복사]</strong> 버튼을 누르면 개조식 목록(○, -, *)과 마크다운 표가 한글(HWP) 및 온나라 전자결재 본문에 최적화된 형식으로 클립보드에 담깁니다.
            </li>
            <li>
              <strong>[한글(HWP) 문서 다운로드]</strong> 버튼 클릭 시 한글 프로그램에서 완벽히 열리는 문서 서식이 즉시 저장됩니다.
            </li>
            <li>
              본문 속 <code>[출처: 파일명 p.X]</code> 태그를 클릭하면 우측 패널에서 해당 원문 페이지와 추출 근거를 즉각 대조할 수 있습니다.
            </li>
          </ul>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
