package com.autograph.performance.domain;

import com.autograph.performance.api.BidResponse;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class InMemoryBidStore implements BidStore {
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<BidResponse>> bids = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, AtomicLong> sequences = new ConcurrentHashMap<>();

    @Override
    public List<BidResponse> findByEventId(long eventId) {
        return List.copyOf(bids.getOrDefault(eventId, new CopyOnWriteArrayList<>()));
    }

    @Override
    public BidResponse save(long eventId, BidResponse bid) {
        bids.computeIfAbsent(eventId, ignored -> new CopyOnWriteArrayList<>()).add(bid);
        return bid;
    }

    @Override
    public long nextId(long eventId) {
        return sequences.computeIfAbsent(eventId, ignored -> new AtomicLong(3)).incrementAndGet();
    }
}
