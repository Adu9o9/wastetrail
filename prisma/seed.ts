import "dotenv/config";
import { PrismaClient, PickupStatus, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingFacility = await prisma.facility.findFirst({
  where: { name: "WasteTrail Demo Facility" },
});

const facility =
  existingFacility ??
  (await prisma.facility.create({
    data: {
      name: "WasteTrail Demo Facility",
      address: "Kochi, Kerala",
      active: true,
      lat: 9.9312,
      lng: 76.2673,
    },
  }));


  const generatorUser = await prisma.appUser.upsert({
    where: { clerkUserId: "demo_generator_clerk_id" },
    update: { role: Role.GENERATOR },
    create: {
      clerkUserId: "demo_generator_clerk_id",
      role: Role.GENERATOR,
      generatorProfile: {
        create: {
          name: "Demo Generator",
          address: "Near MG Road, Kochi",
          lat: 9.9315,
          lng: 76.2670,
        },
      },
    },
    include: { generatorProfile: true },
  });

  const collectorUser = await prisma.appUser.upsert({
    where: { clerkUserId: "demo_collector_clerk_id" },
    update: { role: Role.COLLECTOR },
    create: {
      clerkUserId: "demo_collector_clerk_id",
      role: Role.COLLECTOR,
      collectorProfile: {
        create: {
          facilityId: facility.id,
        },
      },
    },
    include: { collectorProfile: true },
  });

  const generatorProfileId = generatorUser.generatorProfile!.id;
  const collectorProfileId = collectorUser.collectorProfile!.id;

  await prisma.pickupRequest.createMany({
    data: [
      {
        facilityId: facility.id,
        generatorId: generatorProfileId,
        wasteType: "Pig waste (demo)",
        approxKg: 25,
        notes: "First demo pickup request",
        status: PickupStatus.OPEN,
      },
      {
        facilityId: facility.id,
        generatorId: generatorProfileId,
        wasteType: "Pig waste (demo) - accepted",
        approxKg: 40,
        notes: "Second demo pickup request",
        status: PickupStatus.ACCEPTED,
        acceptedByCollectorId: collectorProfileId,
        acceptedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete:", {
    facilityId: facility.id,
    generatorUserId: generatorUser.id,
    collectorUserId: collectorUser.id,
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
