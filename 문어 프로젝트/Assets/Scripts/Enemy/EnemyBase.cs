using UnityEngine;

/// <summary>
/// 모든 적의 기본 클래스.
/// 보스마다 이 클래스를 상속하여 고유한 대사, 공격 패턴, 대화 반응을 구현.
/// </summary>
public abstract class EnemyBase : MonoBehaviour
{
    // 기본 스탯
    public abstract string EnemyName { get; }
    public abstract int MaxHP { get; }
    public abstract int ATK { get; }
    public abstract int DEF { get; }

    // 호감도 (대화하기로 올림)
    public abstract int MaxAffection { get; }
    public int Affection { get; protected set; }

    // 현재 HP
    public int CurrentHP { get; protected set; }

    // 전투용 스프라이트
    public virtual Sprite BattleSprite => null;

    // 도망 가능 여부
    public virtual bool CanFlee => true;

    // 처치 보상
    public virtual int GoldReward => 10;

    protected virtual void Awake()
    {
        CurrentHP = MaxHP;
        Affection = 0;
    }

    public void TakeDamage(int amount)
    {
        CurrentHP = Mathf.Max(0, CurrentHP - amount);
        OnDamaged(amount);
    }

    /// <summary>
    /// 턴마다 표시되는 적 상태 텍스트 (언더테일의 * Froggit이 당신을 물끄러미 쳐다본다)
    /// </summary>
    public abstract string GetFlavorText(int turn);

    /// <summary>
    /// 적 공격 시 표시되는 텍스트
    /// </summary>
    public abstract string GetAttackText(int turn);

    /// <summary>
    /// 대화 선택지 목록
    /// </summary>
    public abstract string[] GetTalkOptions();

    /// <summary>
    /// 대화 선택 시 적의 반응. 호감도를 올리는 로직 포함.
    /// </summary>
    public abstract string OnTalk(int choiceIndex);

    /// <summary>
    /// 공격 패턴 실행. 턴 수에 따라 다른 패턴 사용.
    /// </summary>
    public abstract void ExecuteAttackPattern(int turn, Transform bulletContainer);

    /// <summary>
    /// 공격 패턴 지속 시간
    /// </summary>
    public virtual float GetAttackDuration(int turn) => 4f;

    /// <summary>
    /// 데미지 받았을 때 반응 (선택적 오버라이드)
    /// </summary>
    protected virtual void OnDamaged(int amount) { }
}
