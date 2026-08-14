# Emergency Protocol Diagram — Project Tracker

## תפקיד המסמך

זהו מקור האמת המורחב והיחיד בריפו עבור:

- מצב הפרויקט הנוכחי
- משימות פתוחות ותיעדוף
- Definition of Done ודרך אימות
- קישורים למסמכי שלבים, audits והיסטוריה

הכספת שומרת תקציר תמציתי בלבד ומפנה למסמך הזה:

- [מצב נוכחי בכספת](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/current.md)
- [משימות פתוחות בכספת](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/tasks.md)

## כללי מקור אמת

1. משימה חדשה או שינוי סטטוס מתועדים קודם כאן בפירוט.
2. הכספת מסונכרנת לאחר מכן בתקציר קצר בלבד.
3. מסמכי Phase, redesign ו-audit הם מסמכי הוכחה והיסטוריה, לא רשימות מתחרות של משימות פתוחות.
4. backlog חדש נפתח רק לפי [REM-003 Audit Gate](./rem-003-audit-gate.md).
5. משימה נסגרת רק לאחר validation מקומי, אימות CI/Production לפי הצורך, ועדכון המסמך הזה והכספת.

## תמונת מצב מאומתת

נכון ל-`2026-08-14`, עבור בסיס האפליקציה והאבטחה האחרון שאומת:

- branch: `main`
- application baseline: `3deeb9d`
- Git: נקי ומסונכרן ל-`origin/main`; את HEAD הנוכחי קוראים מ-Git בזמן אמת ולא משכפלים במסמך
- validation תחת Node `20.20.2`: `build`, `lint`, ו-`26/26` בדיקות עברו
- GitHub Actions: ריצת `Validate` מספר `31793152326` עברה, כולל production dependency audit
- Cloudflare Pages: deployment פונקציונלי `595fd14e` נוצר מ-`3deeb9d`
- Production: `https://bls-protocol.evyatarhazan.com/` מחזיר `200`
- D1 health: `/api/health` מחזיר `{"status":"ok","database":"ready"}`
- Comments read path: `/api/comments/pulse_check` מחזיר `{"comments":[]}`
- `npm audit`: ‏0 חולשות
- `npm audit --omit=dev`: ‏0 חולשות

commit תיעוד עשוי ליצור CI ו-deployment חדשים בלי לשנות את האפליקציה. לכן ה-HEAD, ריצת ה-CI וה-deployment האחרונים נבדקים בזמן אמת ואינם נשמרים כאן כערכים “אחרונים” קבועים.

## Backlog פעיל

| ID | עדיפות | סטטוס | משימה | סיבה | Definition of Done | אימות |
|---|---|---|---|---|---|---|
| `ENV-001` | P2 | open | ליישר את סביבת ה-validation המקומית ל-Node 20 כברירת מחדל | ה-shell המקומי הוא Node `22.23.2`, בעוד CI ו-`.nvmrc` הם Node 20 | `node -v` מחזיר Node 20 לפני ריצת validation רגילה | `node -v`, `npm ci`, `build`, `lint`, `test` |

## הושלם לאחרונה

| ID | נסגר | תוצאה | הוכחה |
|---|---|---|---|
| `SEC-001` | `2026-08-14` | `nanoid` עודכן מ-`3.3.16` ל-`3.3.18`; production audit נקי | commit `3deeb9d`, `npm audit --omit=dev` = 0 |
| `SEC-002` | `2026-08-14` | `brace-expansion` עודכן מ-`5.0.8` ל-`5.0.9`; audit מלא נקי | commit `3deeb9d`, `npm audit` = 0 |
| `CI-001` | `2026-08-14` | נוסף gate של `npm audit --omit=dev --audit-level=high` | GitHub Actions `31793152326` עבר |

## מועמד שאינו backlog פעיל

| ID | סטטוס | נושא | תנאי לפתיחה |
|---|---|---|---|
| `QA-CANDIDATE-001` | candidate | להפוך coverage ל-gate מחייב | לפתוח רק לאחר audit שמגדיר baseline, יעד coverage וסיכון ל-false confidence |

## כללי Validation קבועים

```bash
npm ci
npm run build
npm run lint
npm test
npm audit
npm audit --omit=dev
```

לאחר שינוי שנפרס:

1. לוודא ש-GitHub Actions עבר על ה-commit הנכון.
2. לוודא ש-Cloudflare Pages deployment מצביע לאותו commit.
3. לבדוק את הדומיין החי, `/api/health` ונתיב API רלוונטי.
4. לאמת bundle חי כאשר השינוי נוגע ל-client.
5. לסנכרן כאן את הסטטוס ואז לעדכן את תקציר הכספת.

## מסמכי היסטוריה והוכחה

### שלבים סגורים

- [UI/UX redesign task list](../redesign/ui-ux-redesign-task-list.md) — Phases 1–9 הושלמו.
- [Phase 4 UI/UX tracker](./protocol-gap-tracker-phase-4-ui-ux.md) — סגור.
- [Post Phase 4 remaining work](./post-phase-4-remaining-work.md) — `REM-001` עד `REM-003` הושלמו.
- [Comments Layer Redesign task list](./comments-layer-redesign-task-list.md) — המימוש והאימות הושלמו; המסמך נשמר כהיסטוריית ביצוע.

### מסמכי gate ואימות

- [REM-003 Audit Gate](./rem-003-audit-gate.md)
- [Reference scenarios E2E](./reference-scenarios-e2e.md)
- [Coverage proof units 3–5](./coverage-proof-units-3-5.md)
- [REM-002 sync verification](./rem-002-sync-verification.md)

## סגירת פער מקורות האמת

ב-`2026-08-14` אוחד ניהול הפרויקט למודל הבא:

- המסמך הזה הוא tracker מורחב וקנוני בריפו.
- הכספת מחזיקה רק overview, current ו-tasks תמציתיים.
- רשומת UI/UX הישנה בכספת נסגרה.
- מסמכי שלבים סגורים מפנים לכאן ואינם מוגדרים עוד כ-backlog פעיל.
