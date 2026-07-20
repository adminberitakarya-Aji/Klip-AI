/**
 * Credit Service - Handle credit operations
 *
 * Operations:
 * - Check balance
 * - Deduct credits (with rollback on failure)
 * - Refund credits (automatic on generation failure)
 * - Grant free credits (one-time registration bonus)
 * - Transaction logging
 */

import { prisma, CreditTransactionType, PaymentStatus } from "@klipai/db";
import { FREE_CREDITS_AMOUNT } from "@klipai/ai/pricing";

export interface CreditCheckResult {
  sufficient: boolean;
  currentBalance: number;
  required: number;
  deficit: number; // How many more credits needed (0 if sufficient)
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
  error?: string;
}

/**
 * Check if user has sufficient credits
 */
export async function checkCredits(
  userId: string,
  requiredCredits: number,
): Promise<CreditCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    return {
      sufficient: false,
      currentBalance: 0,
      required: requiredCredits,
      deficit: requiredCredits,
    };
  }

  const currentBalance = user.credits;
  const sufficient = currentBalance >= requiredCredits;
  const deficit = sufficient ? 0 : requiredCredits - currentBalance;

  return {
    sufficient,
    currentBalance,
    required: requiredCredits,
    deficit,
  };
}

/**
 * Deduct credits from user balance
 * Creates transaction record for audit trail
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: Record<string, unknown>,
): Promise<CreditDeductionResult> {
  try {
    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Lock the user row for update
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.credits < amount) {
        throw new Error(
          `Insufficient credits. Required: ${amount}, Available: ${user.credits}`,
        );
      }

      // Deduct from balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: user.credits - amount,
        },
        select: { credits: true },
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount, // Negative for deduction
          type,
          description,
          paymentStatus: PaymentStatus.COMPLETED,
          metadata: metadata || undefined,
        },
      });

      return {
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    });

    return {
      success: true,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    };
  } catch (error) {
    return {
      success: false,
      newBalance: 0,
      transactionId: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Refund credits to user (e.g., when generation fails after retries)
 */
export async function refundCredits(
  userId: string,
  amount: number,
  originalTransactionId: string,
  reason: string,
): Promise<CreditDeductionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Add to balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: amount,
          },
        },
        select: { credits: true },
      });

      // Create refund transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount: amount, // Positive for refund
          type: CreditTransactionType.REFUND,
          description: `Refund: ${reason}`,
          paymentStatus: PaymentStatus.COMPLETED,
          metadata: {
            originalTransactionId,
            reason,
            refundedAt: new Date().toISOString(),
          },
        },
      });

      return {
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    });

    return {
      success: true,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    };
  } catch (error) {
    return {
      success: false,
      newBalance: 0,
      transactionId: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add credits to user (purchase or free credits)
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  packageId?: string,
  metadata?: Record<string, unknown>,
): Promise<CreditDeductionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Add to balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: amount,
          },
        },
        select: { credits: true },
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          packageId: packageId || null,
          amount: amount, // Positive for addition
          type,
          description,
          paymentStatus: PaymentStatus.COMPLETED,
          metadata: metadata || undefined,
        },
      });

      return {
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    });

    return {
      success: true,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    };
  } catch (error) {
    return {
      success: false,
      newBalance: 0,
      transactionId: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Grant free credits to new user (one-time registration bonus)
 */
export async function grantFreeCredits(userId: string): Promise<{
  success: boolean;
  creditsGranted: number;
  alreadyClaimed: boolean;
}> {
  // Check if user already received free credits
  const existingTransaction = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: CreditTransactionType.FREE_CREDITS,
    },
  });

  if (existingTransaction) {
    return {
      success: false,
      creditsGranted: 0,
      alreadyClaimed: true,
    };
  }

  // Grant free credits
  const result = await addCredits(
    userId,
    FREE_CREDITS_AMOUNT,
    CreditTransactionType.FREE_CREDITS,
    "Free credits for new user registration",
    undefined,
    {
      source: "registration_bonus",
      amount: FREE_CREDITS_AMOUNT,
    },
  );

  if (result.success) {
    // Update user flag
    await prisma.user.update({
      where: { id: userId },
      data: { hasReceivedFreeCredits: true },
    });
  }

  return {
    success: result.success,
    creditsGranted: result.success ? FREE_CREDITS_AMOUNT : 0,
    alreadyClaimed: false,
  };
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userId: string): Promise<{
  balance: number;
  hasReceivedFreeCredits: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      hasReceivedFreeCredits: true,
    },
  });

  return {
    balance: user?.credits || 0,
    hasReceivedFreeCredits: user?.hasReceivedFreeCredits || false,
  };
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: CreditTransactionType;
  },
): Promise<{
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: Date;
    metadata: unknown;
  }>;
  total: number;
}> {
  const { limit = 20, offset = 0, type } = options || {};

  const where = {
    userId,
    ...(type ? { type } : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
        metadata: true,
      },
    }),
    prisma.creditTransaction.count({ where }),
  ]);

  return {
    transactions,
    total,
  };
}

/**
 * Get credit packages available for purchase
 */
export async function getCreditPackages(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    credits: number;
    priceIdr: number;
    priceUsd: number | null;
    description: string | null;
    features: string[];
    isPopular: boolean;
  }>
> {
  const packages = await prisma.creditPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      credits: true,
      priceIdr: true,
      priceUsd: true,
      description: true,
      features: true,
      isPopular: true,
    },
  });

  return packages;
}

/**
 * Get specific credit package by slug
 */
export async function getCreditPackageBySlug(slug: string): Promise<{
  id: string;
  name: string;
  slug: string;
  credits: number;
  priceIdr: number;
  priceUsd: number | null;
  description: string | null;
  features: string[];
} | null> {
  const pkg = await prisma.creditPackage.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      credits: true,
      priceIdr: true,
      priceUsd: true,
      description: true,
      features: true,
    },
  });

  return pkg;
}
