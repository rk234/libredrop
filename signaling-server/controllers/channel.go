package controllers

import (
	"encoding/json"
	"log"

	"github.com/gofiber/contrib/websocket"
)

type SignalMessage struct {
	MessageType string
	MessageData interface{}
}

func SignalingChannel(c *websocket.Conn) {
	log.Println(c.Params("receiver"))

	var (
		mt  int
		msg []byte
		err error
	)

	for {
		if mt, msg, err = c.ReadMessage(); err != nil {
			log.Println("read: ", err)
			break
		}

		log.Println("mt: ", mt)
		log.Printf("recv: %s", msg)

		var sm SignalMessage

		if err := json.Unmarshal(msg, &sm); err != nil {
			log.Println("err: ", err)
		}

		log.Println("sm: ", sm)

		if err = c.WriteMessage(mt, msg); err != nil {
			log.Println("write: ", err)
			break
		}
	}
}
