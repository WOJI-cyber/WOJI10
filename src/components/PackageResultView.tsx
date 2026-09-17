import React, { useState } from "react";
import {
  FileText,
  FileCheck,
  Clock,
  Mic,
  Scale,
  Table,
  HelpCircle,
  CheckSquare,
  Send,
  Download,
  Copy,
  Printer,
  Sparkles,
  Search,
  ExternalLink,
  RotateCcw,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Bookmark,
  Bold,
  Heading2,
  List,
  Wand2,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  GeneratedData,
  MeetingInfo,
  PackageTabKey,
  UploadedFileItem,
} from "../types";
import {
  downloadAsHwpDoc,
  downloadAsTxt,
  copyToClipboard,
} from "../utils/documentExporter";

interface PackageResultViewProps {
  data: GeneratedData;
  meetingInfo: MeetingInfo;
  sourceFiles: UploadedFileItem[];
  onUpdatePackageText: (tab: PackageTabKey, newText: string) => void;
  onQuickRewrite: (tab: PackageTabKey, action: string, customPrompt?: string) => Promise<void>;
  isRewriting: boolean;
}

interface TabConfig {
  key: PackageTabKey;
  label: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    key: "meeting_doc",
    label: "회의자료 (개조식)",
    badge: "○, -, * 표준",
    icon: <FileText className="w-4 h-4 text-emerald-700" />,
    description: "보건소 표준 개조식 문체 및 핵심 통계 표가 포함된 공식 회의자료",
  },
  {
    key: "one_page_summary",
    label: "1페이지 요약",
    badge: "기관장 보고용",
    icon: <FileCheck className="w-4 h-4 text-indigo-600" />,
    description: "보건소장 및 단체장 대면 보고를 위한 핵심 요약 브리핑 템플릿",
  },
  {
    key: "meeting_order",
    label: "회의 진행 순서",
    badge: "타임라인",
    icon: <Clock className="w-4 h-4 text-amber-600" />,
    description: "개회부터 폐회까지 시간대별 발언 및 시나리오",
  },
  {
    key: "speech_script",
    label: "발표자 대본",
    badge: "구어체 낭독용",
    icon: <Mic className="w-4 h-4 text-rose-600" />,
    description: "회의자료 항목별 연결 설명과 부드러운 공직 구어체 낭독 대본",
  },
  {
    key: "key_issues",
    label: "핵심 안건 및 쟁점",
    badge: "대립/협의 요점",
    icon: <Scale className="w-4 h-4 text-purple-600" />,
    description: "기관 간 이견사항 및 절충안 분석",
  },
  {
    key: "decision_table",
    label: "결정 필요사항",
    badge: "Decision Table",
    icon: <Table className="w-4 h-4 text-cyan-600" />,
    description: "안건별 대안 비교, 장단점 및 권고사항 매트릭스",
  },
  {
    key: "expected_qa",
    label: "예상 Q&A",
    badge: "참석자 질의 대비",
    icon: <HelpCircle className="w-4 h-4 text-emerald-600" />,
    description: "예상되는 날카로운 질문 4~5개와 출처 기반 모범 답변",
  },
  {
    key: "followup_checklist",
    label: "후속조치 체크리스트",
    badge: "기한/담당자별",
    icon: <CheckSquare className="w-4 h-4 text-teal-600" />,
    description: "회의 종료 후 이행할 실행 과제 및 담당 부서 점검표",
  },
  {
    key: "official_notice_draft",
    label: "공문 초안",
    badge: "시행문 양식",
    icon: <Send className="w-4 h-4 text-emerald-700" />,
    description: "표준 공문서 규정에 맞춘 개최 알림 및 결과 통보 시행문",
  },
];

