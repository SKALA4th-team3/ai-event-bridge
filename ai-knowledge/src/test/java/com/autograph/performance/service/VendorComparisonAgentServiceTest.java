package com.autograph.performance.service;

import com.autograph.performance.api.AgentUnavailableException;
import com.autograph.performance.api.VendorComparisonResponse;
import com.autograph.performance.domain.KnowledgeVendorDocumentRepository;
import com.autograph.performance.integration.CourseInfo;
import com.autograph.performance.integration.CourseServiceClient;
import com.autograph.performance.integration.EnrollmentInfo;
import com.autograph.performance.integration.EnrollmentServiceClient;
import com.autograph.performance.integration.OllamaClient;
import com.autograph.performance.integration.UserInfo;
import com.autograph.performance.integration.UserServiceClient;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class VendorComparisonAgentServiceTest {
    private final CourseServiceClient courseServiceClient = mock(CourseServiceClient.class);
    private final EnrollmentServiceClient enrollmentServiceClient = mock(EnrollmentServiceClient.class);
    private final UserServiceClient userServiceClient = mock(UserServiceClient.class);
    private final KnowledgeVendorDocumentRepository documentRepository = mock(KnowledgeVendorDocumentRepository.class);
    private final OllamaClient ollamaClient = mock(OllamaClient.class);

    private final VendorComparisonAgentService service = new VendorComparisonAgentService(
            courseServiceClient, enrollmentServiceClient, userServiceClient, documentRepository, ollamaClient);

    @Test
    void rejectsEventIdNotLinkedToRealCourse() {
        when(courseServiceClient.findCourse(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.compare(999))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("실제 공고");
    }

    @Test
    void rejectsRealCourseWithNoBidders() {
        when(courseServiceClient.findCourse(1)).thenReturn(Optional.of(
                new CourseInfo(1L, "한강 여름축제 주무대 설치", "desc", "FRONTEND", "OPEN")));
        when(enrollmentServiceClient.findByCourse(1)).thenReturn(List.of());

        assertThatThrownBy(() -> service.compare(1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("지원한 업체가 없습니다");
    }

    @Test
    void wrapsOllamaFailureAsAgentUnavailable() {
        when(courseServiceClient.findCourse(1)).thenReturn(Optional.of(
                new CourseInfo(1L, "한강 여름축제 주무대 설치", "desc", "FRONTEND", "OPEN")));
        when(enrollmentServiceClient.findByCourse(1)).thenReturn(List.of(
                new EnrollmentInfo(1L, 6L, 1L, new BigDecimal("65000000"), "제안서", "SUBMITTED")));
        when(userServiceClient.findUser(6L)).thenReturn(Optional.of(new UserInfo(6L, "a@b.com", "한빛무대", "STUDENT")));
        when(documentRepository.findByCompanyName("한빛무대")).thenReturn(List.of());
        when(ollamaClient.generateJson(anyString())).thenThrow(new RuntimeException("connection refused"));

        assertThatThrownBy(() -> service.compare(1))
                .isInstanceOf(AgentUnavailableException.class);
    }

    @Test
    void parsesOllamaResponseAndStripsBracketsFromCompanyNames() {
        when(courseServiceClient.findCourse(1)).thenReturn(Optional.of(
                new CourseInfo(1L, "한강 여름축제 주무대 설치", "desc", "FRONTEND", "OPEN")));
        when(enrollmentServiceClient.findByCourse(1)).thenReturn(List.of(
                new EnrollmentInfo(1L, 6L, 1L, new BigDecimal("65000000"), "제안서", "SUBMITTED")));
        when(userServiceClient.findUser(6L)).thenReturn(Optional.of(new UserInfo(6L, "a@b.com", "한빛무대", "STUDENT")));
        when(documentRepository.findByCompanyName("한빛무대")).thenReturn(List.of());
        when(ollamaClient.generateJson(anyString())).thenReturn(
                "{\"recommendedCompany\": \"[한빛무대]\", \"reasoning\": \"유일한 지원 업체\", " +
                "\"scores\": [{\"companyName\": \"[한빛무대]\", \"score\": 90, \"comment\": \"양호\"}]}");
        when(ollamaClient.model()).thenReturn("qwen3.5:4b");

        VendorComparisonResponse result = service.compare(1);

        assertThat(result.recommendedCompany()).isEqualTo("한빛무대");
        assertThat(result.linkedToRealCourse()).isTrue();
        assertThat(result.scores()).hasSize(1);
        assertThat(result.scores().get(0).companyName()).isEqualTo("한빛무대");
        assertThat(result.scores().get(0).score()).isEqualTo(90);
    }
}
