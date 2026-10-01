package com.autograph.performance.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CourseInfo(Long id, String title, String description, String category, String status) {}
