export const PERMISSION = {
  DASHBOARD_VIEW: "dashboard:view",

  ORG_READ: "organization:read",
  ORG_UPDATE: "organization:update",
  ORG_DELETE: "organization:delete",

  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",

  PERMISSION_ASSIGN: "permission:assign",

  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",

  INDICATOR_CREATE: "indicator:create",
  INDICATOR_READ: "indicator:read",
  INDICATOR_UPDATE: "indicator:update",
  INDICATOR_DELETE: "indicator:delete",

  BENEFICIARY_CREATE: "beneficiary:create",
  BENEFICIARY_READ: "beneficiary:read",
  BENEFICIARY_UPDATE: "beneficiary:update",
  BENEFICIARY_DELETE: "beneficiary:delete",

  DATA_COLLECT: "data:collect",
  DATA_READ: "data:read",
  DATA_UPDATE: "data:update",
  DATA_DELETE: "data:delete",

  REPORT_GENERATE: "report:generate",
  REPORT_READ: "report:read",
  REPORT_EXPORT: "report:export",

  EVALUATION_CREATE: "evaluation:create",
  EVALUATION_READ: "evaluation:read",
  EVALUATION_UPDATE: "evaluation:update",
  EVALUATION_DELETE: "evaluation:delete",

  AUDIT_READ: "audit:read",

  SETTING_READ: "setting:read",
  SETTING_UPDATE: "setting:update",
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [PERMISSION.DASHBOARD_VIEW]: "View dashboard",

  [PERMISSION.ORG_READ]: "Read organization settings",
  [PERMISSION.ORG_UPDATE]: "Update organization settings",
  [PERMISSION.ORG_DELETE]: "Delete organization",

  [PERMISSION.USER_CREATE]: "Create users",
  [PERMISSION.USER_READ]: "Read users",
  [PERMISSION.USER_UPDATE]: "Update users",
  [PERMISSION.USER_DELETE]: "Delete users",

  [PERMISSION.ROLE_CREATE]: "Create roles",
  [PERMISSION.ROLE_READ]: "Read roles",
  [PERMISSION.ROLE_UPDATE]: "Update roles",
  [PERMISSION.ROLE_DELETE]: "Delete roles",

  [PERMISSION.PERMISSION_ASSIGN]: "Assign permissions to roles",

  [PERMISSION.PROJECT_CREATE]: "Create projects",
  [PERMISSION.PROJECT_READ]: "Read projects",
  [PERMISSION.PROJECT_UPDATE]: "Update projects",
  [PERMISSION.PROJECT_DELETE]: "Delete projects",

  [PERMISSION.INDICATOR_CREATE]: "Create indicators",
  [PERMISSION.INDICATOR_READ]: "Read indicators",
  [PERMISSION.INDICATOR_UPDATE]: "Update indicators",
  [PERMISSION.INDICATOR_DELETE]: "Delete indicators",

  [PERMISSION.BENEFICIARY_CREATE]: "Create beneficiaries",
  [PERMISSION.BENEFICIARY_READ]: "Read beneficiaries",
  [PERMISSION.BENEFICIARY_UPDATE]: "Update beneficiaries",
  [PERMISSION.BENEFICIARY_DELETE]: "Delete beneficiaries",

  [PERMISSION.DATA_COLLECT]: "Collect monitoring data",
  [PERMISSION.DATA_READ]: "Read monitoring data",
  [PERMISSION.DATA_UPDATE]: "Update monitoring data",
  [PERMISSION.DATA_DELETE]: "Delete monitoring data",

  [PERMISSION.REPORT_GENERATE]: "Generate reports",
  [PERMISSION.REPORT_READ]: "Read reports",
  [PERMISSION.REPORT_EXPORT]: "Export reports",

  [PERMISSION.EVALUATION_CREATE]: "Create evaluations",
  [PERMISSION.EVALUATION_READ]: "Read evaluations",
  [PERMISSION.EVALUATION_UPDATE]: "Update evaluations",
  [PERMISSION.EVALUATION_DELETE]: "Delete evaluations",

  [PERMISSION.AUDIT_READ]: "View audit logs",

  [PERMISSION.SETTING_READ]: "Read system settings",
  [PERMISSION.SETTING_UPDATE]: "Update system settings",
};

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSION);
