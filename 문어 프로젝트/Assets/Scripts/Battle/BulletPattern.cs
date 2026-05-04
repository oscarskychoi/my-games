using System.Collections;
using UnityEngine;

/// <summary>
/// 총알 패턴 생성을 위한 유틸리티.
/// EnemyBase 서브클래스에서 호출하여 다양한 패턴을 생성.
/// </summary>
public static class BulletPattern
{
    /// <summary>
    /// 기본 총알 프리팹 생성 (스프라이트 없을 때 임시용)
    /// </summary>
    static GameObject CreateBulletObject(Transform parent, float size = 0.2f)
    {
        GameObject bullet = new GameObject("Bullet");
        bullet.transform.SetParent(parent);
        bullet.layer = LayerMask.NameToLayer("Bullet");

        // 임시 스프라이트 (흰색 사각형)
        var sr = bullet.AddComponent<SpriteRenderer>();
        sr.sprite = CreateSquareSprite();
        sr.color = Color.white;
        bullet.transform.localScale = Vector3.one * size;

        return bullet;
    }

    static Sprite CreateSquareSprite()
    {
        Texture2D tex = new Texture2D(4, 4);
        Color[] colors = new Color[16];
        for (int i = 0; i < 16; i++) colors[i] = Color.white;
        tex.SetPixels(colors);
        tex.Apply();
        tex.filterMode = FilterMode.Point;
        return Sprite.Create(tex, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 4);
    }

    /// <summary>
    /// 직선 총알 - 한 방향에서 반대편으로
    /// </summary>
    public static IEnumerator StraightLine(Transform container, int count, float interval,
        Vector2 spawnOffset, Vector2 direction, float speed = 4f, int damage = 3)
    {
        for (int i = 0; i < count; i++)
        {
            var obj = CreateBulletObject(container);
            obj.transform.position = (Vector2)container.position + spawnOffset +
                new Vector2(Random.Range(-0.5f, 0.5f), Random.Range(-0.5f, 0.5f));

            var bullet = obj.AddComponent<BulletBase>();
            bullet.speed = speed;
            bullet.damage = damage;
            bullet.SetDirection(direction);

            yield return new WaitForSeconds(interval);
        }
    }

    /// <summary>
    /// 원형 탄막 - 중심에서 방사형으로 퍼짐
    /// </summary>
    public static IEnumerator CircleSpread(Transform container, int count, float speed = 3f,
        int damage = 3, Vector2? center = null)
    {
        Vector2 spawnPos = center ?? (Vector2)container.position;

        for (int i = 0; i < count; i++)
        {
            float angle = (360f / count) * i;
            Vector2 dir = new Vector2(
                Mathf.Cos(angle * Mathf.Deg2Rad),
                Mathf.Sin(angle * Mathf.Deg2Rad)
            );

            var obj = CreateBulletObject(container);
            obj.transform.position = spawnPos;

            var bullet = obj.AddComponent<BulletBase>();
            bullet.speed = speed;
            bullet.damage = damage;
            bullet.SetDirection(dir);
        }

        yield return null;
    }

    /// <summary>
    /// 랜덤 낙하 - 위에서 아래로 랜덤 위치에서 떨어짐
    /// </summary>
    public static IEnumerator RandomFall(Transform container, int count, float interval,
        float xMin, float xMax, float ySpawn, float speed = 3f, int damage = 3)
    {
        for (int i = 0; i < count; i++)
        {
            float x = Random.Range(xMin, xMax);

            var obj = CreateBulletObject(container);
            obj.transform.position = new Vector2(x, ySpawn);

            var bullet = obj.AddComponent<BulletBase>();
            bullet.speed = speed;
            bullet.damage = damage;
            bullet.SetDirection(Vector2.down);

            yield return new WaitForSeconds(interval);
        }
    }

    /// <summary>
    /// 추적 총알 - 플레이어를 향해 발사
    /// </summary>
    public static IEnumerator HomingShots(Transform container, Transform target, int count,
        float interval, Vector2 spawnPos, float speed = 2.5f, int damage = 4)
    {
        for (int i = 0; i < count; i++)
        {
            var obj = CreateBulletObject(container, 0.25f);
            obj.transform.position = spawnPos;

            var bullet = obj.AddComponent<BulletBase>();
            bullet.speed = speed;
            bullet.damage = damage;
            bullet.SetTarget(target);

            yield return new WaitForSeconds(interval);
        }
    }

    /// <summary>
    /// 물결 탄막 - 사인파 패턴으로 이동
    /// </summary>
    public static IEnumerator WavePattern(Transform container, int count, float interval,
        Vector2 spawnOffset, Vector2 direction, float speed = 3f, int damage = 3)
    {
        for (int i = 0; i < count; i++)
        {
            var obj = CreateBulletObject(container);
            obj.transform.position = (Vector2)container.position + spawnOffset;

            var bullet = obj.AddComponent<WaveBullet>();
            bullet.speed = speed;
            bullet.damage = damage;
            bullet.waveAmplitude = 1.5f;
            bullet.waveFrequency = 3f;
            bullet.SetWaveDirection(direction);

            yield return new WaitForSeconds(interval);
        }
    }
}
