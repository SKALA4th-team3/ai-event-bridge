package com.lecture.course.controller;

import com.lecture.course.dto.CourseDto;
import com.lecture.course.entity.Course;
import com.lecture.course.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    /**
     * POST /courses - 강의 등록 (강사만)
     * Gateway에서 전달한 X-User-Id 헤더로 강사 ID 추출
     */
    @PostMapping
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> createCourse(
            @Valid @RequestBody CourseDto.CreateRequest request,
            @RequestHeader("X-User-Id") Long instructorId) {

        CourseDto.CourseResponse response = courseService.createCourse(request, instructorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CourseDto.ApiResponse.success(response));
    }

    /**
     * GET /courses - 전체 강의 목록
     */
    @GetMapping
    public ResponseEntity<CourseDto.ApiResponse<List<CourseDto.CourseResponse>>> getAllCourses() {
        return ResponseEntity.ok(
                CourseDto.ApiResponse.success(courseService.getAllCourses())
        );
    }

    /**
     * GET /courses/{courseId} - 공고 상세
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> getCourse(
            @PathVariable("courseId") Long courseId) {
        return ResponseEntity.ok(
                CourseDto.ApiResponse.success(courseService.getCourse(courseId))
        );
    }

    /**
     * GET /courses/category/{category} - 카테고리별 강의
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<CourseDto.ApiResponse<List<CourseDto.CourseResponse>>> getCoursesByCategory(
            @PathVariable Course.Category category) {
        return ResponseEntity.ok(
                CourseDto.ApiResponse.success(courseService.getCoursesByCategory(category))
        );
    }

    /**
     * GET /courses/internal/exists/{courseId} - 공고 존재 여부 (Enrollment Service 호출)
     */
    @GetMapping("/internal/exists/{courseId}")
    public ResponseEntity<Boolean> existsCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.existsCourse(courseId));
    }

    /**
     * GET /courses/internal/{courseId} - 공고 상세 조회 (Enrollment Service 내부 호출용)
     * - 내 수강 목록 응답 조립 시 사용
     * - 래퍼 없이 CourseResponse만 직접 반환
     */
    @GetMapping("/internal/{courseId}")
    public ResponseEntity<CourseDto.CourseResponse> getCourseInternal(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getCourse(courseId));
    }

    /**
     * POST /courses/internal/{courseId}/enrollment-count - 지원 수 증가 (Enrollment Service 호출)
     */
    @PostMapping("/internal/{courseId}/enrollment-count")
    public ResponseEntity<Void> increaseEnrollmentCount(@PathVariable Long courseId) {
        courseService.increaseEnrollmentCount(courseId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /courses/internal/recommend - 추천 서비스용 미수강 강의 조회
     * category: 카테고리, excludeIds: 이미 수강한 강의 ID 목록
     */
    @GetMapping("/internal/recommend")
    public ResponseEntity<List<CourseDto.CourseResponse>> getRecommendCourses(
            @RequestParam Course.Category category,
            @RequestParam(defaultValue = "") List<Long> excludeIds) {
        return ResponseEntity.ok(courseService.getRecommendCourses(category, excludeIds));
    }

    @PatchMapping("/{courseId}")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> updateCourse(
            @PathVariable Long courseId, @Valid @RequestBody CourseDto.CreateRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(CourseDto.ApiResponse.success(courseService.updateCourse(courseId, request, userId)));
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long courseId, @RequestHeader("X-User-Id") Long userId) {
        courseService.deleteCourse(courseId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{courseId}/open")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> openCourse(@PathVariable Long courseId, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(CourseDto.ApiResponse.success(courseService.changeStatus(courseId, userId, Course.Status.PUBLISHED)));
    }

    @PostMapping("/{courseId}/publish")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> publishCourse(@PathVariable Long courseId, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(CourseDto.ApiResponse.success(courseService.changeStatus(courseId, userId, Course.Status.OPEN)));
    }

    @PostMapping("/{courseId}/close")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> closeCourse(@PathVariable Long courseId, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(CourseDto.ApiResponse.success(courseService.changeStatus(courseId, userId, Course.Status.CLOSED)));
    }

    @PostMapping("/{courseId}/complete")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> completeCourse(@PathVariable Long courseId, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(CourseDto.ApiResponse.success(courseService.changeStatus(courseId, userId, Course.Status.COMPLETED)));
    }
}
