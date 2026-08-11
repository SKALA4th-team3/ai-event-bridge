package com.autograph.performance.service;

import com.autograph.performance.api.RegressionAnalysis;
import com.autograph.performance.api.RegressionPoint;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.function.ToDoubleFunction;

@Component
public class LinearRegressionCalculator {
    public <T> RegressionAnalysis calculate(List<T> samples, ToDoubleFunction<T> x, ToDoubleFunction<T> y,
                                            int trendStartYear, int trendEndYear) {
        if (samples.size() < 2) throw new IllegalArgumentException("회귀 계산에는 두 개 이상의 데이터가 필요합니다.");

        double meanX = samples.stream().mapToDouble(x).average().orElseThrow();
        double meanY = samples.stream().mapToDouble(y).average().orElseThrow();
        double sumXX = 0.0;
        double sumXY = 0.0;
        double totalSquares = 0.0;
        for (T sample : samples) {
            double dx = x.applyAsDouble(sample) - meanX;
            double dy = y.applyAsDouble(sample) - meanY;
            sumXX += dx * dx;
            sumXY += dx * dy;
            totalSquares += dy * dy;
        }
        double slope = sumXX == 0.0 ? 0.0 : sumXY / sumXX;
        double intercept = meanY - slope * meanX;
        double residualSquares = samples.stream()
                .mapToDouble(sample -> {
                    double residual = y.applyAsDouble(sample) - (slope * x.applyAsDouble(sample) + intercept);
                    return residual * residual;
                }).sum();
        double rSquared = totalSquares == 0.0 ? 1.0 : 1.0 - residualSquares / totalSquares;

        List<RegressionPoint> trend = new ArrayList<>();
        for (int year = trendStartYear; year <= trendEndYear; year++) {
            trend.add(new RegressionPoint(year, slope * year + intercept));
        }
        return new RegressionAnalysis(slope, intercept, rSquared, List.copyOf(trend));
    }
}
