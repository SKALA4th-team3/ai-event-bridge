package com.lecture.enrollment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "enrollments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"}))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(precision = 15, scale = 2)
    private BigDecimal bidAmount;

    @Column(columnDefinition = "TEXT")
    private String proposal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.SUBMITTED;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum Status {
        SUBMITTED, UNDER_REVIEW, AWARDED, NOT_AWARDED, WITHDRAWN,
        /* 이전 결제 기반 흐름과의 데이터 호환용 */
        PENDING, ACTIVE, CANCELLED
    }

    public void activate() {
        this.status = Status.ACTIVE;
    }

    public void cancel() {
        this.status = Status.WITHDRAWN;
    }

    public void award() {
        this.status = Status.AWARDED;
    }

    public void returnToReview() {
        this.status = Status.UNDER_REVIEW;
    }

    public void update(BigDecimal bidAmount, String proposal) {
        this.bidAmount = bidAmount;
        this.proposal = proposal;
    }
}
