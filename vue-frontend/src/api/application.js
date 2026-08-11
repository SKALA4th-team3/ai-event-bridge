import api from './index.js'
import { toPosting } from './posting.js'

const unwrap = (res) => res.data?.data ?? res.data

/** enrollment(백엔드) → application(우리 도메인) */
export function toApplication(e) {
  return {
    id: e.id,
    postingId: e.courseId,
    userId: e.userId,
    status: e.status,                       // PENDING | ACTIVE | CANCELLED
    appliedAt: e.createdAt,
    bidAmount: e.bidAmount ?? null,
    proposal: e.proposal ?? null,
    posting: e.course ? toPosting({ ...e.course, price: e.course.price }) : null
  }
}

export const applicationApi = {
  async mine() {
    return (unwrap(await api.get('/api/enrollments/my')) ?? []).map(toApplication)
  },
  async byUser(userId) {
    return (unwrap(await api.get(`/api/enrollments/user/${userId}`)) ?? []).map(toApplication)
  },
  async byCourse(courseId) {
    return (unwrap(await api.get(`/api/enrollments/courses/${courseId}`)) ?? []).map(toApplication)
  },
  /** 지원 생성은 Enrollment Service 경로로 요청한다. */
  async apply(courseId, { bidAmount, proposal } = {}) {
    return toApplication(unwrap(await api.post(`/api/enrollments/courses/${courseId}`, {
      bidAmount,
      proposal
    })))
  }
}
