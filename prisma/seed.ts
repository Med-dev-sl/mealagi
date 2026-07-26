import { PrismaClient, SubscriptionPlan, Status, AuditSeverity } from "@prisma/client";
import * as bcrypt from "bcrypt";

import {
  PERMISSION,
  PERMISSION_DESCRIPTIONS,
  ROLE,
  ROLE_PERMISSIONS,
  SYSTEM_ROLES,
  AUDIT_ACTION,
  type RoleName,
} from "../src/constants";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  await prisma.$transaction(async (tx) => {
    // ── Organization ────────────────────────────────────────
    const org = await tx.organization.upsert({
      where: { code: "SYSTEM" },
      update: {},
      create: {
        name: "AI MEAL Platform",
        slug: "system",
        code: "SYSTEM",
        email: "admin@aimeal.local",
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        status: Status.ACTIVE,
      },
    });

    console.log(`  Organization: ${org.name}`);

    // ── Organization Settings ────────────────────────────────
    await tx.organizationSettings.upsert({
      where: { organizationId: org.id },
      update: {},
      create: {
        organizationId: org.id,
        locale: "en",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
        currency: "USD",
        featureFlags: {},
        sessionTimeoutMs: 3600000,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSpecialChar: true,
        },
      },
    });

    console.log("  Organization settings: created");

    // ── Permissions ─────────────────────────────────────────
    const permissionRecords = await Promise.all(
      Object.values(PERMISSION).map((perm) => {
        const [resource, action] = perm.split(":");
        return tx.permission.upsert({
          where: { resource_action: { resource, action } },
          update: {},
          create: {
            resource,
            action,
            description: PERMISSION_DESCRIPTIONS[perm],
            isSystem: true,
          },
        });
      }),
    );

    const permMap = new Map<string, string>();
    for (const p of permissionRecords) {
      permMap.set(`${p.resource}:${p.action}`, p.id);
    }

    console.log(`  Permissions: ${permissionRecords.length} created`);

    // ── Roles ────────────────────────────────────────────────
    const roleNames = Object.values(ROLE);
    const createdRoles = await Promise.all(
      roleNames.map((name) =>
        tx.role.upsert({
          where: { name_organizationId: { name, organizationId: org.id } },
          update: {},
          create: {
            name,
            organizationId: org.id,
            isSystem: SYSTEM_ROLES.includes(name as RoleName),
          },
        }),
      ),
    );

    const roleMap = new Map<string, string>();
    for (const r of createdRoles) {
      roleMap.set(r.name, r.id);
    }

    console.log(`  Roles: ${createdRoles.length} created`);

    // ── Role-Permission Assignments ──────────────────────────
    let assignmentCount = 0;
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) continue;

      const permissionIds = permissions
        .map((key: string) => permMap.get(key))
        .filter((id): id is string => id !== undefined);

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId,
            permissionId,
          })),
          skipDuplicates: true,
        });
        assignmentCount += permissionIds.length;
      }
    }

    console.log(`  Role-permission assignments: ${assignmentCount}`);

    // ── Super Administrator ──────────────────────────────────
    const passwordHash = await bcrypt.hash("Admin@123456", 12);

    const admin = await tx.user.upsert({
      where: { email: "admin@aimeal.local" },
      update: {},
      create: {
        organizationId: org.id,
        firstName: "System",
        lastName: "Administrator",
        email: "admin@aimeal.local",
        passwordHash,
        jobTitle: "System Administrator",
        status: Status.ACTIVE,
        emailVerified: true,
      },
    });

    console.log(`  Super Administrator: ${admin.email}`);

    // ── Assign SUPER_ADMIN Role ──────────────────────────────
    const superAdminRoleId = roleMap.get(ROLE.SUPER_ADMIN);
    if (superAdminRoleId) {
      await tx.userRole.upsert({
        where: { userId_roleId: { userId: admin.id, roleId: superAdminRoleId } },
        update: {},
        create: { userId: admin.id, roleId: superAdminRoleId },
      });
    }

    console.log("  SUPER_ADMIN role: assigned");

    // ── SYSTEM_INITIALIZED Audit Log ─────────────────────────
    await tx.auditLog.create({
      data: {
        organizationId: org.id,
        userId: admin.id,
        action: AUDIT_ACTION.SYSTEM_INITIALIZED,
        resource: "system",
        resourceId: org.id,
        severity: AuditSeverity.INFO,
        metadata: {
          version: "1.0.0",
          platform: "AI MEAL",
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log("  Audit log: SYSTEM_INITIALIZED");
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
