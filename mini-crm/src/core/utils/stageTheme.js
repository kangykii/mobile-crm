export const STAGE_THEMES = {
  New: { accent: "#0176D3", fill: "#EAF5FE", text: "#014486" },
  Contacted: { accent: "#9050E9", fill: "#F3E8FF", text: "#5A1BA9" },
  Qualified: { accent: "#FF9500", fill: "#FFF4E5", text: "#8C4B02" },
  Proposal: { accent: "#E91E8C", fill: "#FCE7F3", text: "#9D174D" },
  Won: { accent: "#2E844A", fill: "#ECFDF3", text: "#027A48" },
  Lost: { accent: "#706E6B", fill: "#F2F2F7", text: "#444444" },
  All: { accent: "#0176D3", fill: "#EAF5FE", text: "#014486" },
};

export function getStageTheme(stage = "New") {
  return STAGE_THEMES[stage] || STAGE_THEMES.New;
}
