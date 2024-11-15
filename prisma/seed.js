"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        // Seed Users
        const roles = ["JOBSEEKER", "EMPLOYER", "ADMIN", "SUPERADMIN"];
        for (let i = 0; i < 20; i++) {
            yield prisma.user.create({
                data: {
                    name: faker_1.faker.name.fullName(),
                    email: faker_1.faker.internet.email(),
                    emailVerified: faker_1.faker.date.past(),
                    image: faker_1.faker.image.avatar(),
                    password: faker_1.faker.internet.password(),
                    // @ts-ignore
                    role: faker_1.faker.helpers.arrayElement(roles),
                    profile: { bio: faker_1.faker.lorem.text() },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }
        // Seed Applications
        for (let i = 0; i < 20; i++) {
            const user = yield prisma.user.findFirst({
                skip: Math.floor(Math.random() * 20),
            });
            yield prisma.application.create({
                data: {
                    user_id: (_a = user === null || user === void 0 ? void 0 : user.id) !== null && _a !== void 0 ? _a : "",
                    job_id: faker_1.faker.datatype.uuid(),
                    cover_letter: faker_1.faker.lorem.paragraph(),
                    resume_url: faker_1.faker.internet.url(),
                    status: "Pending",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }
        // Seed Application Statuses
        for (let i = 0; i < 20; i++) {
            const application = yield prisma.application.findFirst({
                skip: Math.floor(Math.random() * 20),
            });
            yield prisma.applicationStatus.create({
                data: {
                    application_id: (_b = application === null || application === void 0 ? void 0 : application.id) !== null && _b !== void 0 ? _b : "",
                    status: faker_1.faker.helpers.arrayElement([
                        "Pending",
                        "Reviewed",
                        "Accepted",
                        "Rejected",
                    ]),
                    updated_at: faker_1.faker.date.recent(),
                },
            });
        }
        // Seed Payments
        for (let i = 0; i < 20; i++) {
            const user = yield prisma.user.findFirst({
                skip: Math.floor(Math.random() * 20),
            });
            yield prisma.payment.create({
                data: {
                    user_id: (_c = user === null || user === void 0 ? void 0 : user.id) !== null && _c !== void 0 ? _c : "",
                    amount: parseFloat(faker_1.faker.finance.amount(10, 500, 2)),
                    payment_method: faker_1.faker.finance.transactionType(),
                    status: faker_1.faker.helpers.arrayElement(["Pending", "Completed", "Failed"]),
                },
            });
        }
        // Seed Accounts
        for (let i = 0; i < 20; i++) {
            const user = yield prisma.user.findFirst({
                skip: Math.floor(Math.random() * 20),
            });
            yield prisma.account.create({
                data: {
                    userId: (_d = user === null || user === void 0 ? void 0 : user.id) !== null && _d !== void 0 ? _d : "",
                    type: faker_1.faker.helpers.arrayElement(["oauth", "email"]),
                    provider: faker_1.faker.helpers.arrayElement(["google", "github", "facebook"]),
                    providerAccountId: faker_1.faker.datatype.uuid(),
                    refresh_token: faker_1.faker.datatype.uuid(),
                    access_token: faker_1.faker.datatype.uuid(),
                    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                    token_type: "Bearer",
                    scope: "read write",
                    id_token: faker_1.faker.datatype.uuid(),
                    session_state: faker_1.faker.datatype.uuid(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }
        // Seed Verification Tokens
        for (let i = 0; i < 20; i++) {
            yield prisma.verificationToken.create({
                data: {
                    identifier: faker_1.faker.internet.email(),
                    token: faker_1.faker.datatype.uuid(),
                    expires: faker_1.faker.date.future(),
                },
            });
        }
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
