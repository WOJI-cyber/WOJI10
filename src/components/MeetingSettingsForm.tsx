import React from "react";
import { MeetingInfo, MeetingType } from "../types";
import {
  Calendar,
  Clock,
  Users,
  Target,
  CheckSquare,
  Sparkles,
  Loader2,
  FileCheck2,
} from "lucide-react";

interface MeetingSettingsFormProps {
  meetingInfo: MeetingInfo;
  onChange: (info: MeetingInfo) => void;
  onSubmit: () => void;
  isLoading: boolean;
  canSubmit: boolean;
}

const MEETING_TYPES: MeetingType[] = [
  "내부회의",
  "기관장 보고",
  "실무회의",
  "유관기관 협의체",
  "주민 설명회",
];

export const MeetingSettingsForm: React.FC<MeetingSettingsFormProps> = ({
  meetingInfo,
  onChange,
  onSubmit,
  isLoading,
  canSubmit,
}) => {
  const updateField = (field: keyof MeetingInfo, value: string) => {
    onChange({
      ...meetingInfo,
      [field]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit && !isLoading) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-blue-700" />
            <span>회의 설정 및 주요 안건 정의</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            참석 대상과 목적에 맞는 최적의 문체와 패키지 9종을 구성하기 위한 설정입니다.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
          * 필수 입력
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 회의명 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="meeting-title"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            회의명 <span className="text-rose-500">*</span>
          </label>
          <input
            id="meeting-title"
            type="text"
            required
            value={meetingInfo.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="예) 2026년 3분기 감염병 대응 유관기관 협의체 회의"
            className="w-full text-xs text-slate-900 px-3 py-2 rounded-md border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
          />
        </div>

        {/* 회의 성격 */}
        <div>
          <label
            htmlFor="meeting-type"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            회의 성격 <span className="text-rose-500">*</span>
          </label>
          <select
            id="meeting-type"
            value={meetingInfo.type}
            onChange={(e) => updateField("type", e.target.value as MeetingType)}
            className="w-full text-xs text-slate-900 px-3 py-2 rounded-md border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white font-medium"
          >
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* 참석 대상 */}
        <div>
          <label
            htmlFor="meeting-target"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            참석 대상
          </label>
          <div className="relative">
            <input
              id="meeting-target"
              type="text"
              value={meetingInfo.target}
              onChange={(e) => updateField("target", e.target.value)}
              placeholder="예) 보건소장, 건강증진과장, 경찰서·소방서 실무자"
              className="w-full text-xs text-slate-900 pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
            />
            <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* 회의 일시 */}
        <div>
          <label
            htmlFor="meeting-datetime"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            회의 일시 <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="meeting-datetime"
              type="text"
              required
              value={meetingInfo.datetime}
              onChange={(e) => updateField("datetime", e.target.value)}
              placeholder="예) 2026. 09. 25.(금) 14:00"
              className="w-full text-xs text-slate-900 pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* 예상 소요 시간 */}
        <div>
          <label
            htmlFor="meeting-duration"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            예상 회의 시간
          </label>
          <div className="relative">
            <input
              id="meeting-duration"
              type="text"
              value={meetingInfo.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              placeholder="예) 60분"
              className="w-full text-xs text-slate-900 pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
            />
            <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* 회의 목적 및 필수 논의 안건 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="meeting-purpose-agendas"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            회의 목적 & 필수 논의 안건 <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="meeting-purpose-agendas"
            rows={3}
            required
            value={meetingInfo.purposeAndAgendas}
            onChange={(e) => updateField("purposeAndAgendas", e.target.value)}
            placeholder="회의를 개최하는 목적과 반드시 다루어야 할 핵심 안건을 작성해 주세요. (예: 1. 야간 응급이송 핫라인 일원화 구축, 2. 4분기 합동 훈련 일정 협의)"
            className="w-full text-xs text-slate-900 p-3 rounded-md border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y font-medium placeholder:text-slate-400 leading-relaxed"
          />
        </div>

        {/* 회의를 통해 결정해야 하는 사항 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="meeting-decisions"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            회의를 통해 결정해야 하는 사항 (Decision Items) <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="meeting-decisions"
            rows={2}
            required
            value={meetingInfo.decisionItems}
            onChange={(e) => updateField("decisionItems", e.target.value)}
            placeholder="회의 종료 시 최종 합의 또는 재가받아야 할 구체적인 결정 과제를 적어주세요. (예: 기관별 전담 연락관 지정 여부 및 훈련 예산 1,200만원 분담률 확정)"
            className="w-full text-xs text-slate-900 p-3 rounded-md border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y font-medium placeholder:text-slate-400 leading-relaxed"
          />
        </div>
      </div>

      {/* CTA Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!canSubmit || isLoading}
          id="btn-generate-package"
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
            !canSubmit || isLoading
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.99]"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-200" />
              <span>AI가 공문서 원문 대조 및 9종 회의 패키지 생성 중입니다 (약 15~20초)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>AI 회의 패키지 9종 및 근거 분석 일괄 자동 생성하기</span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-2">
          * 입력된 모든 자료는 브라우저 메모리 상에서만 즉시 처리되며, 원문 출처 [파일명 p.X]가 자동 매핑됩니다.
        </p>
      </div>
    </form>
  );
};
