package com.autograph.performance.api;

import com.autograph.performance.service.EventPerformanceService;
import com.autograph.performance.service.VendorComparisonAgentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}")
public class EventPerformanceController {
    private final EventPerformanceService service;
    private final VendorComparisonAgentService agentService;

    public EventPerformanceController(EventPerformanceService service, VendorComparisonAgentService agentService) {
        this.service = service;
        this.agentService = agentService;
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

    /** 실제 공고에 실제로 지원한 업체들을 로컬 LLM(Qwen)이 비교·추천한다. 데모 eventId에는 404 대신 409를 준다. */
    @GetMapping("/vendor-comparison")
    public VendorComparisonResponse compareVendors(@PathVariable long eventId) {
        return agentService.compare(eventId);
    }

    /** 이 공고에 대해 과거에 호출했던 AI 업체 비교 결과들(최신순). */
    @GetMapping("/vendor-comparison/history")
    public List<VendorComparisonHistoryItem> vendorComparisonHistory(@PathVariable long eventId) {
        return agentService.history(eventId);
    }
}
