package main

import (
	"fmt"
	"libredrop/signal/controllers"
	"log"
	"os"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()

	app.Use(cors.New())

	// signal := app.Group("/signal")
	//
	// signal.Use("/channel", func(c *fiber.Ctx) error {
	// 	if websocket.IsWebSocketUpgrade(c) {
	// 		c.Locals("allowed", true)
	// 		return c.Next()
	// 	}
	//
	// 	return fiber.ErrUpgradeRequired
	// })

	app.Get("/channel/:id", websocket.New(controllers.SignalingChannel))

	app.Get("/discovery/find/:id", controllers.GetPeers)
	app.Get("/discovery/me", controllers.GetNewID)

	if len(os.Args) == 1 {
		app.Listen(":3000")
	} else {
		log.Println(fmt.Sprint(os.Args[1], ":3000"))
		app.Listen(fmt.Sprint(os.Args[1], ":3000"))
	}
}
