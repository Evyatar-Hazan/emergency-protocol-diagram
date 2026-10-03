# Clinical review schema fixtures

הקבצים בתיקייה זו בודקים רק את חוזה JSON Schema של Task 53. הם סינתטיים ואינם מאשרים תוכן קליני.

| Fixture | תוצאה צפויה תחת Draft 2020-12 |
|---|---|
| `clinical-review.approved.valid.json` | valid |
| `clinical-review.pending.valid.json` | valid עם שדות אישור `null` |
| `clinical-review.approved.invalid-source-null.json` | invalid: `source` חייב להיות object |
| `clinical-review.approved.invalid-decided-at-null.json` | invalid: `decided_at` חייב להיות date-time string |
| `clinical-review.approved.invalid-review-due-null.json` | invalid: `review_due` חייב להיות date string |

הבדיקה רצה כחלק מ־`npm test` באמצעות `npm run test:clinical-schema`.
