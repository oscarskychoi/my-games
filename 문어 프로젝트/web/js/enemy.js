// 적 기본 클래스
class EnemyBase {
    constructor() {
        this.currentHP = this.maxHP;
        this.affection = 0;
    }

    get name() { return '???'; }
    get maxHP() { return 20; }
    get atk() { return 3; }
    get def() { return 1; }
    get maxAffection() { return 5; }
    get canFlee() { return true; }
    get goldReward() { return 10; }

    takeDamage(amount) {
        const actual = Math.max(1, amount - this.def);
        this.currentHP = Math.max(0, this.currentHP - actual);
        return actual;
    }

    getFlavorText(turn) { return '...'; }
    getAttackText(turn) { return '적이 공격한다!'; }
    getTalkOptions() { return ['대화하기']; }
    onTalk(choiceIndex) { return { text: '...', affectionGain: 0 }; }

    // 공격 패턴 반환: { bullets: [...], duration: seconds }
    getAttackPattern(turn, boxBounds) { return { bullets: [], duration: 3 }; }
}

// 1스테이지 보스: 호기심 고양이
class CatBoss extends EnemyBase {
    constructor() {
        super();
        this.talkedAboutFish = false;
        this.petted = false;
        this.gaveInk = false;
    }

    get name() { return '호기심 고양이'; }
    get maxHP() { return 40; }
    get atk() { return 5; }
    get def() { return 2; }
    get maxAffection() { return 5; }
    get canFlee() { return false; }
    get goldReward() { return 15; }

    getFlavorText(turn) {
        if (this.affection >= 3)
            return '고양이가 경계를 풀고 가까이 다가온다.';

        const texts = [
            '고양이가 촉수를 신기한 듯 바라본다.',
            '고양이가 꼬리를 살랑살랑 흔든다.',
            '고양이가 발톱을 세운다! 조심해!',
            '고양이가 그루밍을 하다가 당신을 본다.',
        ];
        return texts[(turn - 1) % texts.length];
    }

    getAttackText(turn) {
        if (this.affection >= 3)
            return '고양이가 장난스럽게 앞발을 내민다.';

        const texts = [
            '고양이가 앞발을 휘둘렀다!',
            '고양이가 털뭉치를 뱉어냈다!',
            '고양이가 날카로운 발톱으로 할퀸다!',
            '고양이가 돌진한다!',
        ];
        return texts[(turn - 1) % texts.length];
    }

    getTalkOptions() {
        if (this.affection >= 3)
            return ['머리 쓰다듬기', '물고기 얘기하기', '같이 놀자고 하기'];
        return ['인사하기', '물고기 얘기하기', '먹물로 장난치기'];
    }

