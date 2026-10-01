package com.autograph.performance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** AI 업체 비교 에이전트 호출 기록. 같은 공고를 다시 봐도 과거 추천을 다시 볼 수 있게 남겨 둔다. */
@Entity
@Table(name = "knowledge_vendor_comparison_log")
public class KnowledgeVendorComparisonLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private long eventId;

    @Column(name = "event_name", nullable = false, length = 200)
    private String eventName;

    @Column(name = "recommended_company", nullable = false, length = 100)
    private String recommendedCompany;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String reasoning;

    /** VendorScoreResponse 리스트를 그대로 JSON 문자열로 저장한다 — 조회 전용 로그라 별도 테이블로 쪼개지 않는다. */
    @Column(name = "scores_json", nullable = false, columnDefinition = "LONGTEXT")
    private String scoresJson;

    @Column(nullable = false, length = 50)
    private String model;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected KnowledgeVendorComparisonLogEntity() {}

    public KnowledgeVendorComparisonLogEntity(long eventId, String eventName, String recommendedCompany,
                                               String reasoning, String scoresJson, String model, Instant createdAt) {
        this.eventId = eventId;
        this.eventName = eventName;
        this.recommendedCompany = recommendedCompany;
        this.reasoning = reasoning;
        this.scoresJson = scoresJson;
        this.model = model;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public long getEventId() { return eventId; }
    public String getEventName() { return eventName; }
    public String getRecommendedCompany() { return recommendedCompany; }
    public String getReasoning() { return reasoning; }
    public String getScoresJson() { return scoresJson; }
    public String getModel() { return model; }
    public Instant getCreatedAt() { return createdAt; }
}
