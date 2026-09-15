import type { Bike } from './schema'
import { BUDGET_MAX, type Answers } from './answers'
import type { Recommendation, RankedResult } from './recommend'

export type ReasonKind = 'match' | 'stretch' | 'relaxed'

export interface Reason {
  kind: ReasonKind
  text: string
}

const USE_HIT: Record<Answers['useCase'], string> = {
  commute: '适合城市通勤的定位',
  sport: '变速和齿比适合运动骑行',
  travel: '适合旅行携车出行',
  casual: '轻松的骑行姿态适合休闲代步',
}

export function reasonsFor(rec: Recommendation, answers: Answers, result: RankedResult): Reason[] {
  const bike: Bike = rec.bike
  const rs: Reason[] = []

  if (bike.useCases.includes(answers.useCase)) {
    rs.push({ kind: 'match', text: USE_HIT[answers.useCase] })
  }
  if (answers.fold === 'daily' && bike.folding.carryScore >= 4) {
    rs.push({ kind: 'match', text: '折叠紧凑,适合每天携带' })
  }
  if (answers.fold === 'rarely' && bike.folding.carryScore <= 3) {
    rs.push({ kind: 'match', text: '不常折叠的话,这款的配置更值' })
  }
  if ((answers.useCase === 'sport' || answers.useCase === 'commute') && bike.drivetrain.climbScore >= 4) {
    rs.push({ kind: 'match', text: '齿比范围大,爬坡不吃力' })
  }
  if (answers.useCase === 'travel' && bike.weightKg <= 10) {
    rs.push({ kind: 'match', text: `仅 ${bike.weightKg}kg,拎着走不费劲` })
  }
  if (result.mode === 'strict' && bike.priceCny > BUDGET_MAX[answers.budget]) {
    rs.push({ kind: 'stretch', text: `价格略超预算上限,参考价 ${bike.priceCny} 元` })
  }
  if (result.mode === 'relaxed' && result.relaxedDimensions.includes('budget')) {
    rs.push({ kind: 'relaxed', text: `超出你的预算区间(参考价 ${bike.priceCny} 元),其余条件都匹配` })
  }
  if (result.mode === 'relaxed' && result.relaxedDimensions.includes('height')) {
    rs.push({ kind: 'relaxed', text: '身高适配区间与你略有出入,建议试骑确认' })
  }
  return rs
}
