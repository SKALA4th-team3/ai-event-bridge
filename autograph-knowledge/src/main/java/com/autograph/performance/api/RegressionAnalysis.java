package com.autograph.performance.api;

import java.util.List;

public record RegressionAnalysis(
        double slope,
        double intercept,
        double rSquared,
        List<RegressionPoint> trend
) {}
