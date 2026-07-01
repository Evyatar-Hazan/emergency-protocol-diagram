export type DiscussionSeed = {
  kind: string;
  title: string;
  prompt: string;
};

const DEFAULT_DISCUSSION_SEEDS: DiscussionSeed[] = [
  {
    kind: 'טיפ ביצועי',
    title: 'טעות ביצועית שקל לפספס',
    prompt: 'איזו טעות ביצועית הכי קל לעשות בצומת הזה, ואיך נמנעים ממנה?',
  },
  {
    kind: 'הבהרה',
    title: 'ממצא שמקדם לשלב הבא',
    prompt: 'מהו הממצא הקריטי שבגללו צריך לעבור לשלב הבא בלי להתעכב?',
  },
  {
    kind: 'שאלה',
    title: 'שאלת אנמנזה חשובה',
    prompt: 'איזו שאלה קצרה באנמנזה הכי עוזרת להבין מה באמת קורה כאן?',
  },
];

export const discussionSeedsByNode: Record<string, DiscussionSeed[]> = {
  'unified_flow:scene_assessment': [
    {
      kind: 'טיפ ביצועי',
      title: 'סכנת זירה ראשונה',
      prompt: 'איזה סיכון בזירה הכי קל לפספס כאן לפני שניגשים בכלל למטופל?',
    },
    {
      kind: 'שאלה',
      title: 'מנגנון שמחליף מסלול',
      prompt: 'איזה פרט בזירה היה גורם לך לעבור מיד למסלול אר"ן, חומ"ס או טראומה קשה?',
    },
  ],
  'unified_flow:choking_protocol': [
    {
      kind: 'הבהרה',
      title: 'חסימה חלקית או מלאה',
      prompt: 'איזה סימן אחד הכי עוזר להבדיל כאן בין חסימה חלקית לחסימה מלאה?',
    },
    {
      kind: 'טיפ ביצועי',
      title: 'מעבר להחייאה',
      prompt: 'מהו הרגע המדויק שבו מפסיקים תמרוני חנק ועוברים מייד ל-CPR/AED?',
    },
  ],
  'unified_flow:acute_coronary_syndrome': [
    {
      kind: 'שאלה',
      title: 'ACS לא טיפוסי',
      prompt: 'איזה סימן או תלונה יגרמו לך לחשוד ב-ACS גם בלי כאב חזה קלאסי?',
    },
    {
      kind: 'טיפ ביצועי',
      title: 'מה לא לדחות',
      prompt: 'איזו פעולה הכי חשוב לא לדחות כאן כשיש כאב חזה עם סימני חוסר יציבות?',
    },
  ],
  'unified_flow:stroke': [
    {
      kind: 'שאלה',
      title: 'Last Known Well',
      prompt: 'איך אתה סוגר מהר את שעת ה-last known well כשאין עד אחד מסודר בזירה?',
    },
    {
      kind: 'תיקון קליני',
      title: 'Stroke mimics',
      prompt: 'איזה מצב מסוכן יכול להיראות כמו שבץ כאן, ואיך לא לפספס אותו לפני פינוי?',
    },
  ],
  'unified_flow:seizure': [
    {
      kind: 'הבהרה',
      title: 'מה חשוב אחרי ההתקף',
      prompt: 'מהו הממצא הכי חשוב לבדוק כאן מיד אחרי שהפרכוס נפסק?',
    },
    {
      kind: 'טיפ ביצועי',
      title: 'חשד לסטטוס',
      prompt: 'איזה סימן בשטח גורם לך להבין שזה כבר לא "פרכוס שעבר" אלא חשד לסטטוס?',
    },
  ],
  'unified_flow:trauma_shock_assessment': [
    {
      kind: 'טיפ ביצועי',
      title: 'שוק מפוצה',
      prompt: 'איזה שילוב ממצאים יגרום לך להגדיר כאן שוק מפוצה עוד לפני לחץ דם נמוך?',
    },
    {
      kind: 'שאלה',
      title: 'דימום פנימי',
      prompt: 'איפה היית מחפש כאן מקור לדימום פנימי אם אין דימום חיצוני ברור?',
    },
  ],
  'unified_flow:imminent_delivery': [
    {
      kind: 'טיפ ביצועי',
      title: 'מה לא עושים',
      prompt: 'מהי ההתערבות שהכי קל לעשות כאן מתוך לחץ, אבל אסור לעשות אותה בלידה מתקדמת?',
    },
    {
      kind: 'שאלה',
      title: 'סיבוך שמחליף מסלול',
      prompt: 'איזה ממצא בלידה היה גורם לך להבין שזו כבר לא לידה רגילה אלא סיבוך מיילדותי פעיל?',
    },
  ],
  'unified_flow:obstetric_emergency': [
    {
      kind: 'הבהרה',
      title: 'בחירת הסיבוך המוביל',
      prompt: 'איזה רמז קליני אחד הכי יעזור לבחור כאן בין רעלת, דימום, חוץ רחמי או טראומה בהריון?',
    },
    {
      kind: 'מקור',
      title: 'מקור שווה ציטוט',
      prompt: 'איזה מקור או כלל מוסכם חשוב להביא לדיון הזה כדי לדייק את ההחלטה בצומת?',
    },
  ],
};

export const getDiscussionSeeds = (nodeId: string) =>
  discussionSeedsByNode[nodeId] ?? DEFAULT_DISCUSSION_SEEDS;
