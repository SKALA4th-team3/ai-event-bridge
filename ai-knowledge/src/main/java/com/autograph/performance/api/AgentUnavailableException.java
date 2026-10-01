package com.autograph.performance.api;

/** 로컬 Ollama(Qwen)가 꺼져 있거나 응답을 파싱하지 못했을 때. */
public class AgentUnavailableException extends RuntimeException {
    public AgentUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
