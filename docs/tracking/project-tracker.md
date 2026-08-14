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

נכון ל-`2026-08-14`, עבור בסיס האפליקציה האחרון שאומת לפני איחוד מסמכי המעקב:

- branch: `main`
- application baseline: `1bce7b2`
- Git: נקי ומסונכרן ל-`origin/main`; את HEAD הנוכחי קוראים מ-Git בזמן אמת ולא משכפלים במסמך
- validation תחת Node `20.20.2`: `build`, `lint`, ו-`26/26` בדיקות עברו
- GitHub Actions: ריצת `Validate` מספר `30363425364` עברה על בסיס האפליקציה `1bce7b2`
- Cloudflare Pages: deployment פונקציונלי `87302ab4` אימת את בסיס האפליקציה `1bce7b2`
- Production: `https://bls-protocol.evyatarhazan.com/` מחזיר `200`
- D1 health: `/api/health` מחזיר `{"status":"ok","database":"ready"}`
- Comments read path: `/api/comments/pulse_check` מחזיר `{"comments":[]}`
- `npm audit`: שתי חולשות `high`
- `npm audit --omit=dev`: חולשת `high` אחת ב-`nanoid 3.3.16`

commit תיעוד עשוי ליצור CI ו-deployment חדשים בלי לשנות את האפליקציה. לכן ה-HEAD, ריצת ה-CI וה-deployment האחרונים נבדקים בזמן אמת ואינם נשמרים כאן כערכים “אחרונים” קבועים.

## Backlog פעיל

| ID | עדיפות | סטטוס | משימה | סיבה | Definition of Done | אימות |
|---|---|---|---|---|---|---|
| `SEC-001` | P1 | open | לתקן את `nanoid 3.3.16` במסלול `postcss` | החולשה מופיעה גם ב-`npm audit --omit=dev` | `nanoid >=3.3.18` נפתר דרך עדכון lockfile/שרשרת התלויות ללא regression | `npm audit --omit=dev`, `build`, `lint`, `test` |
| `SEC-002` | P2 | open | לתקן את `brace-expansion 5.0.8` במסלול ESLint/typescript-eslint | חולשת tooling מסוג `high` ב-audit המלא | `npm audit` מחזיר 0 חולשות ללא `--force` | `npm audit`, `lint`, `build`, `test` |
| `CI-001` | P1 | open | להוסיף `npm audit --omit=dev` ל-CI כ-gate נפרד | CI ירוק כיום אינו מוכיח ש-production dependencies נקיות | workflow נכשל על production advisory ועובר כשה-audit נקי | בדיקת workflow ב-PR או push מבוקר |
| `ENV-001` | P2 | open | ליישר את סביבת ה-validation המקומית ל-Node 20 כברירת מחדל | ה-shell המקומי הוא Node `22.23.2`, בעוד CI ו-`.nvmrc` הם Node 20 | `node -v` מחזיר Node 20 לפני ריצת validation רגילה | `node -v`, `npm ci`, `build`, `lint`, `test` |

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
