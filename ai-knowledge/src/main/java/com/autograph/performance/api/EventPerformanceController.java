package com.autograph.performance.api;

import com.autograph.performance.service.EventPerformanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}")
public class EventPerformanceController {
    private final EventPerformanceService service;

    public EventPerformanceController(EventPerformanceService service) {
        this.service = service;
    }

    @GetMapping("/performance")
    public EventPerformanceResponse getPerformance(@PathVariable long eventId) {
        return service.getPerformance(eventId);
    }

    @PostMapping("/bids")
    @ResponseStatus(HttpStatus.CREATED)
    public BidResponse createBid(@PathVariable long eventId, @Valid @RequestBody BidRequest request) {
        return service.createBid(eventId, request);
    }
}
