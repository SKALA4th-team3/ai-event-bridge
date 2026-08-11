package com.lecture.enrollment.controller;

import com.lecture.enrollment.dto.EnrollmentDto;
import com.lecture.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 공고 ID를 받는 지원 생성 API.
 */
@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class CourseEnrollmentController {
    private final EnrollmentService enrollmentService;

    @PostMapping("/courses/{courseId}")
    public ResponseEntity<EnrollmentDto.ApiResponse<EnrollmentDto.EnrollmentResponse>> apply(
            @PathVariable Long courseId,
            @Valid @RequestBody EnrollmentDto.ApplyRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(EnrollmentDto.ApiResponse.success(
                enrollmentService.apply(userId, courseId, request.getBidAmount(), request.getProposal())));
    }
}
