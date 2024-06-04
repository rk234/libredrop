package main

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"libredrop/signal/controllers"
)

func main() {
	app := fiber.New()

	signal := app.Group("/signal")

	signal.Use("/channel", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}

		return fiber.ErrUpgradeRequired
	})

	app.Get("/channel/:id", websocket.New(controllers.SignalingChannel))
	app.Listen(":3000")
}
