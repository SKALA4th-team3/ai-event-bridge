package com.autograph.performance.api;

public record BidResponse(
        Long bidId,
        String companyName,
        long bidAmount,
        long expectedRevenue,
        long otherCost,
        long expectedProfit,
        double roi
) {}
