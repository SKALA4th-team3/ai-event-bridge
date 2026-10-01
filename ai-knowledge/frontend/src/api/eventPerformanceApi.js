const readJson = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || '요청을 처리하지 못했습니다.')
  return data
}

export const getEventPerformance = (eventId) =>
  fetch(`/api/events/${encodeURIComponent(eventId)}/performance`).then(readJson)

export const createBid = (eventId, bid) =>
  fetch(`/api/events/${encodeURIComponent(eventId)}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bid),
  }).then(readJson)

/** 실제 공고(course-service)에 연결된 eventId에서만 동작한다. 로컬 Qwen(Ollama)이
 *  실제 입찰·과거 수행 평가 문서를 근거로 업체를 비교·추천한다. */
export const compareVendors = (eventId) =>
  fetch(`/api/events/${encodeURIComponent(eventId)}/vendor-comparison`).then(readJson)

/** 이 공고에 대해 과거에 호출했던 AI 업체 비교 결과들(최신순). 호출할 때마다 휘발되지 않도록 서버가 DB에 남긴 로그. */
export const getVendorComparisonHistory = (eventId) =>
  fetch(`/api/events/${encodeURIComponent(eventId)}/vendor-comparison/history`).then(readJson)
