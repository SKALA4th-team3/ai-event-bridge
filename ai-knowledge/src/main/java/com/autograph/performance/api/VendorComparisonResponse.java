package com.autograph.performance.api;

import java.util.List;

public record VendorComparisonResponse(
        long eventId,
        String eventName,
        boolean linkedToRealCourse,
        String recommendedCompany,
        String reasoning,
        List<VendorScoreResponse> scores,
        String model
) {}
