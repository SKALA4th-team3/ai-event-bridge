package com.autograph.performance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** AI 업체 비교 에이전트가 근거로 삼는 과거 수행 평가 문서. 사람이 쓴 텍스트를 그대로 둔다 — 숫자로 요약·가공하지 않는다. */
@Entity
@Table(name = "knowledge_vendor_document")
public class KnowledgeVendorDocumentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected KnowledgeVendorDocumentEntity() {}

    public KnowledgeVendorDocumentEntity(String companyName, String title, String content, Instant createdAt) {
        this.companyName = companyName;
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getCompanyName() { return companyName; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
