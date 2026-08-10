import { Prisma, AuditAction } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";
import * as notificationService from "./notification.service.js";
import { getPaginationMeta } from "../utils/pagination.js";

const normalizePhone = (
  phone: string | null | undefined,
) => phone?.trim().replace(/\s+/g, "") ?? null;

type LoyaltyProgramInput = {
  rewardName: string;
  purchaseThreshold: number;
  rewardQuantity: number;
  minimumOrderValue: number;
  isActive: boolean;
};

const validateProgramInput = (
  input: LoyaltyProgramInput,
) => {
  if (input.purchaseThreshold < 1) {
    throw new AppError(
      "Purchase threshold must be at least 1",
      400,
    );
  }

  if (input.rewardQuantity < 1) {
    throw new AppError(
      "Reward quantity must be at least 1",
      400,
    );
  }

  if (input.minimumOrderValue < 0) {
    throw new AppError(
      "Minimum order value cannot be negative",
      400,
    );
  }

  if (!input.rewardName.trim()) {
    throw new AppError(
      "Reward name is required",
      400,
    );
  }
};

const getProgramOrThrow = async (
  restaurantId: string,
  programId: string,
) => {
  const program =
    await prisma.loyaltyProgram.findFirst({
      where: {
        id: programId,
        restaurantId,
      },
    });

  if (!program) {
    throw new AppError(
      "Loyalty program not found",
      404,
    );
  }

  return program;
};