export const PackageResultView: React.FC<PackageResultViewProps> = ({
  data,
  meetingInfo,
  sourceFiles,
  onUpdatePackageText,
  onQuickRewrite,
  isRewriting,
}) => {
  const [activeTab, setActiveTab] = useState<PackageTabKey>("meeting_doc");
  const [rightPanelTab, setRightPanelTab] = useState<"analysis" | "quickActions" | "sources">("analysis");
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedSourceHighlight, setSelectedSourceHighlight] = useState<string | null>(null);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const currentContent = data.package[activeTab] || "";
  const currentTabConfig = TAB_CONFIGS.find((t) => t.key === activeTab) || TAB_CONFIGS[0];

  const handleCopy = async () => {
    const success = await copyToClipboard(currentContent, `${meetingInfo.title}_${currentTabConfig.label}`);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadHwp = () => {
    const isOfficialNotice = activeTab === "official_notice_draft";
    downloadAsHwpDoc(currentContent, `${meetingInfo.title}_${currentTabConfig.label}`, isOfficialNotice);
  };

  const handleDownloadTxt = () => {
    downloadAsTxt(currentContent, `${meetingInfo.title}_${currentTabConfig.label}`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick insertion helpers for editor
  const insertText = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("package-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentContent.substring(start, end);
    const newText =
      currentContent.substring(0, start) +
      prefix +
      (selected || "항목 내용") +
      suffix +
      currentContent.substring(end);

    onUpdatePackageText(activeTab, newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 5));
    }, 50);
  };

  const insertCitationChip = () => {
    const docName = sourceFiles.length > 0 ? sourceFiles[0].name : "사업계획서.pdf";
    insertText(` [출처: ${docName} p.1] `);
  };

  const insertVerificationTag = () => {
    insertText(" [확인 필요] ");
  };

  // Jump to source when user clicks a citation
  const handleCitationClick = (citationText: string) => {
    setSelectedSourceHighlight(citationText);
    setRightPanelTab("sources");
  };

  // Render text with interactive citation spans for preview mode
  const renderPreviewWithCitations = (text: string) => {
    const parts = text.split(/(\[출처:\s*[^\]]+\]|\[확인 필요\])/g);

    return (
      <div className="text-xs sm:text-sm text-slate-900 leading-relaxed font-sans space-y-2 whitespace-pre-wrap">
        {parts.map((part, idx) => {
          if (part.startsWith("[출처:")) {
            const match = part.replace(/^\[출처:\s*/, "").replace(/\]$/, "");
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCitationClick(match)}
                className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-colors align-baseline cursor-pointer"
                title="클릭 시 우측 근거 문서 미리보기로 이동"
              >
                <Bookmark className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>{part}</span>
              </button>
            );
          }
          if (part === "[확인 필요]") {
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 align-baseline"
              >
                <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                <span>[확인 필요]</span>
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar: Meeting Overview & Export Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
              {meetingInfo.type}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {meetingInfo.datetime} ({meetingInfo.duration || "60분"})
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 truncate max-w-xs">
              참석: {meetingInfo.target || "보건소 및 유관기관"}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {meetingInfo.title}
          </h1>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {/* Clipboard Copy with feedback */}
          <button
            onClick={handleCopy}
            id="btn-copy-package"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300 shadow-2xs"
            title="한글(HWP) 및 전자결재에 바로 붙여넣을 수 있도록 서식 복사"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">복사 완료! (HWP 붙여넣기 가능)</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>클립보드 복사</span>
              </>
            )}
          </button>

          {/* HWP / Word Download */}
          <button
            onClick={handleDownloadHwp}
            id="btn-download-hwp"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            title="한글(HWP) 프로그램에서 바로 열리는 문서 파일 다운로드"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>한글(HWP) 문서 다운로드</span>
          </button>

          {/* TXT Download */}
          <button
            onClick={handleDownloadTxt}
            className="p-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="텍스트 파일로 저장"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="문서 인쇄 또는 PDF로 저장"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT PANEL (Tabs + Editor) ================= */}
        <div className="lg:col-span-7 space-y-3">
          {/* 9 Tab Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-2 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 px-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>맞춤형 회의 패키지 9종</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    viewMode === "edit"
                      ? "bg-white text-emerald-900 shadow-2xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  편집기 모드
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    viewMode === "preview"
                      ? "bg-white text-emerald-900 shadow-2xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  인터랙티브 출처 뷰
                </button>
              </div>
            </div>

            {/* Scrollable Tab bar */}
            <div className="flex overflow-x-auto p-1.5 gap-1 scrollbar-thin bg-white border-b border-slate-100">
              {TAB_CONFIGS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    id={`tab-${tab.key}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span className={isActive ? "text-emerald-200" : ""}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Current Tab Description Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <p className="line-clamp-1">
                <strong className="text-slate-800">{currentTabConfig.label}:</strong>{" "}
                {currentTabConfig.description}
              </p>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shrink-0 ml-2">
                {currentTabConfig.badge}
              </span>
            </div>

            {/* Editor Formatting Quick Toolbar */}
            {viewMode === "edit" && (
              <div className="px-3 py-1.5 border-b border-slate-200 bg-white flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                <span className="text-[11px] text-slate-400 font-medium mr-1">서식 도구:</span>
                <button
                  type="button"
                  onClick={() => insertText("**", "**")}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 border border-slate-200 hover:border-slate-300"
                  title="굵게"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText("## ")}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 border border-slate-200 hover:border-slate-300"
                  title="제목 추가"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText("○ ")}
                  className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 border border-slate-200 font-bold"
                  title="개조식 부호 ○"
                >
                  ○
                </button>
                <button
                  type="button"
                  onClick={() => insertText("  - ")}
                  className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 border border-slate-200 font-bold"
                  title="개조식 부호 -"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => insertText("    * ")}
                  className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 border border-slate-200 font-bold"
                  title="개조식 부호 *"
                >
                  *
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button
                  type="button"
                  onClick={insertCitationChip}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold"
                  title="출처 표기 태그 삽입"
                >
                  <Bookmark className="w-3 h-3" />
                  + 출처 태그
                </button>
                <button
                  type="button"
                  onClick={insertVerificationTag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 text-[11px] font-semibold"
                  title="확인 필요 태그 삽입"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  + [확인 필요]
                </button>
              </div>
            )}

            {/* Document Content Area */}
            <div className="p-4 min-h-[460px] max-h-[700px] overflow-y-auto">
              {viewMode === "edit" ? (
                <textarea
                  id="package-editor"
                  value={currentContent}
                  onChange={(e) => onUpdatePackageText(activeTab, e.target.value)}
                  className="w-full min-h-[440px] text-xs sm:text-sm text-slate-900 leading-relaxed font-mono p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-y bg-slate-50/30"
                  placeholder="내용이 비어 있습니다."
                />
              ) : (
                <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                  {renderPreviewWithCitations(currentContent)}
                </div>
              )}
            </div>

            {/* Bottom Editor Status Bar */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span>글자수: {currentContent.length.toLocaleString()} 자</span>
                <span>•</span>
                <span>줄 수: {currentContent.split("\n").length} 행</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span>한글(HWP) 및 공문서 조례 준수 양식</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL (Analysis & Quick Actions & Source Viewer) ================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Right Panel Header Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/80 p-1 gap-1">
              <button
                type="button"
                onClick={() => setRightPanelTab("analysis")}
                className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  rightPanelTab === "analysis"
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                <span>📌 AI 근거 분석</span>
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab("quickActions")}
                className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  rightPanelTab === "quickActions"
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                <span>🪄 퀵 리라이팅</span>
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab("sources")}
                className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  rightPanelTab === "sources"
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                <span>📂 근거 문서 보기</span>
              </button>
            </div>

            {/* Right Panel Content */}
            <div className="p-4 min-h-[460px] max-h-[700px] overflow-y-auto space-y-4">
              {/* TAB 1: AI 근거 분석 */}
              {rightPanelTab === "analysis" && (
                <div className="space-y-4">
                  {/* 회의 배경 및 현 상황 */}
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <span>📌 회의 배경 및 현재 상황</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {data.analysis_summary?.background || "회의 배경 분석 데이터가 준비되었습니다."}
                    </p>
                  </div>

                  {/* 주요 통계 및 실적 표 */}
                  {data.analysis_summary?.statistics_table && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>📊 주요 통계 및 실적 요약</span>
                      </div>
                      <div className="text-xs text-slate-800 p-2.5 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto font-mono whitespace-pre-wrap">
                        {data.analysis_summary.statistics_table}
                      </div>
                    </div>
                  )}

                  {/* 문제점 및 주요 쟁점 */}
                  {data.analysis_summary?.main_issues && (
                    <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                        <span>⚠️ 문제점 및 주요 쟁점</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {data.analysis_summary.main_issues}
                      </p>
                    </div>
                  )}

                  {/* 미확인 / 확인 필요 사항 */}
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>❓ 미확인 / 회의 전 공무원 확인 필요 사항</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">
                      {data.analysis_summary?.verification_items ||
                        "회의 전 참석 부서 실무자 직급 및 보건복지부 최신 지침 변동 사항 확인 요망."}
                    </p>
                  </div>

                  {/* 추출된 근거 사실 (Extracted Facts) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        문서 원문 발췌 근거 ({data.extracted_facts?.length || 0}건)
                      </span>
                      <span className="text-[11px] text-slate-400">출처 기반 매핑 완료</span>
                    </div>

                    <div className="space-y-2">
                      {(data.extracted_facts || []).map((fact) => {
                        const isVerified = fact.confidence === "confirmed";
                        return (
                          <div
                            key={fact.id}
                            className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-colors ${
                              isVerified
                                ? "bg-white border-slate-200"
                                : "bg-amber-50/50 border-amber-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isVerified
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-200 text-amber-900"
                                }`}
                              >
                                {isVerified ? "확인된 사실" : "확인 필요"}
                              </span>
                              <span className="text-[11px] text-emerald-700 font-semibold">
                                📄 {fact.source_file} {fact.page ? `p.${fact.page}` : ""}
                              </span>
                            </div>
                            <p className="text-slate-800 leading-snug">{fact.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 퀵 리라이팅 (Quick Actions) */}
              {rightPanelTab === "quickActions" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 mb-1">
                      원클릭 퀵 리라이팅 (Quick Prompt)
                    </h3>
                    <p className="text-xs text-slate-500">
                      선택된 <strong>[{currentTabConfig.label}]</strong>의 텍스트를 공무원 실무 목적에 맞게 1초 만에 재구성합니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* 공무원 보고서 문체로 */}
                    <button
                      type="button"
                      disabled={isRewriting}
                      onClick={() => onQuickRewrite(activeTab, "civil_servant")}
                      className="p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 bg-white text-left transition-all flex items-start gap-2.5 group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                        👔
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                          공무원 보고서 문체로 변환
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          개조식 종결어미(-함, -음, -조치 요망) 및 표준 행정 문체로 일괄 교정
                        </p>
                      </div>
                    </button>

                    {/* 더 간결하게 */}
                    <button
                      type="button"
                      disabled={isRewriting}
                      onClick={() => onQuickRewrite(activeTab, "more_concise")}
                      className="p-3 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/60 bg-white text-left transition-all flex items-start gap-2.5 group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 font-bold text-sm">
                        🪄
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-purple-900">
                          더 간결하게 압축
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          군더더기 표현을 삭제하고 핵심 수치와 쟁점만 컴팩트하게 축약
                        </p>
                      </div>
                    </button>

                    {/* 표로 재구성 */}
                    <button
                      type="button"
                      disabled={isRewriting}
                      onClick={() => onQuickRewrite(activeTab, "table_format")}
                      className="p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 bg-white text-left transition-all flex items-start gap-2.5 group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                        📊
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                          표(Table) 서식으로 재구성
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          비교 항목, 수치 및 담당기관을 일목요연한 마크다운 표로 정리
                        </p>
                      </div>
                    </button>

                    {/* 5분 발표용으로 요약 */}
                    <button
                      type="button"
                      disabled={isRewriting}
                      onClick={() => onQuickRewrite(activeTab, "five_min_summary")}
                      className="p-3 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/60 bg-white text-left transition-all flex items-start gap-2.5 group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-sm">
                        ⏱️
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                          5분 발표용 핵심 요약
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          보건소장 및 위원장에게 5분 안에 전달 가능한 핵심 브리핑 구성
                        </p>
                      </div>
                    </button>

                    {/* 대본 톤 조절 */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isRewriting}
                        onClick={() => onQuickRewrite(activeTab, "script_tone_up")}
                        className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-all"
                      >
                        <p className="text-xs font-bold text-slate-800">🗣️ 대본 격식 상향</p>
                        <p className="text-[10px] text-slate-500">기관장 대면 보고용</p>
                      </button>
                      <button
                        type="button"
                        disabled={isRewriting}
                        onClick={() => onQuickRewrite(activeTab, "script_tone_down")}
                        className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-all"
                      >
                        <p className="text-xs font-bold text-slate-800">👥 친근한 전달체</p>
                        <p className="text-[10px] text-slate-500">실무자 협의체용</p>
                      </button>
                    </div>
                  </div>

                  {/* 커스텀 프롬프트 입력창 */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label
                      htmlFor="custom-rewrite-prompt"
                      className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                    >
                      <span>✏️ 직접 수정 지시 프롬프트</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="custom-rewrite-prompt"
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="예) 소방서 협조 요청 사항을 더 강조해줘"
                        className="flex-1 text-xs text-slate-900 px-3 py-2 rounded-md border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
                      />
                      <button
                        type="button"
                        disabled={!customPrompt.trim() || isRewriting}
                        onClick={() => {
                          onQuickRewrite(activeTab, "custom", customPrompt);
                          setCustomPrompt("");
                        }}
                        className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-md text-xs font-bold shrink-0 transition-colors shadow-2xs"
                      >
                        적용
                      </button>
                    </div>
                  </div>

                  {isRewriting && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-900">
                      <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>AI가 지시사항에 맞춰 문서를 정밀하게 재작성하고 있습니다...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: 근거 문서 미리보기 (Source Viewer) */}
              {rightPanelTab === "sources" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">업로드 원문 문서</span>
                    <span className="text-[11px] text-slate-400">
                      총 {sourceFiles.length}개 파일 등록됨
                    </span>
                  </div>

                  {sourceFiles.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      등록된 원문 문서가 없습니다.
                    </div>
                  ) : (
                    <>
                      {/* Document Selector Pills */}
                      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
                        {sourceFiles.map((doc, idx) => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              setSelectedDocIndex(idx);
                              setSelectedSourceHighlight(null);
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                              selectedDocIndex === idx
                                ? "bg-emerald-800 text-white shadow-2xs"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {doc.name}
                          </button>
                        ))}
                      </div>

                      {/* Document Details Card */}
                      {sourceFiles[selectedDocIndex] && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200">
                            <span className="font-bold text-slate-800 truncate max-w-[200px]">
                              {sourceFiles[selectedDocIndex].name}
                            </span>
                            <span>페이지: {sourceFiles[selectedDocIndex].pages || 1}p</span>
                          </div>

                          {selectedSourceHighlight && (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center justify-between">
                              <span>선택된 출처: <strong>{selectedSourceHighlight}</strong></span>
                              <button
                                type="button"
                                onClick={() => setSelectedSourceHighlight(null)}
                                className="text-[11px] text-emerald-700 underline"
                              >
                                하이라이트 해제
                              </button>
                            </div>
                          )}

                          {/* Raw text preview with chunk scroll */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-[380px] overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {sourceFiles[selectedDocIndex].text || "추출된 텍스트가 없습니다."}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
