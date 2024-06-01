package state

type Answer struct {
	From       string
	To         string
	AnswerType string
	SDP        string
}

var answers map[string]Answer = make(map[string]Answer)

func PutAnswer(answer Answer) {
	answers[answer.From] = answer
}

func GetAnswersTo(offererID string) []Answer {
	answers := make([]Answer, 0)
	for _, answer := range answers {
		if answer.To == offererID {
			answers = append(answers, answer)
		}
	}

	return answers
}

func RemoveAnswer(answererID string) {
	delete(answers, answererID)
}
