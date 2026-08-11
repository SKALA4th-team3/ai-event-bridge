package com.autograph.performance.service;

import com.autograph.performance.api.BidRequest;
import com.autograph.performance.api.BidResponse;
import com.autograph.performance.api.EventPerformanceResponse;
import com.autograph.performance.domain.BidStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EventPerformanceService {
    private final SeededDemoDataGenerator generator;
    private final BidStore bidStore;

    public EventPerformanceService(SeededDemoDataGenerator generator, BidStore bidStore) {
        this.generator = generator;
        this.bidStore = bidStore;
    }

    public EventPerformanceResponse getPerformance(long eventId) {
        validateEventId(eventId);
        SeededDemoDataGenerator.PerformanceData performance = generator.performance(eventId);
        List<BidResponse> bids = new ArrayList<>(generator.initialBids(eventId));
        bids.addAll(bidStore.findByEventId(eventId));
        return new EventPerformanceResponse(eventId, "지역축제 #" + eventId, performance.history(),
                performance.visitorRegression(), performance.costRegression(), performance.netProfitRegression(),
                List.copyOf(bids));
    }

    public BidResponse createBid(long eventId, BidRequest request) {
        validateEventId(eventId);
        long profit = request.expectedRevenue() - request.bidAmount() - request.otherCost();
        BidResponse bid = new BidResponse(bidStore.nextId(eventId), request.companyName().trim(),
                request.bidAmount(), request.expectedRevenue(), request.otherCost(),
                profit, SeededDemoDataGenerator.roi(profit, request.bidAmount()));
        return bidStore.save(eventId, bid);
    }

    private void validateEventId(long eventId) {
        if (eventId <= 0) throw new IllegalArgumentException("eventId는 1 이상이어야 합니다.");
    }
}
