import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditAction } from "@prisma/client";
import { AuditEntity } from "../constants/audit.js";
import * as notificationService from "./notification.service.js";
import { getPaginationMeta } from "../utils/pagination.js";

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

  async applyOrderCompletion(
    restaurantId: string,
    orderId: string,
  ) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
        status: "COMPLETED",
      },
    });

    if (!order) {
      return null;
    }

    const program = await prisma.loyaltyProgram.findUnique({
      where: {
        restaurantId,
      },
    });

    if (!program || !program.isActive) {
      return null;
    }

    const customerPhone = normalizePhone(order.customerPhone);

    if (!customerPhone) {
      return null;
    }

    const customer = await this.getOrCreateCustomer(
      restaurantId,
      customerPhone,
    );

    if (!customer) {
      return null;
    }

    const orderValue = Number(order.total);

    if (orderValue < Number(program.minimumOrderValue)) {
      return null;
    }

    return prisma.$transaction(async (tx) => {
      const processed = await tx.order.updateMany({
        where: {
          id: order.id,
          loyaltyProcessed: false,
        },
        data: {
          loyaltyProcessed: true,
        },
      });

      if (processed.count === 0) {
        return null;
      }
      const currentCustomer =
        await tx.loyaltyCustomer.findUniqueOrThrow({
          where: {
            id: customer.id,
          },
        });

      const progress =
        currentCustomer.progressCount + 1;

      const rewardsEarned = Math.floor(
        progress / program.purchaseThreshold,
      );

      const remainingProgress =
        progress % program.purchaseThreshold;

      const updatedCustomer =
        await tx.loyaltyCustomer.update({
          where: {
            id: currentCustomer.id,
          },
          data: {
            visitCount: {
              increment: 1,
            },

            totalSpend: {
              increment: orderValue,
            },

            progressCount: remainingProgress,

            lastOrderAt: new Date(),
          },
        });

      const createdRewards = [];

      for (let i = 0; i < rewardsEarned; i++) {
        const reward = await tx.loyaltyReward.create({
          data: {
            restaurantId,
            customerId: currentCustomer.id,
            programId: program.id,
            orderId: order.id,
            status: "AVAILABLE",
          },
        });

        createdRewards.push(reward);
      }

      if (createdRewards.length > 0) {
        await notificationService.notifyRewardEarned({
          restaurantId,
          customerId: customer.id,
          customerPhone: customer.phone,
          rewardCount: createdRewards.length,
          rewardName: program.rewardName,
          orderId: order.id,
        });
      }

      await auditService.log({
        restaurantId,

        action: AuditAction.ORDER_STATUS_CHANGED,

        entity: AuditEntity.Order,

        entityId: order.id,

        metadata: {
          customerPhone,

          rewardsEarned,

          remainingProgress,

          rewardName: program.rewardName,
        },
      });

      return {
        customer: updatedCustomer,
        rewards: createdRewards,
        rewardCount: createdRewards.length,
      };
    });
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

    const customer = await prisma.loyaltyCustomer.findUniqueOrThrow({
      where: {
        id: customerId,
      },
    });

    const program = await prisma.loyaltyProgram.findUnique({
      where: {
        restaurantId,
      },
    });

    await notificationService.notifyRewardRedeemed({
      restaurantId,
      customerId: customer.id,
      customerPhone: customer.phone,
      rewardId: updatedReward.id,
      rewardName: program?.rewardName ?? "Reward",
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

  async listCustomers(
    restaurantId: string,
    page = "1",
    limit = "20",
    search?: string,
    sort:
      | "lastOrderAt"
      | "visitCount"
      | "totalSpend"
      | "createdAt" = "lastOrderAt",
    order: "asc" | "desc" = "desc",
  ) {
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100,
    );

    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.LoyaltyCustomerWhereInput = {
      restaurantId,

      ...(search
        ? {
            OR: [
              {
                phone: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [customers, total] =
      await prisma.$transaction([
        prisma.loyaltyCustomer.findMany({
          where,
          skip,
          take: limitNumber,

          orderBy: {
            [sort]: order,
          },

          include: {
            rewards: {
              select: {
                status: true,
              },
            },
          },
        }),

        prisma.loyaltyCustomer.count({
          where,
        }),
      ]);

    return {
      data: customers.map((customer) => ({
        id: customer.id,
        phone: customer.phone,
        name: customer.name,

        visitCount: customer.visitCount,
        progressCount: customer.progressCount,
        totalSpend: customer.totalSpend,

        lastOrderAt: customer.lastOrderAt,
        createdAt: customer.createdAt,

        availableRewards:
          customer.rewards.filter(
            (r) => r.status === "AVAILABLE",
          ).length,

        redeemedRewards:
          customer.rewards.filter(
            (r) => r.status === "REDEEMED",
          ).length,
      })),

      pagination: getPaginationMeta(
        pageNumber,
        limitNumber,
        total,
      ),
    };
  },

  async getPublicProgram(restaurantId: string) {
    const program = await prisma.loyaltyProgram.findUnique({
      where: {
        restaurantId,
      },
    });

    if (!program || !program.isActive) {
      throw new AppError(
        "Loyalty program is not available.",
        404,
      );
    }

    return {
      rewardName: program.rewardName,
      purchaseThreshold: program.purchaseThreshold,
      rewardQuantity: program.rewardQuantity,
      minimumOrderValue: program.minimumOrderValue,
      isActive: program.isActive,
    };
  },

  async getPublicCustomer(
    restaurantId: string,
    phone: string,
  ) {
    const result = await this.getCustomer(
      restaurantId,
      phone,
    );

    return {
      customer: {
        phone: result.customer.phone,
        visitCount: result.customer.visitCount,
        progressCount: result.customer.progressCount,
      },

      progress: result.progress,

      rewards: result.rewards.map((reward) => ({
        id: reward.id,
        status: reward.status,
        createdAt: reward.createdAt,
      })),
    };
  },
};
