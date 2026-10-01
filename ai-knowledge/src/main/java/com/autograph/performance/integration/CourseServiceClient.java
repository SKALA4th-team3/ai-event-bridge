package com.autograph.performance.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Optional;

/** course-service(공고)를 조회한다. 떠 있지 않거나 courseId가 없으면 빈 Optional을 돌려줘 데모 폴백이 이어지게 한다. */
@Component
public class CourseServiceClient {
    private static final Logger log = LoggerFactory.getLogger(CourseServiceClient.class);

    private final WebClient webClient;

    public CourseServiceClient(@Value("${services.course-service.base-url}") String baseUrl) {
        this.webClient = WebClient.create(baseUrl);
    }

    public Optional<CourseInfo> findCourse(long courseId) {
        try {
            Envelope<CourseInfo> envelope = webClient.get()
                    .uri("/api/courses/{id}", courseId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Envelope<CourseInfo>>() {})
                    .block(Duration.ofSeconds(2));
            if (envelope != null && envelope.success() && envelope.data() != null) {
                return Optional.of(envelope.data());
            }
            return Optional.empty();
        } catch (Exception e) {
            log.debug("course-service 조회 실패 (courseId={}): {}", courseId, e.toString());
            return Optional.empty();
        }
    }
}
