package com.autograph.performance.api;

import java.time.Instant;
import java.util.List;

public record VendorComparisonHistoryItem(
        long eventId,
        String eventName,
        String recommendedCompany,
        String reasoning,
        List<VendorScoreResponse> scores,
        String model,
        Instant createdAt
) {}
