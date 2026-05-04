// 전투 시스템 - 언더테일식 턴제 + 총알 피하기
const Battle = {
    // 상태
    state: 'intro', // intro, playerTurn, chooseAction, chooseTalk, enemyTurn, text, won, spared, lost
    enemy: null,
    turn: 0,

    // 영혼 (총알 피하기 모드의 플레이어)
    soul: { x: 0, y: 0, speed: 180, invTimer: 0, invDuration: 1 },

    // 배틀박스 영역
    box: { left: 120, top: 120, right: 520, bottom: 340 },

    // 총알 목록
    bullets: [],
    bulletTimer: 0,
    pendingBullets: [],

    // 메뉴
    menuIndex: 0,
    menuItems: ['싸우기', '대화하기', '아이템', '도망'],
    talkIndex: 0,
    talkOptions: [],

    // 텍스트 표시
    text: '',
    textDisplay: '',
    textCharIndex: 0,
    textTimer: 0,
    textDone: false,
    textCallback: null,

    // 전환 효과
    transition: null,

    // 공격 타이머
    attackTimer: 0,
    attackDuration: 0,

    // 공격 애니메이션
    attackAnim: null, // { progress: 0, target: 'enemy' }

    init(enemyName) {
        switch (enemyName) {
            case 'Cat': this.enemy = new CatBoss(); break;
            case 'Eagle': this.enemy = new EagleBoss(); break;
            case 'Lion': this.enemy = new LionBoss(); break;
            case 'Human': this.enemy = new HumanBoss(); break;
            default: this.enemy = new CatBoss();
        }

        this.turn = 0;
        this.bullets = [];
        this.pendingBullets = [];
        this.menuIndex = 0;
        this.state = 'intro';
        this.transition = { type: 'fadeIn', progress: 1 };

        // 영혼 위치 초기화
        this.soul.x = (this.box.left + this.box.right) / 2;
        this.soul.y = (this.box.top + this.box.bottom) / 2;
        this.soul.invTimer = 0;

        this.showText(`* ${this.enemy.name}(이)가 나타났다!`, () => {
            this.startPlayerTurn();
        });
    },

    startPlayerTurn() {
        this.turn++;
        this.state = 'chooseAction';
        this.menuIndex = 0;
        this.text = `* ${this.enemy.getFlavorText(this.turn)}`;
        this.textDisplay = this.text;
        this.textDone = true;
    },

    update(dt, game) {
        // 전환 효과
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

        switch (this.state) {
            case 'text':
                this.updateText(dt);
                break;
            case 'chooseAction':
                this.updateChooseAction(dt, game);
                break;
            case 'chooseTalk':
                this.updateChooseTalk(dt, game);
                break;
            case 'enemyTurn':
                this.updateEnemyTurn(dt, game);
                break;
            case 'attackAnim':
                this.updateAttackAnim(dt, game);
                break;
            case 'won':
            case 'spared':
            case 'lost':
                this.updateText(dt);
                break;
        }
    },

    // 텍스트 표시 업데이트
    updateText(dt) {
        if (!this.textDone) {
            this.textTimer += dt;
            if (this.textTimer > 0.03) {
                this.textCharIndex++;
                this.textTimer = 0;
                if (this.textCharIndex >= this.text.length) {
                    this.textDisplay = this.text;
                    this.textDone = true;
                }
                this.textDisplay = this.text.substring(0, this.textCharIndex);
            }

            if (Input.confirm) {
                this.textCharIndex = this.text.length;
                this.textDisplay = this.text;
                this.textDone = true;
            }
        } else if (Input.confirm) {
            if (this.textCallback) {
                const cb = this.textCallback;
                this.textCallback = null;
                cb();
            }
        }
    },

    showText(text, callback) {
        this.state = 'text';
        this.text = text;
        this.textDisplay = '';
        this.textCharIndex = 0;
        this.textTimer = 0;
        this.textDone = false;
        this.textCallback = callback;
    },

    // 행동 선택 메뉴
    updateChooseAction(dt, game) {
        if (Input.isJustPressed('ArrowLeft') || Input.isJustPressed('KeyA'))
            this.menuIndex = (this.menuIndex - 1 + 4) % 4;
        if (Input.isJustPressed('ArrowRight') || Input.isJustPressed('KeyD'))
            this.menuIndex = (this.menuIndex + 1) % 4;

        if (Input.confirm) {
            switch (this.menuIndex) {
                case 0: this.doFight(game); break;
                case 1: this.doTalk(game); break;
                case 2: this.doItem(game); break;
                case 3: this.doFlee(game); break;
            }
        }
    },

    // 싸우기
    doFight(game) {
        const damage = Math.max(1, game.playerATK - this.enemy.def);
        const actualDmg = this.enemy.takeDamage(damage);

        this.attackAnim = { progress: 0, target: 'enemy' };
        this.state = 'attackAnim';
        this._pendingFightDamage = actualDmg;
        this._pendingFightGame = game;
    },

    updateAttackAnim(dt, game) {
        if (!this.attackAnim) return;
        this.attackAnim.progress += dt * 4;

        if (this.attackAnim.progress >= 1) {
            this.attackAnim = null;
            const actualDmg = this._pendingFightDamage;
            const g = this._pendingFightGame;

            this.showText(`* 문어의 촉수 공격! ${actualDmg} 데미지!`, () => {
                if (this.enemy.currentHP <= 0) {
                    this.battleWon(g);
                } else {
                    this.startEnemyTurn(g);
                }
            });
        }
    },

    // 대화하기
    doTalk(game) {
        this.talkOptions = this.enemy.getTalkOptions();
        this.talkIndex = 0;
        this.state = 'chooseTalk';
    },

    updateChooseTalk(dt, game) {
        if (Input.isJustPressed('ArrowUp') || Input.isJustPressed('KeyW'))
            this.talkIndex = (this.talkIndex - 1 + this.talkOptions.length) % this.talkOptions.length;
        if (Input.isJustPressed('ArrowDown') || Input.isJustPressed('KeyS'))
            this.talkIndex = (this.talkIndex + 1) % this.talkOptions.length;

        if (Input.cancel) {
            this.state = 'chooseAction';
            return;
        }

        if (Input.confirm) {
            const result = this.enemy.onTalk(this.talkIndex);
            this.showText(`* ${result.text}`, () => {
                if (this.enemy.affection >= this.enemy.maxAffection) {
                    this.battleSpared(game);
                } else {
                    this.startEnemyTurn(game);
                }
            });
        }
    },

    // 아이템
    doItem(game) {
        game.playerHP = Math.min(game.playerHP + 5, game.playerMaxHP);
        this.showText('* 먹물 주먹밥을 먹었다! HP가 5 회복되었다!', () => {
            this.startEnemyTurn(game);
        });
    },

    // 도망
    doFlee(game) {
        if (this.enemy.canFlee) {
            this.showText('* 성공적으로 도망쳤다!', () => {
                this.transition = {
                    type: 'fadeOut',
                    progress: 0,
                    callback: () => game.endBattle(false)
                };
            });
        } else {
            this.showText(`* ${this.enemy.name}(이)가 도망치지 못하게 막았다!`, () => {
                this.startEnemyTurn(game);
            });
        }
    },

    // 적 턴 시작
    startEnemyTurn(game) {
        this.state = 'enemyTurn';
        this.bullets = [];
        this.pendingBullets = [];

        this.text = `* ${this.enemy.getAttackText(this.turn)}`;
        this.textDisplay = this.text;
        this.textDone = true;

        // 영혼 위치 초기화
        this.soul.x = (this.box.left + this.box.right) / 2;
        this.soul.y = (this.box.top + this.box.bottom) / 2;

        // 공격 패턴 생성
        const pattern = this.enemy.getAttackPattern(this.turn, this.box);
        this.pendingBullets = pattern.bullets.map(b => ({ ...b }));
        this.attackDuration = pattern.duration;
        this.attackTimer = 0;
        this.bulletTimer = 0;
    },

    // 적 턴 업데이트
    updateEnemyTurn(dt, game) {
        this.attackTimer += dt;
        this.bulletTimer += dt;

        // 영혼 이동
        let dx = 0, dy = 0;
        if (Input.left) dx = -1;
        if (Input.right) dx = 1;
        if (Input.up) dy = -1;
        if (Input.down) dy = 1;

        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        this.soul.x += (dx / len) * this.soul.speed * dt;
        this.soul.y += (dy / len) * this.soul.speed * dt;

        // 배틀박스 범위 제한
        const pad = 6;
        this.soul.x = Math.max(this.box.left + pad, Math.min(this.box.right - pad, this.soul.x));
        this.soul.y = Math.max(this.box.top + pad, Math.min(this.box.bottom - pad, this.soul.y));

        // 무적 타이머
        if (this.soul.invTimer > 0) {
            this.soul.invTimer -= dt;
        }

        // 대기 중인 총알 생성
        const toSpawn = [];
        for (let i = this.pendingBullets.length - 1; i >= 0; i--) {
            const b = this.pendingBullets[i];
            if (this.attackTimer >= (b.delay || 0)) {
                this.bullets.push({
                    x: b.x,
                    y: b.y,
                    vx: b.vx * 60, // 초속으로 변환
                    vy: b.vy * 60,
                    damage: b.damage,
                    type: b.type || 'normal',
                    life: 5,
                });
                toSpawn.push(i);
            }
        }
        for (const i of toSpawn) {
            this.pendingBullets.splice(i, 1);
        }

        // 총알 업데이트
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;

            if (b.life <= 0) {
                this.bullets.splice(i, 1);
                continue;
            }

            // 영혼과 충돌 체크
            if (this.soul.invTimer <= 0) {
                const dist = Math.sqrt((b.x - this.soul.x) ** 2 + (b.y - this.soul.y) ** 2);
                if (dist < 10) {
                    // 피격!
                    const actualDmg = Math.max(1, b.damage - game.playerDEF);
                    game.playerHP = Math.max(0, game.playerHP - actualDmg);
                    this.soul.invTimer = this.soul.invDuration;
                    this.bullets.splice(i, 1);
                }
            }
        }

        // 공격 턴 종료
        if (this.attackTimer >= this.attackDuration && this.pendingBullets.length === 0) {
            this.bullets = [];

            if (game.playerHP <= 0) {
                this.battleLost(game);
            } else {
                this.startPlayerTurn();
            }
        }
    },

    // 전투 종료
    battleWon(game) {
        const gold = this.enemy.goldReward;
        game.gold += gold;
        this.state = 'won';
        this.showText(`* ${this.enemy.name}(을)를 쓰러뜨렸다!\n* ${gold}G를 획득했다!`, () => {
            this.transition = {
                type: 'fadeOut',
                progress: 0,
                callback: () => game.endBattle(true)
            };
        });
    },

    battleSpared(game) {
        this.state = 'spared';
        this.showText(`* ${this.enemy.name}(과)와 친구가 되었다!`, () => {
            this.transition = {
                type: 'fadeOut',
                progress: 0,
                callback: () => game.endBattle(true)
            };
        });
    },

    battleLost(game) {
        this.state = 'lost';
        this.showText('* ...\n* 문어는 쓰러졌다.', () => {
            this.transition = {
                type: 'fadeOut',
                progress: 0,
                callback: () => game.gameOver()
            };
        });
    },

    // 렌더링
    render(ctx) {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        // 배경
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        // 적 스프라이트 (보스별)
        this.renderEnemy(ctx);

        // 배틀박스
        this.renderBattleBox(ctx);

        // 적 턴이면 총알과 영혼 렌더
        if (this.state === 'enemyTurn') {
            this.renderBullets(ctx);
            this.renderSoul(ctx);
        }

        // 공격 애니메이션
        if (this.attackAnim) {
            this.renderAttackAnim(ctx);
        }

        // 텍스트 박스
        this.renderTextBox(ctx);

        // 메뉴
        if (this.state === 'chooseAction') {
            this.renderActionMenu(ctx);
        } else if (this.state === 'chooseTalk') {
            this.renderTalkMenu(ctx);
        }

        // HP 바
        this.renderHP(ctx);

        // 전환 효과
        if (this.transition) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, this.transition.progress)})`;
            ctx.fillRect(0, 0, W, H);
        }
    },

    renderEnemy(ctx) {
        let sprite;
        if (this.enemy instanceof CatBoss) sprite = Sprites.getCatBoss();
        else if (this.enemy instanceof EagleBoss) sprite = Sprites.getEagleBoss();
        else if (this.enemy instanceof LionBoss) sprite = Sprites.getLionBoss();
        else if (this.enemy instanceof HumanBoss) sprite = Sprites.getHumanBoss();
        else sprite = Sprites.getCatBoss();
        const cx = (this.box.left + this.box.right) / 2;
        const ey = this.box.top - sprite.height - 20;
        ctx.drawImage(sprite, cx - sprite.width / 2, ey);

        // 적 이름 + HP바
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.enemy.name, cx, ey - 10);

        // 적 HP바
        const barW = 100;
        const barH = 6;
        const barX = cx - barW / 2;
        const barY = ey - 5;
        ctx.fillStyle = '#440000';
        ctx.fillRect(barX, barY, barW, barH);
        const hpRatio = this.enemy.currentHP / this.enemy.maxHP;
        ctx.fillStyle = hpRatio > 0.3 ? '#00cc00' : '#ff4400';
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
    },

    renderBattleBox(ctx) {
        const b = this.box;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
    },

    renderSoul(ctx) {
        // 무적 중 깜빡임
        if (this.soul.invTimer > 0 && Math.floor(this.soul.invTimer * 10) % 2 === 0) return;

        const sprite = Sprites.getSoul();
        ctx.drawImage(sprite, this.soul.x - sprite.width / 2, this.soul.y - sprite.height / 2);
    },

    renderBullets(ctx) {
        for (const b of this.bullets) {
            const sprite = Sprites.getBullet(b.type);
            ctx.drawImage(sprite, b.x - sprite.width / 2, b.y - sprite.height / 2);
        }
    },

    renderAttackAnim(ctx) {
        if (!this.attackAnim) return;
        const p = this.attackAnim.progress;
        const cx = (this.box.left + this.box.right) / 2;
        const cy = (this.box.top + this.box.bottom) / 2;

        // 슬래시 효과
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const slashY = this.box.top - 80 + p * 120;
        ctx.moveTo(cx - 50 + p * 20, slashY - 40);
        ctx.lineTo(cx + 50 - p * 20, slashY + 40);
        ctx.stroke();
        ctx.restore();
    },

    renderTextBox(ctx) {
        const W = ctx.canvas.width;
        const boxY = this.box.bottom + 10;
        const boxH = 70;

        // 텍스트 배경
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.box.left, boxY, this.box.right - this.box.left, boxH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.box.left, boxY, this.box.right - this.box.left, boxH);

        // 텍스트
        ctx.fillStyle = '#ffffff';
        ctx.font = '15px monospace';
        ctx.textAlign = 'left';

        const lines = this.textDisplay.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, this.box.left + 15, boxY + 24 + i * 22);
        });

        // 계속 프롬프트
        if (this.textDone && this.textCallback) {
            const blink = Math.sin(Date.now() / 200) > 0;
            if (blink) {
                ctx.fillStyle = '#ffff00';
                ctx.font = '12px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('▼', this.box.right - 10, boxY + boxH - 8);
            }
        }
    },

    renderActionMenu(ctx) {
        const W = ctx.canvas.width;
        const menuY = this.box.bottom + 85;
        const menuW = (this.box.right - this.box.left) / 4;

        for (let i = 0; i < 4; i++) {
            const x = this.box.left + i * menuW;
            const isSelected = i === this.menuIndex;

            // 선택 배경
            if (isSelected) {
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(x + 2, menuY - 2, menuW - 4, 24);
            }

            ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.menuItems[i], x + menuW / 2, menuY + 14);
        }

        // 조작 안내
        ctx.fillStyle = '#666666';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← → 선택  |  Z 결정', (this.box.left + this.box.right) / 2, menuY + 38);
    },

    renderTalkMenu(ctx) {
        const menuX = this.box.left + 20;
        const menuY = this.box.top + 20;

        ctx.fillStyle = '#000000';
        ctx.fillRect(this.box.left, this.box.top, this.box.right - this.box.left, this.box.bottom - this.box.top);

        // 대화 선택지 제목
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('어떻게 말할까?', menuX, menuY);

        for (let i = 0; i < this.talkOptions.length; i++) {
            const isSelected = i === this.talkIndex;
            const y = menuY + 30 + i * 30;

            if (isSelected) {
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(menuX - 5, y - 14, 280, 24);
                ctx.fillStyle = '#000000';
            } else {
                ctx.fillStyle = '#ffffff';
            }

            ctx.font = '14px monospace';
            const prefix = isSelected ? '> ' : '  ';
            ctx.fillText(prefix + this.talkOptions[i], menuX, y);
        }

        // 호감도 표시
        ctx.fillStyle = '#ff6090';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        const hearts = '♥'.repeat(this.enemy.affection) + '♡'.repeat(Math.max(0, this.enemy.maxAffection - this.enemy.affection));
        ctx.fillText(`호감도: ${hearts}`, this.box.right - 20, menuY);

        // 안내
        ctx.fillStyle = '#666666';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ 선택 | Z 결정 | X 취소', (this.box.left + this.box.right) / 2, this.box.bottom - 15);
    },

    renderHP(ctx) {
        const W = ctx.canvas.width;
        const y = ctx.canvas.height - 30;

        // 문어 이름 + LV
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`문어  LV ${Game.playerLV}`, 20, y);

        // HP 바
        const barX = 160;
        const barW = 150;
        const barH = 16;

        ctx.fillStyle = '#440000';
        ctx.fillRect(barX, y - 12, barW, barH);

        const hpRatio = Game.playerHP / Game.playerMaxHP;
        ctx.fillStyle = hpRatio > 0.3 ? '#ffff00' : '#ff4400';
        ctx.fillRect(barX, y - 12, barW * hpRatio, barH);

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(`HP ${Game.playerHP}/${Game.playerMaxHP}`, barX + barW + 10, y);

        // 골드
        ctx.textAlign = 'right';
        ctx.fillText(`${Game.gold}G`, W - 20, y);
    },
};
