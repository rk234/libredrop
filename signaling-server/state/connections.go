package state

type Peer struct {
	ID          string
	DisplayName string
}

var connections []Peer

func Connect(peer Peer) {
	connections = append(connections, peer)
}

func DisconnectID(id string) {
	for index, conn := range connections {
		if conn.ID == id {
			connections = append(connections[:index], connections[index+1:]...)
		}
	}
}

func Disconnect(peer Peer) {
	var index int = -1
	for i := 0; i < len(connections); i++ {
		if connections[i].ID == peer.ID {
			index = i
			break
		}
	}

	if index != -1 {
		connections = append(connections[:index], connections[index+1:]...)
		RemoveOffer(peer.ID)
		RemoveAnswer(peer.ID)
	}
}
