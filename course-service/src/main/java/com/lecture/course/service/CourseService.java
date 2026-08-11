package com.lecture.course.service;

import com.lecture.course.dto.CourseDto;
import com.lecture.course.entity.Course;
import com.lecture.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courseRepository;

    /**
     * 강의 등록 (강사만 가능 - SecurityConfig에서 role 검증)
     */
    @Transactional
    public CourseDto.CourseResponse createCourse(CourseDto.CreateRequest request, Long instructorId) {
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .instructorId(instructorId)
                .build();

        return CourseDto.CourseResponse.from(courseRepository.save(course));
    }

    /**
     * 공고 단건 조회
     */
    public CourseDto.CourseResponse getCourse(Long id) {
        Course course = findCourseById(id);
        return CourseDto.CourseResponse.from(course);
    }

    /**
     * 공개 공고 목록 조회
     */
    public List<CourseDto.CourseResponse> getAllCourses() {
        return courseRepository.findByStatusIn(List.of(Course.Status.PUBLISHED, Course.Status.OPEN,
                        Course.Status.CLOSED, Course.Status.AWARDED, Course.Status.COMPLETED,
                        Course.Status.ACTIVE)).stream()
                .map(CourseDto.CourseResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 카테고리별 강의 조회
     */
    public List<CourseDto.CourseResponse> getCoursesByCategory(Course.Category category) {
        return getAllCourses().stream()
                .filter(course -> course.getCategory() == category)
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseDto.CourseResponse updateCourse(Long courseId, CourseDto.CreateRequest request, Long userId) {
        Course course = findOwnedDraft(courseId, userId);
        course.update(request.getTitle(), request.getDescription(), request.getCategory(), request.getPrice());
        return CourseDto.CourseResponse.from(course);
    }

    @Transactional
    public void deleteCourse(Long courseId, Long userId) {
        courseRepository.delete(findOwnedDraft(courseId, userId));
    }

    @Transactional
    public CourseDto.CourseResponse changeStatus(Long courseId, Long userId, Course.Status target) {
        Course course = findCourseById(courseId);
        if (!course.getInstructorId().equals(userId)) throw new IllegalArgumentException("공고를 변경할 권한이 없습니다.");
        Set<Course.Status> allowed = switch (target) {
            case PUBLISHED -> Set.of(Course.Status.DRAFT);
            case OPEN -> Set.of(Course.Status.PUBLISHED);
            case CLOSED -> Set.of(Course.Status.OPEN);
            case COMPLETED -> Set.of(Course.Status.AWARDED);
            default -> Set.of();
        };
        if (!allowed.contains(course.getStatus())) throw new IllegalStateException("현재 상태에서는 요청한 상태로 변경할 수 없습니다.");
        course.changeStatus(target);
        return CourseDto.CourseResponse.from(course);
    }

    /**
     * 강의 존재 여부 확인 (Enrollment Service → Course Service REST 호출용)
     */
    public boolean existsCourse(Long id) {
        return courseRepository.existsById(id);
    }

    /**
     * 수강생 수 증가 (Enrollment Service 수강 활성화 시 호출)
     */
    @Transactional
    public void increaseEnrollmentCount(Long courseId) {
        Course course = findCourseById(courseId);
        course.increaseEnrollmentCount();
    }

    /**
     * 추천 서비스용: 카테고리별 미수강 강의 조회
     * - excludeCourseIds: 이미 수강한 강의 ID 목록
     */
    public List<CourseDto.CourseResponse> getRecommendCourses(
            Course.Category category, List<Long> excludeCourseIds) {

        List<Course> courses = excludeCourseIds.isEmpty()
                ? courseRepository.findByCategoryAndStatus(category, Course.Status.OPEN)
                : courseRepository.findByCategoryAndStatusAndIdNotIn(
                        category, Course.Status.OPEN, excludeCourseIds);

        // 수강생 수 기준 내림차순 정렬
        return courses.stream()
                .sorted((a, b) -> b.getEnrollmentCount() - a.getEnrollmentCount())
                .map(CourseDto.CourseResponse::from)
                .collect(Collectors.toList());
    }

    private Course findCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("강의를 찾을 수 없습니다: " + id));
    }

    private Course findOwnedDraft(Long courseId, Long userId) {
        Course course = findCourseById(courseId);
        if (!course.getInstructorId().equals(userId)) throw new IllegalArgumentException("공고를 변경할 권한이 없습니다.");
        if (course.getStatus() != Course.Status.DRAFT) throw new IllegalStateException("DRAFT 상태의 공고만 변경할 수 있습니다.");
        return course;
    }
}
