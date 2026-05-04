/** QA(평가) 관리 화면 - 타입 정의 */

export interface QaCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export interface QaRecord {
  id: string;
  consultId: string;
  agentName: string;
  evaluatorName: string;
  totalScore: number;
  evaluatedAt: string;
}
