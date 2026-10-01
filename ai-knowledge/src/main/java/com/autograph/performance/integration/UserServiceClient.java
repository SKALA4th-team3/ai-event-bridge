package com.autograph.performance.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Optional;

@Component
public class UserServiceClient {
    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    private final WebClient webClient;

    public UserServiceClient(@Value("${services.user-service.base-url}") String baseUrl) {
        this.webClient = WebClient.create(baseUrl);
    }

    public Optional<UserInfo> findUser(long userId) {
        try {
            Envelope<UserInfo> envelope = webClient.get()
                    .uri("/api/users/{id}", userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Envelope<UserInfo>>() {})
                    .block(Duration.ofSeconds(2));
            if (envelope != null && envelope.success() && envelope.data() != null) {
                return Optional.of(envelope.data());
            }
            return Optional.empty();
        } catch (Exception e) {
            log.debug("user-service 조회 실패 (userId={}): {}", userId, e.toString());
            return Optional.empty();
        }
    }
}
