import React from "react";
import { ShieldAlert, Info, Lock } from "lucide-react";

export const NoticeBanner: React.FC = () => {
  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-950">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-amber-900 font-bold text-[10px]">
            <Lock className="w-3 h-3" />
          </span>
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold text-amber-900">
              [공공기관 보안 및 개인정보 처리 원칙]
            </span>
            <span>
              본 시스템은 서버에 사용자의 업로드 파일 및 생성 결과를 일체 저장하지 않으며(Zero-Data Retention), 
              <strong> 비밀문서(1·2·3급) 및 대외비의 업로드를 엄격히 금지합니다.</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-amber-800 shrink-0 text-[11px] self-end sm:self-auto">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
          <span>주민등록번호 패턴 자동 마스킹 필터 작동 중</span>
        </div>
      </div>
    </div>
  );
};
