package controllers

import (
	"encoding/json"
	"github.com/gofiber/contrib/websocket"
	"libredrop/signal/state"
	"log"
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

		switch sm.MessageType {
		case "connect":
			str, _ := json.Marshal(sm.MessageData)
			var peer state.Peer
			json.Unmarshal(str, &peer)

			state.Connect(peer)

			if err := c.WriteJSON(sm); err != nil {
				log.Println("err: ", err)
			}
		case "disconnect":
			str, _ := json.Marshal(sm.MessageData)
			var peer state.Peer
			json.Unmarshal(str, &peer)

			state.Disconnect(peer)

			if err := c.WriteJSON(sm); err != nil {
				log.Println("err: ", err)
			}
		case "offer":
			str, _ := json.Marshal(sm.MessageData)
			var offer state.Offer
			json.Unmarshal(str, &offer)

			state.PutOffer(offer)

			if err := c.WriteJSON(sm); err != nil {
				log.Println("err: ", err)
			}
		case "answer":
			str, _ := json.Marshal(sm.MessageData)
			var answer state.Answer
			json.Unmarshal(str, &answer)

			state.PutAnswer(answer)

			if err := c.WriteJSON(sm); err != nil {
				log.Println("err: ", err)
			}
		default:
			if err = c.WriteMessage(mt, msg); err != nil {
				log.Println("write: ", err)
				break
			}
		}
	}
}
