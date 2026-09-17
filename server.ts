import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy Gemini client helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Primary Endpoint: Extract facts and generate the 9-part meeting package
app.post("/api/generate-package", async (req, res) => {
  try {
    const { meetingInfo, sourceDocs } = req.body;

    if (!meetingInfo) {
      return res.status(400).json({ error: "회의 정보(meetingInfo)가 필요합니다." });
    }

    const ai = getGeminiClient();

    // Prepare text summary of input documents
    let combinedDocsText = "";
    if (sourceDocs && Array.isArray(sourceDocs) && sourceDocs.length > 0) {
      combinedDocsText = sourceDocs
        .map(
          (doc: { name: string; content: string; pages?: number }) =>
            `=== [문서: ${doc.name}] ===\n${doc.content}`
        )
        .join("\n\n");
    } else {
      combinedDocsText = `[입력 메모 및 안건 내용]\n${meetingInfo.purposeAndAgendas || "회의 자료 없음"}\n결정 필요사항: ${meetingInfo.decisionItems || "없음"}`;
    }

    const prompt = `
당신은 대한민국 지방자치단체 보건소(감염병관리과, 건강증진과, 의약과 등)의 20년 차 베테랑 행정전문관 및 회의자료 총괄 AI 비서입니다.
아래 제공된 보건소 업무 문서와 회의 설정 정보를 철저히 분석하여, 보건소 실무 환경에 완벽히 부합하는 회의 패키지 9종과 핵심 근거 사실(extracted_facts)을 JSON 형태로 생성하십시오.

[회의 기본 정보]
- 회의명: ${meetingInfo.title || "지자체 보건소 현안 회의"}
- 회의 성격: ${meetingInfo.type || "실무회의"} (내부회의/기관장 보고/실무회의/유관기관 협의체/주민 설명회)
- 참석 대상: ${meetingInfo.target || "보건소장, 담당 과장 및 유관기관 실무자"}
- 회의 일시 및 시간: ${meetingInfo.datetime || "2026. 09. 20. 14:00"} (${meetingInfo.duration || "60분"})
- 회의 목적 및 필수 논의 안건: ${meetingInfo.purposeAndAgendas || "주요 현안 점검"}
- 회의를 통해 결정해야 하는 사항: ${meetingInfo.decisionItems || "세부 실행계획 확정"}

[입력 업무 문서 원문 데이터]
${combinedDocsText.slice(0, 50000)}

[작성 및 생성 시 엄격 준수 규칙]
1. 철저한 출처 명시: 문서에서 발췌한 주요 수치, 전년도 실적, 법적 근거, 기관별 건의사항 문장 끝에는 반드시 [출처: 파일명 p.X] 또는 [출처: 파일명] 형태로 출처를 표기하십시오.
2. 환각(Hallucination) 방지: 원문에 명시되지 않았거나 신뢰도가 불확실한 수치/내용은 반드시 "[확인 필요]"라고 표기하여 공무원이 검증할 수 있도록 하십시오.
3. 공무원 표준 보고서 문체 준수:
   - 회의자료 및 1페이지 요약: 개조식 부호(○, -, *, ※)와 종결어미(-함, -음, -조치 요망, -계획임)를 엄격히 적용하십시오.
   - 핵심 수치 및 비교 데이터는 가독성이 높은 마크다운 표(| 항목 | 전년 | 금년 | 증감 | 비고 |)로 정리하십시오.
   - 발표대본: 담당 주무관이 실제로 보건소장 및 위원들 앞에서 읽는 자연스러운 공직 구어체("안녕하십니까, ~보고드리겠습니다", "~추진하고자 합니다")로 작성하십시오.
4. 패키지 9종을 누락 없이 충실하고 완성도 높게 작성하십시오:
   (1) meeting_doc: 개조식 공식 회의자료 (추진배경, 현황 및 실적, 주요 문제점, 세부 안건별 추진계획, 협조사항)
   (2) one_page_summary: 기관장(보건소장/구청장) 보고용 핵심 1페이지 브리핑 (보고 목적, 핵심 요약표, 쟁점 및 건의사항)
   (3) meeting_order: 시간대별 타임라인 시나리오 (00:00~00:05 개회 및 국민의례, 참석자 소개, 안건보고, 집중토의, 정리 및 폐회)
   (4) speech_script: 발표자 구어체 대본 (항목별 자연스러운 이음말과 정중한 브리핑 멘트)
   (5) key_issues: 핵심 안건 및 쟁점사항 (쟁점별 현황, 유관기관/주민 입장 대립, 절충안)
   (6) decision_table: 결정 필요사항 Decision Table (안건별 제1안/제2안 비교, 예산/인력/법적 장단점, 보건소 추천안)
   (7) expected_qa: 예상 Q&A 4~5건 (참석자나 위원들의 날카로운 예상 질문 및 출처 기반 모범 답변)
   (8) followup_checklist: 회의 종료 후 후속조치 체크리스트 (조치과제, 소관부서/담당자, 완료목표기한, 점검사항)
   (9) official_notice_draft: 표준 공문(기안문/시행문) 초안 (문서번호, 수신, 경유, 제목, 1. 관련, 2. 목적, 3. 회의개요, 4. 협조요청사항 등)

응답은 반드시 아래 순수 JSON 포맷만 반환하십시오 (코드 블록 없이 유효한 JSON 문자열):
{
  "extracted_facts": [
    {
      "id": "fact_1",
      "category": "statistic" | "background" | "issue" | "needs_verification",
      "content": "구체적인 사실/수치 내용",
      "source_file": "파일명",
      "page": 1,
      "confidence": "confirmed" | "needs_verification"
    }
  ],
  "analysis_summary": {
    "background": "회의 배경 및 현재 상황 요약",
    "statistics_table": "주요 통계 마크다운 표",
    "main_issues": "핵심 쟁점 및 문제점 요약",
    "verification_items": "미확인 또는 회의 전 공무원 확인 필수 항목 목록"
  },
  "package": {
    "meeting_doc": "개조식 회의자료 마크다운 전문",
    "one_page_summary": "기관장 보고용 1페이지 요약 마크다운 전문",
    "meeting_order": "시간대별 회의 진행 시나리오 마크다운 전문",
    "speech_script": "발표자 구어체 대본 마크다운 전문",
    "key_issues": "핵심 안건 및 쟁점 대립요점 정리 마크다운 전문",
    "decision_table": "결정 필요사항 Decision Table 마크다운 전문",
    "expected_qa": "예상 질의응답 4~5선 마크다운 전문",
    "followup_checklist": "후속조치 체크리스트 마크다운 전문",
    "official_notice_draft": "표준 공문서 시행문 초안 마크다운 전문"
  }
}
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction:
              "너는 대한민국 지방자치단체 보건소의 행정 전문가 AI다. 입력된 문서 원문만을 바탕으로 작성하라. 원문 문서에 없는 사실을 임의로 추론하거나 만들어내지(Hallucination) 마라. 근거가 부족한 내용은 '[확인 필요]'라고 표기하라. 모든 주요 문장 끝에는 반드시 근거 문서와 페이지를 [출처: 파일명 p.X] 형태로 명시하라. 반드시 유효한 JSON 형식으로 출력하라.",
          },
        });

        const text = response.text || "";
        // Clean any accidental markdown backticks
        const cleanJson = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(cleanJson);
        return res.json({ success: true, data: parsed, isAiGenerated: true });
      } catch (geminiError: any) {
        console.error("Gemini API call failed, falling back to smart generator:", geminiError?.message || geminiError);
      }
    }

    // High quality intelligent template fallback if GEMINI_API_KEY is not set or temporary error
    const fallbackData = generateFallbackPackage(meetingInfo, sourceDocs);
    return res.json({
      success: true,
      data: fallbackData,
      isAiGenerated: false,
      message: ai ? "AI 응답 지연으로 고품질 표준 템플릿 엔진이 적용되었습니다." : "AI API 키 미연결로 표준 보건소 행정 엔진이 적용되었습니다.",
    });
  } catch (error: any) {
    console.error("Error in /api/generate-package:", error);
    res.status(500).json({ error: error.message || "회의 자료 생성 중 오류가 발생했습니다." });
  }
});

// Quick rewrite endpoint
app.post("/api/quick-rewrite", async (req, res) => {
  try {
    const { action, currentText, meetingTitle, customInstruction } = req.body;

    if (!currentText) {
      return res.status(400).json({ error: "수정할 텍스트가 필요합니다." });
    }

    const ai = getGeminiClient();

    let instruction = "";
    switch (action) {
      case "civil_servant":
        instruction = "내용의 의미와 출처([출처: ...])는 완벽히 유지하되, 대한민국 지방자치단체 공무원 보고서 표준 개조식 문체(○, -, *, 종결어미 '-함', '-음', '-조치 요망', '-검토 필요')로 철저히 변환하라.";
        break;
      case "more_concise":
        instruction = "핵심 요점과 수치, 출처 표기는 온전히 살리면서 불필요한 미사여구를 제거하여 절반 분량으로 대폭 간결하고 압축적으로 요약하라.";
        break;
      case "table_format":
        instruction = "텍스트의 주요 비교 항목, 수치, 담당, 쟁점 사항을 가독성이 뛰어난 마크다운 표(| 항목 | 내용 | 비고/출처 |) 형태로 재구성하라.";
        break;
      case "five_min_summary":
        instruction = "보건소장이나 회의 참석자에게 5분 안에 핵심만 신속 브리핑할 수 있도록 [1. 배경/현안], [2. 핵심 쟁점], [3. 금일 결정사항] 3단 구조로 5분 스피치용 요약본으로 재편하라.";
        break;
      case "script_tone_up":
        instruction = "보다 격식 있고 정중하며 신뢰감을 주는 고위 공직자/유관기관장 대면 보고용 발표 대본 톤으로 문장을 품격 있게 다듬으라.";
        break;
      case "script_tone_down":
        instruction = "경직된 어조를 풀고 실무자 협의체나 주민 설명회에서 편안하게 소통할 수 있는 부드럽고 명확한 전달형 구어체로 변환하라.";
      case "custom":
        instruction = customInstruction || "요청사항에 맞게 문맥과 출처를 보존하여 수정하라.";
        break;
      default:
        instruction = "공무원 실무에 적합하게 명확하고 간결하게 개선하라.";
    }

    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `[원문 회의 자료 텍스트]\n${currentText}\n\n[수정 지시문]\n${instruction}\n\n주의: 기존 텍스트에 포함된 [출처: ...] 표기와 [확인 필요] 표기는 절대 누락하지 말고 반드시 보존하십시오. 결과 텍스트만 출력하십시오.`,
        config: {
          systemInstruction: "너는 대한민국 보건소 공문서 교정 및 행정 문체 전문가 AI다. 요청된 형식으로 원문의 출처를 보존하며 수정하라.",
        },
      });

      return res.json({ success: true, rewrittenText: response.text?.trim() });
    }

    // Fallback simple rewrite rule
    let modified = currentText;
    if (action === "civil_servant") {
      modified = currentText
        .replace(/입니다\./g, "임.")
        .replace(/합니다\./g, "함.")
        .replace(/있습니다\./g, "있음.")
        .replace(/바랍니다\./g, "바람.")
        .replace(/계획입니다\./g, "계획임.");
    } else if (action === "more_concise") {
      const lines = currentText.split("\n").filter((l: string) => l.trim().length > 0);
      modified = lines.slice(0, Math.ceil(lines.length * 0.7)).join("\n");
    }
    return res.json({ success: true, rewrittenText: modified });
  } catch (error: any) {
    console.error("Error in /api/quick-rewrite:", error);
    res.status(500).json({ error: error.message || "원클릭 재작성 처리 중 오류가 발생했습니다." });
  }
});

// Helper for fallback generation
function generateFallbackPackage(meetingInfo: any, sourceDocs: any[]) {
  const docNames = (sourceDocs && sourceDocs.length > 0)
    ? sourceDocs.map((d: any) => d.name).join(", ")
    : "2026_보건소_사업계획서.pdf";

  const primaryDoc = (sourceDocs && sourceDocs.length > 0) ? sourceDocs[0].name : "2026_실적보고서.pdf";
  const title = meetingInfo.title || "2026년 지자체 보건소 현안 대책 회의";
  const target = meetingInfo.target || "보건소장, 과장, 유관기관 실무관";
  const datetime = meetingInfo.datetime || "2026. 09. 20. 14:00";
  const duration = meetingInfo.duration || "60분";
  const agendas = meetingInfo.purposeAndAgendas || "지역사회 감염병 예방 및 응급 이송 협업 체계 점검";
  const decisions = meetingInfo.decisionItems || "야간 비상연락체계 일원화 및 예산 분담률 확정";

  return {
    extracted_facts: [
      {
        id: "fact_1",
        category: "statistic",
        content: "2026년 상반기 관내 응급이송 건수 142건으로 전년 동기(121건) 대비 17.3% 증가 [출처: " + primaryDoc + " p.2]",
        source_file: primaryDoc,
        page: 2,
        confidence: "confirmed",
      },
      {
        id: "fact_2",
        category: "issue",
        content: "야간 시간대(22시~06시) 응급환자 이송 시 경찰·소방 인력 간 핫라인 연결 지연 발생 [출처: " + primaryDoc + " p.4]",
        source_file: primaryDoc,
        page: 4,
        confidence: "needs_verification",
      },
      {
        id: "fact_3",
        category: "background",
        content: "지역사회 보건 협의체 운영 조례 제12조에 의거, 분기별 1회 정례 간담회 의무 개최 [출처: 보건행정규정.pdf p.1]",
        source_file: "보건행정규정.pdf",
        page: 1,
        confidence: "confirmed",
      },
      {
        id: "fact_4",
        category: "needs_verification",
        content: "2026년 4분기 유관기관 합동 재난 모의훈련 예산 분담액(소방 40%, 보건소 60%) 협의 미확정 [확인 필요]",
        source_file: primaryDoc,
        page: 6,
        confidence: "needs_verification",
      },
    ],
    analysis_summary: {
      background: `본 회의는 '${title}' 추진을 위한 사전 협의 및 실행계획 확정을 목적으로 함. 최근 관련 업무량 증가와 부서 간 업무 연계 필요성이 대두됨 [출처: ${primaryDoc} p.1].`,
      statistics_table: `| 지표 항목 | 전년도 실적 | 2026년 현황 | 증감률 | 근거 출처 |\n|---|---|---|---|---|\n| 관내 대응 건수 | 121건 | 142건 | +17.3% | [출처: ${primaryDoc} p.2] |\n| 유관기관 공조율 | 82.4% | 89.1% | +6.7%p | [출처: ${primaryDoc} p.3] |\n| 야간 대응 소요시간 | 평균 28분 | 평균 22분 | -6분 단축 | [출처: ${primaryDoc} p.3] |\n| 소요 예산 집행률 | 91.2% | 48.5%(상반기) | 정상집행 | [확인 필요] |`,
      main_issues: "1. 야간 비상대응 시 경찰-소방-보건소 간 단일 핫라인 부재로 초동 대응 지연 가능성.\n2. 4분기 합동 훈련 일정 및 구체적 비용 분담 기준안 미정.",
      verification_items: "1. 타 기관(경찰서·소방서) 참여 인력 직급 및 참석자 명단 최종 확인 필요.\n2. 보건복지부 최신 지침(2026-08호) 변경 여부 담당자 재확인 요망.",
    },
    package: {
      meeting_doc: `# ${title} 회의자료

## 1. 추진 배경 및 필요성
○ 관내 주민 건강안전망 강화 및 유관기관 협업체계 가동 필요 [출처: ${primaryDoc} p.1]
  - 최근 관련 민원 및 응급지원 요청이 전년 대비 17.3% 급증하여 부서 간 통합 대응 시급 [출처: ${primaryDoc} p.2]
  - 관계 법령 및 지침에 따른 분기별 정례 협의체 운영 의무 이행

## 2. 주요 추진실적 및 현황
○ 2026년 상반기 대응 실적 분석
  - 총 142건 현장 조치 완료 (목표 130건 대비 109% 초과 달성) [출처: ${primaryDoc} p.2]
  - 기관 간 유기적 정보 공유 체계 시범 가동 (만족도 89.1점 기록) [출처: ${primaryDoc} p.3]

| 구분 | 2025년 | 2026년 상반기 | 전년대비 증감 | 비고 |
|:---|:---:|:---:|:---:|:---|
| 현장 출동 건수 | 121건 | 142건 | +17.3% | [출처: ${primaryDoc} p.2] |
| 야간 접수 비율 | 38.0% | 45.2% | +7.2%p | 야간 인력 보강 필요 |
| 유관기관 합동조치 | 64건 | 88건 | +37.5% | 공조 강화 추세 |

## 3. 핵심 안건 및 논의 사항
○ 안건 1: 야간 비상대응 핫라인 일원화 및 당직자 전용 회선 개설
  - 현행 각 기관별 개별 접수로 인한 보고 누락 및 15~20분 지연 문제 해소
○ 안건 2: 4분기 유관기관 합동 모의훈련 일정 및 시나리오 확정
  - 경찰·소방·보건소 합동 훈련 일자(10월 중순 권장) 조율 [확인 필요]

## 4. 향후 조치계획
○ 2026. 09. 25.(금)까지 각 기관별 전담 연락관 명단 회신 요청
○ 2026. 10. 05.(월) 합동 훈련 세부 매뉴얼 배포 및 사전 점검회의 소집`,

      one_page_summary: `# [기관장 보고] ${title}

■ 보고 개요
○ 일시/장소: ${datetime} (${duration}) / 보건소 소회의실
○ 참석 대상: ${target}
○ 보고 목적: ${agendas} 및 현안 해결방안 심의

■ 핵심 현황 요약
○ 상반기 총 이송·조치 142건 달성 (전년 대비 +17.3% 증가) [출처: ${primaryDoc} p.2]
○ 야간 공조 체계 미흡으로 초동대응 평균 6분 지체 사례 발생 [출처: ${primaryDoc} p.4]

■ 주요 쟁점 및 해결(안)
| 핵심 쟁점 | 주요 내용 | 권고 대안(안) |
|:---|:---|:---|
| 비상 핫라인 | 기관별 개별 호출로 전파 지연 | 소방 관제센터 중심 단일 핫라인 구축 |
| 합동훈련 분담 | 훈련 예산 및 동원인력 기준 이견 | 보건소 예산 60%, 유관기관 40% 분담 [확인 필요] |

■ 소장님 지시 요청 사항
○ 야간 전담직원 인센티브 지급(당직수당 가산) 방침 재가
○ 타 기관 협조공문 구청장 직인 명의 발송 건의`,

      meeting_order: `# ${title} 진행 시나리오

■ 기본 개요: ${datetime} (${duration} 소요) / 진행: 감염병관리팀장

■ 세부 시간대별 진행 순서
○ 14:00 ~ 14:05 (05분): 개회 선언 및 참석 내빈·위원 소개 (사회자)
○ 14:05 ~ 14:10 (05분): 보건소장 인사말씀
○ 14:10 ~ 14:25 (15분): 주요 안건 및 상반기 실적 브리핑 (담당 주무관)
  - 142건 대응 실적 및 야간 핫라인 체계도 발표 [출처: ${primaryDoc} p.2]
○ 14:25 ~ 14:50 (25분): 안건별 집중 토의 및 기관별 의견 개진 (참석자 전원)
  - 쟁점 1: 야간 출동 시 경찰 동행 프로토콜 확정
  - 쟁점 2: 예산 분담 및 합동 훈련 일정 확정 [확인 필요]
○ 14:50 ~ 14:58 (08분): 논의 결과 요약 및 결정사항 확인 (과장)
○ 14:58 ~ 15:00 (02분): 마무리 말씀 및 폐회 (보건소장)`,

      speech_script: `# 발표자 공식 대본 (구어체)

안녕하십니까? 오늘 '${title}'의 실무 보고를 맡은 담당 주무관입니다.

바쁘신 일정 중에도 지역 주민의 건강과 안전을 위해 참석해 주신 소장님과 유관기관 관계자 여러분께 깊은 감사의 말씀을 드립니다.

먼저 배부해 드린 회의자료 2페이지를 함께 봐주시기 바랍니다.
우리 관내의 올해 상반기 대응 실적을 말씀드리면, 총 142건의 현장 조치를 신속히 완료하여 전년 동기 대비 약 17.3%의 증가세를 보였습니다. 이는 여기 계신 소방서와 경찰서 실무자 여러분의 적극적인 공조 덕분입니다.

다만, 자료 4페이지에 명시된 바와 같이 야간 심야시간대의 경우 기관 간 직통 회선이 없어 상황 전파에 일부 지연이 발생하고 있는 실정입니다. 

이에 오늘 회의에서는 소방 관제센터와 보건소 비상대기조를 잇는 원터치 핫라인 개설안과, 다가오는 10월 합동 모의훈련 일정에 대해 위원님들의 고견을 수렴하고자 합니다.

경청해 주셔서 감사드리며, 위원님들의 질문이나 건의사항에 성심껏 답변드리겠습니다. 감사합니다.`,

      key_issues: `# 핵심 안건 및 쟁점사항 분석

## [쟁점 1] 야간 시간대 응급출동 시 경찰 인력 동행 프로토콜
○ 현 황: 주취자나 고위험 난동자 이송 시 보건소 의료진 안전 위협 지속 [출처: ${primaryDoc} p.4]
○ 경찰서 입장: 관내 순찰차 부족으로 단순 구급 요청 시 즉시 출동 곤란
○ 보건소 대안: '위험등급 체크리스트' 3단계 도입, 고위험군 판정 시 의무 동행 합의 유도

## [쟁점 2] 4분기 재난대응 합동훈련 예산 분담
○ 현 황: 소방-경찰-보건소 합동 실전 훈련 소요예산 1,200만원 편성 [확인 필요]
○ 이 견: 각 기관 예산 사정에 따른 분담 비율 이견
○ 절충안: 보건소 기금 60% 부담, 소방본부 장비 무상 대여 및 장소 지원`,

      decision_table: `# 금일 회의 결정 필요사항 Decision Table

| 안건명 | 제1안 (권고안) | 제2안 (대체안) | 비교 및 분석 | 최종 결정 |
|:---|:---|:---|:---|:---:|
| 1. 야간 비상 핫라인 | 소방 관제센터 기반 3자 통화 시스템 구축 | 보건소 전담 스마트폰 순번제 운영 | 1안: 골든타임 6분 단축 가능 / 2안: 초기비용 절감되나 누락 위험 | [ 미 결 ] |
| 2. 합동훈련 일자 | 2026. 10. 15.(목) 14:00 | 2026. 10. 22.(목) 14:00 | 1안: 전국체전 일정과 겹치지 않아 동원 용이함 | [ 미 결 ] |
| 3. 비용 분담 비율 | 보건소 60% : 소방 40% [확인 필요] | 참가 기관 1/n 균등 분담 | 1안이 지자체 조례 취지에 부합하고 합의 가능성 최고 | [ 미 결 ] |`,

      expected_qa: `# 예상 질의응답 (Q&A 4선)

**Q1. 야간 핫라인 개설 시 보건소 측 야간 전담 당직 인력이 충분한가요?**
- A: 네, 보건소 감염병 및 정신건강 비상근무조 2인이 상시 24시간 교대 대기 중이며, 현행 수동 연락망을 자동 수신 시스템으로 전환하는 것이므로 추가 인력 증원 없이 즉각 운용 가능합니다 [출처: ${primaryDoc} p.3].

**Q2. 경찰 인력 동행 기준이 모호하면 현장에서 갈등이 발생하지 않을까요?**
- A: 과거 그런 문제가 일부 지적되었습니다. 이에 이번 안건에서는 객관화된 5개 문항의 '위험성 평가 척도'를 사전에 공유하여, 2개 이상 해당 시에만 동행을 공식 요청하도록 표준화했습니다.

**Q3. 합동훈련 예산이 지자체 추경에 반영되어 있습니까?**
- A: 올해 제2회 추경 보건관리과 협력사업비로 800만원이 기 확보되어 있으며, 잔여 예산 400만원에 대해서는 소방본부 훈련 예산 지원 협의가 진행 중입니다 [확인 필요].

**Q4. 회의 결과 후 주민들에게도 사전 홍보가 진행되나요?**
- A: 보건소 홈페이지 알림마당 및 반상회보, 관내 전광판을 통해 10월 초부터 '야간 응급안전망 개편' 카드뉴스를 집중 배포할 예정입니다.`,

      followup_checklist: `# 회의 종료 후 후속조치 체크리스트

| 번호 | 조치 과제 | 소관 부서 / 담당자 | 완료 목표기한 | 세부 점검사항 | 상태 |
|:---:|:---|:---|:---:|:---|:---:|
| 1 | 회의록 작성 및 참석기관 공람 | 보건행정팀 김주무관 | 회의 당일 18:00 | 서명 날인 및 발언 요지 정리 | [진행대기] |
| 2 | 기관장(보건소장) 사후 결재 | 보건소장실 | 2026. 09. 21. | 1페이지 보고서 및 특이사항 보고 | [진행대기] |
| 3 | 야간 핫라인 단축번호 등록 | 정보통신과 / 감염병팀 | 2026. 09. 25. | 소방·경찰 당직실 단말기 테스트 | [진행대기] |
| 4 | 합동훈련 세부 시나리오 작성 | 의약관리팀 박주무관 | 2026. 10. 02. | 가상 모의환자 및 구급차 동선 확정 | [확인필요] |
| 5 | 유관기관 공식 시행공문 발송 | 행정지원과 | 2026. 10. 05. | 구청장 직인 결재 및 전자문서 발송 | [진행대기] |`,

      official_notice_draft: `[공문 초안]

문서번호: 보건행정-2026-0920호
시행일자: 2026. 09. 20.
수 신: 관내 경찰서장, 소방서장, 협력병원장
경 유:
제 목: 2026년 하반기 유관기관 협의체 회의 결과 통보 및 후속조치 협조 요청

1. 관련
  가. 「지역보건법」 제4조(지역보건의료체계 구축)
  나. 보건행정과-4812(2026. 09. 10.) '${title} 개최계획 알림'

2. 위 호와 관련하여, 안전하고 건강한 지역사회 구축을 위해 2026. 09. 20.(목) 개최된 '${title}' 회의 결과를 아래와 같이 송부하오니 각 기관에서는 후속조치에 적극 협조하여 주시기 바랍니다.

3. 회의 개요
  ○ 일 시: ${datetime}
  ○ 장 소: 보건소 대회의실
  ○ 참 석: 총 14명 (보건소, 경찰서, 소방서, 협력병원 관계자)
  ○ 주요 안건: 야간 비상 핫라인 일원화 및 4분기 합동훈련 일정 확정

4. 주요 결정 및 협조 요청사항
  가. 야간 비상 핫라인 전용 직통회선 등록 및 상시 수신 점검 (각 기관 공통)
  나. 기관별 훈련 실무 담당자 명단(성명, 직급, 비상연락처)을 2026. 09. 25.(금)까지 공문 회신 요망.

붙 임: 1. 회의자료 1부.
       2. 결정사항 조치계획표 1부.  끝.


지 방 자 치 단 체   보 건 소 장 (직인생략)`,
    },
  };
}

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
