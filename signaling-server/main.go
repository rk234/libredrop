package main

import (
	"libredrop/signal/controllers"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	signal := app.Group("/signal")

	signal.Post("/offer", controllers.PostOffer)
	signal.Get("/offer/:", controllers.GetOffers)

	signal.Post("/answer", controllers.PostAnswer)
	signal.Get("/answer", controllers.GetAnswers)

	app.Listen(":3000")
}