export const loyaltyService = {
  // --------------------------------------------------
  // PROGRAM CRUD
  // --------------------------------------------------

  async createProgram(
    restaurantId: string,
    input: LoyaltyProgramInput,
  ) {
    validateProgramInput(input);

    const program =
      await prisma.loyaltyProgram.create({
        data: {
          restaurantId,
          rewardName: input.rewardName.trim(),
          purchaseThreshold:
            input.purchaseThreshold,
          rewardQuantity:
            input.rewardQuantity,
          minimumOrderValue:
            input.minimumOrderValue,
          isActive: input.isActive,
        },
      });

    await auditService.log({
      restaurantId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: {
        action: "LOYALTY_PROGRAM_CREATED",
        loyaltyProgramId: program.id,
        rewardName: program.rewardName,
      },
    });

    return program;
  },

  async listPrograms(
    restaurantId: string,
  ) {
    const programs =
      await prisma.loyaltyProgram.findMany({
        where: {
          restaurantId,
        },
        include: {
          _count: {
            select: {
              rewards: true,
              customerPrograms: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return programs.map((program) => ({
      ...program,
      rewardCount: program._count.rewards,
      customerCount:
        program._count.customerPrograms,
      _count: undefined,
    }));
  },

  async getProgram(
    restaurantId: string,
    programId: string,
  ) {
    return getProgramOrThrow(
      restaurantId,
      programId,
    );
  },

  async updateProgram(
    restaurantId: string,
    programId: string,
    input: LoyaltyProgramInput,
  ) {
    validateProgramInput(input);

    const existing =
      await getProgramOrThrow(
        restaurantId,
        programId,
      );

    const program =
      await prisma.loyaltyProgram.update({
        where: {
          id: existing.id,
        },
        data: {
          rewardName: input.rewardName.trim(),
          purchaseThreshold:
            input.purchaseThreshold,
          rewardQuantity:
            input.rewardQuantity,
          minimumOrderValue:
            input.minimumOrderValue,
          isActive: input.isActive,
        },
      });

    await auditService.log({
      restaurantId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: {
        action: "LOYALTY_PROGRAM_UPDATED",
        loyaltyProgramId: program.id,
      },
    });

    return program;
  },

  async updateProgramStatus(
    restaurantId: string,
    programId: string,
    isActive: boolean,
  ) {
    const existing =
      await getProgramOrThrow(
        restaurantId,
        programId,
      );

    const program =
      await prisma.loyaltyProgram.update({
        where: {
          id: existing.id,
        },
        data: {
          isActive,
        },
      });

    await auditService.log({
      restaurantId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: {
        action: isActive
          ? "LOYALTY_PROGRAM_ENABLED"
          : "LOYALTY_PROGRAM_DISABLED",
        loyaltyProgramId: program.id,
      },
    });

    return program;
  },

  async deleteProgram(
    restaurantId: string,
    programId: string,
  ) {
    const program =
      await getProgramOrThrow(
        restaurantId,
        programId,
      );

    const availableRewards =
      await prisma.loyaltyReward.count({
        where: {
          programId,
          status: "AVAILABLE",
        },
      });

    if (availableRewards > 0) {
      throw new AppError(
        "This loyalty program cannot be deleted because customers still have unredeemed rewards from it. Disable the program instead.",
        409,
      );
    }

    await prisma.loyaltyProgram.delete({
      where: {
        id: program.id,
      },
    });

    await auditService.log({
      restaurantId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: {
        action: "LOYALTY_PROGRAM_DELETED",
        loyaltyProgramId: program.id,
        rewardName: program.rewardName,
      },
    });

    return null;
  },

  // --------------------------------------------------
  // CUSTOMER
  // --------------------------------------------------

  async getOrCreateCustomer(
    restaurantId: string,
    phone: string | null | undefined,
    name?: string | null,
  ) {
    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      return null;
    }

    let customer =
      await prisma.loyaltyCustomer.findUnique({
        where: {
          restaurantId_phone: {
            restaurantId,
            phone: normalizedPhone,
          },
        },
      });

    if (!customer) {
      customer =
        await prisma.loyaltyCustomer.create({
          data: {
            restaurantId,
            phone: normalizedPhone,
            name: name?.trim() || null,
          },
        });
    }

    return customer;
  },

  async getCustomer(
    restaurantId: string,
    phone: string,
  ) {
    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      throw new AppError(
        "Phone number is required",
        400,
      );
    }

    const customer =
      await prisma.loyaltyCustomer.findUnique({
        where: {
          restaurantId_phone: {
            restaurantId,
            phone: normalizedPhone,
          },
        },
        include: {
          customerPrograms: {
            include: {
              program: {
                select: {
                  id: true,
                  rewardName: true,
                  purchaseThreshold: true,
                  rewardQuantity: true,
                  minimumOrderValue: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

    if (!customer) {
      throw new AppError(
        "Customer not found",
        404,
      );
    }

    const rewards =
      await prisma.loyaltyReward.findMany({
        where: {
          restaurantId,
          customerId: customer.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return {
      customer,
      progress:
        customer.customerPrograms.map(
          (progress) => ({
            programId: progress.programId,
            rewardName:
              progress.program.rewardName,
            progressCount:
              progress.progressCount,
            purchaseThreshold:
              progress.program
                .purchaseThreshold,
            rewardQuantity:
              progress.program.rewardQuantity,
            isActive:
              progress.program.isActive,
          }),
        ),
      rewards,
    };
  },

  // --------------------------------------------------
  // ORDER COMPLETION
  // --------------------------------------------------

  async applyOrderCompletion(
    restaurantId: string,
    orderId: string,
  ) {
    const order =
      await prisma.order.findFirst({
        where: {
          id: orderId,
          restaurantId,
          status: "COMPLETED",
        },
      });

    if (!order) {
      return null;
    }

    const programs =
      await prisma.loyaltyProgram.findMany({
        where: {
          restaurantId,
          isActive: true,
        },
      });

    if (!programs.length) {
      return null;
    }

    const customerPhone =
      normalizePhone(order.customerPhone);

    if (!customerPhone) {
      return null;
    }

    const customer =
      await this.getOrCreateCustomer(
        restaurantId,
        customerPhone,
      );

    if (!customer) {
      return null;
    }

    const orderValue =
      Number(order.total);

    const eligiblePrograms =
      programs.filter(
        (program) =>
          orderValue >=
          Number(
            program.minimumOrderValue,
          ),
      );

    if (!eligiblePrograms.length) {
      return null;
    }

    return prisma.$transaction(
      async (tx) => {
        const processed =
          await tx.order.updateMany({
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

        const updatedCustomer =
          await tx.loyaltyCustomer.update({
            where: {
              id: customer.id,
            },
            data: {
              visitCount: {
                increment: 1,
              },
              totalSpend: {
                increment: orderValue,
              },
              lastOrderAt: new Date(),
            },
          });

        const createdRewards: {
          id: string;
          programId: string;
        }[] = [];

        for (const program of eligiblePrograms) {
          const progress =
            await tx.loyaltyCustomerProgram.upsert(
              {
                where: {
                  customerId_programId: {
                    customerId:
                      customer.id,
                    programId:
                      program.id,
                  },
                },
                create: {
                  customerId:
                    customer.id,
                  programId:
                    program.id,
                  progressCount: 1,
                },
                update: {
                  progressCount: {
                    increment: 1,
                  },
                },
              },
            );

          const rewardsEarned =
            Math.floor(
              progress.progressCount /
                program.purchaseThreshold,
            );

          const remainingProgress =
            progress.progressCount %
            program.purchaseThreshold;

          if (rewardsEarned > 0) {
            await tx.loyaltyCustomerProgram.update(
              {
                where: {
                  id: progress.id,
                },
                data: {
                  progressCount:
                    remainingProgress,
                },
              },
            );

            for (
              let i = 0;
              i <
              rewardsEarned *
                program.rewardQuantity;
              i++
            ) {
              const reward =
                await tx.loyaltyReward.create({
                  data: {
                    restaurantId,
                    customerId:
                      customer.id,
                    programId:
                      program.id,
                    orderId: order.id,
                    status: "AVAILABLE",
                  },
                });

              createdRewards.push({
                id: reward.id,
                programId: program.id,
              });
            }

            await notificationService.notifyRewardEarned(
              {
                restaurantId,
                customerId: customer.id,
                customerPhone:
                  customer.phone,
                rewardCount:
                  rewardsEarned *
                  program.rewardQuantity,
                rewardName:
                  program.rewardName,
                orderId: order.id,
              },
            );
          }
        }

        await auditService.log({
          restaurantId,
          action:
            AuditAction.ORDER_STATUS_CHANGED,
          entity: AuditEntity.Order,
          entityId: order.id,
          metadata: {
            customerPhone,
            processedPrograms:
              eligiblePrograms.map(
                (program) => program.id,
              ),
            rewardsEarned:
              createdRewards.length,
          },
        });

        return {
          customer:
            updatedCustomer,
          rewards: createdRewards,
          rewardCount:
            createdRewards.length,
        };
      },
    );
  },

  // --------------------------------------------------
  // REDEEM
  // --------------------------------------------------

  async redeemReward(
    restaurantId: string,
    customerId: string,
    rewardId: string,
  ) {
    const reward =
      await prisma.loyaltyReward.findFirst({
        where: {
          id: rewardId,
          restaurantId,
          customerId,
          status: "AVAILABLE",
        },
      });

    if (!reward) {
      throw new AppError(
        "Reward not found or already redeemed",
        404,
      );
    }

    if (!reward.programId) {
      throw new AppError(
        "This reward is no longer associated with a loyalty program.",
        409,
      );
    }

    const program =
      await prisma.loyaltyProgram.findFirst({
        where: {
          id: reward.programId,
          restaurantId,
        },
      });

    if (!program) {
      throw new AppError(
        "The loyalty program associated with this reward no longer exists.",
        409,
      );
    }

    const updatedReward =
      await prisma.loyaltyReward.update({
        where: {
          id: rewardId,
        },
        data: {
          status: "REDEEMED",
          redeemedAt: new Date(),
        },
      });

    const customer =
      await prisma.loyaltyCustomer.findUniqueOrThrow({
        where: {
          id: customerId,
        },
      });

    await notificationService.notifyRewardRedeemed({
      restaurantId,
      customerId: customer.id,
      customerPhone: customer.phone,
      rewardId: updatedReward.id,
      rewardName: program.rewardName,
    });

    await auditService.log({
      restaurantId,
      employeeId: null,
      action: AuditAction.ORDER_STATUS_CHANGED,
      entity: AuditEntity.Order,
      entityId: reward.orderId ?? undefined,
      metadata: {
        rewardId: updatedReward.id,
        programId: reward.programId,
        status: updatedReward.status,
      },
    });

    return updatedReward;
  },

  // --------------------------------------------------
  // CUSTOMER LIST
  // --------------------------------------------------

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
    const pageNumber = Math.max(
      Number(page) || 1,
      1,
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100,
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const where: Prisma.LoyaltyCustomerWhereInput =
      {
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
            customerPrograms: {
              select: {
                progressCount: true,
                programId: true,
                program: {
                  select: {
                    purchaseThreshold:
                      true,
                  },
                },
              },
            },
          },
        }),

        prisma.loyaltyCustomer.count({
          where,
        }),
      ]);

    return {
      data: customers.map(
        (customer) => ({
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
          visitCount:
            customer.visitCount,
          totalSpend:
            customer.totalSpend,
          lastOrderAt:
            customer.lastOrderAt,
          createdAt:
            customer.createdAt,

          programs:
            customer.customerPrograms.map(
              (program) => ({
                programId:
                  program.programId,
                progressCount:
                  program.progressCount,
                purchaseThreshold:
                  program.program
                    .purchaseThreshold,
              }),
            ),

          availableRewards:
            customer.rewards.filter(
              (r) =>
                r.status ===
                "AVAILABLE",
            ).length,

          redeemedRewards:
            customer.rewards.filter(
              (r) =>
                r.status ===
                "REDEEMED",
            ).length,
        }),
      ),

      pagination:
        getPaginationMeta(
          pageNumber,
          limitNumber,
          total,
        ),
    };
  },

  // --------------------------------------------------
  // PUBLIC
  // --------------------------------------------------

  async getPublicProgram(
    restaurantId: string,
  ) {
    const programs =
      await prisma.loyaltyProgram.findMany(
        {
          where: {
            restaurantId,
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      );

    if (!programs.length) {
      throw new AppError(
        "Loyalty program is not available.",
        404,
      );
    }

    return {
      programs: programs.map(
        (program) => ({
          id: program.id,
          rewardName:
            program.rewardName,
          purchaseThreshold:
            program.purchaseThreshold,
          rewardQuantity:
            program.rewardQuantity,
          minimumOrderValue:
            program.minimumOrderValue,
          isActive:
            program.isActive,
        }),
      ),
    };
  },

  async getPublicCustomer(
    restaurantId: string,
    phone: string,
  ) {
    const result =
      await this.getCustomer(
        restaurantId,
        phone,
      );

    return {
      customer: {
        phone:
          result.customer.phone,
        visitCount:
          result.customer.visitCount,
      },

      programs: result.progress,

      rewards:
        result.rewards.map(
          (reward) => ({
            id: reward.id,
            programId:
              reward.programId,
            status: reward.status,
            createdAt:
              reward.createdAt,
          }),
        ),
    };
  },
};