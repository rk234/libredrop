package controllers

import (
	"encoding/json"
	"libredrop/signal/state"
	"log"

	"github.com/gofiber/contrib/websocket"
)

type SignalMessage struct {
	MessageType string
	MessageData interface{}
}

func SignalingChannel(c *websocket.Conn) {
	peerID := c.Params("id")

	state.ConnectPeer(peerID, c)

	var (
		mt  int
		msg []byte
		err error
	)

	for {
		if mt, msg, err = c.ReadMessage(); err != nil {
			log.Println("read: ", err)
			state.DisconnectPeer(peerID)
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
		case "offer":
			str, _ := json.Marshal(sm.MessageData)
			var offer state.Offer
			json.Unmarshal(str, &offer)

			state.PutOffer(offer)

			for receiver, conn := range state.PeerConnections {
				if receiver == offer.To {
					log.Println("Broadcasting offer to ", receiver)
					if err := conn.WriteJSON(sm); err != nil {
						log.Println("err: ", err)
					}
				}
			}
		case "answer":
			str, _ := json.Marshal(sm.MessageData)
			var answer state.Answer
			json.Unmarshal(str, &answer)

			state.PutAnswer(answer)

			if err := state.GetConnection(answer.To).WriteJSON(sm); err != nil {
				log.Println("err: ", err)
			}
		case "candidate":
			for receiver, conn := range state.PeerConnections {
				if receiver != peerID {
					log.Println("Transmitting candidate to", receiver)
					if err = conn.WriteMessage(mt, msg); err != nil {
						log.Println("err: ", err)
					}
				}
			}
		default:
			if err = c.WriteMessage(mt, msg); err != nil {
				log.Println("write: ", err)
			}
		}

		// state.DisconnectPeer(peerID)
	}

}
