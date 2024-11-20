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
		//read message from WS, handle errors
		if mt, msg, err = c.ReadMessage(); err != nil {
			log.Println("read: ", err)
			state.DisconnectPeer(peerID)
			break
		}

		log.Println("mt: ", mt)
		log.Printf("recv: %s", msg)

		var sm SignalMessage

		// marse msg string as SignalMessage type, handle error
		if err := json.Unmarshal(msg, &sm); err != nil {
			log.Println("err: ", err)
		}

		log.Println("sm: ", sm)

		//handle different message types
		switch sm.MessageType {
		case "offer":
			//offer received, send it to the intended recipient
			str, _ := json.Marshal(sm.MessageData)
			var offer state.Offer
			json.Unmarshal(str, &offer) // parse json to offer type

			state.PutOffer(offer) // put offer in state

			// send offer to receiving peer
			log.Println("Broadcasting offer to ", offer.To)
			conn := state.PeerConnections[offer.To]
			if err := conn.WriteJSON(sm); err != nil {
				log.Println("err: ", err)
			}
		case "answer":
			//answer received, send it to the peer that made the corresponding offer
			str, _ := json.Marshal(sm.MessageData)
			var answer state.Answer
			json.Unmarshal(str, &answer)

			state.PutAnswer(answer)

			if err := state.GetConnection(answer.To).WriteJSON(sm); err != nil {
				log.Println("err: ", err)
			}
		case "candidate":
			//WebRTC ICE candidate received, broadcast to other peers
			for receiver, conn := range state.PeerConnections {
				if receiver != peerID {
					log.Println("Transmitting candidate to", receiver)
					if err = conn.WriteMessage(mt, msg); err != nil {
						log.Println("err: ", err)
					}
				}
			}
		case "rejection":
			//rejection received, send it to the peer that made the correspinding offer
			str, _ := json.Marshal(sm.MessageData)
			var offer state.Offer
			json.Unmarshal(str, &offer)

			//remove offer, rejected
			state.RemoveOffer(offer.From)
			conn := state.PeerConnections[offer.From]
			log.Println("Sending rejection to " + offer.From)
			if err = conn.WriteMessage(mt, msg); err != nil {
				log.Println("err: ", err)
			}
		default:
			//no corresponding message type, write it back
			if err = c.WriteMessage(mt, msg); err != nil {
				log.Println("write: ", err)
			}
		}

		// state.DisconnectPeer(peerID)
	}

}
