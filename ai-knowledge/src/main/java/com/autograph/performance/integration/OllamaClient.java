package com.autograph.performance.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

/** 로컬 Ollama(Qwen) 호출. 비용 0원, API 키 불필요 — localhost:11434에 떠 있어야 한다. */
@Component
public class OllamaClient {
    private final WebClient webClient;
    private final String model;

    public OllamaClient(@Value("${agent.ollama.base-url}") String baseUrl,
                         @Value("${agent.ollama.model}") String model) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(c -> c.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
        this.model = model;
    }

    public String model() {
        return model;
    }

    /** JSON 스키마를 지정한 프롬프트를 보내고 순수 JSON 문자열을 돌려준다. think 모드는 끈다 —
     *  켜 두면 결과가 response가 아니라 thinking 필드로 들어가 버린다. */
    public String generateJson(String prompt) {
        Map<String, Object> body = Map.of(
                "model", model,
                "prompt", prompt,
                "stream", false,
                "format", "json",
                "think", false
        );
        Map<?, ?> res = webClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(90));
        if (res == null || res.get("response") == null) {
            throw new IllegalStateException("Ollama 응답이 비어 있습니다.");
        }
        return res.get("response").toString();
    }
}
