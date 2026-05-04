#!/usr/bin/env bash
#
# deploy.sh - ~/Projects/ 게임들을 GitHub에 push하고 Cloudflare Pages 안내 출력
#
# 환경변수:
#   PROJECTS_DIR  (default: $HOME/Projects)
#   REPO_NAME     (default: my-games)
#   REPO_VISIBILITY (default: public)  -- public | private

set -euo pipefail

PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"
REPO_NAME="${REPO_NAME:-my-games}"
REPO_VISIBILITY="${REPO_VISIBILITY:-public}"

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

step() { printf "\n\033[1;36m▸\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; }

# ─────────────────────────────────────
# 1. 의존성 확인
# ─────────────────────────────────────
step "의존성 확인"
missing=0
for cmd in git gh python3; do
  if ! command -v "$cmd" &>/dev/null; then
    err "'$cmd' 가 설치되어있지 않습니다."
    missing=1
  fi
done
if [[ $missing -eq 1 ]]; then
  echo ""
  echo "설치 방법은 README.md를 참조하세요."
  exit 1
fi
ok "git, gh, python3 모두 OK"

# ─────────────────────────────────────
# 2. gh 로그인 확인
# ─────────────────────────────────────
step "GitHub CLI 인증 확인"
if ! gh auth status &>/dev/null; then
  echo "  로그인이 필요합니다. 'gh auth login' 을 실행합니다..."
  gh auth login
fi
ok "GitHub CLI 인증됨 ($(gh api user -q .login))"

# ─────────────────────────────────────
# 3. Projects 디렉토리 이동
# ─────────────────────────────────────
if [[ ! -d "$PROJECTS_DIR" ]]; then
  err "$PROJECTS_DIR 디렉토리가 없습니다."
  exit 1
fi
cd "$PROJECTS_DIR"

# ─────────────────────────────────────
# 4. index.html 생성
# ─────────────────────────────────────
step "index.html 생성"
PROJECTS_DIR="$PROJECTS_DIR" python3 "$SCRIPT_DIR/build-index.py"

# ─────────────────────────────────────
# 5. .gitignore 보장
# ─────────────────────────────────────
if [[ ! -f .gitignore ]]; then
  step ".gitignore 생성"
  cat > .gitignore <<'EOF'
# OS
.DS_Store
Thumbs.db

# Editors
.vscode/
.idea/
*.swp

# Dependencies
node_modules/

# Env
.env
.env.local

# Logs
*.log

# Henry's working directories (제외)
henry/
tasks/

# Build output
dist/
build/
_site/
EOF
  ok ".gitignore 생성됨"
fi

# ─────────────────────────────────────
# 6. README.md 보장 (없을 때만)
# ─────────────────────────────────────
if [[ ! -f README.md ]]; then
  step "README.md 생성"
  cat > README.md <<EOF
# $REPO_NAME

내가 만든 웹 게임 모음. Cloudflare Pages로 배포됩니다.

## 새 게임 추가

1. 이 repo에 \`my-game/index.html\` 형태로 폴더 추가
2. (선택) \`my-game/meta.json\` 작성:
   \`\`\`json
   { "title": "My Game", "description": "한 줄 설명" }
   \`\`\`
3. \`./deploy.sh\` 실행

## 로컬 미리보기

\`\`\`bash
python3 -m http.server 8000
# → http://localhost:8000
\`\`\`
EOF
  ok "README.md 생성됨"
fi

# ─────────────────────────────────────
# 7. git 초기화
# ─────────────────────────────────────
if [[ ! -d .git ]]; then
  step "git 초기화"
  git init -b main >/dev/null
  ok "git repo 초기화됨"
fi

# 사용자 정보 누락 시 가이드
if ! git config user.email &>/dev/null; then
  err "git user.email이 설정되지 않았습니다. 먼저 다음을 실행하세요:"
  echo "    git config --global user.name  \"Your Name\""
  echo "    git config --global user.email \"you@example.com\""
  exit 1
fi

# ─────────────────────────────────────
# 8. 커밋
# ─────────────────────────────────────
step "변경사항 커밋"
git add -A
if git diff --cached --quiet; then
  ok "변경사항 없음 (skip)"
else
  git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null
  ok "커밋 완료"
fi

# ─────────────────────────────────────
# 9. Remote 연결 + push
# ─────────────────────────────────────
if ! git remote get-url origin &>/dev/null; then
  step "GitHub repo 생성: $REPO_NAME ($REPO_VISIBILITY)"
  gh repo create "$REPO_NAME" \
    --"$REPO_VISIBILITY" \
    --source=. \
    --remote=origin \
    --push \
    --description "내가 만든 웹 게임 모음 (Cloudflare Pages 배포)"
  ok "Repo 생성 + push 완료"
else
  step "GitHub에 push"
  git push -u origin main
  ok "push 완료"
fi

REPO_URL=$(gh repo view --json url -q .url 2>/dev/null || echo "")

# ─────────────────────────────────────
# 10. 안내
# ─────────────────────────────────────
cat <<EOF

════════════════════════════════════════════════════════
✅ GitHub 업로드 완료
════════════════════════════════════════════════════════
EOF
[[ -n "$REPO_URL" ]] && echo "📦 Repo: $REPO_URL"
cat <<'EOF'

🚀 Cloudflare Pages 연동 (최초 1회만):

  1. https://dash.cloudflare.com 접속 (없으면 가입 → 무료)
  2. 좌측 메뉴: Workers & Pages → Create
  3. Pages 탭 → Connect to Git → 위 repo 선택
  4. 빌드 설정:
       Framework preset       : None
       Build command          : (비워두기)
       Build output directory : /
  5. Save and Deploy

연동되면 https://<repo>.pages.dev 주소가 발급됩니다.
이후엔 ./deploy.sh 만 실행하면 push → 자동 재배포.

EOF
