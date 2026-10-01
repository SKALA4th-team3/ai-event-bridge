package com.autograph.performance.service;

import com.autograph.performance.api.AgentUnavailableException;
import com.autograph.performance.api.VendorComparisonHistoryItem;
import com.autograph.performance.api.VendorComparisonResponse;
import com.autograph.performance.api.VendorScoreResponse;
import com.autograph.performance.domain.KnowledgeVendorComparisonLogEntity;
import com.autograph.performance.domain.KnowledgeVendorComparisonLogRepository;
import com.autograph.performance.domain.KnowledgeVendorDocumentEntity;
import com.autograph.performance.domain.KnowledgeVendorDocumentRepository;
import com.autograph.performance.integration.CourseInfo;
import com.autograph.performance.integration.CourseServiceClient;
import com.autograph.performance.integration.EnrollmentInfo;
import com.autograph.performance.integration.EnrollmentServiceClient;
import com.autograph.performance.integration.OllamaClient;
import com.autograph.performance.integration.UserServiceClient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * "향후 Agent가 업체를 비교 분석한다"는 AiReadinessPanel의 구상을 실제로 구현한다.
 * 실제 공고(course-service)·실제 입찰(enrollment-service)·실제 업체명(user-service)과
 * 가상으로 작성한 수행 평가 문서(knowledge_vendor_document)를 근거로 로컬 LLM(Qwen, Ollama)이
 * 비교·추천한다. README의 "향후 확장"에 해당하는 부분을 데모가 아니라 실제로 호출되게 만든 것.
 */
@Service
public class VendorComparisonAgentService {
    private static final Logger log = LoggerFactory.getLogger(VendorComparisonAgentService.class);

    private final CourseServiceClient courseServiceClient;
    private final EnrollmentServiceClient enrollmentServiceClient;
    private final UserServiceClient userServiceClient;
    private final KnowledgeVendorDocumentRepository documentRepository;
    private final KnowledgeVendorComparisonLogRepository logRepository;
    private final OllamaClient ollamaClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public VendorComparisonAgentService(CourseServiceClient courseServiceClient,
                                         EnrollmentServiceClient enrollmentServiceClient,
                                         UserServiceClient userServiceClient,
                                         KnowledgeVendorDocumentRepository documentRepository,
                                         KnowledgeVendorComparisonLogRepository logRepository,
                                         OllamaClient ollamaClient) {
        this.courseServiceClient = courseServiceClient;
        this.enrollmentServiceClient = enrollmentServiceClient;
        this.userServiceClient = userServiceClient;
        this.documentRepository = documentRepository;
        this.logRepository = logRepository;
        this.ollamaClient = ollamaClient;
    }

    public VendorComparisonResponse compare(long eventId) {
        CourseInfo course = courseServiceClient.findCourse(eventId)
                .orElseThrow(() -> new IllegalStateException(
                        "eventId " + eventId + "는 실제 공고(course-service)와 연결되어 있지 않습니다. " +
                        "비교할 실제 입찰 데이터가 없어 에이전트를 호출할 수 없습니다."));

        List<EnrollmentInfo> enrollments = enrollmentServiceClient.findByCourse(eventId);
        if (enrollments.isEmpty()) {
            throw new IllegalStateException("courseId " + eventId + "(" + course.title() + ")에 아직 지원한 업체가 없습니다.");
        }

        List<CompanyContext> contexts = enrollments.stream()
                .map(this::toCompanyContext)
                .toList();

        String prompt = buildPrompt(course.title(), contexts);
        AgentJson parsed;
        try {
            String json = ollamaClient.generateJson(prompt);
            parsed = objectMapper.readValue(json, AgentJson.class);
        } catch (Exception e) {
            throw new AgentUnavailableException(
                    "로컬 LLM(Ollama, " + ollamaClient.model() + ") 호출에 실패했습니다. " +
                    "Ollama가 떠 있는지(`ollama serve`) 확인해 주세요.", e);
        }

        List<VendorScoreResponse> scores = parsed.scores() == null ? List.of() : parsed.scores().stream()
                .map(s -> new VendorScoreResponse(stripBrackets(s.companyName()), s.score(),
                        s.comment() == null ? "" : s.comment()))
                .toList();
        String recommendedCompany = stripBrackets(parsed.recommendedCompany());
        if (recommendedCompany == null || recommendedCompany.isBlank()) {
            recommendedCompany = contexts.isEmpty() ? "알 수 없음" : contexts.get(0).companyName();
        }
        // 모델이 가끔 reasoning을 비워서 응답한다 — NOT NULL 컬럼 저장과 프론트 표시를 위해 방어한다.
        String reasoning = parsed.reasoning() == null || parsed.reasoning().isBlank()
                ? "(모델이 근거를 생성하지 않았습니다. 점수만 참고하세요.)"
                : parsed.reasoning();

        persistLog(eventId, course.title(), recommendedCompany, reasoning, scores);

        return new VendorComparisonResponse(eventId, course.title(), true,
                recommendedCompany, reasoning, scores, ollamaClient.model());
    }

