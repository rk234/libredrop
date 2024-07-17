# Libredrop

Libredrop is a peer-to-peer file sharing app powered by WebRTC, Vue, and Go Fiber (for the signaling server). 
Libredrop makes it quick and easy to send files between any two devices with a web browser 
over LAN, without the need for additional software. Libredrop is still at an early stage and under active
development.

## Why is the signaling server needed?

For two peers to connect, an intermediary server is required for them to exchange messages to facilitate the connection.
The signaling server serves as a way for peers to offer and respond to transfer requests and communicate the necessary
information to create a WebRTC peer connection between them. The signaling server does **NOT** see any of the file data
transferred between the two clients. The tranfer process itself is entirely peer-to-peer, and does not involve the server 
in any way.

## Developing

Starting up the vite development server on localhost:

```bash
$ git clone https://github.com/rk234/libredrop.git
$ cd libredrop
$ cd libredrop-web
$ bun install
$ bun dev
```
Running the signaling server:

```
$ cd libredrop
$ cd signaling-server
$ go build
$ go run main.go
```

To run libredrop over lan, use `bun dev --host` and `go run main.go {Local IP Here}`. Modifications will need to be
made to `signaling.ts` in order to point the client to the correct URL for the signaling server.

## Screenshots 
![Screenshot from 2024-07-17 23-15-14](https://github.com/user-attachments/assets/53e187aa-a41f-4ecf-85ed-ef1195f91c68)
![Screenshot from 2024-07-17 23-15-40](https://github.com/user-attachments/assets/d06b623f-b98c-4ffd-8d63-af567581cda2)
![Screenshot from 2024-07-17 23-15-53](https://github.com/user-attachments/assets/3653c509-d3c2-4f19-99f2-f2de699c1c84)
![Screenshot from 2024-07-17 23-14-51](https://github.com/user-attachments/assets/11057c12-4237-4680-9b6b-9bbed9131d8d)

