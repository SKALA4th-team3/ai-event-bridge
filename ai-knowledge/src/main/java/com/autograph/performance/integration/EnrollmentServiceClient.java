package com.autograph.performance.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

@Component
public class EnrollmentServiceClient {
    private static final Logger log = LoggerFactory.getLogger(EnrollmentServiceClient.class);

    private final WebClient webClient;

    public EnrollmentServiceClient(@Value("${services.enrollment-service.base-url}") String baseUrl) {
        this.webClient = WebClient.create(baseUrl);
    }

    /** 공고(courseId)에 들어온 실제 입찰 목록. 서비스가 없거나 비어 있으면 빈 리스트. */
    public List<EnrollmentInfo> findByCourse(long courseId) {
        try {
            Envelope<List<EnrollmentInfo>> envelope = webClient.get()
                    .uri("/api/enrollments/courses/{courseId}", courseId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Envelope<List<EnrollmentInfo>>>() {})
                    .block(Duration.ofSeconds(2));
            if (envelope != null && envelope.success() && envelope.data() != null) {
                return envelope.data();
            }
            return List.of();
        } catch (Exception e) {
            log.debug("enrollment-service 조회 실패 (courseId={}): {}", courseId, e.toString());
            return List.of();
        }
    }
}
