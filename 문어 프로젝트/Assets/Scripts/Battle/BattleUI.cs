using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class BattleUI : MonoBehaviour
{
    [Header("Text")]
    public Text dialogueText;
    public float textSpeed = 0.03f;

    [Header("Action Buttons")]
    public GameObject actionPanel;
    public Button fightButton;
    public Button talkButton;
    public Button itemButton;
    public Button fleeButton;

    [Header("Choice Panel")]
    public GameObject choicePanel;
    public Button[] choiceButtons;
    public Text[] choiceTexts;

    [Header("HP Bars")]
    public Slider playerHPBar;
    public Text playerHPText;
    public Slider enemyHPBar;
    public Text enemyNameText;

    [Header("Enemy Display")]
    public Image enemySpriteImage;

    int selectedAction;
    bool textComplete;

    void Start()
    {
        fightButton.onClick.AddListener(() => BattleManager.Instance.OnFight());
        talkButton.onClick.AddListener(() => BattleManager.Instance.OnTalk());
        itemButton.onClick.AddListener(() => BattleManager.Instance.OnItem());
        fleeButton.onClick.AddListener(() => BattleManager.Instance.OnFlee());

        choicePanel.SetActive(false);
    }

    public void SetupEnemyInfo(EnemyBase enemy)
    {
        enemyNameText.text = enemy.EnemyName;
        enemyHPBar.maxValue = enemy.MaxHP;
        enemyHPBar.value = enemy.CurrentHP;

        if (enemy.BattleSprite != null)
            enemySpriteImage.sprite = enemy.BattleSprite;
    }

    public void UpdatePlayerHP(int current, int max)
    {
        playerHPBar.maxValue = max;
        playerHPBar.value = current;
        playerHPText.text = $"HP {current}/{max}";
    }

    public void UpdateEnemyHP(int current, int max)
    {
        enemyHPBar.value = current;
    }

    public void ShowActionMenu(bool show)
    {
        actionPanel.SetActive(show);
        if (show)
        {
            // 첫 번째 버튼 자동 선택
            fightButton.Select();
        }
    }

    public Coroutine ShowText(string text)
    {
        return StartCoroutine(TypeText(text));
    }

    IEnumerator TypeText(string text)
    {
        textComplete = false;
        dialogueText.text = "";

        foreach (char c in text)
        {
            dialogueText.text += c;

            // Z키나 Enter로 빠르게 넘기기
            if (Input.GetKey(KeyCode.Z) || Input.GetKey(KeyCode.Return))
            {
                dialogueText.text = text;
                break;
            }

            if (c != ' ')
                yield return new WaitForSeconds(textSpeed);
        }

        dialogueText.text = text;
        textComplete = true;

        // Z키로 확인 대기
        yield return new WaitUntil(() =>
            Input.GetKeyDown(KeyCode.Z) || Input.GetKeyDown(KeyCode.Return));
    }

    public void ShowChoices(string[] options, Action<int> onSelected)
    {
        choicePanel.SetActive(true);

        for (int i = 0; i < choiceButtons.Length; i++)
        {
            if (i < options.Length)
            {
                choiceButtons[i].gameObject.SetActive(true);
                choiceTexts[i].text = options[i];

                int index = i; // 클로저용 로컬 변수
                choiceButtons[i].onClick.RemoveAllListeners();
                choiceButtons[i].onClick.AddListener(() =>
                {
                    choicePanel.SetActive(false);
                    onSelected(index);
                });
            }
            else
            {
                choiceButtons[i].gameObject.SetActive(false);
            }
        }

        // 첫 번째 선택지 자동 선택
        if (options.Length > 0)
            choiceButtons[0].Select();
    }
}
