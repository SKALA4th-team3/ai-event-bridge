package com.autograph.performance.service;

import com.autograph.performance.api.YearPerformance;
import com.autograph.performance.domain.KnowledgeEventPerformanceEntity;
import com.autograph.performance.domain.KnowledgeEventPerformanceRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SeededDemoDataGeneratorTest {
    private final KnowledgeEventPerformanceRepository performanceRepository = mock(KnowledgeEventPerformanceRepository.class);
    private final SeededDemoDataGenerator generator;

    {
        when(performanceRepository.findByEventIdOrderByYearAsc(anyLong())).thenReturn(List.of());
        generator = new SeededDemoDataGenerator(new LinearRegressionCalculator(), performanceRepository);
    }

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

    @Test
    void usesPersistedHistoryInsteadOfSeededFallbackWhenDbHasData() {
        var persisted = List.of(
                new KnowledgeEventPerformanceEntity(501, 2023, 40_000, 20_000_000L, 30_000_000L, 10_000_000L),
                new KnowledgeEventPerformanceEntity(501, 2024, 42_000, 21_000_000L, 32_000_000L, 11_000_000L));
        when(performanceRepository.findByEventIdOrderByYearAsc(501)).thenReturn(persisted);

        var history = generator.history(501);

        assertThat(history).hasSize(2);
        assertThat(history.get(0)).isEqualTo(new YearPerformance(2023, 40_000, 20_000_000L, 30_000_000L, 10_000_000L, false));
        assertThat(history.get(1)).isEqualTo(new YearPerformance(2024, 42_000, 21_000_000L, 32_000_000L, 11_000_000L, false));
    }
}
