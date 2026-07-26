import { PrismaClient, SubscriptionPlan, Status } from "@prisma/client";
import * as bcrypt from "bcrypt";

import {
  PERMISSION,
  PERMISSION_DESCRIPTIONS,
  ROLE,
  ROLE_PERMISSIONS,
  SYSTEM_ROLES,
  type RoleName,
} from "../src/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const org = await prisma.organization.upsert({
    where: { code: "default" },
    update: {},
    create: {
      name: "Default Organization",
      slug: "default",
      code: "default",
      email: "admin@agimeal.com",
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      status: Status.ACTIVE,
    },
  });

  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: { organizationId: org.id },
  });

  console.log(`Organization: ${org.name} (${org.id})`);

  const permissionRecords = await Promise.all(
    Object.values(PERMISSION).map((perm) => {
      const [resource, action] = perm.split(":");
      return prisma.permission.upsert({
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

  console.log(`Permissions: ${permissionRecords.length} created`);

  const permMap = new Map<string, string>();
  for (const p of permissionRecords) {
    permMap.set(`${p.resource}:${p.action}`, p.id);
  }

  const roleNames = Object.values(ROLE);
  const createdRoles = await Promise.all(
    roleNames.map((name) =>
      prisma.role.upsert({
        where: { name_organizationId: { name, organizationId: org.id } },
        update: {},
        create: {
          name,
          organizationId: org.id,
          isSystem: SYSTEM_ROLES.includes(name),
        },
      }),
    ),
  );

  console.log(`Roles: ${createdRoles.length} created`);

  for (const role of createdRoles) {
    const roleName = role.name as RoleName;
    const permissions = ROLE_PERMISSIONS[roleName];
    if (!permissions) continue;

    const permissionIds: string[] = permissions
      .map((key: string) => permMap.get(key))
      .filter((id): id is string => id !== undefined);

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }

  console.log("Role-permission assignments complete");

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@agimeal.com" },
    update: {},
    create: {
      organizationId: org.id,
      firstName: "Super",
      lastName: "Admin",
      email: "admin@agimeal.com",
      passwordHash,
      jobTitle: "System Administrator",
      status: Status.ACTIVE,
      emailVerified: true,
    },
  });

  console.log(`Super Admin: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.email})`);

  const superAdminRole = createdRoles.find((r) => r.name === ROLE.SUPER_ADMIN);
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: superAdmin.id, roleId: superAdminRole.id },
    });
  }

  console.log("Super Admin role assigned");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
