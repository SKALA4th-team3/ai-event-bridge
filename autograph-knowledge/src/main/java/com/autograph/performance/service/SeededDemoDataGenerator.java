package com.autograph.performance.service;

import com.autograph.performance.api.BidResponse;
import com.autograph.performance.api.RegressionAnalysis;
import com.autograph.performance.api.YearPerformance;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.SplittableRandom;

@Component
public class SeededDemoDataGenerator {
    public static final int HISTORY_START_YEAR = 2006;
    public static final int HISTORY_END_YEAR = 2025;
    public static final int FORECAST_YEAR = 2026;
    private static final long HISTORY_SALT = 0x484953544F52594CL;
    private static final long BID_SALT = 0x424944534545444CL;
    private static final String[] COMPANIES = {"한빛이벤트", "드림축제기획", "지역문화컴퍼니"};
    private final LinearRegressionCalculator regressionCalculator;

    public SeededDemoDataGenerator(LinearRegressionCalculator regressionCalculator) {
        this.regressionCalculator = regressionCalculator;
    }

    public PerformanceData performance(long eventId) {
        List<YearPerformance> past = historicalData(eventId);
        RegressionAnalysis visitorRegression = regressionCalculator.calculate(
                past, YearPerformance::year, YearPerformance::visitors, HISTORY_START_YEAR, FORECAST_YEAR);
        RegressionAnalysis costRegression = regressionCalculator.calculate(
                past, YearPerformance::year, YearPerformance::cost, HISTORY_START_YEAR, FORECAST_YEAR);
        RegressionAnalysis netProfitRegression = regressionCalculator.calculate(
                past, YearPerformance::year, YearPerformance::netProfit, HISTORY_START_YEAR, FORECAST_YEAR);
        return new PerformanceData(past, visitorRegression, costRegression, netProfitRegression);
    }

    public List<YearPerformance> history(long eventId) {
        return performance(eventId).history();
    }

    private List<YearPerformance> historicalData(long eventId) {
        SplittableRandom random = random(eventId, HISTORY_SALT);
        int baseVisitors = roundTo(random.nextInt(22_000, 36_001), 100);
        int annualVisitorGrowth = random.nextInt(650, 1_301);
        long baseCost = roundTo(random.nextLong(17_000_000L, 28_100_001L), 100_000L);
        long annualCostGrowth = random.nextLong(800_000L, 1_600_001L);
        List<YearPerformance> result = new ArrayList<>();

        for (int year = HISTORY_START_YEAR; year <= HISTORY_END_YEAR; year++) {
            int offset = year - HISTORY_START_YEAR;
            int visitors = roundTo(Math.max(10_000, baseVisitors + annualVisitorGrowth * offset
                    + random.nextInt(-2_800, 2_801)), 100);
            long cost = roundTo(Math.max(8_000_000L, baseCost + annualCostGrowth * offset
                    + random.nextLong(-2_400_000L, 2_400_001L)), 100_000L);
            long revenuePerVisitor = 1_200L + offset * 21L + random.nextLong(-90L, 91L);
            long revenue = roundTo(visitors * revenuePerVisitor, 100_000L);
            revenue = Math.max(revenue, roundTo((long) (cost * random.nextDouble(1.12, 1.42)), 100_000L));
            result.add(new YearPerformance(year, visitors, cost, revenue, revenue - cost, false));
        }
        return List.copyOf(result);
    }

    public List<BidResponse> initialBids(long eventId) {
        SplittableRandom random = random(eventId, BID_SALT);
        List<BidResponse> bids = new ArrayList<>();
        for (int index = 0; index < COMPANIES.length; index++) {
            long bidAmount = roundTo(random.nextLong(32_000_000L, 48_100_001L), 100_000L);
            long expectedRevenue = roundTo(random.nextLong(76_000_000L, 108_100_001L), 100_000L);
            long otherCost = roundTo(random.nextLong(5_500_000L, 13_100_001L), 100_000L);
            long expectedProfit = expectedRevenue - bidAmount - otherCost;
            bids.add(new BidResponse((long) index + 1, COMPANIES[index], bidAmount,
                    expectedRevenue, otherCost, expectedProfit, roi(expectedProfit, bidAmount)));
        }
        return List.copyOf(bids);
    }

    public static double roi(long profit, long bidAmount) {
        if (bidAmount == 0) return 0.0;
        return Math.round((profit * 1000.0 / bidAmount)) / 10.0;
    }

    private SplittableRandom random(long eventId, long salt) { return new SplittableRandom(mix64(eventId ^ salt)); }
    private long mix64(long value) {
        value = (value ^ (value >>> 30)) * 0xbf58476d1ce4e5b9L;
        value = (value ^ (value >>> 27)) * 0x94d049bb133111ebL;
        return value ^ (value >>> 31);
    }
    private int roundTo(int value, int unit) { return Math.round((float) value / unit) * unit; }
    private long roundTo(long value, long unit) { return Math.round((double) value / unit) * unit; }

    public record PerformanceData(
            List<YearPerformance> history,
            RegressionAnalysis visitorRegression,
            RegressionAnalysis costRegression,
            RegressionAnalysis netProfitRegression
    ) {}
}