    onTalk(choiceIndex) {
        switch (choiceIndex) {
            case 0:
                if (this.affection >= 3 && !this.petted) {
                    this.petted = true;
                    this.affection += 2;
                    return { text: '고양이가 눈을 감고 그르렁거린다... 좋아하는 것 같다!', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '고양이가 고개를 갸우뚱한다. 경계심이 조금 풀린 것 같다.', affectionGain: 1 };

            case 1:
                if (!this.talkedAboutFish) {
                    this.talkedAboutFish = true;
                    this.affection += 2;
                    return { text: '"물고기?" 고양이의 눈이 반짝인다! 공통 관심사를 찾은 것 같다!', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '고양이가 침을 흘리며 물고기 얘기에 귀를 기울인다.', affectionGain: 1 };

            case 2:
                if (this.affection >= 3) {
                    this.affection += 2;
                    return { text: '고양이가 꼬리를 세우고 신나게 뛰어다닌다! 완전히 마음을 열었다!', affectionGain: 2 };
                }
                if (!this.gaveInk) {
                    this.gaveInk = true;
                    this.affection += 1;
                    return { text: '먹물을 살짝 뿌렸다! 고양이가 깜짝 놀랐지만... 재미있어하는 것 같다?', affectionGain: 1 };
                }
                return { text: '고양이가 먹물 자국을 핥으며 얼굴을 찡그린다.', affectionGain: 0 };

            default:
                return { text: '고양이가 갸우뚱한다.', affectionGain: 0 };
        }
    }

    getAttackPattern(turn, boxBounds) {
        const bullets = [];
        const isGentle = this.affection >= 3;
        const dmg = isGentle ? 1 : this.atk;
        const spd = isGentle ? 1.5 : 3;
        const duration = isGentle ? 2.5 : 4;

        const pattern = turn % 4;
        const cx = (boxBounds.left + boxBounds.right) / 2;
        const cy = (boxBounds.top + boxBounds.bottom) / 2;

        switch (pattern) {
            case 1: // 발톱 낙하
                for (let i = 0; i < 15; i++) {
                    bullets.push({
                        x: boxBounds.left + Math.random() * (boxBounds.right - boxBounds.left),
                        y: boxBounds.top - 20,
                        vx: 0,
                        vy: spd,
                        damage: dmg,
                        type: 'claw',
                        delay: i * 0.2,
                    });
                }
                break;

            case 2: // 털뭉치 원형 탄막
                for (let i = 0; i < 10; i++) {
                    const angle = (Math.PI * 2 / 10) * i;
                    bullets.push({
                        x: cx,
                        y: cy,
                        vx: Math.cos(angle) * spd,
                        vy: Math.sin(angle) * spd,
                        damage: dmg,
                        type: 'furball',
                        delay: 0,
                    });
                }
                break;

            case 3: // 좌우 직선 공격
                for (let i = 0; i < 8; i++) {
                    // 왼쪽에서
                    bullets.push({
                        x: boxBounds.left - 10,
                        y: boxBounds.top + (i + 1) * ((boxBounds.bottom - boxBounds.top) / 9),
                        vx: spd * 1.2,
                        vy: 0,
                        damage: dmg,
                        type: 'claw',
                        delay: i * 0.15,
                    });
                    // 오른쪽에서
                    bullets.push({
                        x: boxBounds.right + 10,
                        y: boxBounds.top + (i + 0.5) * ((boxBounds.bottom - boxBounds.top) / 9),
                        vx: -spd * 1.2,
                        vy: 0,
                        damage: dmg,
                        type: 'claw',
                        delay: i * 0.15 + 0.1,
                    });
                }
                break;

            case 0: // 추적 공격 (중앙에서 퍼짐 → 소용돌이)
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI * 2 / 12) * i + (turn * 0.5);
                    bullets.push({
                        x: cx,
                        y: cy - 30,
                        vx: Math.cos(angle) * spd * 0.8,
                        vy: Math.sin(angle) * spd * 0.8,
                        damage: dmg,
                        type: 'furball',
                        delay: i * 0.1,
                    });
                }
                break;
        }

        return { bullets, duration };
    }
}

// 2스테이지 보스: 위풍당당 독수리
class EagleBoss extends EnemyBase {
    constructor() {
        super();
        this.toldAboutSky = false;
        this.sharedFish = false;
        this.showedInk = false;
    }

    get name() { return '위풍당당 독수리'; }
    get maxHP() { return 60; }
    get atk() { return 7; }
    get def() { return 3; }
    get maxAffection() { return 6; }
    get canFlee() { return false; }
    get goldReward() { return 25; }

    getFlavorText(turn) {
        if (this.affection >= 4)
            return '독수리가 날개를 접고 편안하게 앉아있다.';
        const texts = [
            '독수리가 날카로운 눈으로 내려다본다.',
            '독수리가 거대한 날개를 펼쳤다. 바람이 거세다!',
            '독수리가 발톱으로 땅을 긁는다.',
            '독수리가 하늘을 올려다보며 울음소리를 낸다.',
        ];
        return texts[(turn - 1) % texts.length];
    }

    getAttackText(turn) {
        if (this.affection >= 4)
            return '독수리가 살랑살랑 깃털을 흔든다.';
        const texts = [
            '독수리가 깃털을 날렸다!',
            '독수리가 급강하한다!',
            '독수리의 날갯짓이 돌풍을 일으켰다!',
            '독수리가 날카로운 발톱으로 할퀸다!',
        ];
        return texts[(turn - 1) % texts.length];
    }

    getTalkOptions() {
        if (this.affection >= 4)
            return ['하늘 얘기하기', '물고기 나눠주기', '같이 바다 구경하자고 하기'];
        return ['하늘에 대해 묻기', '물고기 나눠주기', '먹물로 그림 그리기'];
    }

