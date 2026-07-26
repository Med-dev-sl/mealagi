export const SITE = {
  name: "AI MEAL",
  tagline: "AI-Powered Monitoring, Evaluation, Accountability & Learning Platform",
  description:
    "AI MEAL is an enterprise-grade platform that leverages artificial intelligence to streamline monitoring, evaluation, accountability, and learning for NGOs, governments, UN agencies, and donors.",
  url: "https://aimeal.io",
  email: "hello@aimeal.io",
  social: {
    twitter: "@aimeal",
    linkedin: "https://linkedin.com/company/aimeal",
  },
};

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORGANIZATION_ADMIN: "ORGANIZATION_ADMIN",
  MEAL_MANAGER: "MEAL_MANAGER",
  ME_OFFICER: "ME_OFFICER",
  FIELD_ENUMERATOR: "FIELD_ENUMERATOR",
  PROGRAM_MANAGER: "PROGRAM_MANAGER",
  FINANCE_MANAGER: "FINANCE_MANAGER",
  DONOR: "DONOR",
  PARTNER: "PARTNER",
  COMMUNITY_USER: "COMMUNITY_USER",
} as const;

export const REPORTING_FREQUENCIES = [
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const INDICATOR_TYPES = [
  { value: "quantitative", label: "Quantitative" },
  { value: "qualitative", label: "Qualitative" },
  { value: "mixed", label: "Mixed" },
] as const;
