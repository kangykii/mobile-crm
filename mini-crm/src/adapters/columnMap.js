export const COLUMN_FIELDS = [
  "ID",
  "Name",
  "Company",
  "Email",
  "Phone",
  "Value",
  "Stage",
  "LastContactedAt",
  "CreatedAt",
  "NotesTimeline",
  "OwnerEmail",
];

export const LEADS_SHEET_NAME = "Leads";

/** Tab-separated header row — paste into Google Sheets cell A1 */
export const LEADS_HEADER_ROW_TSV = COLUMN_FIELDS.join("\t");

export const COLUMN_MAP = Object.fromEntries(COLUMN_FIELDS.map((field, index) => [field, index]));

export function leadToRow(lead) {
  return [
    lead.ID,
    lead.Name,
    lead.Company || "",
    lead.Email || "",
    lead.Phone || "",
    lead.Value ?? 0,
    lead.Stage || "New",
    lead.LastContactedAt || "",
    lead.CreatedAt || "",
    lead.NotesTimeline || "",
    lead.OwnerEmail || "",
  ];
}

export function rowToLead(values = []) {
  return {
    ID: values[COLUMN_MAP.ID] || "",
    Name: values[COLUMN_MAP.Name] || "",
    Company: values[COLUMN_MAP.Company] || "",
    Email: values[COLUMN_MAP.Email] || "",
    Phone: values[COLUMN_MAP.Phone] || "",
    Value: Number(values[COLUMN_MAP.Value] || 0),
    Stage: values[COLUMN_MAP.Stage] || "New",
    LastContactedAt: values[COLUMN_MAP.LastContactedAt] || "",
    CreatedAt: values[COLUMN_MAP.CreatedAt] || "",
    NotesTimeline: values[COLUMN_MAP.NotesTimeline] || "",
    OwnerEmail: values[COLUMN_MAP.OwnerEmail] || "",
  };
}
