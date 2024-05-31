package controllers

import "github.com/gofiber/fiber/v2"

func PostAnswer(ctx *fiber.Ctx) error {
	return ctx.SendString("Hello from PostAnswer")
}

func GetAnswers(ctx *fiber.Ctx) error {
	return ctx.SendString("Get Answers!")
}
