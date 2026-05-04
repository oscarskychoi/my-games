// 오버월드 상태 - 맵 이동, NPC 상호작용, 적 조우
const Overworld = {
    // 맵 데이터: 0=물, 1=모래, 2=바위(벽), 3=산호, 4=해초, 5=벽, 6=풀, 7=나무, 8=도로
    map: null,
    mapWidth: 20,
    mapHeight: 15,
    tileSize: 32,

    // 플레이어
    player: { x: 5, y: 7, frame: 0, frameTimer: 0, dir: 'down' },

    // NPC 목록
    npcs: [],

    // 적 조우 위치
    enemyTrigger: null,

    // 대화 상태
    dialogue: null,

    // 전환 효과
    transition: null,

    // 스테이지 관리
    currentStage: 0,
    stageNames: ['심해 동굴', '해안가', '숲속 평원', '인간의 도시'],
    stageColors: ['#182050', '#1a3050', '#0a2010', '#202028'],

    // 스테이지별 맵 데이터
    stages: [
        // Stage 0: 심해 동굴
        {
            baseTile: 0, wallTile: 5,
            decorations: [
                [3,4,3],[3,5,3],[5,12,4],[6,12,4],[8,3,2],
                [10,8,3],[10,9,3],[4,15,4],[5,15,4],[11,14,2],[7,7,2],[7,8,2]
            ],
            exits: [{ x: 19, y: 2, tile: 1 }, { x: 19, y: 3, tile: 1 }],
            npcs: [
                { x: 8, y: 5, sprite: 'clam', name: '지혜로운 조개',
                  lines: ['* 안녕, 꼬마 문어야.','* 동쪽 해안가에 이상한 생물이 나타났다고 하더라.','* 조심해! 지상의 생물들은 우리와 많이 다르단다.','* Z키로 대화하고, 화살표키로 이동해!'] },
                { x: 14, y: 10, sprite: 'clam', name: '겁쟁이 조개',
                  lines: ['* 히익! 깜짝이야!','* 해안가 쪽에서 무서운 소리가 들렸어...','* "야옹" 이라고... 무슨 뜻일까?'] }
            ],
            enemy: { x: 18, y: 2, name: 'Cat' },
            playerStart: { x: 3, y: 7 },
        },
        // Stage 1: 해안가
        {
            baseTile: 1, wallTile: 2,
            decorations: [
                [3,3,0],[3,4,0],[4,3,0],[4,4,0],[5,3,0], // 왼쪽 바다
                [3,16,6],[4,16,6],[5,15,6],[8,14,6],[9,15,6],
                [7,10,2],[11,6,2],[6,8,2]
            ],
            exits: [{ x: 19, y: 7, tile: 6 }, { x: 19, y: 8, tile: 6 }],
            npcs: [
                { x: 10, y: 5, sprite: 'clam', name: '바다거북 할아버지',
                  lines: ['* 오호, 문어가 지상으로 올라왔구나.','* 저 앞 절벽 위에 거대한 새가 있단다.','* 하늘을 나는 생물이라... 대단하지 않니?'] },
            ],
            enemy: { x: 18, y: 7, name: 'Eagle' },
            playerStart: { x: 2, y: 7 },
        },
        // Stage 2: 숲속 평원
        {
            baseTile: 6, wallTile: 7,
            decorations: [
                [2,5,7],[2,6,7],[3,14,7],[4,14,7],[9,4,7],[9,5,7],
                [6,8,2],[7,8,2],[12,12,7],[5,10,7],
                [3,3,6],[8,11,6],[11,7,6]
            ],
            exits: [{ x: 19, y: 7, tile: 8 }, { x: 19, y: 8, tile: 8 }],
            npcs: [
                { x: 7, y: 4, sprite: 'clam', name: '현명한 올빼미',
                  lines: ['* 부엉... 바다에서 온 손님이라니.','* 이 숲의 끝에 사바나가 있어.','* 거기엔 스스로를 왕이라 부르는 사자가 살지.','* 힘으로만은 이길 수 없을 거야. 마음을 열어봐.'] },
            ],
            enemy: { x: 18, y: 7, name: 'Lion' },
            playerStart: { x: 2, y: 7 },
        },
        // Stage 3: 인간의 도시
        {
            baseTile: 8, wallTile: 5,
            decorations: [
                [2,3,5],[2,4,5],[2,5,5],[3,3,5],[3,5,5], // 건물
                [2,10,5],[2,11,5],[2,12,5],[3,10,5],[3,12,5],
                [7,4,5],[7,5,5],[8,4,5],
                [10,10,5],[10,11,5],[11,10,5],[11,11,5],
            ],
            exits: [],
            npcs: [
                { x: 6, y: 10, sprite: 'clam', name: '떠돌이 고양이',
                  lines: ['* 야옹! 너... 전에 만난 문어잖아!','* 여기 인간들은 무서워. 조심해.','* 하지만 대화하면 알아줄 거야... 아마도.'] },
            ],
            enemy: { x: 16, y: 4, name: 'Human' },
            playerStart: { x: 2, y: 12 },
        },
    ],

    init() {
        this.currentStage = 0;
        this.loadStage(0);
    },

    loadStage(stageIndex) {
        this.currentStage = stageIndex;
        const stage = this.stages[stageIndex];

        // 맵 생성
        this.map = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
                    this.map[y][x] = stage.wallTile;
                } else {
                    this.map[y][x] = stage.baseTile;
                }
            }
        }

        // 장식
        for (const [y, x, tile] of stage.decorations) {
            if (y >= 0 && y < this.mapHeight && x >= 0 && x < this.mapWidth)
                this.map[y][x] = tile;
        }

        // 출구
        for (const exit of stage.exits) {
            this.map[exit.y][exit.x] = exit.tile;
        }

        // NPC
        this.npcs = stage.npcs;

        // 적
        this.enemyTrigger = stage.enemy ? { x: stage.enemy.x, y: stage.enemy.y, enemy: stage.enemy.name } : null;

        // 플레이어 위치
        this.player.x = stage.playerStart.x;
        this.player.y = stage.playerStart.y;

        this.dialogue = null;
        this.transition = { type: 'fadeIn', progress: 1 };
    },

    nextStage() {
        if (this.currentStage < this.stages.length - 1) {
            this.transition = {
                type: 'fadeOut',
                progress: 0,
                callback: () => {
                    this.loadStage(this.currentStage + 1);
                }
            };
        } else {
            // 게임 클리어!
            this.dialogue = null;
            this.startDialogue('시스템', [
                '* ...',
                '* 문어는 모든 지상 생물들과 친구가 되었다.',
                '* 바다와 육지, 하늘... 모두가 하나로 연결되어 있다.',
                '* OCTOPUS TALE - 문어 이야기 -',
                '* 플레이해주셔서 감사합니다!',
            ]);
        }
    },

    update(dt, game) {
        // 전환 효과 처리
        if (this.transition) {
            if (this.transition.type === 'fadeIn') {
                this.transition.progress -= dt * 2;
                if (this.transition.progress <= 0) this.transition = null;
            } else if (this.transition.type === 'fadeOut') {
                this.transition.progress += dt * 2;
                if (this.transition.progress >= 1) {
                    this.transition.callback?.();
                    this.transition = null;
                }
            }
            return;
        }

        // 대화 중이면 대화 처리
        if (this.dialogue) {
            this.updateDialogue(dt);
            return;
        }

        // 플레이어 이동
        this.updatePlayer(dt, game);
    },

    updatePlayer(dt, game) {
        const speed = 4; // 타일/초
        let dx = 0, dy = 0;

        if (Input.left) { dx = -1; this.player.dir = 'left'; }
        else if (Input.right) { dx = 1; this.player.dir = 'right'; }
        else if (Input.up) { dy = -1; this.player.dir = 'up'; }
        else if (Input.down) { dy = 1; this.player.dir = 'down'; }

        if (dx !== 0 || dy !== 0) {
            const newX = this.player.x + dx * speed * dt;
            const newY = this.player.y + dy * speed * dt;

            // 충돌 체크
            const tileX = Math.round(newX);
            const tileY = Math.round(newY);

            if (this.canWalk(newX, this.player.y)) this.player.x = newX;
            if (this.canWalk(this.player.x, newY)) this.player.y = newY;

            // 걷기 애니메이션
            this.player.frameTimer += dt;
            if (this.player.frameTimer > 0.25) {
                this.player.frame = 1 - this.player.frame;
                this.player.frameTimer = 0;
            }
        } else {
            this.player.frame = 0;
        }

        // 상호작용 (Z키)
        if (Input.confirm) {
            this.tryInteract(game);
        }
    },

    canWalk(x, y) {
        const margin = 0.3;
        // 4 모서리 체크
        const checks = [
            [x - margin, y - margin],
            [x + margin, y - margin],
            [x - margin, y + margin],
            [x + margin, y + margin],
        ];
        for (const [cx, cy] of checks) {
            const tx = Math.floor(cx + 0.5);
            const ty = Math.floor(cy + 0.5);
            if (tx < 0 || tx >= this.mapWidth || ty < 0 || ty >= this.mapHeight) return false;
            const tile = this.map[ty][tx];
            if (tile === 2 || tile === 5 || tile === 7) return false; // 바위, 벽, 나무
        }
        return true;
    },

    tryInteract(game) {
        const dirOffsets = {
            'up': [0, -1], 'down': [0, 1], 'left': [-1, 0], 'right': [1, 0]
        };
        const [ox, oy] = dirOffsets[this.player.dir];
        const targetX = Math.round(this.player.x) + ox;
        const targetY = Math.round(this.player.y) + oy;

        // NPC 체크
        for (const npc of this.npcs) {
            if (npc.x === targetX && npc.y === targetY) {
                this.startDialogue(npc.name, npc.lines);
                return;
            }
        }

        // 적 조우 체크 (가까이 가면)
        if (this.enemyTrigger) {
            const dist = Math.abs(this.player.x - this.enemyTrigger.x) +
                Math.abs(this.player.y - this.enemyTrigger.y);
            if (dist < 2) {
                this.transition = {
                    type: 'fadeOut',
                    progress: 0,
                    callback: () => game.startBattle(this.enemyTrigger.enemy)
                };
                return;
            }
        }
    },

    startDialogue(name, lines) {
        this.dialogue = {
            name: name,
            lines: lines,
            currentLine: 0,
            charIndex: 0,
            timer: 0,
            done: false,
        };
    },

    updateDialogue(dt) {
        const d = this.dialogue;
        if (!d) return;

        const line = d.lines[d.currentLine];

        if (!d.done) {
            d.timer += dt;
            if (d.timer > 0.03) {
                d.charIndex++;
                d.timer = 0;
                if (d.charIndex >= line.length) {
                    d.done = true;
                }
            }
            // Z키로 즉시 완성
            if (Input.confirm) {
                d.charIndex = line.length;
                d.done = true;
            }
        } else {
            // 다음 줄 또는 종료
            if (Input.confirm) {
                d.currentLine++;
                if (d.currentLine >= d.lines.length) {
                    this.dialogue = null;
                } else {
                    d.charIndex = 0;
                    d.done = false;
                    d.timer = 0;
                }
            }
        }
    },

    render(ctx) {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        // 맵 바깥 배경색
        ctx.fillStyle = this.stageColors[this.currentStage] || '#182050';
        ctx.fillRect(0, 0, W, H);

        // 카메라 오프셋 (플레이어 중심)
        const camX = this.player.x * this.tileSize - W / 2;
        const camY = this.player.y * this.tileSize - H / 2;

        ctx.save();
        ctx.translate(-camX, -camY);

        // 타일 렌더링
        const startTX = Math.max(0, Math.floor(camX / this.tileSize) - 1);
        const startTY = Math.max(0, Math.floor(camY / this.tileSize) - 1);
        const endTX = Math.min(this.mapWidth, Math.ceil((camX + W) / this.tileSize) + 1);
        const endTY = Math.min(this.mapHeight, Math.ceil((camY + H) / this.tileSize) + 1);

        for (let ty = startTY; ty < endTY; ty++) {
            for (let tx = startTX; tx < endTX; tx++) {
                const tile = this.map[ty][tx];
                const tileTypes = ['water', 'sand', 'rock', 'coral', 'seaweed', 'wall', 'grass', 'tree', 'road'];
                const tileSprite = Sprites.getTile(tileTypes[tile] || 'water');

                const px = tx * this.tileSize;
                const py = ty * this.tileSize;

                // 타일을 32x32로 스케일
                ctx.drawImage(tileSprite, px, py, this.tileSize, this.tileSize);
            }
        }

        // NPC 렌더링
        for (const npc of this.npcs) {
            const sprite = Sprites.getClam();
            const px = npc.x * this.tileSize - sprite.width / 2;
            const py = npc.y * this.tileSize - sprite.height / 2;
            ctx.drawImage(sprite, px, py);
        }

        // 적 트리거 표시 (느낌표)
        if (this.enemyTrigger) {
            const ex = this.enemyTrigger.x * this.tileSize;
            const ey = this.enemyTrigger.y * this.tileSize;
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', ex, ey - 10 + Math.sin(Date.now() / 300) * 4);
        }

        // 플레이어 렌더링
        const playerSprite = Sprites.getOctopus(this.player.dir, this.player.frame);
        const ppx = this.player.x * this.tileSize - playerSprite.width / 2;
        const ppy = this.player.y * this.tileSize - playerSprite.height / 2;
        ctx.drawImage(playerSprite, ppx, ppy);

        ctx.restore();

        // UI 오버레이
        this.renderUI(ctx);

        // 대화 박스
        if (this.dialogue) {
            this.renderDialogue(ctx);
        }

        // 전환 효과
        if (this.transition) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, this.transition.progress)})`;
            ctx.fillRect(0, 0, W, H);
        }
    },

    renderUI(ctx) {
        // 상단 위치 안내
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(this.stageNames[this.currentStage] || '???', 10, 20);

        // 조작법 안내
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('방향키: 이동 | Z: 상호작용', ctx.canvas.width - 10, 20);
    },

    renderDialogue(ctx) {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;
        const d = this.dialogue;

        // 대화 박스 배경
        const boxY = H - 130;
        const boxH = 120;
        const boxMargin = 20;

        ctx.fillStyle = '#000000';
        ctx.fillRect(boxMargin, boxY, W - boxMargin * 2, boxH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxMargin, boxY, W - boxMargin * 2, boxH);

        // 이름
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(d.name, boxMargin + 15, boxY + 22);

        // 대화 텍스트 (타자기 효과)
        const line = d.lines[d.currentLine];
        const displayText = line.substring(0, d.charIndex);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';

        // 줄바꿈 처리
        const maxWidth = W - boxMargin * 2 - 30;
        const words = displayText.split('');
        let currentLine = '';
        let lineY = boxY + 48;

        for (const char of words) {
            const testLine = currentLine + char;
            if (ctx.measureText(testLine).width > maxWidth) {
                ctx.fillText(currentLine, boxMargin + 15, lineY);
                currentLine = char;
                lineY += 22;
            } else {
                currentLine = testLine;
            }
        }
        ctx.fillText(currentLine, boxMargin + 15, lineY);

        // 계속 표시
        if (d.done) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.textAlign = 'right';
            const blink = Math.sin(Date.now() / 200) > 0;
            if (blink) {
                ctx.fillText('Z키로 계속 ▼', W - boxMargin - 15, boxY + boxH - 12);
            }
        }
    },
};
