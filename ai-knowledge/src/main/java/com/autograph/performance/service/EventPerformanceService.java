package com.autograph.performance.service;

import com.autograph.performance.api.BidRequest;
import com.autograph.performance.api.BidResponse;
import com.autograph.performance.api.EventPerformanceResponse;
import com.autograph.performance.api.RealBid;
import com.autograph.performance.domain.BidStore;
import com.autograph.performance.integration.CourseInfo;
import com.autograph.performance.integration.CourseServiceClient;
import com.autograph.performance.integration.EnrollmentInfo;
import com.autograph.performance.integration.EnrollmentServiceClient;
import com.autograph.performance.integration.UserServiceClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EventPerformanceService {
    private final SeededDemoDataGenerator generator;
    private final BidStore bidStore;
    private final CourseServiceClient courseServiceClient;
    private final EnrollmentServiceClient enrollmentServiceClient;
    private final UserServiceClient userServiceClient;

    public EventPerformanceService(SeededDemoDataGenerator generator, BidStore bidStore,
                                    CourseServiceClient courseServiceClient,
                                    EnrollmentServiceClient enrollmentServiceClient,
                                    UserServiceClient userServiceClient) {
        this.generator = generator;
        this.bidStore = bidStore;
        this.courseServiceClient = courseServiceClient;
        this.enrollmentServiceClient = enrollmentServiceClient;
        this.userServiceClient = userServiceClient;
    }

    public EventPerformanceResponse getPerformance(long eventId) {
        validateEventId(eventId);
        SeededDemoDataGenerator.PerformanceData performance = generator.performance(eventId);
        List<BidResponse> bids = new ArrayList<>(generator.initialBids(eventId));
        bids.addAll(bidStore.findByEventId(eventId));

        /* README 연결 지점: eventId가 course-service의 실제 공고와 같은 id면
           공고명과 실제 지원 현황(enrollment-service)을 가져온다. 없으면 기존 데모 그대로. */
        Optional<CourseInfo> course = courseServiceClient.findCourse(eventId);
        String eventName = course.map(CourseInfo::title).orElse("지역축제 #" + eventId);
        List<RealBid> realBids = course.isPresent() ? realBidsFor(eventId) : List.of();

        return new EventPerformanceResponse(eventId, eventName, performance.history(),
                performance.visitorRegression(), performance.costRegression(), performance.netProfitRegression(),
                List.copyOf(bids), course.isPresent(), realBids);
    }

    private List<RealBid> realBidsFor(long courseId) {
        List<EnrollmentInfo> enrollments = enrollmentServiceClient.findByCourse(courseId);
        List<RealBid> result = new ArrayList<>();
        for (EnrollmentInfo enrollment : enrollments) {
            String companyName = userServiceClient.findUser(enrollment.userId())
                    .map(user -> user.name())
                    .orElse("업체 #" + enrollment.userId());
            result.add(new RealBid(companyName, enrollment.bidAmount(), enrollment.proposal(), enrollment.status()));
        }
        return List.copyOf(result);
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
