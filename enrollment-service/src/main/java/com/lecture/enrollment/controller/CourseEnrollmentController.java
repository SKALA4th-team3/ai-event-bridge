package com.lecture.enrollment.controller;

import com.lecture.enrollment.dto.EnrollmentDto;
import com.lecture.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Course(공고) 하위의 지원 생성 API.
 * URL 변수에는 courseId를 명시해 어떤 리소스의 ID인지 모호하지 않게 한다.
 */
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseEnrollmentController {
    private final EnrollmentService enrollmentService;

    @PostMapping("/{courseId}/enrollments")
    public ResponseEntity<EnrollmentDto.ApiResponse<EnrollmentDto.EnrollmentResponse>> apply(
            @PathVariable Long courseId,
            @Valid @RequestBody EnrollmentDto.ApplyRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(EnrollmentDto.ApiResponse.success(
                enrollmentService.apply(userId, courseId, request.getBidAmount(), request.getProposal())));
    }
}
