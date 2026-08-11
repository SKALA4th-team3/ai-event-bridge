// API 전환 전까지 사용하는 원본 Demo count입니다. 비율은 knowledgeViewModel에서 계산합니다.
export const knowledgeDemoData = Object.freeze({
  asOf: '2026.08.11 09:34',
  totals: { events: 2451, bids: 8320, companies: 1205, searchLogs: 14286 },
  counts: {
    performanceLinkedEvents: 1840,
    eventRegion: 2402, eventType: 2451, eventBudget: 2304, eventVisitors: 1840,
    eventActualCost: 1789, eventActualRevenue: 1764,
    bidPrice: 8237, bidAwardResult: 7987, bidContractAmount: 7322, bidCompany: 8070,
    companyExpertise: 1109, companyRegion: 1193, companyHistory: 988, companyPerformance: 819,
    searchRegion: 10286, searchPrice: 9143, searchSector: 11572, searchEventType: 8286,
  },
  searches: [
    { id: 1, raw: '광주 2천만원 현수막 1000개 설치', conditions: { 지역: '광주', 예산: '20,000,000원', 용역: '현수막 설치', 수량: '1,000개' } },
  ],
  vendorKnowledgeSummary: {
    registeredCompanies: 1205,
    performanceRecords: 8320,
    linkedEvents: 1846,
    linkedResults: 7612,
    linkedEvaluations: 7945,
  },
  vendorKnowledgeList: [
    {
      id: 1, companyName: '한빛이벤트', totalEvents: 12, similarEvents: 7,
      averageContractAmount: 390000000, averageActualCost: 352000000, averageVisitors: 60400,
      averageRevenue: 518000000, averageRoi: 34.8, averageScore: 89.1, excellentRate: 75,
      events: [
        { name: '2025 광주 문화축제', contractAmount: 420000000, visitors: 61200, roi: 34.1, score: 89, grade: '우수' },
        { name: '2024 지역예술축제', contractAmount: 360000000, visitors: 54800, roi: 28.7, score: 85, grade: '우수' },
      ],
      averageEvaluationCriteria: [
        { label: '수행 품질', score: 17.8, maxScore: 20 }, { label: '예산 집행 효율', score: 16.9, maxScore: 20 },
        { label: '일정 준수', score: 17.6, maxScore: 20 }, { label: '안전 관리', score: 18.4, maxScore: 20 },
        { label: '현장 대응', score: 16.7, maxScore: 20 }, { label: '만족도', score: 17.1, maxScore: 20 },
      ],
    },
    {
      id: 2, companyName: '드림축제기획', totalEvents: 10, similarEvents: 6,
      averageContractAmount: 365000000, averageActualCost: 331000000, averageVisitors: 57200,
      averageRevenue: 476000000, averageRoi: 30.4, averageScore: 87.3, excellentRate: 70,
      events: [{ name: '2025 남부권 시민축제', contractAmount: 380000000, visitors: 58900, roi: 31.2, score: 88, grade: '우수' }],
      averageEvaluationCriteria: [{ label: '수행 품질', score: 17.2, maxScore: 20 }, { label: '예산 집행 효율', score: 17.5, maxScore: 20 }, { label: '일정 준수', score: 17.3, maxScore: 20 }, { label: '안전 관리', score: 17.6, maxScore: 20 }, { label: '현장 대응', score: 16.4, maxScore: 20 }, { label: '만족도', score: 16.8, maxScore: 20 }],
    },
    {
      id: 3, companyName: '지역문화컴퍼니', totalEvents: 15, similarEvents: 9,
      averageContractAmount: 410000000, averageActualCost: 369000000, averageVisitors: 63100,
      averageRevenue: 552000000, averageRoi: 34.6, averageScore: 90.2, excellentRate: 80,
      events: [{ name: '2025 동부권 지역문화제', contractAmount: 430000000, visitors: 65200, roi: 35.5, score: 91, grade: '우수' }],
      averageEvaluationCriteria: [{ label: '수행 품질', score: 18.3, maxScore: 20 }, { label: '예산 집행 효율', score: 17.8, maxScore: 20 }, { label: '일정 준수', score: 18.1, maxScore: 20 }, { label: '안전 관리', score: 18.7, maxScore: 20 }, { label: '현장 대응', score: 17.2, maxScore: 20 }, { label: '만족도', score: 17.9, maxScore: 20 }],
    },
    {
      id: 4, companyName: '미래문화기획', totalEvents: 8, similarEvents: 4,
      averageContractAmount: 312000000, averageActualCost: 287000000, averageVisitors: 48900,
      averageRevenue: 401000000, averageRoi: 28.5, averageScore: 84.8, excellentRate: 63,
      events: [{ name: '2024 미래도시 문화행사', contractAmount: 320000000, visitors: 50100, roi: 29.1, score: 85, grade: '양호' }],
      averageEvaluationCriteria: [{ label: '수행 품질', score: 16.8, maxScore: 20 }, { label: '예산 집행 효율', score: 16.2, maxScore: 20 }, { label: '일정 준수', score: 16.9, maxScore: 20 }, { label: '안전 관리', score: 17.5, maxScore: 20 }, { label: '현장 대응', score: 15.9, maxScore: 20 }, { label: '만족도', score: 16.4, maxScore: 20 }],
    },
    {
      id: 5, companyName: '동행이벤트', totalEvents: 9, similarEvents: 5,
      averageContractAmount: 338000000, averageActualCost: 305000000, averageVisitors: 52600,
      averageRevenue: 438000000, averageRoi: 29.6, averageScore: 86.1, excellentRate: 67,
      events: [{ name: '2025 동행 지역축제', contractAmount: 350000000, visitors: 54100, roi: 30.2, score: 87, grade: '우수' }],
      averageEvaluationCriteria: [{ label: '수행 품질', score: 17.4, maxScore: 20 }, { label: '예산 집행 효율', score: 16.8, maxScore: 20 }, { label: '일정 준수', score: 17.1, maxScore: 20 }, { label: '안전 관리', score: 17.8, maxScore: 20 }, { label: '현장 대응', score: 16.1, maxScore: 20 }, { label: '만족도', score: 16.9, maxScore: 20 }],
    },
  ],
})
