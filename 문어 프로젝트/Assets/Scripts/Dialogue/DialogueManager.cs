using System.Collections;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// 오버월드에서 NPC와 대화할 때 사용하는 대화 시스템.
/// 전투 중 대화는 BattleUI에서 별도 처리.
/// </summary>
public class DialogueManager : MonoBehaviour
{
    public static DialogueManager Instance { get; private set; }

    [Header("UI")]
    public GameObject dialoguePanel;
    public Text nameText;
    public Text dialogueText;
    public Text continuePrompt;
    public float textSpeed = 0.03f;

    bool isDialogueActive;
    string[] currentLines;
    int currentLineIndex;
    bool lineComplete;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        dialoguePanel.SetActive(false);
    }

    /// <summary>
    /// 대화 시작
    /// </summary>
    public void StartDialogue(string speakerName, string[] lines)
    {
        if (isDialogueActive) return;

        isDialogueActive = true;
        currentLines = lines;
        currentLineIndex = 0;

        nameText.text = speakerName;
        dialoguePanel.SetActive(true);

        GameManager.Instance?.ChangeState(GameState.Dialogue);

        // 플레이어 이동 멈추기
        var player = FindFirstObjectByType<PlayerController>();
        player?.SetCanMove(false);

        StartCoroutine(DisplayLine());
    }

    IEnumerator DisplayLine()
    {
        lineComplete = false;
        continuePrompt.gameObject.SetActive(false);
        dialogueText.text = "";

        string line = currentLines[currentLineIndex];

        foreach (char c in line)
        {
            dialogueText.text += c;

            if (Input.GetKey(KeyCode.Z) || Input.GetKey(KeyCode.Return))
            {
                dialogueText.text = line;
                break;
            }

            if (c != ' ')
                yield return new WaitForSeconds(textSpeed);
        }

        dialogueText.text = line;
        lineComplete = true;
        continuePrompt.gameObject.SetActive(true);
    }

    void Update()
    {
        if (!isDialogueActive) return;

        if (lineComplete && (Input.GetKeyDown(KeyCode.Z) || Input.GetKeyDown(KeyCode.Return)))
        {
            currentLineIndex++;

            if (currentLineIndex < currentLines.Length)
            {
                StartCoroutine(DisplayLine());
            }
            else
            {
                EndDialogue();
            }
        }
    }

    void EndDialogue()
    {
        isDialogueActive = false;
        dialoguePanel.SetActive(false);

        GameManager.Instance?.ChangeState(GameState.Overworld);

        var player = FindFirstObjectByType<PlayerController>();
        player?.SetCanMove(true);
    }
}

/// <summary>
/// 오버월드 NPC에 붙이는 대화 트리거 컴포넌트
/// </summary>
public class NPCDialogue : MonoBehaviour, IInteractable
{
    public string npcName = "???";
    [TextArea(2, 5)]
    public string[] dialogueLines;

    public void Interact()
    {
        DialogueManager.Instance?.StartDialogue(npcName, dialogueLines);
    }
}
