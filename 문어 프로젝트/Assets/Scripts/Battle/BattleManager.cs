using System.Collections;
using UnityEngine;

public enum BattleState
{
    Start,
    PlayerTurn,
    EnemyTurn,
    Won,
    Lost,
    Spared // 대화로 설득 성공
}

public class BattleManager : MonoBehaviour
{
    public static BattleManager Instance { get; private set; }

    [Header("References")]
    public BattleUI battleUI;
    public BattleSoul soul;
    public Transform bulletContainer;

    [Header("Battle Box")]
    public RectTransform battleBox; // 총알 피하기 영역

    public BattleState State { get; private set; }
    public EnemyBase CurrentEnemy { get; private set; }

    int turnCount;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        SetupBattle();
    }

    void SetupBattle()
    {
        // 적 생성
        string enemyName = GameManager.Instance?.CurrentEnemyName ?? "Cat";
        CurrentEnemy = CreateEnemy(enemyName);

        battleUI.SetupEnemyInfo(CurrentEnemy);
        battleUI.UpdatePlayerHP(GameManager.Instance.PlayerHP, GameManager.Instance.PlayerMaxHP);

        StartCoroutine(BattleStart());
    }

    EnemyBase CreateEnemy(string enemyName)
    {
        switch (enemyName)
        {
            case "Cat":
                return gameObject.AddComponent<CatBoss>();
            default:
                return gameObject.AddComponent<CatBoss>();
        }
    }

    IEnumerator BattleStart()
    {
        State = BattleState.Start;

        // 적 등장 대사
        yield return battleUI.ShowText($"* {CurrentEnemy.EnemyName}(이)가 나타났다!");
        yield return new WaitForSeconds(1f);

        PlayerTurn();
    }

    public void PlayerTurn()
    {
        State = BattleState.PlayerTurn;
        turnCount++;
        soul.SetActive(false);
        battleUI.ShowActionMenu(true);
        battleUI.ShowText($"* {CurrentEnemy.GetFlavorText(turnCount)}");
    }

    // 플레이어 행동: 싸우기
    public void OnFight()
    {
        battleUI.ShowActionMenu(false);
        StartCoroutine(DoFight());
    }

    IEnumerator DoFight()
    {
        // 공격 데미지 계산
        int damage = Mathf.Max(1, GameManager.Instance.PlayerATK - CurrentEnemy.DEF);
        CurrentEnemy.TakeDamage(damage);

        battleUI.UpdateEnemyHP(CurrentEnemy.CurrentHP, CurrentEnemy.MaxHP);
        yield return battleUI.ShowText($"* 문어의 촉수 공격! {damage} 데미지!");
        yield return new WaitForSeconds(0.5f);

        if (CurrentEnemy.CurrentHP <= 0)
        {
            StartCoroutine(BattleWon());
        }
        else
        {
            StartEnemyTurn();
        }
    }

    // 플레이어 행동: 대화하기
    public void OnTalk()
    {
        battleUI.ShowActionMenu(false);
        StartCoroutine(DoTalk());
    }

    IEnumerator DoTalk()
    {
        string[] options = CurrentEnemy.GetTalkOptions();
        // 대화 선택지 표시
        int choice = -1;
        battleUI.ShowChoices(options, (selected) => choice = selected);

        yield return new WaitUntil(() => choice >= 0);

        string response = CurrentEnemy.OnTalk(choice);
        yield return battleUI.ShowText($"* {response}");
        yield return new WaitForSeconds(0.5f);

        if (CurrentEnemy.Affection >= CurrentEnemy.MaxAffection)
        {
            StartCoroutine(BattleSpared());
        }
        else
        {
            StartEnemyTurn();
        }
    }

    // 플레이어 행동: 아이템
    public void OnItem()
    {
        battleUI.ShowActionMenu(false);
        // MVP에서는 회복 아이템만
        StartCoroutine(DoItem());
    }

    IEnumerator DoItem()
    {
        GameManager.Instance.HealPlayer(5);
        battleUI.UpdatePlayerHP(GameManager.Instance.PlayerHP, GameManager.Instance.PlayerMaxHP);
        yield return battleUI.ShowText("* 먹물 주먹밥을 먹었다! HP가 5 회복되었다!");
        yield return new WaitForSeconds(0.5f);
        StartEnemyTurn();
    }

    // 플레이어 행동: 도망
    public void OnFlee()
    {
        battleUI.ShowActionMenu(false);
        StartCoroutine(DoFlee());
    }

    IEnumerator DoFlee()
    {
        if (CurrentEnemy.CanFlee)
        {
            yield return battleUI.ShowText("* 성공적으로 도망쳤다!");
            yield return new WaitForSeconds(1f);
            GameManager.Instance.EndBattle(false);
        }
        else
        {
            yield return battleUI.ShowText($"* {CurrentEnemy.EnemyName}(이)가 도망치지 못하게 막았다!");
            yield return new WaitForSeconds(0.5f);
            StartEnemyTurn();
        }
    }

    // 적 턴: 총알 피하기
    void StartEnemyTurn()
    {
        State = BattleState.EnemyTurn;
        battleUI.ShowActionMenu(false);
        soul.SetActive(true);

        StartCoroutine(DoEnemyTurn());
    }

    IEnumerator DoEnemyTurn()
    {
        yield return battleUI.ShowText($"* {CurrentEnemy.GetAttackText(turnCount)}");

        // 적 공격 패턴 실행
        float duration = CurrentEnemy.GetAttackDuration(turnCount);
        CurrentEnemy.ExecuteAttackPattern(turnCount, bulletContainer);

        yield return new WaitForSeconds(duration);

        // 총알 제거
        ClearBullets();
        soul.SetActive(false);

        battleUI.UpdatePlayerHP(GameManager.Instance.PlayerHP, GameManager.Instance.PlayerMaxHP);

        if (GameManager.Instance.PlayerHP <= 0)
        {
            StartCoroutine(BattleLost());
        }
        else
        {
            PlayerTurn();
        }
    }

    void ClearBullets()
    {
        foreach (Transform child in bulletContainer)
        {
            Destroy(child.gameObject);
        }
    }

    IEnumerator BattleWon()
    {
        State = BattleState.Won;
        int goldReward = CurrentEnemy.GoldReward;
        GameManager.Instance.Gold += goldReward;

        yield return battleUI.ShowText($"* {CurrentEnemy.EnemyName}(을)를 쓰러뜨렸다!\n* {goldReward}G를 획득했다!");
        yield return new WaitForSeconds(2f);
        GameManager.Instance.EndBattle(true);
    }

    IEnumerator BattleSpared()
    {
        State = BattleState.Spared;
        yield return battleUI.ShowText($"* {CurrentEnemy.EnemyName}(과)와 친구가 되었다!");
        yield return new WaitForSeconds(2f);
        GameManager.Instance.EndBattle(true);
    }

    IEnumerator BattleLost()
    {
        State = BattleState.Lost;
        yield return battleUI.ShowText("* ...\n* 문어는 쓰러졌다.");
        yield return new WaitForSeconds(3f);
        // 게임 오버 처리 (나중에 게임 오버 화면 추가)
        UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
    }
}
