package state

import (
	"log"

	"github.com/gofiber/contrib/websocket"
)

var PeerConnections map[string]*websocket.Conn = make(map[string]*websocket.Conn)

func ConnectPeer(peerID string, conn *websocket.Conn) {
	log.Println("=>CONNECT ", peerID)
	PeerConnections[peerID] = conn
}

func GetConnection(peerID string) *websocket.Conn {
	return PeerConnections[peerID]
}

func DisconnectPeer(peerID string) {
	log.Println("=>DISCONNECT ", peerID)
	delete(PeerConnections, peerID)
}
