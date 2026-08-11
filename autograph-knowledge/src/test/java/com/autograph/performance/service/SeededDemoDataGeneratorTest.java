package com.autograph.performance.service;

import com.autograph.performance.api.YearPerformance;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class SeededDemoDataGeneratorTest {
    private final SeededDemoDataGenerator generator = new SeededDemoDataGenerator(new LinearRegressionCalculator());

    @Test
    void sameEventIdAlwaysProducesSameTwentyHistoricalYears() {
        var first = generator.performance(101);
        var second = generator.performance(101);

        assertThat(first).isEqualTo(second);
        assertThat(first.history()).hasSize(20);
        assertThat(first.history().stream().filter(item -> !item.forecast())).hasSize(20);
        assertThat(first.history().getFirst().year()).isEqualTo(2006);
        assertThat(first.history().getLast().year()).isEqualTo(2025);
        assertThat(first.history()).noneMatch(YearPerformance::forecast);
    }

    @Test
    void differentEventIdsProduceDifferentDataAndValidProfit() {
        assertThat(generator.history(101)).isNotEqualTo(generator.history(102));
        assertThat(generator.history(101)).allSatisfy(item ->
                assertThat(item.netProfit()).isEqualTo(item.revenue() - item.cost()));
    }

    @Test
    void demoMoneyUsesReducedScaleWhileKeepingFinancialRelationships() {
        var history = generator.history(101);
        var bids = generator.initialBids(101);

        assertThat(history).allSatisfy(item -> {
            assertThat(item.cost()).isLessThan(100_000_000L);
            assertThat(item.revenue()).isLessThan(200_000_000L);
            assertThat(item.netProfit()).isEqualTo(item.revenue() - item.cost());
        });
        assertThat(bids).allSatisfy(bid -> {
            assertThat(bid.bidAmount()).isBetween(32_000_000L, 48_100_000L);
            assertThat(bid.expectedProfit()).isEqualTo(bid.expectedRevenue() - bid.bidAmount() - bid.otherCost());
        });
    }

    @Test
    void allThreeRegressionsExtendThrough2026() {
        var performance = generator.performance(101);
        assertThat(performance.visitorRegression().trend()).hasSize(21);
        assertThat(performance.costRegression().trend()).hasSize(21);
        assertThat(performance.netProfitRegression().trend()).hasSize(21);
        assertThat(performance.visitorRegression().rSquared()).isBetween(0.0, 1.0);
        assertThat(performance.costRegression().rSquared()).isBetween(0.0, 1.0);
        assertThat(performance.netProfitRegression().rSquared()).isBetween(0.0, 1.0);
        assertThat(performance.visitorRegression().trend().getLast().year()).isEqualTo(2026);
    }

    @Test
    void zeroBidAmountHasZeroRoi() {
        assertThat(SeededDemoDataGenerator.roi(100_000, 0)).isZero();
    }
}
