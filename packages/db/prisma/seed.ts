import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const SEED_USERS = [
  { email: "admin@nexos.com",  name: "Admin Nexos",  role: "owner"  },
  { email: "ops@nexos.com",    name: "Ops Nexos",    role: "admin"  },
  { email: "ventas@nexos.com", name: "Ventas Nexos", role: "member" },
];

const PASSWORD = "Amin1234!";

async function createAuthUser(email: string, name: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (existing) return existing.id;
    }
    throw new Error(`Error creating ${email}: ${error.message}`);
  }

  return data.user.id;
}

async function main() {
  console.log("Seeding users…");

  const userIds: string[] = [];

  for (const u of SEED_USERS) {
    const id = await createAuthUser(u.email, u.name);

    await prisma.user.upsert({
      where: { id },
      update: { email: u.email, name: u.name },
      create: { id, email: u.email, name: u.name },
    });

    userIds.push(id);
    console.log(`  ${u.email} → ${id}`);
  }

  // Organization
  console.log("Seeding organization…");
  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: { name: "Nexos" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Nexos",
      plan: "free",
    },
  });

  // Memberships
  for (let i = 0; i < SEED_USERS.length; i++) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: userIds[i],
        },
      },
      update: { role: SEED_USERS[i].role },
      create: {
        organizationId: org.id,
        userId: userIds[i],
        role: SEED_USERS[i].role,
      },
    });
  }
  console.log("  memberships OK");

  // Sources
  console.log("Seeding sources…");
  const sources = [
    {
      name: "Encuentra24 – Autos Honduras",
      type: "rss",
      url: "https://www.encuentra24.com/rss/hn/cars",
      vertical: "autos",
    },
    {
      name: "OLX Honduras – Smartphones",
      type: "rss",
      url: "https://www.olx.hn/rss/smartphones",
      vertical: "smartphones",
    },
    {
      name: "InmoHN – Bienes Raíces",
      type: "rss",
      url: "https://www.inmohn.com/feed",
      vertical: "real_estate",
    },
  ];

  for (const s of sources) {
    await prisma.source.upsert({
      where: {
        id:
          s.vertical === "autos"
            ? "00000000-0000-0000-0001-000000000001"
            : s.vertical === "smartphones"
            ? "00000000-0000-0000-0001-000000000002"
            : "00000000-0000-0000-0001-000000000003",
      },
      update: { name: s.name, url: s.url },
      create: {
        id:
          s.vertical === "autos"
            ? "00000000-0000-0000-0001-000000000001"
            : s.vertical === "smartphones"
            ? "00000000-0000-0000-0001-000000000002"
            : "00000000-0000-0000-0001-000000000003",
        organizationId: org.id,
        name: s.name,
        type: s.type,
        url: s.url,
        vertical: s.vertical,
        status: "active",
      },
    });
    console.log(`  ${s.name}`);
  }

  // Saved searches
  console.log("Seeding saved searches…");
  const adminId = userIds[0];
  const savedSearches = [
    {
      id: "00000000-0000-0000-0002-000000000001",
      name: "Toyota Hilux SPS",
      keywords: ["toyota", "hilux"],
      filters: { category: "autos", intent: "buy" },
    },
    {
      id: "00000000-0000-0000-0002-000000000002",
      name: "iPhone 14 Tegucigalpa",
      keywords: ["iphone", "14"],
      filters: { category: "smartphones" },
    },
    {
      id: "00000000-0000-0000-0002-000000000003",
      name: "Apartamentos en renta Zona Sur",
      keywords: ["apartamento", "zona sur"],
      filters: { category: "real_estate", intent: "rent" },
    },
  ];

  for (const ss of savedSearches) {
    await prisma.savedSearch.upsert({
      where: { id: ss.id },
      update: { name: ss.name },
      create: {
        id: ss.id,
        organizationId: org.id,
        createdBy: adminId,
        name: ss.name,
        keywords: ss.keywords,
        filters: ss.filters,
        isActive: true,
      },
    });
    console.log(`  ${ss.name}`);
  }

  // Alert
  console.log("Seeding alerts…");
  await prisma.alert.upsert({
    where: { id: "00000000-0000-0000-0003-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0003-000000000001",
      organizationId: org.id,
      createdBy: adminId,
      savedSearchId: "00000000-0000-0000-0002-000000000001",
      name: "Alerta Toyota Hilux",
      channel: "email",
      channelConfig: { email: "admin@nexos.com" },
      isActive: true,
    },
  });
  console.log("  Alerta Toyota Hilux → email admin@nexos.com");

  console.log("\nSeed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
