using UnityEngine;
using UnityEngine.SceneManagement;

public enum GameState
{
    Overworld,
    Battle,
    Dialogue,
    Menu
}

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public GameState CurrentState { get; private set; } = GameState.Overworld;

    // 플레이어 데이터 (씬 전환 시 유지)
    public int PlayerHP { get; set; } = 20;
    public int PlayerMaxHP { get; set; } = 20;
    public int PlayerATK { get; set; } = 5;
    public int PlayerDEF { get; set; } = 3;
    public int PlayerLV { get; set; } = 1;
    public int Gold { get; set; } = 0;

    // 현재 전투 중인 적 이름 (씬 전환 시 전달용)
    public string CurrentEnemyName { get; set; }

    // 오버월드에서 플레이어 위치 기억
    public Vector3 LastOverworldPosition { get; set; }

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void ChangeState(GameState newState)
    {
        CurrentState = newState;
    }

    public void StartBattle(string enemyName)
    {
        CurrentEnemyName = enemyName;

        // 현재 플레이어 위치 저장
        var player = FindFirstObjectByType<PlayerController>();
        if (player != null)
            LastOverworldPosition = player.transform.position;

        ChangeState(GameState.Battle);
        SceneManager.LoadScene("Battle");
    }

    public void EndBattle(bool playerWon)
    {
        ChangeState(GameState.Overworld);
        SceneManager.LoadScene("Overworld");
    }

    public void HealPlayer(int amount)
    {
        PlayerHP = Mathf.Min(PlayerHP + amount, PlayerMaxHP);
    }

    public void DamagePlayer(int amount)
    {
        int actualDamage = Mathf.Max(1, amount - PlayerDEF);
        PlayerHP = Mathf.Max(0, PlayerHP - actualDamage);
    }
}
