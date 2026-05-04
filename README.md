# Game Deploy Kit

`~/Projects/` 아래에 폴더로 모여 있는 정적 웹 게임들을 한 번에
**GitHub → Cloudflare Pages**로 무료 공개 배포하기 위한 스크립트 모음.

```
~/Projects/
├── build-index.py     ← 키트
├── deploy.sh          ← 키트
├── README.md          ← 키트 (이 파일)
├── snake/
│   ├── index.html
│   └── meta.json      (선택)
├── tetris/
│   └── index.html
└── ...                ← 나머지 게임들
```

## 0. 사전 준비

### GitHub CLI (gh) 설치

| OS | 명령 |
|---|---|
| **macOS** (Homebrew) | `brew install gh` |
| **Ubuntu/Debian** | `sudo apt install gh` (안 되면 [공식 가이드](https://github.com/cli/cli/blob/trunk/docs/install_linux.md)) |
| **Fedora** | `sudo dnf install gh` |
| **Windows** (winget) | `winget install --id GitHub.cli` |
| **Windows** (Scoop) | `scoop install gh` |

설치 확인:
```bash
gh --version
```

### GitHub 로그인

```bash
gh auth login
```
→ `GitHub.com` → `HTTPS` → `Login with a web browser` 선택, 출력된 코드 복사 후 브라우저에서 인증.

### git 사용자 정보 (이미 설정돼 있으면 skip)

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

---

## 1. 키트 설치

키트의 `build-index.py`, `deploy.sh`, `README.md` 세 파일을 `~/Projects/` 직속에 복사:

```bash
cp build-index.py deploy.sh README.md ~/Projects/
chmod +x ~/Projects/deploy.sh
```

---

## 2. (선택) 게임 메타데이터 작성

각 게임 폴더에 `meta.json`을 두면 목록 페이지에 제목/설명이 예쁘게 들어갑니다:

```json
{
  "title": "Snake.exe",
  "description": "키보드 방향키로 사과를 먹는 클래식"
}
```

없으면 `index.html`의 `<title>` 태그를 쓰고, 그것도 없으면 폴더명을 씁니다.

---

## 3. 배포

```bash
cd ~/Projects
./deploy.sh
```

스크립트가 하는 일:
1. `index.html`을 새로 빌드 (모든 게임 폴더 자동 스캔)
2. `.gitignore`, `README.md` 없으면 생성
3. git 초기화 + 커밋
4. **GitHub repo가 없으면 새로 만들고 push**, 있으면 그냥 push
5. Cloudflare Pages 연동 안내 출력

---

## 4. Cloudflare Pages 연동 (최초 1회)

1. <https://dash.cloudflare.com> 접속 (가입 무료)
2. 좌측: **Workers & Pages** → **Create**
3. **Pages** 탭 → **Connect to Git** → 방금 만든 repo 선택
4. 빌드 설정
   - Framework preset: **None**
   - Build command: **(비워두기)**
   - Build output directory: **`/`**
5. **Save and Deploy**

→ `https://<repo-name>.pages.dev` 주소 발급. 친구들에게 공유 가능.

이후엔 `./deploy.sh` 실행할 때마다 GitHub push와 동시에 Cloudflare가 자동 재배포합니다 (보통 30초~1분).

---

## 환경변수로 동작 변경

```bash
REPO_NAME=henrys-arcade ./deploy.sh           # repo 이름 변경
REPO_VISIBILITY=private ./deploy.sh           # private repo로 (단, Cloudflare는 public/private 둘 다 OK)
PROJECTS_DIR=~/games ./deploy.sh              # 디렉토리 변경
```

---

## 자주 발생하는 문제

**Q. 일부 폴더가 목록에 안 나와요.**
→ 해당 폴더 안에 `index.html`이 없으면 자동 제외됩니다. 또한 다음 폴더는 무조건 제외:
`henry`, `tasks`, `node_modules`, `dist`, `build`, `_site`, `.git`, `.github`, `.vscode`, `.idea`, 그리고 `.`으로 시작하는 모든 폴더.

**Q. 게임 안에서 `localStorage` 저장이 도메인 바뀌면 사라져요.**
→ 정상입니다. `localStorage`는 origin 단위로 저장되므로 `pages.dev` 도메인을 처음 정한 그대로 유지하세요.

**Q. 커스텀 도메인 쓰고 싶어요.**
→ 도메인 구입 후 Cloudflare Pages 프로젝트 → **Custom domains** → 추가. DNS는 Cloudflare에서 자동 처리해 줍니다.

**Q. 빌드 한 번에 너무 많은 트래픽이 와도 괜찮나요?**
→ Cloudflare Pages는 무료 플랜에서도 **대역폭 무제한**입니다. 빌드 횟수만 월 500회 제한.

---

## 새 게임 추가 워크플로

```bash
mkdir ~/Projects/my-new-game
# 게임 파일들 작성...
echo '{"title":"My New Game","description":"설명"}' > ~/Projects/my-new-game/meta.json
cd ~/Projects && ./deploy.sh
```
