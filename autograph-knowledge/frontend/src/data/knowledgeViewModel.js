import { knowledgeDemoData as source } from './knowledgeDemoData.js'

const pct = (count, total) => Math.round((count / total) * 100)
const metric = (label, count, total, unit, description = '') => ({ label, count, total, unit, percentage: pct(count, total), description })
const t = source.totals
const c = source.counts

export const knowledgeDashboard = Object.freeze({
  asOf: source.asOf,
  summary: [
    { id: 'events', label: '행사 데이터', value: t.events, unit: '건', description: '지역, 예산, 행사 유형' },
    { id: 'bids', label: '입찰 데이터', value: t.bids, unit: '건', description: '업체, 제안금액, 낙찰 결과' },
    { id: 'companies', label: '등록 업체', value: t.companies, unit: '개', description: '전문분야, 지역, 수행이력' },
    { ...metric('', c.performanceLinkedEvents, t.events, '행사'), id: 'results', label: '행사 결과 데이터 확보', description: '행사 종료 후 방문객, 비용, 매출, 순이익 등 실제 결과가 확보된 행사 비율' },
    { id: 'searches', label: 'LLM 검색 로그', value: t.searchLogs, unit: '건', description: '현재 자연어 검색 기능에서 발생한 사용자 검색 요청 기록' },
  ],
  collection: [
    { title: '행사 데이터', description: '정부가 등록한 행사 공고와 행사 기본정보', fields: [
      metric('지역', c.eventRegion, t.events, '행사'), metric('행사 유형', c.eventType, t.events, '행사'),
      metric('예산', c.eventBudget, t.events, '행사'), metric('실제 방문객', c.eventVisitors, t.events, '행사', '전체 행사 중 행사 종료 후 실제 방문객 수가 확보된 행사'),
    ] },
    { title: '입찰 데이터', description: '각 행사에 업체가 제출한 입찰 및 계약 관련 정보', fields: [
      metric('제안금액', c.bidPrice, t.bids, '입찰'), metric('낙찰 결과', c.bidAwardResult, t.bids, '입찰'),
      metric('계약금액', c.bidContractAmount, t.bids, '입찰', '전체 입찰 중 최종 계약금액이 기록된 입찰'), metric('업체 연결', c.bidCompany, t.bids, '입찰', '입찰 기록이 플랫폼에 등록된 실제 업체 정보와 연결된 상태'),
    ] },
    { title: '업체 데이터', description: '플랫폼에 등록된 업체의 기본정보와 과거 수행정보', fields: [
      metric('전문분야', c.companyExpertise, t.companies, '업체'), metric('지역', c.companyRegion, t.companies, '업체'),
      metric('수행이력', c.companyHistory, t.companies, '업체', '등록 업체의 과거 행사 수행 기록'), metric('성과 연결', c.companyPerformance, t.companies, '업체', '업체가 수행한 행사와 해당 행사의 실제 결과 데이터가 연결된 상태'),
    ] },
  ],
  aiUse: {
    search: {
      name: 'LLM 자연어 입찰공고 검색', status: '현재 사용 중',
      description: '업체가 자연어로 입력한 지역, 예산, 용역과 수량 등의 조건을 LLM이 구조화하고, 조건에 맞는 정부 행사 입찰공고를 조회합니다.',
      total: t.searchLogs,
      flow: ['업체 자연어 검색', 'LLM 조건 구조화', '정부 입찰공고 조회', '행사 / 입찰공고 카드 표시'],
      metrics: [
        metric('지역 조건', c.searchRegion, t.searchLogs, '검색', '지역 표현을 LLM이 지역 값으로 구조화한 요청'),
        metric('예산 조건', c.searchPrice, t.searchLogs, '검색', '금액 표현을 예산 또는 최대금액 조건으로 구조화한 요청'),
        metric('용역 조건', c.searchSector, t.searchLogs, '검색', '작업 또는 서비스 표현을 용역 조건으로 구조화한 요청'),
        metric('행사 유형', c.searchEventType, t.searchLogs, '검색', '축제, 공연 등의 표현을 행사 유형으로 구조화한 요청'),
      ],
      example: source.searches[0],
      uses: ['사용자가 어떤 조건으로 검색하는지 확인', 'LLM이 추출한 검색 조건 확인', '자연어 검색 기능의 사용 현황 분석'],
    },
    prediction: {
      name: 'AI 예측', status: '현재 사용 중',
      description: '축적된 과거 행사 데이터를 기반으로 현재 행사 화면에서 방문객, 비용과 수익 등의 예상값을 제공합니다.',
      items: [
        { label: '방문객 수 예측', description: '과거 행사 방문객 데이터로 향후 방문객 수준을 예상' },
        { label: '비용 예측', description: '과거 행사 실제 비용으로 향후 행사 비용 수준을 예상' },
        { label: '수익 예측', description: '과거 행사 실제 매출 데이터로 향후 수익 수준을 예상' },
        { label: '예상 입찰금액', description: '과거 유사 행사 입찰 데이터로 이번 행사에서 업체가 제안할 것으로 예상되는 가격 수준' },
        { label: '입찰 참고가격', description: '과거 유사 행사의 제안금액과 최종 계약금액을 비교해 담당자가 검토할 때 참고할 가격 범위' },
      ],
      knowledge: [
        { label: '행사 데이터', value: t.events, unit: '건' },
        metric('행사 결과', c.performanceLinkedEvents, t.events, '행사'), metric('실제 방문객', c.eventVisitors, t.events, '행사'),
        metric('실제 비용', c.eventActualCost, t.events, '행사'), metric('실제 매출', c.eventActualRevenue, t.events, '행사'),
        metric('입찰 제안금액', c.bidPrice, t.bids, '입찰'), metric('계약금액', c.bidContractAmount, t.bids, '입찰'),
      ],
      currentMethod: '과거 데이터 추세 기반 예상',
      futureMethod: '구조화된 지역, 행사 유형, 예산, 날씨, 비용과 매출 등 여러 변수를 활용하는 ML 기반 예측으로 확장 가능',
      dataLinks: [
        { source: '정부 행사 결과 데이터', fields: '방문객, 비용, 매출, 순이익', use: '방문객, 비용, 매출과 순이익 예측' },
        { source: '행사 + 입찰 데이터', fields: '행사 유형, 지역, 예산, 제안금액, 계약금액', use: '예상 입찰금액과 입찰 참고가격 분석' },
      ],
    },
    futureGuide: {
      title: '향후 AX 데이터 활용 방식',
      description: '정부 결과보고서를 예측할 때마다 LLM에 전달하지 않고 방문객, 비용, 매출과 순이익 등 필요한 값을 구조화해 Knowledge로 축적합니다. 축적된 수치는 회귀 및 ML 모델의 예측 데이터로 재사용합니다.',
      flow: ['정부 결과보고서','데이터 구조화','Knowledge 축적','ML 예측','필요 시 LLM 설명'],
      llmRole: '비정형 보고서 데이터 추출, 자연어 이해, 필요 시 예측 결과 설명',
      mlRole: '방문객, 비용, 매출과 수익, 입찰금액 수치 예측',
      benefit: '반복적인 LLM 호출을 줄여 API 비용과 처리 시간을 절감하고, 동일한 데이터를 여러 예측과 분석에 재사용합니다.',
    },
    future: [
      {
        id: 'company-analysis', name: '업체 수행 Knowledge',
        description: '플랫폼에 참여한 업체들의 과거 행사 수행이력과 계약·성과·평가 데이터를 연결하여 축적합니다. 업체를 선택하면 상세 수행 Knowledge를 확인할 수 있습니다.',
        platformSummary: source.vendorKnowledgeSummary,
        vendors: source.vendorKnowledgeList,
        metrics: [],
        totals: [{ label: '등록 업체', value: t.companies, unit: '개' }, { label: '입찰 이력', value: t.bids, unit: '건' }],
        flow: ['업체', '과거 수행한 여러 행사', '각 행사 결과보고서 연결', '수행이력과 실제 성과 종합'],
        summaryTitle: '업체 수행이력 요약',
        summaryFields: ['과거 수행 행사','유사 행사','결과 데이터 연결','평균 계약금액','평균 실제 방문객','평균 실제 비용','평균 실제 매출'],
        summary: '업체의 과거 수행 행사와 결과 데이터를 종합해 유사 행사 수행경험, 계약금액, 방문객, 비용과 매출 이력을 확인할 수 있습니다.',
        note: '향후에는 업체의 과거 수행이력과 새로운 행사 조건을 함께 활용해 유사 행사 수행 시 예상 성과를 분석하는 모델로 확장할 수 있습니다.',
      },
    ],
    agent: {
      name: '정부 행사 입찰 검토 AI Agent', status: '미구현',
      description: '행사 조건과 지원 업체 데이터를 자동으로 조회하고, 각 업체의 제안금액과 유사 행사 수행 횟수, 계약금액, 실제 비용·방문객·매출, ROI뿐 아니라 누적 평균 평가점수와 수행 품질, 예산 집행 효율, 일정 준수, 안전 관리, 현장 대응, 만족도 등 분야별 평가점수를 함께 비교하여 업체별 강점, 리스크와 참고 근거를 정리한 입찰 비교분석 자료를 정부 담당자에게 제공하는 Agent입니다.',
      flow: ['행사 조건 확인','지원 업체 및 제안금액 조회','업체별 유사 행사 수행 Knowledge 조회','실제 성과 및 누적 평가 데이터 비교','분야별 평가점수 비교','업체별 강점·리스크·근거 정리','입찰 비교분석 자료 생성','정부 담당자 최종 판단'],
      coreKnowledge: [{ label: '행사 데이터', value: t.events, unit: '건' }, { label: '입찰 데이터', value: t.bids, unit: '건' }, { label: '업체 데이터', value: t.companies, unit: '개' }, { label: '정부 행사 결과', value: c.performanceLinkedEvents, total: t.events, unit: '행사' }],
      comparisonCriteria: ['종합 평균 평가점수','수행 품질','예산 집행 효율','일정 준수','안전 관리','현장 대응','만족도'],
      comparisonExample: [
        { company: 'A업체', score: 89.1, quality: 18.4, safety: 19.1, budget: 16.2, roi: 34.8 },
        { company: 'B업체', score: 86.7, quality: 17.2, safety: 16.8, budget: 18.5, roi: 37.1 },
      ],
      comparisonSummary: 'A업체는 수행 품질과 안전 관리가 강하고, B업체는 예산 집행 효율과 ROI가 상대적으로 높습니다.',
      decisionNote: '최종 낙찰 판단은 정부 담당자가 수행합니다.',
    },
  },
})

export { pct as calculateKnowledgePercentage }
