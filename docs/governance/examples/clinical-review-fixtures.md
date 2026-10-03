# Clinical review schema fixtures

הקבצים בתיקייה זו בודקים רק את חוזה JSON Schema. הם סינתטיים ואינם מאשרים תוכן קליני.

| Fixture | תוצאה צפויה תחת Draft 2020-12 |
|---|---|
| `clinical-review.approved.valid.json` | valid |
| `clinical-review.approved.invalid-source-null.json` | invalid: `source` חייב להיות object כאשר `review_status` הוא `approved_for_stated_use` |
| `clinical-review.approved.invalid-decided-at-null.json` | invalid: `decided_at` חייב להיות date-time string |
| `clinical-review.approved.invalid-review-due-null.json` | invalid: `review_due` חייב להיות date string |

ה־fixture הקיים `clinical-review.example.json` נשאר רשומת `pending` תקפה שבה ערכי האישור יכולים להיות `null`.

יש להריץ את הקבצים מול validator שתומך ב־JSON Schema Draft 2020-12 וב־format validation. בדיקת JSON באמצעות `jq` מוכיחה parsing בלבד ואינה מחליפה semantic schema validation.
