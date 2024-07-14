import { SERVER_DOMAIN_HTTP } from "@/signaling/signaling"
import axios from "axios"

export type Peer = {
  ID: string
  DisplayName: string
}

const receivedID = (await axios.get(SERVER_DOMAIN_HTTP + "/discovery/me"))
console.log(receivedID)

export const me: Peer = {
  ID: receivedID.data as string,
  DisplayName: localStorage.getItem("displayName") ?? "Unnamed Peer"
}

export function setDisplayName(name: string) {
  me.DisplayName = name
}

