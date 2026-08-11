package com.autograph.performance.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class LinearRegressionCalculatorTest {
    record Sample(int x, double y) {}

    @Test
    void calculatesLeastSquaresAndRSquared() {
        var result = new LinearRegressionCalculator().calculate(
                List.of(new Sample(1, 3), new Sample(2, 5), new Sample(3, 7)),
                Sample::x, Sample::y, 1, 4);

        assertThat(result.slope()).isCloseTo(2.0, within(0.0001));
        assertThat(result.intercept()).isCloseTo(1.0, within(0.0001));
        assertThat(result.rSquared()).isCloseTo(1.0, within(0.0001));
        assertThat(result.trend().getLast().value()).isCloseTo(9.0, within(0.0001));
    }
}
