// 키보드 입력 관리
const Input = {
    keys: {},
    justPressed: {},
    _previousKeys: {},

    init() {
        window.addEventListener('keydown', (e) => {
            e.preventDefault();
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            e.preventDefault();
            this.keys[e.code] = false;
        });
    },

    update() {
        // justPressed 계산: 이번 프레임에 새로 눌린 키
        for (const code in this.keys) {
            this.justPressed[code] = this.keys[code] && !this._previousKeys[code];
        }
        this._previousKeys = { ...this.keys };
    },

    isDown(code) {
        return !!this.keys[code];
    },

    isJustPressed(code) {
        return !!this.justPressed[code];
    },

    // 방향키 또는 WASD
    get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); },
    get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); },
    get up() { return this.isDown('ArrowUp') || this.isDown('KeyW'); },
    get down() { return this.isDown('ArrowDown') || this.isDown('KeyS'); },
    get confirm() { return this.isJustPressed('KeyZ') || this.isJustPressed('Enter'); },
    get cancel() { return this.isJustPressed('KeyX') || this.isJustPressed('Escape'); },
};
