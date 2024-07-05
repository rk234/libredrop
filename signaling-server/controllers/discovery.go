package controllers

import (
	"fmt"
	"libredrop/signal/state"
	"strings"

	"github.com/gofiber/fiber/v2"
)

var nextID int64 = 0

func GetPeers(c *fiber.Ctx) error {
	myID := c.Params("id")

	var peers []string = make([]string, 1)
	for id := range state.PeerConnections {
		if id != myID {
			peers = append(peers, id)
		}
	}

	return c.SendString(strings.Join(peers, ", "))
}

func GetNewID(c *fiber.Ctx) error {
	nextID++
	return c.SendString(fmt.Sprintf("peer-%v", nextID-1))
}

//TODO: Hook up with the app!
