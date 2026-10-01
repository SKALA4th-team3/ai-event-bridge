package com.autograph.performance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "knowledge_bid")
public class KnowledgeBidEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private long eventId;

    /** SeededDemoDataGenerator.initialBids()가 매 이벤트마다 1~3번을 선점하므로,
     *  실제 저장된 입찰은 이벤트별로 4번부터 이어지는 별도 번호를 쓴다. */
    @Column(name = "display_id", nullable = false)
    private long displayId;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(name = "bid_amount", nullable = false)
    private long bidAmount;

    @Column(name = "expected_revenue", nullable = false)
    private long expectedRevenue;

    @Column(name = "other_cost", nullable = false)
    private long otherCost;

    @Column(name = "expected_profit", nullable = false)
    private long expectedProfit;

    @Column(name = "roi", nullable = false)
    private double roi;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected KnowledgeBidEntity() {}

    public KnowledgeBidEntity(long eventId, long displayId, String companyName, long bidAmount,
                               long expectedRevenue, long otherCost, long expectedProfit, double roi,
                               Instant createdAt) {
        this.eventId = eventId;
        this.displayId = displayId;
        this.companyName = companyName;
        this.bidAmount = bidAmount;
        this.expectedRevenue = expectedRevenue;
        this.otherCost = otherCost;
        this.expectedProfit = expectedProfit;
        this.roi = roi;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public long getEventId() { return eventId; }
    public long getDisplayId() { return displayId; }
    public String getCompanyName() { return companyName; }
    public long getBidAmount() { return bidAmount; }
    public long getExpectedRevenue() { return expectedRevenue; }
    public long getOtherCost() { return otherCost; }
    public long getExpectedProfit() { return expectedProfit; }
    public double getRoi() { return roi; }
    public Instant getCreatedAt() { return createdAt; }
}
