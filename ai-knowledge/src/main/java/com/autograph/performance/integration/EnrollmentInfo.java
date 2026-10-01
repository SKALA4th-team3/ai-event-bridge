package com.autograph.performance.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EnrollmentInfo(Long id, Long userId, Long courseId, BigDecimal bidAmount, String proposal,
                              String status) {}
