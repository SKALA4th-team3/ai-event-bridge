package com.lecture.enrollment.controller;

import com.lecture.enrollment.dto.EnrollmentDto;
import com.lecture.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * POST /enrollments - 수강신청
     * Gateway에서 X-User-Id 헤더로 사용자 ID 전달
     */
    @PostMapping
    public ResponseEntity<EnrollmentDto.ApiResponse<EnrollmentDto.EnrollmentResponse>> enroll(
            @Valid @RequestBody EnrollmentDto.EnrollRequest request,
            @RequestHeader("X-User-Id") Long userId) {

        EnrollmentDto.EnrollmentResponse response =
                enrollmentService.apply(userId, request.getCourseId(), request.getBidAmount(), request.getProposal());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(EnrollmentDto.ApiResponse.success(response));
    }

    /**
     * GET /enrollments/my - 내 수강 목록 조회
     * Gateway가 전달한 X-User-Id 헤더를 사용
     */
    @GetMapping("/my")
    public ResponseEntity<EnrollmentDto.ApiResponse<List<EnrollmentDto.EnrollmentResponse>>> getMyEnrollments(
            @RequestHeader("X-User-Id") Long userId) {

        List<EnrollmentDto.EnrollmentResponse> response =
                enrollmentService.getEnrollmentsByUser(userId);
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(response));
    }

    /**
     * GET /enrollments/user/{userId} - 특정 사용자 수강 목록 조회
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<EnrollmentDto.ApiResponse<List<EnrollmentDto.EnrollmentResponse>>> getEnrollments(
            @PathVariable Long userId) {

        List<EnrollmentDto.EnrollmentResponse> response =
                enrollmentService.getEnrollmentsByUser(userId);
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(response));
    }

    @GetMapping("/courses/{courseId}")
    public ResponseEntity<EnrollmentDto.ApiResponse<List<EnrollmentDto.EnrollmentResponse>>> getCourseEnrollments(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(enrollmentService.getEnrollmentsByCourse(courseId)));
    }

    @GetMapping("/{enrollmentId}")
    public ResponseEntity<EnrollmentDto.ApiResponse<EnrollmentDto.EnrollmentResponse>> getEnrollment(
            @PathVariable Long enrollmentId, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(enrollmentService.getEnrollment(enrollmentId, userId)));
    }

    @PostMapping("/{enrollmentId}/award")
    public ResponseEntity<EnrollmentDto.ApiResponse<EnrollmentDto.EnrollmentResponse>> awardEnrollment(
            @PathVariable Long enrollmentId, @RequestHeader("X-User-Id") Long instructorId) {
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(
                enrollmentService.awardEnrollment(enrollmentId, instructorId)));
    }

    @PostMapping("/{enrollmentId}/unaward")
    public ResponseEntity<EnrollmentDto.ApiResponse<EnrollmentDto.EnrollmentResponse>> unawardEnrollment(
            @PathVariable Long enrollmentId, @RequestHeader("X-User-Id") Long instructorId) {
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(
                enrollmentService.unawardEnrollment(enrollmentId, instructorId)));
    }

    @PatchMapping("/{enrollmentId}")
    public ResponseEntity<EnrollmentDto.ApiResponse<EnrollmentDto.EnrollmentResponse>> updateEnrollment(
            @PathVariable Long enrollmentId, @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody EnrollmentDto.UpdateRequest request) {
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(enrollmentService.updateEnrollment(enrollmentId, userId, request)));
    }

    @DeleteMapping("/{enrollmentId}")
    public ResponseEntity<Void> withdrawEnrollment(
            @PathVariable Long enrollmentId, @RequestHeader("X-User-Id") Long userId) {
        enrollmentService.withdrawEnrollment(enrollmentId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /enrollments/internal/history/{userId} - 수강 이력 조회 (Recommend Service용)
     */
    @GetMapping("/internal/history/{userId}")
    public ResponseEntity<EnrollmentDto.EnrollmentHistoryResponse> getEnrollmentHistory(
            @PathVariable Long userId) {

        return ResponseEntity.ok(enrollmentService.getEnrollmentHistory(userId));
    }
}
