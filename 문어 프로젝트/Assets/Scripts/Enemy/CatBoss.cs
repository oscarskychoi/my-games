using UnityEngine;

/// <summary>
/// 1스테이지 보스: 고양이.
/// 해안가에서 문어를 발견하고 호기심에 공격하는 고양이.
/// 대화로 설득하면 물고기를 좋아한다는 걸 알게 되고 친구가 됨.
/// </summary>
public class CatBoss : EnemyBase
{
    public override string EnemyName => "호기심 고양이";
    public override int MaxHP => 40;
    public override int ATK => 5;
    public override int DEF => 2;
    public override int MaxAffection => 5;
    public override int GoldReward => 15;
    public override bool CanFlee => false; // 보스전은 도망 불가

    bool talkedAboutFish;
    bool petted;
    bool gaveInk;

    public override string GetFlavorText(int turn)
    {
        if (Affection >= 3)
            return "고양이가 경계를 풀고 가까이 다가온다.";

        return turn switch
        {
            1 => "고양이가 촉수를 신기한 듯 바라본다.",
            2 => "고양이가 꼬리를 살랑살랑 흔든다.",
            3 => "고양이가 발톱을 세운다! 조심해!",
            _ => "고양이가 그루밍을 하다가 당신을 본다."
        };
    }

    public override string GetAttackText(int turn)
    {
        if (Affection >= 3)
            return "고양이가 장난스럽게 앞발을 내민다.";

        return turn switch
        {
            1 => "고양이가 앞발을 휘둘렀다!",
            2 => "고양이가 털뭉치를 뱉어냈다!",
            3 => "고양이가 날카로운 발톱으로 할퀸다!",
            _ => "고양이가 돌진한다!"
        };
    }

    public override string[] GetTalkOptions()
    {
        if (Affection >= 3)
            return new[] { "머리 쓰다듬기", "물고기 얘기하기", "같이 놀자고 하기" };

        return new[] { "인사하기", "물고기 얘기하기", "먹물로 장난치기" };
    }

    public override string OnTalk(int choiceIndex)
    {
        switch (choiceIndex)
        {
            case 0: // 인사하기 / 머리 쓰다듬기
                if (Affection >= 3 && !petted)
                {
                    petted = true;
                    Affection += 2;
                    return "고양이가 눈을 감고 그르렁거린다... 좋아하는 것 같다!";
                }
                Affection += 1;
                return "고양이가 고개를 갸우뚱한다. 경계심이 조금 풀린 것 같다.";

            case 1: // 물고기 얘기하기
                if (!talkedAboutFish)
                {
                    talkedAboutFish = true;
                    Affection += 2;
                    return "\"물고기?\" 고양이의 눈이 반짝인다! 공통 관심사를 찾은 것 같다!";
                }
                Affection += 1;
                return "고양이가 침을 흘리며 물고기 얘기에 귀를 기울인다.";

            case 2: // 먹물로 장난치기 / 같이 놀자고 하기
                if (Affection >= 3)
                {
                    Affection += 2;
                    return "고양이가 꼬리를 세우고 신나게 뛰어다닌다! 완전히 마음을 열었다!";
                }
                if (!gaveInk)
                {
                    gaveInk = true;
                    Affection += 1;
                    return "먹물을 살짝 뿌렸다! 고양이가 깜짝 놀랐지만... 재미있어하는 것 같다?";
                }
                return "고양이가 먹물 자국을 핥으며 얼굴을 찡그린다.";

            default:
                return "고양이가 갸우뚱한다.";
        }
    }

    public override void ExecuteAttackPattern(int turn, Transform bulletContainer)
    {
        // 호감도가 높으면 약한 공격
        int bulletDamage = Affection >= 3 ? 1 : ATK;
        float bulletSpeed = Affection >= 3 ? 2f : 3.5f;

        switch (turn % 4)
        {
            case 1: // 발톱 공격 - 위에서 아래로 낙하
                StartCoroutine(BulletPattern.RandomFall(
                    bulletContainer, 12, 0.25f,
                    -2f, 2f, 3f,
                    bulletSpeed, bulletDamage
                ));
                break;

            case 2: // 털뭉치 - 원형 탄막
                StartCoroutine(BulletPattern.CircleSpread(
                    bulletContainer, 8, bulletSpeed, bulletDamage
                ));
                break;

            case 3: // 돌진 - 좌우에서 직선 총알
                StartCoroutine(BulletPattern.StraightLine(
                    bulletContainer, 6, 0.3f,
                    new Vector2(-3f, 0), Vector2.right,
                    bulletSpeed + 1f, bulletDamage
                ));
                StartCoroutine(BulletPattern.StraightLine(
                    bulletContainer, 6, 0.3f,
                    new Vector2(3f, 0), Vector2.left,
                    bulletSpeed + 1f, bulletDamage
                ));
                break;

            case 0: // 추적 공격
                var soul = FindFirstObjectByType<BattleSoul>();
                if (soul != null)
                {
                    StartCoroutine(BulletPattern.HomingShots(
                        bulletContainer, soul.transform, 5, 0.5f,
                        new Vector2(0, 2.5f), bulletSpeed, bulletDamage
                    ));
                }
                break;
        }
    }

    public override float GetAttackDuration(int turn)
    {
        return Affection >= 3 ? 2.5f : 4f;
    }

    protected override void OnDamaged(int amount)
    {
        // HP가 낮아지면 대사 변경 가능
    }
}
