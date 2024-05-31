package controllers

import (
	"github.com/gofiber/fiber/v2"
	"libredrop/signal/state"
)

func PostOffer(ctx *fiber.Ctx) error {
	offer := state.Offer{}

	if err := ctx.BodyParser(&offer); err != nil {
		return err
	}

	state.PutOffer(offer.From, offer)

	return ctx.SendStatus(200)
}

func GetOffers(ctx *fiber.Ctx) error {
	offer := state.GetOfferFrom(ctx.Params("id"))

	return ctx.JSON(offer)
}
