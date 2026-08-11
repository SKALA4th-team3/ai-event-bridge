import api from './index.js'
import { toPosting } from './posting.js'
import { codeToLabel } from '@/constants/categories.js'

export const recommendApi = {
  /** 응답의 basedOnCategory·message가 '추천 근거' 표시의 재료입니다 */
  async forUser(userId) {
    const { data } = await api.get(`/api/recommend/${userId}`)
    return {
      postings: (data.recommendedCourses ?? []).map(toPosting),
      basis: data.basedOnCategory ? codeToLabel(data.basedOnCategory) : null,
      message: data.message ?? ''
    }
  }
}
