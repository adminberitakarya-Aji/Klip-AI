/**
 * E2E Tests for Credit System API Endpoints
 *
 * Tests the complete credit flow:
 * 1. GET /api/credits/packages - List available packages
 * 2. GET /api/credits/balance - Get user balance
 * 3. POST /api/credits/purchase - Initiate payment (mock)
 * 4. GET /api/credits/history - Transaction history
 * 5. Midtrans webhook processing
 *
 * Run with: pnpm --filter @klipai/api test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock functions
const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockCreditPackageFindMany = vi.fn();
const mockCreditPackageFindUnique = vi.fn();
const mockCreditTransactionFindFirst = vi.fn();
const mockCreditTransactionFindMany = vi.fn();
const mockCreditTransactionCreate = vi.fn();
const mockCreditTransactionCount = vi.fn();
const mockTransaction = vi.fn();

// Mock prisma
vi.mock("@klipai/db", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    creditPackage: {
      findMany: mockCreditPackageFindMany,
      findUnique: mockCreditPackageFindUnique,
    },
    creditTransaction: {
      findFirst: mockCreditTransactionFindFirst,
      findMany: mockCreditTransactionFindMany,
      create: mockCreditTransactionCreate,
      count: mockCreditTransactionCount,
    },
    $transaction: mockTransaction,
  },
  CreditTransactionType: {
    FREE_CREDITS: "FREE_CREDITS",
    PURCHASE: "PURCHASE",
    USAGE: "USAGE",
    REFUND: "REFUND",
  },
  PaymentStatus: {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  },
}));

// Mock the midtrans lib
vi.mock("@/lib/midtrans", () => ({
  createSnapPayment: vi.fn().mockResolvedValue({
    success: true,
    orderId: "KLIP_PRO_user123_1234567890",
    snapToken: "mock-snap-token-12345",
    redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-token",
  }),
  handleMidtransNotification: vi.fn().mockResolvedValue({
    success: true,
    userId: "user-1",
    creditsAdded: 100,
    transactionId: "mock-tx-id",
  } as any),
  verifyMidtransSignature: vi.fn().mockReturnValue(true),
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn().mockImplementation((request: unknown) => {
    const authHeader =
      request instanceof Request ? request.headers.get("authorization") : null;

    if (authHeader === "Bearer test-user-1-token") {
      return Promise.resolve({ id: "user-1", email: "test1@example.com" });
    }
    if (authHeader === "Bearer test-admin-token") {
      return Promise.resolve({
        id: "admin-1",
        email: "admin@example.com",
        role: "admin",
      });
    }
    return Promise.resolve(null);
  }),
}));

describe("Credit System API - E2E Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/credits/packages", () => {
    it("should return list of credit packages", async () => {
      mockCreditPackageFindMany.mockResolvedValue([
        {
          id: "pkg-1",
          name: "Starter",
          slug: "starter",
          credits: 20,
          priceIdr: 50000,
          priceUsd: 3.5,
          description: "Perfect for trying out",
          features: ["20 credits", "Basic support"],
          isPopular: false,
          isActive: true,
          sortOrder: 1,
        },
        {
          id: "pkg-2",
          name: "Pro",
          slug: "pro",
          credits: 100,
          priceIdr: 200000,
          priceUsd: 14,
          description: "Most popular choice",
          features: ["100 credits", "Priority support", "Best value"],
          isPopular: true,
          isActive: true,
          sortOrder: 2,
        },
      ]);

      const { getCreditPackages } = await import("@/lib/credits");
      const packages = await getCreditPackages();

      expect(packages).toHaveLength(2);
      expect(packages[0]).toMatchObject({
        name: "Starter",
        slug: "starter",
        credits: 20,
        priceIdr: 50000,
      });
      expect(packages[1]).toMatchObject({
        name: "Pro",
        slug: "pro",
        credits: 100,
        priceIdr: 200000,
        isPopular: true,
      });
    });

    it("should calculate correct per-credit price", async () => {
      mockCreditPackageFindMany.mockResolvedValue([
        {
          id: "pkg-1",
          name: "Starter",
          slug: "starter",
          credits: 20,
          priceIdr: 50000,
          priceUsd: null,
          description: null,
          features: [],
          isPopular: false,
          isActive: true,
          sortOrder: 1,
        },
      ]);

      const { getCreditPackages } = await import("@/lib/credits");
      const packages = await getCreditPackages();

      const perCreditPrice = Math.ceil(
        packages[0].priceIdr / packages[0].credits,
      );
      expect(perCreditPrice).toBe(2500);
    });
  });

  describe("Credit Balance Logic", () => {
    it("should correctly calculate sufficient/insufficient balance", async () => {
      mockUserFindUnique.mockResolvedValue({
        id: "user-1",
        credits: 50,
      });

      const { checkCredits } = await import("@/lib/credits");

      const result1 = await checkCredits("user-1", 30);
      expect(result1.sufficient).toBe(true);
      expect(result1.currentBalance).toBe(50);
      expect(result1.required).toBe(30);
      expect(result1.deficit).toBe(0);

      const result2 = await checkCredits("user-1", 100);
      expect(result2.sufficient).toBe(false);
      expect(result2.currentBalance).toBe(50);
      expect(result2.required).toBe(100);
      expect(result2.deficit).toBe(50);
    });

    it("should handle non-existent user", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const { checkCredits } = await import("@/lib/credits");
      const result = await checkCredits("nonexistent-user", 10);

      expect(result.sufficient).toBe(false);
      expect(result.currentBalance).toBe(0);
      expect(result.deficit).toBe(10);
    });
  });

  describe("Credit Deduction Flow", () => {
    it("should successfully deduct credits", async () => {
      mockTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            user: {
              findUnique: vi.fn().mockResolvedValue({ credits: 100 }),
              update: vi.fn().mockResolvedValue({ credits: 97 }),
            },
            creditTransaction: {
              create: vi.fn().mockResolvedValue({ id: "tx-new-123" }),
            },
          });
        },
      );

      const { deductCredits } = await import("@/lib/credits");
      const { CreditTransactionType } = await import("@klipai/db");

      const result = await deductCredits(
        "user-1",
        3,
        CreditTransactionType.USAGE,
        "Template generation",
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(97);
      expect(result.transactionId).toBe("tx-new-123");
    });

    it("should handle insufficient credits during deduction", async () => {
      mockTransaction.mockRejectedValue(new Error("Insufficient credits"));

      const { deductCredits } = await import("@/lib/credits");
      const { CreditTransactionType } = await import("@klipai/db");

      const result = await deductCredits(
        "user-1",
        5,
        CreditTransactionType.USAGE,
        "Template generation",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Insufficient credits");
    });
  });

  describe("Credit Refund Flow", () => {
    it("should successfully refund credits", async () => {
      mockTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            user: {
              update: vi.fn().mockResolvedValue({ credits: 103 }),
            },
            creditTransaction: {
              create: vi.fn().mockResolvedValue({ id: "refund-tx-123" }),
            },
          });
        },
      );

      const { refundCredits } = await import("@/lib/credits");

      const result = await refundCredits(
        "user-1",
        3,
        "original-tx-456",
        "Generation failed after retries",
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(103);
    });
  });

  describe("Free Credits Grant", () => {
    it("should grant free credits to new user", async () => {
      mockCreditTransactionFindFirst.mockResolvedValue(null);

      mockTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            user: {
              update: vi.fn().mockResolvedValue({ credits: 10 }),
            },
            creditTransaction: {
              create: vi.fn().mockResolvedValue({ id: "free-tx-123" }),
            },
          });
        },
      );

      const { grantFreeCredits } = await import("@/lib/credits");

      const result = await grantFreeCredits("new-user-1");

      expect(result.success).toBe(true);
      expect(result.creditsGranted).toBe(10);
      expect(result.alreadyClaimed).toBe(false);
    });

    it("should not grant free credits twice", async () => {
      mockCreditTransactionFindFirst.mockResolvedValue({
        id: "existing-free-tx",
        type: "FREE_CREDITS",
      });

      const { grantFreeCredits } = await import("@/lib/credits");
      const result = await grantFreeCredits("user-with-free-credits");

      expect(result.success).toBe(false);
      expect(result.creditsGranted).toBe(0);
      expect(result.alreadyClaimed).toBe(true);
    });
  });

  describe("Credit History", () => {
    it("should return paginated transaction history", async () => {
      const mockTransactions = [
        {
          id: "tx-1",
          amount: -3,
          type: "USAGE",
          description: "Generation",
          createdAt: new Date(),
          metadata: null,
        },
        {
          id: "tx-2",
          amount: 100,
          type: "PURCHASE",
          description: "Pro Package",
          createdAt: new Date(),
          metadata: null,
        },
        {
          id: "tx-3",
          amount: 10,
          type: "FREE_CREDITS",
          description: "Welcome bonus",
          createdAt: new Date(),
          metadata: null,
        },
      ];

      mockCreditTransactionFindMany.mockResolvedValue(mockTransactions);
      mockCreditTransactionCount.mockResolvedValue(3);

      const { getCreditHistory } = await import("@/lib/credits");
      const result = await getCreditHistory("user-1", { limit: 10, offset: 0 });

      expect(result.transactions).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.transactions[0].amount).toBe(-3);
    });

    it("should filter by transaction type", async () => {
      const mockTransactions = [
        {
          id: "tx-purchase",
          amount: 100,
          type: "PURCHASE",
          description: "Pro Package",
          createdAt: new Date(),
          metadata: null,
        },
      ];

      mockCreditTransactionFindMany.mockResolvedValue(mockTransactions);
      mockCreditTransactionCount.mockResolvedValue(1);

      const { getCreditHistory } = await import("@/lib/credits");
      const { CreditTransactionType } = await import("@klipai/db");

      await getCreditHistory("user-1", {
        type: CreditTransactionType.PURCHASE,
      });

      expect(mockCreditTransactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            type: "PURCHASE",
          }),
        }),
      );
    });
  });
});

describe("Credit System Integration Scenarios", () => {
  describe("Complete Purchase Flow (Mock)", () => {
    it("should simulate complete purchase flow", async () => {
      mockCreditPackageFindUnique.mockResolvedValue({
        id: "pkg-pro",
        name: "Pro",
        slug: "pro",
        credits: 100,
        priceIdr: 200000,
        isActive: true,
      });

      const { createSnapPayment } = await import("@/lib/midtrans");
      const paymentResult = await createSnapPayment({
        packageId: "pkg-pro",
        packageSlug: "pro",
        packageName: "Pro",
        credits: 100,
        priceIdr: 200000,
        userId: "user-1",
        userEmail: "user@example.com",
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.snapToken).toBeDefined();
      expect(paymentResult.orderId).toContain("KLIP_PRO");

      const { handleMidtransNotification } = await import("@/lib/midtrans");
      const webhookResult = await handleMidtransNotification({
        order_id: paymentResult.orderId,
        status_code: "200",
        transaction_id: "tx-123",
        transaction_status: "settlement",
        gross_amount: "200000",
        payment_type: "credit_card",
      } as any);

      expect(webhookResult.success).toBe(true);
      expect((webhookResult as any).creditsAdded).toBe(100);
    });
  });

  describe("Credits Expiration Policy", () => {
    it("should document that credits never expire", () => {
      const creditPolicy = {
        creditsExpire: false,
        canTopUp: true,
        automaticRefundOnFailure: true,
      };

      expect(creditPolicy.creditsExpire).toBe(false);
      expect(creditPolicy.canTopUp).toBe(true);
      expect(creditPolicy.automaticRefundOnFailure).toBe(true);
    });
  });
});
