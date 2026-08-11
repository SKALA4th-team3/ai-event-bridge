package com.autograph.performance.api;

public record YearPerformance(
        int year,
        int visitors,
        long cost,
        long revenue,
        long netProfit,
        boolean forecast
) {}
