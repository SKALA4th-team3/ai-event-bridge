package com.autograph.performance.domain;

import com.autograph.performance.api.BidResponse;
import java.util.List;

/** Replace this port with a JPA-backed implementation when the real bid DB is connected. */
public interface BidStore {
    List<BidResponse> findByEventId(long eventId);
    BidResponse save(long eventId, BidResponse bid);
    long nextId(long eventId);
}
