// 메인 게임 엔진
const Game = {
    canvas: null,
    ctx: null,
    state: 'menu', // menu, overworld, battle, gameover

    // 플레이어 데이터
    playerHP: 20,
    playerMaxHP: 20,
    playerATK: 5,
    playerDEF: 3,
    playerLV: 1,
    gold: 0,

    // 메뉴
    menuIndex: 0,
    menuBlink: 0,

    // 타이틀 애니메이션
    titleAnim: 0,

    lastTime: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 픽셀 아트 렌더링 설정
        this.ctx.imageSmoothingEnabled = false;

        Input.init();

        this.lastTime = performance.now();
        this.gameLoop();
    },

    gameLoop() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05); // 최대 50ms
        this.lastTime = now;

        Input.update();
        this.update(dt);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    },

    update(dt) {
        this.titleAnim += dt;

        switch (this.state) {
            case 'menu':
                this.updateMenu(dt);
                break;
            case 'overworld':
                Overworld.update(dt, this);
                break;
            case 'battle':
                Battle.update(dt, this);
                break;
            case 'gameover':
                if (Input.confirm) {
                    this.state = 'menu';
                    this.menuIndex = 0;
                }
                break;
        }
    },

    updateMenu(dt) {
        this.menuBlink += dt;

        if (Input.isJustPressed('ArrowUp') || Input.isJustPressed('KeyW'))
            this.menuIndex = Math.max(0, this.menuIndex - 1);
        if (Input.isJustPressed('ArrowDown') || Input.isJustPressed('KeyS'))
            this.menuIndex = Math.min(1, this.menuIndex + 1);

        if (Input.confirm) {
            if (this.menuIndex === 0) {
                this.startGame();
            }
            // 1 = 나가기 (웹이라 무시)
        }
    },

    startGame() {
        this.playerHP = this.playerMaxHP;
        this.gold = 0;
        this.playerLV = 1;
        Overworld.init();
        this.state = 'overworld';
    },

    startBattle(enemyName) {
        this.state = 'battle';
        Battle.init(enemyName);
    },

    endBattle(won) {
        this.state = 'overworld';
        if (won) {
            Overworld.enemyTrigger = null;
            // 다음 스테이지로 이동
            Overworld.transition = { type: 'fadeIn', progress: 1 };
            setTimeout(() => Overworld.nextStage(), 500);
        } else {
            Overworld.transition = { type: 'fadeIn', progress: 1 };
        }
    },

    gameOver() {
        this.state = 'gameover';
    },

    render() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // 화면 초기화
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        switch (this.state) {
            case 'menu':
                this.renderMenu(ctx);
                break;
            case 'overworld':
                Overworld.render(ctx);
                break;
            case 'battle':
                Battle.render(ctx);
                break;
            case 'gameover':
                this.renderGameOver(ctx);
                break;
        }
    },

    renderMenu(ctx) {
        const W = this.canvas.width;
        const H = this.canvas.height;

        // 배경 - 심해 느낌
        ctx.fillStyle = '#0a0a20';
        ctx.fillRect(0, 0, W, H);

        // 물결 효과
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(30, 60, 120, ${0.3 - i * 0.05})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < W; x += 5) {
                const y = H / 2 + 80 + i * 20 + Math.sin(x / 50 + this.titleAnim + i) * 10;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 문어 스프라이트
        const octSprite = Sprites.getOctopus('down', Math.floor(this.titleAnim * 2) % 2);
        const octScale = 3;
        const octX = W / 2 - (octSprite.width * octScale) / 2;
        const octY = 80 + Math.sin(this.titleAnim * 1.5) * 8;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(octSprite, octX, octY, octSprite.width * octScale, octSprite.height * octScale);
        ctx.restore();

        // 타이틀
        ctx.fillStyle = '#ff6090';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('OCTOPUS TALE', W / 2, 280);

        // 부제
        ctx.fillStyle = '#80c0ff';
        ctx.font = '16px monospace';
        ctx.fillText('문 어  이 야 기', W / 2, 310);

        // 메뉴
        const menuItems = ['시작하기', '나가기'];
        for (let i = 0; i < menuItems.length; i++) {
            const y = 370 + i * 40;
            const isSelected = i === this.menuIndex;

            if (isSelected) {
                // 선택 커서
                ctx.fillStyle = '#ffcc00';
                ctx.font = '16px monospace';
                const textW = ctx.measureText(menuItems[i]).width;
                ctx.fillText('♥', W / 2 - textW / 2 - 25, y);
            }

            ctx.fillStyle = isSelected ? '#ffffff' : '#666666';
            ctx.font = `${isSelected ? 'bold ' : ''}18px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(menuItems[i], W / 2, y);
        }

        // 안내
        const blink = Math.sin(this.menuBlink * 3) > 0;
        if (blink) {
            ctx.fillStyle = '#555555';
            ctx.font = '12px monospace';
            ctx.fillText('Z키 또는 Enter로 선택', W / 2, H - 30);
        }
    },

    renderGameOver(ctx) {
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#880000';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 20);

        const blink = Math.sin(Date.now() / 300) > 0;
        if (blink) {
            ctx.fillStyle = '#666666';
            ctx.font = '16px monospace';
            ctx.fillText('Z키로 타이틀로 돌아가기', W / 2, H / 2 + 40);
        }
    },
};

// 게임 시작
window.addEventListener('load', () => Game.init());
