package com.autograph.performance.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeVendorDocumentRepository extends JpaRepository<KnowledgeVendorDocumentEntity, Long> {
    List<KnowledgeVendorDocumentEntity> findByCompanyNameIn(List<String> companyNames);
    List<KnowledgeVendorDocumentEntity> findByCompanyName(String companyName);
}
