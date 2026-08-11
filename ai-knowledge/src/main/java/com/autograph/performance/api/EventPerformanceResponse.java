package com.autograph.performance.api;

import java.util.List;

public record EventPerformanceResponse(
        long eventId,
        String eventName,
        List<YearPerformance> history,
        RegressionAnalysis visitorRegression,
        RegressionAnalysis costRegression,
        RegressionAnalysis netProfitRegression,
        List<BidResponse> bids
) {}
