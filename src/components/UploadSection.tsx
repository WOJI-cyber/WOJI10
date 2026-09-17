import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  FileUp,
} from "lucide-react";
import { UploadedFileItem } from "../types";
import { parseUploadedFile } from "../utils/fileParser";
import { maskPii } from "../utils/piiDetector";

interface UploadSectionProps {
  files: UploadedFileItem[];
  onFilesChange: (files: UploadedFileItem[]) => void;
  directText: string;
  onDirectTextChange: (text: string) => void;
  onPiiAlertTrigger: (fileId: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  files,
  onFilesChange,
  directText,
  onDirectTextChange,
  onPiiAlertTrigger,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    const newItems: UploadedFileItem[] = [...files];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const tempId = `file_${Date.now()}_${i}`;

      const initialItem: UploadedFileItem = {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type || file.name.split(".").pop() || "unknown",
        status: "processing",
        text: "",
        pages: 1,
        detectedPii: { residentNumbers: [], phoneNumbers: [] },
      };

      newItems.push(initialItem);
      onFilesChange([...newItems]);

      try {
        const parsed = await parseUploadedFile(file);
        const targetIndex = newItems.findIndex((item) => item.id === tempId);
        if (targetIndex !== -1) {
          newItems[targetIndex] = {
            ...newItems[targetIndex],
            status: "completed",
            text: parsed.text,
            pages: parsed.pages,
            detectedPii: parsed.detectedPii,
          };
          onFilesChange([...newItems]);

          // Trigger PII warning modal if resident numbers detected
          if (parsed.detectedPii.residentNumbers.length > 0) {
            onPiiAlertTrigger(tempId);
          }
        }
      } catch (err) {
        console.error("File processing failed:", err);
        const targetIndex = newItems.findIndex((item) => item.id === tempId);
        if (targetIndex !== -1) {
          newItems[targetIndex].status = "error";
          onFilesChange([...newItems]);
        }
      }
    }

    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    onFilesChange(updated);
  };

  const handleMaskFilePii = (id: string) => {
    const updated = files.map((f) => {
      if (f.id === id) {
        return {
          ...f,
          text: maskPii(f.text),
          detectedPii: { residentNumbers: [], phoneNumbers: [] },
          isMasked: true,
        };
      }
      return f;
    });
    onFilesChange(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    return <FileText className="w-5 h-5 text-emerald-700" />;
  };

  return (
    <div className="space-y-5">
      {/* Expanded Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center ${
          isDragging
            ? "border-emerald-600 bg-emerald-50/90 scale-[1.01] shadow-md ring-4 ring-emerald-100"
            : "border-slate-300 hover:border-emerald-500 bg-slate-50/40 hover:bg-emerald-50/30"
        }`}
        id="file-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.xls,.txt,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shadow-xs border border-emerald-200">
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-1.5">
            <p className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
              회의 관련 공문서, 계획서, 통계 엑셀 자료를 이곳에 끌어다 놓으세요
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              파일을 직접 드래그 앤 드롭하거나 아래 버튼을 클릭하여 선택할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
            >
              <FileUp className="w-4 h-4" />
              <span>내 컴퓨터에서 파일 선택</span>
            </button>
          </div>

          {/* Supported format badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">PDF</span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">DOCX</span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">XLSX / XLS / CSV</span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">TXT</span>
            <span className="text-slate-400 font-normal">· 파일당 최대 20MB</span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-900 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <span>💡 <strong>한글(HWP) 문서</strong>는 본문을 복사하여 아래 [직접 입력창]에 붙여넣으시면 동일하게 분석됩니다.</span>
          </div>
        </div>
      </div>

      {/* Uploaded File List Cards */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
            <span>업로드 및 텍스트 추출 현황 ({files.length}개)</span>
            <span className="text-slate-500">
              총 {files.reduce((acc, f) => acc + (f.text?.length || 0), 0).toLocaleString()} 자 분석 준비 완료
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {files.map((file) => {
              const hasRrn = file.detectedPii.residentNumbers.length > 0;
              const hasPhone = file.detectedPii.phoneNumbers.length > 0;

              return (
                <div
                  key={file.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    hasRrn
                      ? "bg-amber-50/60 border-amber-300"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-slate-100 shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                          {file.name}
                        </p>
                        {file.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            추출 완료 ({file.pages || 1}p)
                          </span>
                        )}
                        {file.status === "processing" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 animate-pulse">
                            분석 중...
                          </span>
                        )}
                        {file.status === "error" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                            오류
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>추출 글자수: {file.text ? `${file.text.length.toLocaleString()}자` : "0자"}</span>
                        {file.isMasked && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> 마스킹 완료
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* PII Alert Badge */}
                    {hasRrn && (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>주민번호 {file.detectedPii.residentNumbers.length}건 감지</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMaskFilePii(file.id)}
                          className="px-2 py-1 rounded text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 transition-colors shadow-xs"
                          title="주민등록번호 마스킹 처리"
                        >
                          즉시 마스킹
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                      title="파일 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Direct Text Input Box (Memo / verbal briefings / HWP text paste) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <label
            htmlFor="direct-notes"
            className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>직접 입력 텍스트 / 실무 메모 / 한글(HWP) 본문 복사 붙여넣기</span>
          </label>
          <span className="text-[11px] text-slate-500">
            {directText.length.toLocaleString()} 자 입력됨
          </span>
        </div>
        <textarea
          id="direct-notes"
          rows={3}
          value={directText}
          onChange={(e) => onDirectTextChange(e.target.value)}
          placeholder="회의와 관련하여 추가로 반영할 메모나 과장님/소장님 구두 지시사항, 한글(HWP) 문서의 텍스트를 이곳에 편하게 적어주세요. AI가 문서들과 함께 종합 분석합니다."
          className="w-full text-xs text-slate-800 p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-y bg-slate-50/50 placeholder:text-slate-400 leading-relaxed font-sans"
        />
      </div>
    </div>
  );
};
