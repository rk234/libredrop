package state

type Offer struct {
	From      string
	To        string
	OfferType string
	SDP       string
}

var offers map[string]Offer = make(map[string]Offer)

func PutOffer(offer Offer) {
	offers[offer.From] = offer
}

func GetOfferFrom(offererID string) Offer {
	return offers[offererID]
}

func RemoveOffer(offererID string) {
	delete(offers, offererID)
}
