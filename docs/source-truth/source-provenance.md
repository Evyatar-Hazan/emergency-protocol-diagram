# עקיבות מקורות לפי צומת

## מטרה

שכבת העקיבות מחברת כל צומת ב־`unified-flow.json` למקורות שכבר מוצגים בו, לגרסה מתועדת ולסטטוס הסקירה שלו. היא אינה משנה תוכן רפואי ואינה הופכת קישור קיים לאישור קליני או ארגוני.

## מקורות אמת

- תוכן הצמתים והקישורים: `apps/client/src/protocols/unified-flow.json`.
- מיפוי העקיבות: `apps/client/src/protocols/source-provenance.json`.
- חוזה המיפוי: `docs/schemas/node-source-provenance.schema.json`.
- חוזה החלטת review: תוצר Task 53, ‏`TASK-53-clinical-review.schema.json`.

## ברירות מחדל בטוחות

כל שיוך מקור קיים נוצר עם:

- `version_or_date: null` — אין להסיק גרסה מכותרת או מכתובת.
- `source_status: pending` — עצם קיום הקישור אינו אימות מקור.
- `review_status: pending` — אין migration שמאשר תוכן קיים.
- `authority_status: unknown` — אין להסיק סמכות מתעודת BLS או מבעלות על המוצר.
- `review_record_id: null` — אין החלטת review בלי רשומה תואמת.

ה־UI מציג במצב זה שהמקור ממתין לסקירה ושהקישור נועד לעקיבות בלבד.

## מנגנון fail-closed

תווית חיובית מוצגת רק כאשר המיפוי ורשומת Task 53 תואמים וכוללים:

1. `approved_for_stated_use` בשני המקומות.
2. מקור `verified` וסמכות `confirmed`.
3. גרסה, שימוש מאושר, תאריך החלטה ותאריך review עתידי.
4. `review_record_id` קיים.
5. שתי החלטות approval מזוהות, עם scope ותאריך.

כל שדה חסר, review שפג, רשומה לא תואמת או מיפוי חסר מוצגים כלא מאושרים.

## עדכון המיפוי

לאחר שינוי מקורות מריצים:

```bash
npm run generate:source-provenance
```

המחולל שומר metadata קיים רק כאשר הצומת והמקור לא השתנו. לכל צומת נשמר `node_content_hash`; שינוי בתוכן הצומת, בקישור, בתווית או בהערה מאפס את השיוך ל־`pending`/`unknown`. רשומות review נשמרות לצורכי audit אך אינן מקושרות עוד אוטומטית למיפוי שהשתנה.

לאחר ההרצה יש לבצע `test`, ‏`build` ו־`lint`. המחולל אינו בודק נכונות קלינית ואינו רשאי למלא גרסה, reviewer או approval ללא evidence מאומת.
