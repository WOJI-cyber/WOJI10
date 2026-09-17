import React, { useState } from "react";
import { Header } from "./components/Header";
import { NoticeBanner } from "./components/NoticeBanner";
import { UploadSection } from "./components/UploadSection";
import { MeetingSettingsForm } from "./components/MeetingSettingsForm";
import { PackageResultView } from "./components/PackageResultView";
import { PIIModal } from "./components/PIIModal";
import { HelpModal } from "./components/HelpModal";
import {
  MeetingInfo,
  UploadedFileItem,
  GeneratedData,
  PackageTabKey,
} from "./types";
import { maskPii } from "./utils/piiDetector";
import {
  RotateCcw,
  History,
} from "lucide-react";

export default function App() {
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo>({
    title: "",
    type: "실무회의",
    target: "",
    datetime: "",
    duration: "60분",
    purposeAndAgendas: "",
    decisionItems: "",
  });
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [directText, setDirectText] = useState("");
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // PII Warning Modal
  const [piiModal, setPiiModal] = useState<{
    isOpen: boolean;
    fileId: string;
    fileName: string;
    count: number;
  }>({
    isOpen: false,
    fileId: "",
    fileName: "",
    count: 0,
  });

  // Recent History (transient in-memory / local session for security)
  const [recentMeetings, setRecentMeetings] = useState<
    { id: string; title: string; date: string; type: string }[]
  >([]);

  // Reset to new meeting
  const handleReset = () => {
    setMeetingInfo({
      title: "",
      type: "실무회의",
      target: "",
      datetime: "",
      duration: "60분",
      purposeAndAgendas: "",
      decisionItems: "",
    });
    setFiles([]);
    setDirectText("");
    setGeneratedData(null);
  };

  // Trigger PII Alert
  const handlePiiAlertTrigger = (fileId: string) => {
    const targetFile = files.find((f) => f.id === fileId);
    if (targetFile) {
      setPiiModal({
        isOpen: true,
        fileId: targetFile.id,
        fileName: targetFile.name,
        count: targetFile.detectedPii.residentNumbers.length,
      });
    }
  };

  // Mask PII and proceed
  const handleMaskPiiAndProceed = () => {
    if (!piiModal.fileId) return;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === piiModal.fileId) {
          return {
            ...f,
            text: maskPii(f.text),
            detectedPii: { residentNumbers: [], phoneNumbers: [] },
            isMasked: true,
          };
        }
        return f;
      })
    );
    setPiiModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Proceed without masking
  const handleProceedWithoutMasking = () => {
    setPiiModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Submit and generate the 9-part meeting package
  const handleGeneratePackage = async () => {
    if (!meetingInfo.title.trim()) {
      alert("회의명을 입력해 주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare payload
      const sourceDocs = files.map((f) => ({
        name: f.name,
        content: f.text,
        pages: f.pages,
      }));

      if (directText.trim()) {
        sourceDocs.push({
          name: "실무자_직접입력_메모.txt",
          content: directText,
          pages: 1,
        });
      }

      const res = await fetch("/api/generate-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingInfo,
          sourceDocs,
        }),
      });

      if (!res.ok) {
        throw new Error(`생성 요청 실패: ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.data) {
        setGeneratedData(result.data);

        // Add to recent sessions
        setRecentMeetings((prev) => [
          {
            id: `m_${Date.now()}`,
            title: meetingInfo.title,
            date: meetingInfo.datetime || "오늘",
            type: meetingInfo.type,
          },
          ...prev.slice(0, 4),
        ]);

        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        throw new Error(result.error || "자료 생성 응답이 올바르지 않습니다.");
      }
    } catch (err: any) {
      console.error("Package generation error:", err);
      alert(err.message || "회의 자료 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update specific package text from editor
  const handleUpdatePackageText = (tab: PackageTabKey, newText: string) => {
    if (!generatedData) return;
    setGeneratedData({
      ...generatedData,
      package: {
        ...generatedData.package,
        [tab]: newText,
      },
    });
  };

  // Quick rewrite request
  const handleQuickRewrite = async (
    tab: PackageTabKey,
    action: string,
    customInstruction?: string
  ) => {
    if (!generatedData) return;
    const currentText = generatedData.package[tab] || "";
    if (!currentText.trim()) return;

    setIsRewriting(true);
    try {
      const res = await fetch("/api/quick-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          currentText,
          meetingTitle: meetingInfo.title,
          customInstruction,
        }),
      });

      const json = await res.json();
      if (json.success && json.rewrittenText) {
        handleUpdatePackageText(tab, json.rewrittenText);
      } else {
        alert("원클릭 재작성 처리에 실패했습니다.");
      }
    } catch (err) {
      console.error("Rewrite error:", err);
      alert("재작성 요청 중 오류가 발생했습니다.");
    } finally {
      setIsRewriting(false);
    }
  };

  const canSubmit = meetingInfo.title.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <Header
        onOpenHelp={() => setIsHelpOpen(true)}
        onReset={handleReset}
        hasActiveData={!!generatedData}
      />

      {/* Security Notice Banner */}
      <NoticeBanner />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {generatedData ? (
          /* ================= SCREEN 2: Result View (Split View) ================= */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setGeneratedData(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-900 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>회의 설정 및 자료 업로드 수정하기</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>출처 연동 9종 패키지 생성 완료</span>
              </div>
            </div>

            <PackageResultView
              data={generatedData}
              meetingInfo={meetingInfo}
              sourceFiles={files}
              onUpdatePackageText={handleUpdatePackageText}
              onQuickRewrite={handleQuickRewrite}
              isRewriting={isRewriting}
            />
          </div>
        ) : (
          /* ================= SCREEN 1: Input & Configuration ================= */
          <div className="space-y-6">
            {/* Step 1: Large Upload Documents & Memos */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>회의 관련 자료 업로드 & 텍스트 추출</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    회의와 관련된 공문서, 연간 사업계획서(PDF), 실적 통계(XLSX), 지난 회의록 및 메모를 등록해 주세요.
                  </p>
                </div>
              </div>

              <UploadSection
                files={files}
                onFilesChange={setFiles}
                directText={directText}
                onDirectTextChange={setDirectText}
                onPiiAlertTrigger={handlePiiAlertTrigger}
              />
            </div>

            {/* Step 2: Meeting Settings Form */}
            <div className="space-y-4">
              <MeetingSettingsForm
                meetingInfo={meetingInfo}
                onChange={setMeetingInfo}
                onSubmit={handleGeneratePackage}
                isLoading={isLoading}
                canSubmit={canSubmit}
              />
            </div>

            {/* Recent Session History (if any) */}
            {recentMeetings.length > 0 && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>최근 작성된 회의자료 이력 (현재 브라우저 세션)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {recentMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-left space-y-1"
                    >
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        {m.type}
                      </span>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{m.title}</p>
                      <p className="text-[11px] text-slate-500">{m.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>회의자료 생성기 · 지방자치단체 보건소 공무원을 위한 맞춤형 회의자료 자동 생성 시스템</p>
          <p className="text-[11px] text-slate-400">
            데이터 미저장 원칙(Zero-Data Retention) 준수 · 개인정보 자동 마스킹 지원
          </p>
        </div>
      </footer>

      {/* PII Alert Modal */}
      <PIIModal
        isOpen={piiModal.isOpen}
        fileName={piiModal.fileName}
        detectedCount={piiModal.count}
        onMaskAndProceed={handleMaskPiiAndProceed}
        onProceedWithoutMasking={handleProceedWithoutMasking}
        onClose={() => setPiiModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
