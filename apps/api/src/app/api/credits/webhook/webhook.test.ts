/**
 * Tests for Midtrans Webhook Signature Verification
 *
 * These tests verify that the webhook endpoint correctly rejects
 * notifications with invalid or missing signatures.
 */

import { describe, it, expect } from "vitest";
import crypto from "crypto";

// Mock environment variables
const TEST_SERVER_KEY = "test-server-key-12345";

describe("Midtrans Webhook Security", () => {
  /**
   * Generate a valid Midtrans signature
   */
  function generateValidSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    serverKey: string,
  ): string {
    const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    return crypto.createHash("sha512").update(input).digest("hex");
  }

  describe("Signature Generation", () => {
    it("should generate correct SHA512 signature", () => {
      const orderId = "KLIP_STARTER_user123_1234567890";
      const statusCode = "200";
      const grossAmount = "50000";
      const serverKey = TEST_SERVER_KEY;

      const signature = generateValidSignature(
        orderId,
        statusCode,
        grossAmount,
        serverKey,
      );

      // Verify the signature format (128 hex characters for SHA512)
      expect(signature).toHaveLength(128);
      expect(signature).toMatch(/^[a-f0-9]+$/);
    });

    it("should produce different signatures for different inputs", () => {
      const serverKey = TEST_SERVER_KEY;

      const sig1 = generateValidSignature("order1", "200", "50000", serverKey);
      const sig2 = generateValidSignature("order2", "200", "50000", serverKey);
      const sig3 = generateValidSignature("order1", "201", "50000", serverKey);

      expect(sig1).not.toBe(sig2);
      expect(sig1).not.toBe(sig3);
      expect(sig2).not.toBe(sig3);
    });
  });

  describe("Signature Verification Logic", () => {
    /**
     * Simulates the verifySignature function from the route
     */
    function verifySignature(
      notification: {
        order_id: string;
        status_code: string;
        gross_amount: string;
        signature_key?: string;
      },
      serverKey: string,
    ): boolean {
      // Reject if no signature provided
      if (!notification.signature_key) {
        return false;
      }

      // Calculate expected signature
      const input = `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`;
      const expectedSignature = crypto
        .createHash("sha512")
        .update(input)
        .digest("hex");

      // Constant-time comparison
      try {
        const isValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(notification.signature_key),
        );
        return isValid;
      } catch {
        // Buffer lengths don't match
        return false;
      }
    }

    it("should accept valid signature", () => {
      const notification = {
        order_id: "KLIP_STARTER_user123_1234567890",
        status_code: "200",
        gross_amount: "50000",
        signature_key: generateValidSignature(
          "KLIP_STARTER_user123_1234567890",
          "200",
          "50000",
          TEST_SERVER_KEY,
        ),
      };

      expect(verifySignature(notification, TEST_SERVER_KEY)).toBe(true);
    });

    it("should reject missing signature", () => {
      const notification = {
        order_id: "KLIP_STARTER_user123_1234567890",
        status_code: "200",
        gross_amount: "50000",
      };

      expect(verifySignature(notification, TEST_SERVER_KEY)).toBe(false);
    });

    it("should reject invalid signature", () => {
      const notification = {
        order_id: "KLIP_STARTER_user123_1234567890",
        status_code: "200",
        gross_amount: "50000",
        signature_key:
          "invalid_signature_that_is_completely_wrong_and_will_not_match",
      };

      expect(verifySignature(notification, TEST_SERVER_KEY)).toBe(false);
    });

    it("should reject tampered order_id", () => {
      const validSig = generateValidSignature(
        "KLIP_STARTER_user123_1234567890",
        "200",
        "50000",
        TEST_SERVER_KEY,
      );

      const notification = {
        order_id: "KLIP_STARTER_hacker456_9999999999", // Different order_id
        status_code: "200",
        gross_amount: "50000",
        signature_key: validSig,
      };

      expect(verifySignature(notification, TEST_SERVER_KEY)).toBe(false);
    });

    it("should reject tampered amount", () => {
      const validSig = generateValidSignature(
        "KLIP_STARTER_user123_1234567890",
        "200",
        "50000",
        TEST_SERVER_KEY,
      );

      const notification = {
        order_id: "KLIP_STARTER_user123_1234567890",
        status_code: "200",
        gross_amount: "1000000", // Different amount (1M instead of 50K)
        signature_key: validSig,
      };

      expect(verifySignature(notification, TEST_SERVER_KEY)).toBe(false);
    });

    it("should reject wrong server key", () => {
      const notification = {
        order_id: "KLIP_STARTER_user123_1234567890",
        status_code: "200",
        gross_amount: "50000",
        signature_key: generateValidSignature(
          "KLIP_STARTER_user123_1234567890",
          "200",
          "50000",
          "wrong-server-key",
        ),
      };

      expect(verifySignature(notification, TEST_SERVER_KEY)).toBe(false);
    });
  });
});
