using UnityEngine;

/// <summary>
/// 모든 총알의 기본 클래스.
/// 적 턴에 생성되어 플레이어 영혼을 향해 이동.
/// </summary>
[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(BoxCollider2D))]
public class BulletBase : MonoBehaviour
{
    public int damage = 3;
    public float speed = 3f;
    public float lifetime = 5f;
    public bool piercing; // true면 영혼 관통

    protected Rigidbody2D rb;

    protected virtual void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        rb.gravityScale = 0;

        var col = GetComponent<BoxCollider2D>();
        col.isTrigger = true;

        gameObject.tag = "Bullet";

        Destroy(gameObject, lifetime);
    }

    /// <summary>
    /// 특정 방향으로 이동 시작
    /// </summary>
    public void SetDirection(Vector2 direction)
    {
        if (rb == null) rb = GetComponent<Rigidbody2D>();
        rb.linearVelocity = direction.normalized * speed;

        // 이동 방향으로 회전
        float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
        transform.rotation = Quaternion.Euler(0, 0, angle);
    }

    /// <summary>
    /// 타겟을 향해 이동
    /// </summary>
    public void SetTarget(Transform target)
    {
        if (target == null) return;
        Vector2 dir = (target.position - transform.position).normalized;
        SetDirection(dir);
    }
}

/// <summary>
/// 사인파 형태로 움직이는 총알
/// </summary>
public class WaveBullet : BulletBase
{
    public float waveAmplitude = 1f;
    public float waveFrequency = 3f;

    Vector2 baseDirection;
    Vector2 perpendicular;
    float timer;

    public void SetWaveDirection(Vector2 direction)
    {
        baseDirection = direction.normalized;
        perpendicular = new Vector2(-baseDirection.y, baseDirection.x);
        SetDirection(direction);
    }

    void Update()
    {
        timer += Time.deltaTime;
        float wave = Mathf.Sin(timer * waveFrequency) * waveAmplitude;

        if (rb != null)
        {
            rb.linearVelocity = (baseDirection * speed) + (perpendicular * wave);
        }
    }
}

/// <summary>
/// 회전하면서 이동하는 총알
/// </summary>
public class SpinBullet : BulletBase
{
    public float rotationSpeed = 360f;

    void Update()
    {
        transform.Rotate(0, 0, rotationSpeed * Time.deltaTime);
    }
}