    /** 호출할 때마다 결과가 휘발되지 않도록 knowledge_vendor_comparison_log에 남긴다. */
    private void persistLog(long eventId, String eventName, String recommendedCompany, String reasoning,
                             List<VendorScoreResponse> scores) {
        try {
            String scoresJson = objectMapper.writeValueAsString(scores);
            logRepository.save(new KnowledgeVendorComparisonLogEntity(eventId, eventName, recommendedCompany,
                    reasoning, scoresJson, ollamaClient.model(), Instant.now()));
        } catch (Exception e) {
            // 저장 실패는 응답 자체를 막을 이유가 아니다 — 로그만 남기고 사용자에게는 정상 결과를 돌려준다.
            log.warn("AI 업체 비교 로그 저장 실패 (eventId={}): {}", eventId, e.toString());
        }
    }

    public List<VendorComparisonHistoryItem> history(long eventId) {
        return logRepository.findByEventIdOrderByCreatedAtDesc(eventId).stream()
                .map(this::toHistoryItem)
                .toList();
    }

    private VendorComparisonHistoryItem toHistoryItem(KnowledgeVendorComparisonLogEntity entity) {
        List<VendorScoreResponse> scores;
        try {
            scores = objectMapper.readValue(entity.getScoresJson(), new TypeReference<List<VendorScoreResponse>>() {});
        } catch (Exception e) {
            scores = List.of();
        }
        return new VendorComparisonHistoryItem(entity.getEventId(), entity.getEventName(),
                entity.getRecommendedCompany(), entity.getReasoning(), scores, entity.getModel(),
                entity.getCreatedAt());
    }

    /** 프롬프트에서 [업체명] 표기를 쓰다 보니 모델이 대괄호째로 따라 적는 경우가 있어 후처리로 걷어낸다. */
    private static String stripBrackets(String value) {
        return value == null ? null : value.replaceAll("^\\[|\\]$", "").trim();
    }

    private CompanyContext toCompanyContext(EnrollmentInfo enrollment) {
        String companyName = userServiceClient.findUser(enrollment.userId())
                .map(user -> user.name())
                .orElse("업체 #" + enrollment.userId());
        List<KnowledgeVendorDocumentEntity> docs = documentRepository.findByCompanyName(companyName);
        String evaluation = docs.isEmpty()
                ? "과거 수행 평가 문서 없음."
                : docs.stream()
                        .map(d -> d.getTitle() + "\n" + d.getContent())
                        .collect(Collectors.joining("\n---\n"));
        return new CompanyContext(companyName, enrollment.bidAmount(), enrollment.proposal(), evaluation);
    }

    private String buildPrompt(String eventTitle, List<CompanyContext> contexts) {
        StringBuilder sb = new StringBuilder();
        sb.append("당신은 공공 행사 발주 담당자를 돕는 업체 비교 에이전트입니다.\n");
        sb.append("공고: ").append(eventTitle).append("\n");
        sb.append("아래는 이 공고에 실제로 지원한 업체들의 입찰 정보와 과거 수행 평가 문서입니다.\n");
        sb.append("입찰 금액만으로 판단하지 말고, 과거 수행 평가(품질·일정·안전·예산 집행)를 함께 고려해 종합 추천하세요.\n\n");
        for (CompanyContext c : contexts) {
            sb.append("업체명: ").append(c.companyName()).append("\n");
            sb.append("입찰금액: ").append(c.bidAmount()).append("원\n");
            sb.append("제안서: ").append(c.proposal() == null ? "(없음)" : c.proposal()).append("\n");
            sb.append("과거 수행 평가:\n").append(c.evaluation()).append("\n\n");
        }
        sb.append("companyName에는 위에 주어진 업체명을 대괄호나 기호 없이 그대로 쓰세요.\n");
        sb.append("다음 JSON 스키마로만 답하세요(다른 텍스트 금지): ");
        sb.append("{\"recommendedCompany\": string, \"reasoning\": string, ");
        sb.append("\"scores\": [{\"companyName\": string, \"score\": number(0-100), \"comment\": string}]}");
        return sb.toString();
    }

    private record CompanyContext(String companyName, java.math.BigDecimal bidAmount, String proposal,
                                   String evaluation) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AgentJson(String recommendedCompany, String reasoning, List<AgentScore> scores) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AgentScore(String companyName, int score, String comment) {}
}