    onTalk(choiceIndex) {
        switch (choiceIndex) {
            case 0:
                if (!this.toldAboutSky) {
                    this.toldAboutSky = true;
                    this.affection += 2;
                    return { text: '"하늘?" 독수리의 눈이 부드러워졌다. 바다와 하늘... 비슷한 점이 있구나.', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '독수리가 하늘 이야기에 고개를 끄덕인다.', affectionGain: 1 };
            case 1:
                if (!this.sharedFish) {
                    this.sharedFish = true;
                    this.affection += 2;
                    return { text: '물고기를 건넸다! 독수리가 맛있게 먹는다. 음식은 최고의 외교수단!', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '독수리가 고맙다는 듯 울음소리를 낸다.', affectionGain: 1 };
            case 2:
                if (this.affection >= 4) {
                    this.affection += 2;
                    return { text: '독수리가 문어를 등에 태워준다! 하늘과 바다의 우정이 시작되었다!', affectionGain: 2 };
                }
                if (!this.showedInk) {
                    this.showedInk = true;
                    this.affection += 1;
                    return { text: '먹물로 하늘과 구름을 그렸다! 독수리가 신기하게 쳐다본다.', affectionGain: 1 };
                }
                return { text: '독수리가 먹물 그림을 다시 쳐다보며 감탄한다.', affectionGain: 0 };
            default:
                return { text: '독수리가 고개를 돌린다.', affectionGain: 0 };
        }
    }

    getAttackPattern(turn, boxBounds) {
        const bullets = [];
        const isGentle = this.affection >= 4;
        const dmg = isGentle ? 1 : this.atk;
        const spd = isGentle ? 1.5 : 3.5;
        const duration = isGentle ? 2.5 : 5;
        const cx = (boxBounds.left + boxBounds.right) / 2;
        const cy = (boxBounds.top + boxBounds.bottom) / 2;
        const w = boxBounds.right - boxBounds.left;
        const h = boxBounds.bottom - boxBounds.top;

        switch (turn % 4) {
            case 1: // 깃털 비 - 위에서 대각선으로 낙하
                for (let i = 0; i < 18; i++) {
                    bullets.push({
                        x: boxBounds.left + Math.random() * w,
                        y: boxBounds.top - 20,
                        vx: (Math.random() - 0.5) * spd * 0.5,
                        vy: spd,
                        damage: dmg, type: 'feather', delay: i * 0.15,
                    });
                }
                break;
            case 2: // 급강하 - 빠른 직선이 번갈아 좌우로
                for (let i = 0; i < 6; i++) {
                    const fromLeft = i % 2 === 0;
                    bullets.push({
                        x: fromLeft ? boxBounds.left - 15 : boxBounds.right + 15,
                        y: boxBounds.top + h * 0.2 + (i * h * 0.12),
                        vx: (fromLeft ? 1 : -1) * spd * 1.8,
                        vy: spd * 0.3,
                        damage: dmg + 1, type: 'talon', delay: i * 0.4,
                    });
                }
                break;
            case 3: // 돌풍 - 오른쪽으로 밀어내는 총알 벽
                for (let wave = 0; wave < 3; wave++) {
                    for (let i = 0; i < 6; i++) {
                        const gap = Math.floor(Math.random() * 6);
                        if (i === gap) continue;
                        bullets.push({
                            x: boxBounds.left - 15,
                            y: boxBounds.top + (i + 0.5) * (h / 6),
                            vx: spd * 1.2,
                            vy: 0,
                            damage: dmg, type: 'feather', delay: wave * 1.2 + 0.05 * i,
                        });
                    }
                }
                break;
            case 0: // 소용돌이 나선 탄막
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 / 20) * i * 3 + turn;
                    bullets.push({
                        x: cx, y: cy - 20,
                        vx: Math.cos(angle) * spd * 0.9,
                        vy: Math.sin(angle) * spd * 0.9,
                        damage: dmg, type: 'feather', delay: i * 0.12,
                    });
                }
                break;
        }
        return { bullets, duration };
    }
}

// 3스테이지 보스: 용맹한 사자
class LionBoss extends EnemyBase {
    constructor() {
        super();
        this.complimented = false;
        this.sharedStory = false;
        this.dancedTogether = false;
    }

    get name() { return '용맹한 사자'; }
    get maxHP() { return 80; }
    get atk() { return 9; }
    get def() { return 4; }
    get maxAffection() { return 7; }
    get canFlee() { return false; }
    get goldReward() { return 40; }

    getFlavorText(turn) {
        if (this.affection >= 5)
            return '사자가 편안하게 누워서 꼬리를 흔든다.';
        const texts = [
            '사자가 위엄있게 당신을 내려다본다.',
            '사자의 갈기가 바람에 휘날린다.',
            '사자가 낮게 으르렁거린다... 위압감이 대단하다!',
            '사자가 하품을 한다. 여유로워 보이지만 방심은 금물!',
        ];
        return texts[(turn - 1) % texts.length];
    }

