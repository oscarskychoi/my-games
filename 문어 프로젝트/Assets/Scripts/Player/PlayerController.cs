using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(BoxCollider2D))]
public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 4f;
    public float interactDistance = 1f;
    public LayerMask interactableLayer;

    Rigidbody2D rb;
    Animator animator;
    Vector2 movement;
    Vector2 lastDirection = Vector2.down;
    bool canMove = true;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;

        animator = GetComponent<Animator>();

        // 씬 전환 후 이전 위치 복원
        if (GameManager.Instance != null && GameManager.Instance.LastOverworldPosition != Vector3.zero)
        {
            transform.position = GameManager.Instance.LastOverworldPosition;
        }
    }

    void Update()
    {
        if (!canMove || GameManager.Instance?.CurrentState != GameState.Overworld)
        {
            movement = Vector2.zero;
            return;
        }

        // 이동 입력
        movement.x = Input.GetAxisRaw("Horizontal");
        movement.y = Input.GetAxisRaw("Vertical");

        // 대각선 이동 방지 (언더테일처럼)
        if (movement.x != 0)
            movement.y = 0;

        if (movement != Vector2.zero)
            lastDirection = movement;

        // 애니메이터 파라미터 업데이트
        if (animator != null)
        {
            animator.SetFloat("MoveX", movement.x);
            animator.SetFloat("MoveY", movement.y);
            animator.SetFloat("LastMoveX", lastDirection.x);
            animator.SetFloat("LastMoveY", lastDirection.y);
            animator.SetBool("IsMoving", movement != Vector2.zero);
        }

        // 상호작용 (Z키 또는 Enter)
        if (Input.GetKeyDown(KeyCode.Z) || Input.GetKeyDown(KeyCode.Return))
        {
            TryInteract();
        }
    }

    void FixedUpdate()
    {
        rb.linearVelocity = movement.normalized * moveSpeed;
    }

    void TryInteract()
    {
        // lastDirection 방향으로 레이캐스트
        RaycastHit2D hit = Physics2D.Raycast(
            transform.position,
            lastDirection,
            interactDistance,
            interactableLayer
        );

        if (hit.collider != null)
        {
            var interactable = hit.collider.GetComponent<IInteractable>();
            interactable?.Interact();
        }
    }

    public void SetCanMove(bool value)
    {
        canMove = value;
        if (!value)
        {
            movement = Vector2.zero;
            rb.linearVelocity = Vector2.zero;
        }
    }

    // 적과 충돌 시 전투 시작
    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Enemy"))
        {
            var enemy = other.GetComponent<EnemyEncounter>();
            if (enemy != null)
            {
                GameManager.Instance.StartBattle(enemy.enemyName);
            }
        }
    }
}

// 상호작용 가능한 오브젝트 인터페이스
public interface IInteractable
{
    void Interact();
}

// 오버월드에서 적 조우용 컴포넌트
public class EnemyEncounter : MonoBehaviour
{
    public string enemyName = "Cat";
}
