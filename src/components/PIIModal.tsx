import React from "react";
import { AlertTriangle, ShieldCheck, Check, X } from "lucide-react";

interface PIIModalProps {
  isOpen: boolean;
  fileName: string;
  detectedCount: number;
  onMaskAndProceed: () => void;
  onProceedWithoutMasking: () => void;
  onClose: () => void;
}

export const PIIModal: React.FC<PIIModalProps> = ({
  isOpen,
  fileName,
  detectedCount,
  onMaskAndProceed,
  onProceedWithoutMasking,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              개인정보(주민등록번호) 감지 알림
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              공공기관 개인정보보호법 준수를 위한 필수 점검 단계입니다.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 text-xs text-amber-950 space-y-1.5">
          <p className="font-semibold">
            업로드된 문서 <strong>[{fileName}]</strong> 내에서
          </p>
          <p>
            주민등록번호 패턴(000000-000000)이 <strong>{detectedCount}건</strong> 감지되었습니다.
          </p>
          <p className="text-[11px] text-amber-800">
            지방자치단체 공공문서 작성 시 개인정보 유출을 방지하기 위해 마스킹(900101-*******) 처리를 강력히 권고합니다.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onMaskAndProceed}
            id="btn-mask-pii"
            className="w-full py-2.5 px-4 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>자동 마스킹 처리 후 계속하기 (권장)</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onProceedWithoutMasking}
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              마스킹 없이 원본 유지
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-lg text-slate-400 hover:text-slate-600 text-xs transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
