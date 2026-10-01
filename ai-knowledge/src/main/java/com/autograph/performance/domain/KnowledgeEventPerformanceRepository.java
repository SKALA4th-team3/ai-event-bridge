package com.autograph.performance.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeEventPerformanceRepository extends JpaRepository<KnowledgeEventPerformanceEntity, Long> {
    List<KnowledgeEventPerformanceEntity> findByEventIdOrderByYearAsc(long eventId);
}
