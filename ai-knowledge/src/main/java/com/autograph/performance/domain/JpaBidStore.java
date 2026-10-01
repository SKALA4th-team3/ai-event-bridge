package com.autograph.performance.domain;

import com.autograph.performance.api.BidResponse;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/** README의 "BidStore의 JPA 구현체를 추가하고 InMemoryBidStore 대신 주입" 연결 지점 구현체. */
@Repository
@Primary
public class JpaBidStore implements BidStore {
    private final KnowledgeBidRepository repository;

    public JpaBidStore(KnowledgeBidRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<BidResponse> findByEventId(long eventId) {
        return repository.findByEventIdOrderByDisplayIdAsc(eventId).stream()
                .map(JpaBidStore::toResponse)
                .toList();
    }

    @Override
    public BidResponse save(long eventId, BidResponse bid) {
        KnowledgeBidEntity entity = new KnowledgeBidEntity(eventId, bid.bidId(), bid.companyName(),
                bid.bidAmount(), bid.expectedRevenue(), bid.otherCost(), bid.expectedProfit(), bid.roi(),
                Instant.now());
        repository.save(entity);
        return bid;
    }

    @Override
    public long nextId(long eventId) {
        return repository.countByEventId(eventId) + 4;
    }

    private static BidResponse toResponse(KnowledgeBidEntity entity) {
        return new BidResponse(entity.getDisplayId(), entity.getCompanyName(), entity.getBidAmount(),
                entity.getExpectedRevenue(), entity.getOtherCost(), entity.getExpectedProfit(), entity.getRoi());
    }
}
