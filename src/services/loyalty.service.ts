import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditAction } from "@prisma/client";
import { AuditEntity } from "../constants/audit.js";

const normalizePhone = (phone: string | null | undefined) => phone?.trim().replace(/\s+/g, "") ?? null;

type LoyaltyProgramInput = {
  rewardName: string;
  purchaseThreshold: number;
  rewardQuantity: number;
  minimumOrderValue: number;
  isActive: boolean;
};

export const loyaltyService = {
  async upsertProgram(restaurantId: string, input: LoyaltyProgramInput) {
    if (input.purchaseThreshold < 1) {
      throw new AppError("Purchase threshold must be at least 1", 400);
    }

    if (input.rewardQuantity < 1) {
      throw new AppError("Reward quantity must be at least 1", 400);
    }

    const existing = await prisma.loyaltyProgram.findUnique({ where: { restaurantId } });

    const program = existing
      ? await prisma.loyaltyProgram.update({
          where: { id: existing.id },
          data: {
            rewardName: input.rewardName.trim(),
            purchaseThreshold: input.purchaseThreshold,
            rewardQuantity: input.rewardQuantity,
            minimumOrderValue: input.minimumOrderValue,
            isActive: input.isActive,
          },
        })
      : await prisma.loyaltyProgram.create({
          data: {
            restaurantId,
            rewardName: input.rewardName.trim(),
            purchaseThreshold: input.purchaseThreshold,
            rewardQuantity: input.rewardQuantity,
            minimumOrderValue: input.minimumOrderValue,
            isActive: input.isActive,
          },
        });

    await auditService.log({
      restaurantId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: { loyaltyProgramId: program.id, isActive: program.isActive },
    });

    return program;
  },

  async getProgram(restaurantId: string) {
    return prisma.loyaltyProgram.findUnique({ where: { restaurantId } });
  },

  async getOrCreateCustomer(restaurantId: string, phone: string | null | undefined, name?: string | null) {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return null;
    }

    let customer = await prisma.loyaltyCustomer.findUnique({
      where: { restaurantId_phone: { restaurantId, phone: normalizedPhone } },
    });

    if (!customer) {
      customer = await prisma.loyaltyCustomer.create({
        data: {
          restaurantId,
          phone: normalizedPhone,
          name: name?.trim() || null,
        },
      });
    }

    return customer;
  },

  async getCustomer(restaurantId: string, phone: string) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new AppError("Phone number is required", 400);
    }

    const customer = await prisma.loyaltyCustomer.findUnique({
      where: { restaurantId_phone: { restaurantId, phone: normalizedPhone } },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const rewards = await prisma.loyaltyReward.findMany({
      where: { restaurantId, customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      customer,
      rewards,
      progress: {
        purchaseThreshold: await this.getProgramThreshold(restaurantId),
        progressCount: customer.progressCount,
      },
    };
  },

  async getProgramThreshold(restaurantId: string) {
    const program = await prisma.loyaltyProgram.findUnique({ where: { restaurantId } });
    return program?.purchaseThreshold ?? 0;
  },

  async applyOrderCompletion(restaurantId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId, status: "COMPLETED" },
      include: { items: true },
    });

    if (!order) {
      return null;
    }

    const program = await prisma.loyaltyProgram.findUnique({ where: { restaurantId } });
    if (!program || !program.isActive) {
      return null;
    }

    const customerPhone = normalizePhone(order.customerPhone ?? null);
    if (!customerPhone) {
      return null;
    }

    const customer = await this.getOrCreateCustomer(restaurantId, customerPhone);
    if (!customer) {
      return null;
    }

    const orderValue = Number(order.total);
    const minimumOrderValue = Number(program.minimumOrderValue);
    if (orderValue < minimumOrderValue) {
      return null;
    }

    const existingRewards = await prisma.loyaltyReward.findMany({
      where: { restaurantId, customerId: customer.id, programId: program.id, status: "AVAILABLE" },
    });

    const nextProgress = customer.progressCount + 1;
    const rewardEligible = nextProgress >= program.purchaseThreshold;

    const updatedCustomer = await prisma.loyaltyCustomer.update({
      where: { id: customer.id },
      data: {
        visitCount: { increment: 1 },
        totalSpend: { increment: Number(order.total) },
        progressCount: nextProgress,
        lastOrderAt: new Date(),
      },
    });

    if (rewardEligible && existingRewards.length < program.rewardQuantity) {
      const reward = await prisma.loyaltyReward.create({
        data: {
          restaurantId,
          customerId: customer.id,
          programId: program.id,
          status: "AVAILABLE",
          orderId: order.id,
        },
      });

      await auditService.log({
        restaurantId,
        action: AuditAction.ORDER_STATUS_CHANGED,
        entity: AuditEntity.Order,
        entityId: order.id,
        metadata: {
          customerPhone,
          rewardId: reward.id,
          rewardName: program.rewardName,
          progressCount: nextProgress,
        },
      });

      return { customer: updatedCustomer, reward, rewardCount: 1 };
    }

    await auditService.log({
      restaurantId,
      action: AuditAction.ORDER_STATUS_CHANGED,
      entity: AuditEntity.Order,
      entityId: order.id,
      metadata: {
        customerPhone,
        progressCount: nextProgress,
        rewardEligible: false,
      },
    });

    return { customer: updatedCustomer, rewardCount: 0 };
  },

  async redeemReward(restaurantId: string, customerId: string, rewardId: string) {
    const reward = await prisma.loyaltyReward.findFirst({
      where: { id: rewardId, restaurantId, customerId, status: "AVAILABLE" },
    });

    if (!reward) {
      throw new AppError("Reward not found or already redeemed", 404);
    }

    const updatedReward = await prisma.loyaltyReward.update({
      where: { id: rewardId },
      data: {
        status: "REDEEMED",
        redeemedAt: new Date(),
      },
    });

    await auditService.log({
      restaurantId,
      employeeId: null,
      action: AuditAction.ORDER_STATUS_CHANGED,
      entity: AuditEntity.Order,
      entityId: reward.orderId ?? undefined,
      metadata: { rewardId: updatedReward.id, status: updatedReward.status },
    });

    return updatedReward;
  },
};
