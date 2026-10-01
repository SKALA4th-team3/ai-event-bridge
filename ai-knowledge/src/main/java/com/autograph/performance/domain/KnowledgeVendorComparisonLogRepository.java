package com.autograph.performance.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeVendorComparisonLogRepository extends JpaRepository<KnowledgeVendorComparisonLogEntity, Long> {
    List<KnowledgeVendorComparisonLogEntity> findByEventIdOrderByCreatedAtDesc(long eventId);
}
