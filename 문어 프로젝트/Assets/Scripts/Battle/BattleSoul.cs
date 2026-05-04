using UnityEngine;

/// <summary>
/// 전투 중 총알 피하기 모드에서 조작하는 플레이어 영혼 (하트).
/// 언더테일의 빨간 하트에 해당하지만, 문어 게임이므로 작은 문어 아이콘 사용.
/// </summary>
[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(BoxCollider2D))]
public class BattleSoul : MonoBehaviour
{
    public float moveSpeed = 3.5f;

    [Header("Battle Box Bounds")]
    public RectTransform battleBox;

    Rigidbody2D rb;
    BoxCollider2D boxCollider;
    SpriteRenderer spriteRenderer;
    bool isActive;

    // 무적 시간 (피격 후)
    float invincibleTimer;
    public float invincibleDuration = 1f;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;

        boxCollider = GetComponent<BoxCollider2D>();
        boxCollider.isTrigger = true;

        spriteRenderer = GetComponent<SpriteRenderer>();

        SetActive(false);
    }

    void Update()
    {
        if (!isActive) return;

        // 이동 입력
        float moveX = Input.GetAxisRaw("Horizontal");
        float moveY = Input.GetAxisRaw("Vertical");
        Vector2 movement = new Vector2(moveX, moveY).normalized;

        rb.linearVelocity = movement * moveSpeed;

        // 배틀박스 범위 제한
        ClampToBattleBox();

        // 무적 타이머
        if (invincibleTimer > 0)
        {
            invincibleTimer -= Time.deltaTime;
            // 깜빡임 효과
            spriteRenderer.enabled = Mathf.FloorToInt(invincibleTimer * 10) % 2 == 0;
        }
        else
        {
            spriteRenderer.enabled = true;
        }
    }

    void ClampToBattleBox()
    {
        if (battleBox == null) return;

        // 배틀박스의 월드 좌표 경계 계산
        Vector3[] corners = new Vector3[4];
        battleBox.GetWorldCorners(corners);

        float minX = corners[0].x;
        float maxX = corners[2].x;
        float minY = corners[0].y;
        float maxY = corners[2].y;

        // 약간의 패딩
        float padding = 0.1f;
        Vector3 pos = transform.position;
        pos.x = Mathf.Clamp(pos.x, minX + padding, maxX - padding);
        pos.y = Mathf.Clamp(pos.y, minY + padding, maxY - padding);
        transform.position = pos;
    }

    void OnTriggerEnter2D(Collider2D other)
    {
        if (!isActive) return;
        if (invincibleTimer > 0) return;

        if (other.CompareTag("Bullet"))
        {
            var bullet = other.GetComponent<BulletBase>();
            if (bullet != null)
            {
                TakeDamage(bullet.damage);
                if (!bullet.piercing)
                    Destroy(other.gameObject);
            }
        }
    }

    void TakeDamage(int damage)
    {
        GameManager.Instance.DamagePlayer(damage);
        invincibleTimer = invincibleDuration;

        // 피격 사운드 재생 (나중에 AudioManager 연결)
    }

    public void SetActive(bool active)
    {
        isActive = active;
        gameObject.SetActive(active);

        if (active)
        {
            // 배틀박스 중앙으로 리셋
            if (battleBox != null)
            {
                transform.position = battleBox.transform.position;
            }
            rb.linearVelocity = Vector2.zero;
            invincibleTimer = 0;
        }
    }
}
