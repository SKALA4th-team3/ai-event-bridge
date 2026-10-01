package com.autograph.performance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "knowledge_event_performance",
        uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "event_year"}))
public class KnowledgeEventPerformanceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private long eventId;

    @Column(name = "event_year", nullable = false)
    private int year;

    @Column(nullable = false)
    private int visitors;

    @Column(nullable = false)
    private long cost;

    @Column(nullable = false)
    private long revenue;

    @Column(name = "net_profit", nullable = false)
    private long netProfit;

    protected KnowledgeEventPerformanceEntity() {}

    public KnowledgeEventPerformanceEntity(long eventId, int year, int visitors, long cost, long revenue,
                                            long netProfit) {
        this.eventId = eventId;
        this.year = year;
        this.visitors = visitors;
        this.cost = cost;
        this.revenue = revenue;
        this.netProfit = netProfit;
    }

    public Long getId() { return id; }
    public long getEventId() { return eventId; }
    public int getYear() { return year; }
    public int getVisitors() { return visitors; }
    public long getCost() { return cost; }
    public long getRevenue() { return revenue; }
    public long getNetProfit() { return netProfit; }
}
