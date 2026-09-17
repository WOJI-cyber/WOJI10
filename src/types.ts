export type MeetingType =
  | "내부회의"
  | "기관장 보고"
  | "실무회의"
  | "유관기관 협의체"
  | "주민 설명회";

export interface MeetingInfo {
  title: string;
  type: MeetingType;
  target: string;
  datetime: string;
  duration: string;
  purposeAndAgendas: string;
  decisionItems: string;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "processing" | "completed" | "error";
  text: string;
  pages?: number;
  detectedPii: {
    residentNumbers: string[];
    phoneNumbers: string[];
  };
  isMasked?: boolean;
}

export interface ExtractedFact {
  id: string;
  category: "statistic" | "background" | "issue" | "needs_verification";
  content: string;
  source_file: string;
  page?: number;
  confidence: "confirmed" | "needs_verification";
}

export interface AnalysisSummary {
  background: string;
  statistics_table: string;
  main_issues: string;
  verification_items: string;
}

export interface PackageOutputs {
  meeting_doc: string; // 1. 회의자료 (개조식)
  one_page_summary: string; // 2. 기관장 보고용 1페이지 요약
  meeting_order: string; // 3. 회의 진행 순서 (타임라인)
  speech_script: string; // 4. 발표자용 대본 (구어체)
  key_issues: string; // 5. 핵심 안건 및 쟁점
  decision_table: string; // 6. 결정 필요사항 (Decision Table)
  expected_qa: string; // 7. 예상 Q&A
  followup_checklist: string; // 8. 후속조치 체크리스트
  official_notice_draft: string; // 9. 개최계획/공문 초안
}

export type PackageTabKey = keyof PackageOutputs;

export interface GeneratedData {
  extracted_facts: ExtractedFact[];
  analysis_summary: AnalysisSummary;
  package: PackageOutputs;
}

export interface SamplePreset {
  id: string;
  title: string;
  category: string;
  department: string;
  meetingInfo: MeetingInfo;
  files: {
    name: string;
    type: string;
    size: number;
    pages: number;
    content: string;
  }[];
}
