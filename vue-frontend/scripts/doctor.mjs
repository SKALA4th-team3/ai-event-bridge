/* 실행이 안 될 때 원인을 한 번에 짚어 줍니다.  npm run doctor */
import { createServer } from 'node:net'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ok = (b) => (b ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m')
const line = (label, pass, note = '') =>
  console.log(`  ${ok(pass)} ${label.padEnd(22)} ${note}`)

console.log('\n이벤트브릿지 실행 점검\n')

const [maj, min] = process.versions.node.split('.').map(Number)
const nodeOk = maj > 20 || (maj === 20 && min >= 19)
line('Node', nodeOk, `v${process.versions.node}${nodeOk ? '' : '  → 20.19 이상이 필요합니다'}`)

const mods = existsSync(new URL('../node_modules', import.meta.url))
line('node_modules', mods, mods ? '' : '→ npm ci 를 먼저 실행하세요')

if (mods && process.platform === 'darwin') {
  let quarantined = 0
  try {
    quarantined = Number(execSync(
      'xattr -r -p com.apple.quarantine node_modules 2>/dev/null | wc -l',
      { encoding: 'utf8' }).trim())
  } catch { /* xattr 이 없으면 넘어갑니다 */ }
  line('macOS 격리 속성', quarantined === 0,
    quarantined ? `${quarantined}개 → xattr -dr com.apple.quarantine node_modules` : '없음')
}

const port = await new Promise((res) => {
  const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true)))
  s.listen(3000, 'localhost')
})
line('포트 3000', port, port ? '비어 있음' : '사용 중 → 다른 포트로 뜨지만 OAuth 로그인은 3000 이 필요합니다')

const env = existsSync(new URL('../.env', import.meta.url))
line('.env', true, env ? '있음' : '없음 → 실습 기본값으로 동작합니다 (문제 아님)')

const gw = await fetch('http://localhost:8080/actuator/health').then(() => true).catch(() => false)
line('백엔드 게이트웨이', true, gw ? '응답함' : '응답 없음 → 화면만 볼 거면 문제 아닙니다')

console.log(`\n  ${nodeOk && mods ? '\x1b[32mnpm run dev 로 실행하세요.\x1b[0m' : '\x1b[33m위의 ✗ 항목을 먼저 해결하세요.\x1b[0m'}\n`)
