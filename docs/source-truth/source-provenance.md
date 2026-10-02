# עקיבות מקורות לפי צומת

## מטרה

שכבת העקיבות מחברת כל צומת ב־`unified-flow.json` למקורות שכבר מוצגים בו, לגרסה מתועדת ולסטטוס הסקירה שלו. היא אינה משנה תוכן רפואי ואינה הופכת קישור קיים לאישור קליני או ארגוני.

## מקורות אמת

- תוכן הצמתים והקישורים: `apps/client/src/protocols/unified-flow.json`.
- מיפוי העקיבות: `apps/client/src/protocols/source-provenance.json`.
- חוזה המיפוי: `docs/schemas/node-source-provenance.schema.json`.
- חוזה החלטת review: `docs/governance/schemas/clinical-review.schema.json`.

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

## חוזה הטעינה בלקוח

המניפסט הקנוני והסכמה שלו נשארים מקור האמת לבדיקות ול־audit, אך אינם נארזים בתוך JavaScript של הלקוח. לפני כל build, ‏`generate-source-provenance-runtime.mjs` מפיק מהם נכס נגזר ב־`/generated/source-provenance-runtime.json`.

הנכס הנגזר אינו משכפל את `label`, ‏`url`, ‏`note` או `node_id` שכבר קיימים ב־`unified-flow.json`. הוא שומר קטלוג זהויות מקור ייחודי, hashes ונתוני review. בזמן lookup הקטלוג חייב להתאים ל־label ול־URL הפעילים; אי־התאמה נכשלת סגור.

חוזה הטעינה הוא אסינכרוני ובעל ארבעה מצבים:

- `loading` — אין הצגת approval בזמן ההמתנה.
- `ready` — lookup מותר רק לאחר אימות מבנה הנכס וזהות המקור.
- `error` — כשל רשת או payload לא תקין מוצג כעקיבות לא זמינה וללא approval.
- `stale` — cache שפג אינו משמש לאישור אם הרענון נכשל.

ה־cache הוא בזיכרון התהליך בלבד ותוקפו חמש דקות. בכל מצב שאינו `ready`, ‏`resolveSourceProvenance` מחזיר `null` וה־UI נשאר fail-closed. שינוי זה מחייב אינטגרציות שניגשות לעקיבות להשתמש ב־`useSourceProvenanceRuntime` וב־`resolveSourceProvenance`, ולא להניח שמניפסט מלא זמין באופן סינכרוני בזמן import.
