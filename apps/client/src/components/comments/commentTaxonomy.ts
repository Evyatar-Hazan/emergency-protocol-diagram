export type CommentKind = {
  label: string;
  shortLabel: string;
  description: string;
};

export const COMMENT_KIND_OPTIONS: CommentKind[] = [
  {
    label: 'שאלה',
    shortLabel: 'שאלה',
    description: 'משהו לא ברור לי בפרוטוקול או בהחלטה בצומת הזה.',
  },
  {
    label: 'הבהרה',
    shortLabel: 'הבהרה',
    description: 'ניסוח מחדש או חידוד של מה שכבר כתוב כאן.',
  },
  {
    label: 'טיפ ביצועי',
    shortLabel: 'טיפ',
    description: 'דגש קצר שעוזר ליישם נכון יותר בשטח או בתרגול.',
  },
  {
    label: 'תיקון קליני',
    shortLabel: 'תיקון',
    description: 'הערה שמטרתה לדייק תוכן, החלטה או גבול טיפול.',
  },
  {
    label: 'מקור',
    shortLabel: 'מקור',
    description: 'הפניה למסמך, פרוטוקול או reference תומך.',
  },
  {
    label: 'סיכום',
    shortLabel: 'סיכום',
    description: 'ריכוז קצר של מה חשוב לזכור מהדיון הזה.',
  },
];

const allowedKinds = new Set(COMMENT_KIND_OPTIONS.map((item) => item.label));

export const buildCommentPayload = (kindLabel: string, body: string) => {
  const trimmedBody = body.trim();
  const safeKind = allowedKinds.has(kindLabel) ? kindLabel : COMMENT_KIND_OPTIONS[0].label;
  return `[${safeKind}] ${trimmedBody}`;
};

export const parseCommentContent = (rawContent: string) => {
  const match = rawContent.match(/^\[([^\]]+)\]\s*(.*)$/s);

  if (!match) {
    return {
      kindLabel: null,
      body: rawContent,
    };
  }

  const parsedKind = match[1].trim();
  const parsedBody = match[2].trim();

  if (!allowedKinds.has(parsedKind)) {
    return {
      kindLabel: null,
      body: rawContent,
    };
  }

  return {
    kindLabel: parsedKind,
    body: parsedBody || rawContent,
  };
};
