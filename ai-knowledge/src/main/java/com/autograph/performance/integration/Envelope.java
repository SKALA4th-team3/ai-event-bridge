package com.autograph.performance.integration;

/** course/enrollment/user-service 공통 응답 포맷({success, message, data})을 그대로 매핑한다. */
public record Envelope<T>(boolean success, String message, T data) {}
