export type Peer = {
  ID: string
  DisplayName: string
}

export const me: Peer = {
  ID: "peer-" + (Math.round(Math.random() * 100)),
  DisplayName: localStorage.getItem("displayName") ?? "Unnamed Peer"
}

export function setDisplayName(name: string) {
  me.DisplayName = name
}