    getAttackText(turn) {
        if (this.affection >= 5)
            return '사자가 장난스럽게 앞발을 뻗는다.';
        const texts = [
            '사자가 포효했다! 충격파가 몰려온다!',
            '사자가 돌진한다!',
            '사자의 갈기에서 불꽃이 튀었다!',
            '사자가 거대한 앞발로 내리찍는다!',
        ];
        return texts[(turn - 1) % texts.length];
    }

    getTalkOptions() {
        if (this.affection >= 5)
            return ['갈기 칭찬하기', '바다 왕에 대해 얘기하기', '함께 춤추자고 하기'];
        return ['갈기 칭찬하기', '바다 이야기 들려주기', '먹물 춤 보여주기'];
    }

    onTalk(choiceIndex) {
        switch (choiceIndex) {
            case 0:
                if (!this.complimented) {
                    this.complimented = true;
                    this.affection += 2;
                    return { text: '사자가 갈기를 흔들며 뿌듯해한다! 왕의 자존심을 건드린 건 좋은 방향이었다!', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '사자가 으쓱하며 갈기를 정돈한다.', affectionGain: 1 };
            case 1:
                if (!this.sharedStory) {
                    this.sharedStory = true;
                    this.affection += 2;
                    return { text: '심해의 이야기에 사자가 귀를 쫑긋 세운다. "바다에도 왕이 있다고?"', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '사자가 바다 이야기를 더 듣고 싶어한다.', affectionGain: 1 };
            case 2:
                if (this.affection >= 5 && !this.dancedTogether) {
                    this.dancedTogether = true;
                    this.affection += 2;
                    return { text: '사자와 문어가 함께 춤을 춘다! 육지의 왕과 바다의 모험가, 멋진 콤비다!', affectionGain: 2 };
                }
                if (this.affection < 5) {
                    this.affection += 1;
                    return { text: '촉수로 춤을 췄다! 사자가 어이없다는 듯 보다가... 피식 웃었다!', affectionGain: 1 };
                }
                return { text: '사자가 리듬에 맞춰 꼬리를 흔든다.', affectionGain: 0 };
            default:
                return { text: '사자가 무심한 듯 쳐다본다.', affectionGain: 0 };
        }
    }

    getAttackPattern(turn, boxBounds) {
        const bullets = [];
        const isGentle = this.affection >= 5;
        const dmg = isGentle ? 1 : this.atk;
        const spd = isGentle ? 1.5 : 4;
        const duration = isGentle ? 3 : 5.5;
        const cx = (boxBounds.left + boxBounds.right) / 2;
        const cy = (boxBounds.top + boxBounds.bottom) / 2;
        const w = boxBounds.right - boxBounds.left;
        const h = boxBounds.bottom - boxBounds.top;

        switch (turn % 4) {
            case 1: // 포효 충격파 - 중심에서 동심원 확장
                for (let wave = 0; wave < 3; wave++) {
                    const count = 12 + wave * 4;
                    for (let i = 0; i < count; i++) {
                        const angle = (Math.PI * 2 / count) * i + wave * 0.3;
                        bullets.push({
                            x: cx, y: cy,
                            vx: Math.cos(angle) * spd * (0.7 + wave * 0.2),
                            vy: Math.sin(angle) * spd * (0.7 + wave * 0.2),
                            damage: dmg, type: 'shockwave', delay: wave * 1.0,
                        });
                    }
                }
                break;
            case 2: // 돌진 - 거대한 총알이 좌→우로 3줄
                for (let wave = 0; wave < 3; wave++) {
                    const gapY = boxBounds.top + Math.random() * h * 0.7 + h * 0.15;
                    for (let i = 0; i < 8; i++) {
                        const y = boxBounds.top + (i + 0.5) * (h / 8);
                        if (Math.abs(y - gapY) < h / 8) continue; // 빈틈
                        bullets.push({
                            x: boxBounds.left - 20,
                            y: y,
                            vx: spd * 1.5,
                            vy: 0,
                            damage: dmg + 2, type: 'paw', delay: wave * 1.3,
                        });
                    }
                }
                break;
            case 3: // 불꽃 갈기 - 위에서 불꽃이 흩뿌려짐
                for (let i = 0; i < 24; i++) {
                    bullets.push({
                        x: boxBounds.left + Math.random() * w,
                        y: boxBounds.top - 15,
                        vx: (Math.random() - 0.5) * spd * 0.4,
                        vy: spd * (0.8 + Math.random() * 0.4),
                        damage: dmg, type: 'flame', delay: i * 0.12,
                    });
                }
                break;
            case 0: // 내리찍기 - 상하좌우에서 번갈아 공격
                for (let dir = 0; dir < 4; dir++) {
                    for (let i = 0; i < 5; i++) {
                        let x, y, vx, vy;
                        const offset = (i + 0.5) / 5;
                        if (dir === 0) { x = boxBounds.left + offset * w; y = boxBounds.top - 15; vx = 0; vy = spd; }
                        else if (dir === 1) { x = boxBounds.right + 15; y = boxBounds.top + offset * h; vx = -spd; vy = 0; }
                        else if (dir === 2) { x = boxBounds.left + offset * w; y = boxBounds.bottom + 15; vx = 0; vy = -spd; }
                        else { x = boxBounds.left - 15; y = boxBounds.top + offset * h; vx = spd; vy = 0; }
                        bullets.push({ x, y, vx, vy, damage: dmg, type: 'paw', delay: dir * 0.8 + i * 0.08 });
                    }
                }
                break;
        }
        return { bullets, duration };
    }
}

// 최종 보스: 탐욕스러운 인간
class HumanBoss extends EnemyBase {
    constructor() {
        super();
        this.talkedOcean = false;
        this.talkedPollution = false;
        this.showedBeauty = false;
        this.phase2 = false;
    }

    get name() { return '탐욕스러운 인간'; }
    get maxHP() { return 120; }
    get atk() { return 10; }
    get def() { return 5; }
    get maxAffection() { return 8; }
    get canFlee() { return false; }
    get goldReward() { return 100; }

    getFlavorText(turn) {
        if (this.affection >= 6)
            return '인간이 진심으로 당신의 말에 귀를 기울인다.';
        if (this.currentHP < this.maxHP * 0.3 && !this.phase2) {
            this.phase2 = true;
            return '인간의 눈빛이 변했다! "이 생물... 보통이 아니군!"';
        }
        const texts = [
            '인간이 그물을 들고 있다. 눈빛이 탐욕스럽다.',
            '인간이 카메라를 꺼냈다! 희귀 생물 포획에 눈이 멀었다!',
            '인간이 주변에 쓰레기를 버린다. 바다가 더러워진다...',
            '인간이 무전기로 동료를 부른다!',
        ];
        return texts[(turn - 1) % texts.length];
    }

    getAttackText(turn) {
        if (this.affection >= 6)
            return '인간이 조심스럽게 손을 내민다.';
        const texts = [
            '인간이 그물을 던졌다!',
            '인간이 쓰레기를 투척한다!',
            '카메라 플래시가 터졌다! 눈이 부시다!',
            '인간이 포획 장비를 가동한다!',
        ];
        return texts[(turn - 1) % texts.length];
    }

    getTalkOptions() {
        if (this.affection >= 6)
            return ['바다의 아름다움 보여주기', '공존을 제안하기', '촉수로 악수하기'];
        return ['바다에 대해 이야기하기', '오염에 대해 항의하기', '바다의 아름다움 보여주기'];
    }

    onTalk(choiceIndex) {
        switch (choiceIndex) {
            case 0:
                if (!this.talkedOcean) {
                    this.talkedOcean = true;
                    this.affection += 2;
                    return { text: '심해의 신비로운 이야기에 인간이 잠시 멈칫한다. "정말... 그런 세계가?"', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '인간이 바다 이야기에 점점 관심을 보인다.', affectionGain: 1 };
            case 1:
                if (!this.talkedPollution) {
                    this.talkedPollution = true;
                    this.affection += 2;
                    return { text: '먹물로 오염된 바다를 그려 보여줬다. 인간이 부끄러운 듯 고개를 숙인다.', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '"미안하다..." 인간이 진심으로 반성하는 것 같다.', affectionGain: 1 };
            case 2:
                if (this.affection >= 6 && !this.showedBeauty) {
                    this.showedBeauty = true;
                    this.affection += 2;
                    return { text: '촉수로 악수를 건넸다. 인간이 따뜻하게 잡는다. "함께 바다를 지키자."', affectionGain: 2 };
                }
                if (!this.showedBeauty) {
                    this.showedBeauty = true;
                    this.affection += 2;
                    return { text: '먹물로 산호초와 물고기를 그려보였다! 인간의 눈에 감동이 어린다!', affectionGain: 2 };
                }
                this.affection += 1;
                return { text: '인간이 먹물 그림을 카메라에 담으며 미소짓는다.', affectionGain: 1 };
            default:
                return { text: '인간이 어리둥절한 표정을 짓는다.', affectionGain: 0 };
        }
    }

    getAttackPattern(turn, boxBounds) {
        const bullets = [];
        const isGentle = this.affection >= 6;
        const dmg = isGentle ? 1 : this.atk;
        const spd = isGentle ? 1.5 : 4;
        const duration = isGentle ? 3 : 6;
        const cx = (boxBounds.left + boxBounds.right) / 2;
        const cy = (boxBounds.top + boxBounds.bottom) / 2;
        const w = boxBounds.right - boxBounds.left;
        const h = boxBounds.bottom - boxBounds.top;
        const isPhase2 = this.phase2 && !isGentle;

        switch (turn % 4) {
            case 1: // 그물 공격 - 격자 패턴 (빈틈 찾아 피해야 함)
                const gridSize = isPhase2 ? 5 : 4;
                const gapX = Math.floor(Math.random() * gridSize);
                const gapY = Math.floor(Math.random() * gridSize);
                for (let gx = 0; gx < gridSize; gx++) {
                    for (let gy = 0; gy < gridSize; gy++) {
                        if (Math.abs(gx - gapX) <= 1 && Math.abs(gy - gapY) <= 1) continue;
                        bullets.push({
                            x: boxBounds.left + (gx + 0.5) * (w / gridSize),
                            y: boxBounds.top - 30,
                            vx: 0, vy: spd * 0.8,
                            damage: dmg, type: 'net', delay: 0.3 + gx * 0.05,
                        });
                    }
                }
                break;
            case 2: // 쓰레기 투척 - 랜덤 위치에서 다양한 크기
                const count = isPhase2 ? 25 : 18;
                for (let i = 0; i < count; i++) {
                    const side = Math.floor(Math.random() * 4);
                    let x, y, vx, vy;
                    if (side === 0) { x = boxBounds.left + Math.random() * w; y = boxBounds.top - 20; vx = (Math.random() - 0.5) * spd * 0.3; vy = spd; }
                    else if (side === 1) { x = boxBounds.right + 20; y = boxBounds.top + Math.random() * h; vx = -spd; vy = (Math.random() - 0.5) * spd * 0.3; }
                    else if (side === 2) { x = boxBounds.left + Math.random() * w; y = boxBounds.bottom + 20; vx = (Math.random() - 0.5) * spd * 0.3; vy = -spd; }
                    else { x = boxBounds.left - 20; y = boxBounds.top + Math.random() * h; vx = spd; vy = (Math.random() - 0.5) * spd * 0.3; }
                    bullets.push({ x, y, vx, vy, damage: dmg, type: 'trash', delay: i * 0.15 });
                }
                break;
            case 3: // 카메라 플래시 - 화면 중심에서 십자+X자 방사
                for (let burst = 0; burst < (isPhase2 ? 3 : 2); burst++) {
                    const angleOffset = burst * Math.PI / 8;
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI / 4) * i + angleOffset;
                        bullets.push({
                            x: cx, y: cy,
                            vx: Math.cos(angle) * spd * 1.2,
                            vy: Math.sin(angle) * spd * 1.2,
                            damage: dmg, type: 'flash', delay: burst * 1.0,
                        });
                    }
                }
                break;
            case 0: // 복합 패턴 - 위아래 동시 + 좌우 벽
                // 위아래
                for (let i = 0; i < 8; i++) {
                    bullets.push({
                        x: boxBounds.left + (i + 0.5) * (w / 8),
                        y: boxBounds.top - 15,
                        vx: 0, vy: spd,
                        damage: dmg, type: 'net', delay: i * 0.1,
                    });
                    bullets.push({
                        x: boxBounds.left + (i + 1) * (w / 9),
                        y: boxBounds.bottom + 15,
                        vx: 0, vy: -spd,
                        damage: dmg, type: 'trash', delay: i * 0.1 + 1.5,
                    });
                }
                // 좌우 추가 (phase2)
                if (isPhase2) {
                    for (let i = 0; i < 5; i++) {
                        bullets.push({
                            x: boxBounds.left - 15,
                            y: boxBounds.top + (i + 0.5) * (h / 5),
                            vx: spd * 1.3, vy: 0,
                            damage: dmg + 2, type: 'net', delay: 3.0 + i * 0.15,
                        });
                    }
                }
                break;
        }
        return { bullets, duration };
    }
}
