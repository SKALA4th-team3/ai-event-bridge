package com.autograph.performance.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeBidRepository extends JpaRepository<KnowledgeBidEntity, Long> {
    List<KnowledgeBidEntity> findByEventIdOrderByDisplayIdAsc(long eventId);
    long countByEventId(long eventId);
}
