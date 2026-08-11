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
