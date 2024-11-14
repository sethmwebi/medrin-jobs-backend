import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  // Seed Users
  const roles = ["JOBSEEKER", "EMPLOYER", "ADMIN", "SUPERADMIN"];
  for (let i = 0; i < 20; i++) {
    await prisma.user.create({
      data: {
        name: faker.name.fullName(),
        email: faker.internet.email(),
        emailVerified: faker.date.past(),
        image: faker.image.avatar(),
        password: faker.internet.password(),
        // @ts-ignore
        role: faker.helpers.arrayElement(roles),
        profile: { bio: faker.lorem.text() },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Seed Applications
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.findFirst({
      skip: Math.floor(Math.random() * 20),
    });

    await prisma.application.create({
      data: {
        user_id: user?.id ?? "",
        job_id: faker.datatype.uuid(),
        cover_letter: faker.lorem.paragraph(),
        resume_url: faker.internet.url(),
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Seed Application Statuses
  for (let i = 0; i < 20; i++) {
    const application = await prisma.application.findFirst({
      skip: Math.floor(Math.random() * 20),
    });

    await prisma.applicationStatus.create({
      data: {
        application_id: application?.id ?? "",
        status: faker.helpers.arrayElement([
          "Pending",
          "Reviewed",
          "Accepted",
          "Rejected",
        ]),
        updated_at: faker.date.recent(),
      },
    });
  }

  // Seed Payments
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.findFirst({
      skip: Math.floor(Math.random() * 20),
    });

    await prisma.payment.create({
      data: {
        user_id: user?.id ?? "",
        amount: parseFloat(faker.finance.amount(10, 500, 2)),
        payment_method: faker.finance.transactionType(),
        status: faker.helpers.arrayElement(["Pending", "Completed", "Failed"]),
      },
    });
  }

  // Seed Accounts
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.findFirst({
      skip: Math.floor(Math.random() * 20),
    });

    await prisma.account.create({
      data: {
        userId: user?.id ?? "",
        type: faker.helpers.arrayElement(["oauth", "email"]),
        provider: faker.helpers.arrayElement(["google", "github", "facebook"]),
        providerAccountId: faker.datatype.uuid(),
        refresh_token: faker.datatype.uuid(),
        access_token: faker.datatype.uuid(),
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        token_type: "Bearer",
        scope: "read write",
        id_token: faker.datatype.uuid(),
        session_state: faker.datatype.uuid(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Seed Verification Tokens
  for (let i = 0; i < 20; i++) {
    await prisma.verificationToken.create({
      data: {
        identifier: faker.internet.email(),
        token: faker.datatype.uuid(),
        expires: faker.date.future(),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
