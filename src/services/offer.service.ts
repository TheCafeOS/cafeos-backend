import { Prisma, DiscountType } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditAction } from "@prisma/client";
import { AuditEntity } from "../constants/audit.js";

type OfferInput = {
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscount?: number | null;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

const validateOfferInput = (input: OfferInput) => {
  if (!input.name.trim()) {
    throw new AppError("Offer name is required.", 400);
  }

  if (input.discountValue <= 0) {
    throw new AppError(
      "Discount value must be greater than 0.",
      400,
    );
  }

  if (input.minimumOrderValue < 0) {
    throw new AppError(
      "Minimum order value cannot be negative.",
      400,
    );
  }

  if (
    input.maximumDiscount !== null &&
    input.maximumDiscount !== undefined &&
    input.maximumDiscount <= 0
  ) {
    throw new AppError(
      "Maximum discount must be greater than 0.",
      400,
    );
  }

  if (
    input.discountType === "PERCENTAGE" &&
    input.discountValue > 100
  ) {
    throw new AppError(
      "Percentage discount cannot exceed 100%.",
      400,
    );
  }

  if (
    input.startsAt &&
    input.endsAt &&
    input.endsAt <= input.startsAt
  ) {
    throw new AppError(
      "Offer end time must be after the start time.",
      400,
    );
  }
};

const getOfferOrThrow = async (
  restaurantId: string,
  offerId: string,
) => {
  const offer = await prisma.offer.findFirst({
    where: {
      id: offerId,
      restaurantId,
    },
  });

  if (!offer) {
    throw new AppError("Offer not found.", 404);
  }

  return offer;
};

export const offerService = {
  async createOffer(
    restaurantId: string,
    employeeId: string,
    input: OfferInput,
  ) {
    validateOfferInput(input);

    const offer = await prisma.offer.create({
      data: {
        restaurantId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minimumOrderValue: input.minimumOrderValue,
        maximumDiscount:
          input.maximumDiscount ?? null,
        isActive: input.isActive,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
      },
    });

    await auditService.log({
      restaurantId,
      employeeId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: {
        action: "OFFER_CREATED",
        offerId: offer.id,
        name: offer.name,
      },
    });

    return offer;
  },

  async listOffers(
    restaurantId: string,
  ) {
    return prisma.offer.findMany({
      where: {
        restaurantId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async getOffer(
    restaurantId: string,
    offerId: string,
  ) {
    return getOfferOrThrow(
      restaurantId,
      offerId,
    );
  },

  async updateOffer(
    restaurantId: string,
    employeeId: string,
    offerId: string,
    input: OfferInput,
  ) {
    validateOfferInput(input);

    const existing = await getOfferOrThrow(
      restaurantId,
      offerId,
    );

    const offer = await prisma.offer.update({
      where: {
        id: existing.id,
      },
      data: {
        name: input.name.trim(),
        description:
          input.description?.trim() || null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minimumOrderValue:
          input.minimumOrderValue,
        maximumDiscount:
          input.maximumDiscount ?? null,
        isActive: input.isActive,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
      },
    });

    await auditService.log({
      restaurantId,
      employeeId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: {
        action: "OFFER_UPDATED",
        offerId: offer.id,
      },
    });

    return offer;
  },

  async updateOfferStatus(
    restaurantId: string,
    employeeId: string,
    offerId: string,
    isActive: boolean,
  ) {
    const existing = await getOfferOrThrow(
      restaurantId,
      offerId,
    );

    const offer = await prisma.offer.update({
      where: {
        id: existing.id,
      },
      data: {
        isActive,
      },
    });

    await auditService.log({
      restaurantId,
      employeeId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: {
        action: isActive
          ? "OFFER_ENABLED"
          : "OFFER_DISABLED",
        offerId: offer.id,
      },
    });

    return offer;
  },

  async deleteOffer(
    restaurantId: string,
    employeeId: string,
    offerId: string,
  ) {
    const existing = await getOfferOrThrow(
      restaurantId,
      offerId,
    );

    await prisma.offer.delete({
      where: {
        id: existing.id,
      },
    });

    await auditService.log({
      restaurantId,
      employeeId,
      action: AuditAction.SETTINGS_UPDATED,
      entity: AuditEntity.Restaurant,
      entityId: restaurantId,
      metadata: {
        action: "OFFER_DELETED",
        offerId: existing.id,
        name: existing.name,
      },
    });
  },

  async getActiveOffers(
    restaurantId: string,
  ) {
    const now = new Date();

    return prisma.offer.findMany({
      where: {
        restaurantId,
        isActive: true,
        AND: [
          {
            OR: [
              {
                startsAt: null,
              },
              {
                startsAt: {
                  lte: now,
                },
              },
            ],
          },
          {
            OR: [
              {
                endsAt: null,
              },
              {
                endsAt: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },
      orderBy: {
        minimumOrderValue: "asc",
      },
    });
  },

  async getPublicOffers(
    restaurantId: string,
    ) {
    const offers = await this.getActiveOffers(
        restaurantId,
    );

    return offers.map((offer) => ({
        id: offer.id,
        name: offer.name,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: Number(
        offer.discountValue,
        ),
        minimumOrderValue: Number(
        offer.minimumOrderValue,
        ),
        maximumDiscount:
        offer.maximumDiscount !== null
            ? Number(offer.maximumDiscount)
            : null,
        startsAt: offer.startsAt,
        endsAt: offer.endsAt,
    }));
    },

  calculateDiscount(
    offer: {
      discountType: DiscountType;
      discountValue: Prisma.Decimal;
      minimumOrderValue: Prisma.Decimal;
      maximumDiscount: Prisma.Decimal | null;
    },
    subtotal: number,
  ) {
    const minimumOrderValue =
      Number(offer.minimumOrderValue);

    if (subtotal < minimumOrderValue) {
      return 0;
    }

    let discount =
      offer.discountType === "PERCENTAGE"
        ? (subtotal * Number(offer.discountValue)) /
          100
        : Number(offer.discountValue);

    if (offer.maximumDiscount) {
      discount = Math.min(
        discount,
        Number(offer.maximumDiscount),
      );
    }

    return Math.min(
      Math.max(discount, 0),
      subtotal,
    );
  },

  async findBestOffer(
    restaurantId: string,
    subtotal: number,
    tx: Prisma.TransactionClient = prisma,
  ) {
    const now = new Date();

    const offers = await tx.offer.findMany({
      where: {
        restaurantId,
        isActive: true,
        minimumOrderValue: {
          lte: subtotal,
        },
        AND: [
          {
            OR: [
              {
                startsAt: null,
              },
              {
                startsAt: {
                  lte: now,
                },
              },
            ],
          },
          {
            OR: [
              {
                endsAt: null,
              },
              {
                endsAt: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },
    });

    let bestOffer = null;
    let bestDiscount = 0;

    for (const offer of offers) {
      const discount = this.calculateDiscount(
        offer,
        subtotal,
      );

      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    }

    return {
      offer: bestOffer,
      discountAmount: bestDiscount,
    };
  },
};