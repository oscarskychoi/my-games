using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class MainMenuUI : MonoBehaviour
{
    public Button startButton;
    public Button continueButton;
    public Button quitButton;
    public Text titleText;

    void Start()
    {
        titleText.text = "OCTOPUS TALE";

        startButton.onClick.AddListener(OnStart);
        quitButton.onClick.AddListener(OnQuit);

        // 세이브 데이터 있으면 이어하기 활성화 (MVP에서는 비활성)
        continueButton.interactable = false;
    }

    void OnStart()
    {
        // GameManager 초기화
        if (GameManager.Instance != null)
        {
            GameManager.Instance.PlayerHP = GameManager.Instance.PlayerMaxHP;
            GameManager.Instance.Gold = 0;
            GameManager.Instance.PlayerLV = 1;
        }

        SceneManager.LoadScene("Overworld");
    }

    void OnQuit()
    {
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#else
        Application.Quit();
#endif
    }
}
