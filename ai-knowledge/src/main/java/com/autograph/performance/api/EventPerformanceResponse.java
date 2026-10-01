package com.autograph.performance.api;

import java.util.List;

public record EventPerformanceResponse(
        long eventId,
        String eventName,
        List<YearPerformance> history,
        RegressionAnalysis visitorRegression,
        RegressionAnalysis costRegression,
        RegressionAnalysis netProfitRegression,
        List<BidResponse> bids,
        /** eventId가 course-service의 실제 공고와 매칭됐는지. false면 전부 데모 데이터. */
        boolean linkedToRealCourse,
        /** course/enrollment/user-service에서 실시간으로 가져온 실제 지원 현황. 매칭 안 되면 빈 리스트. */
        List<RealBid> realBids
) {}
