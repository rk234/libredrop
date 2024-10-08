# Libredrop

Libredrop is a peer-to-peer file sharing app powered by WebRTC, Vue, a custom efficient binary transfer 
protocol and Go Fiber (for the signaling server). Libredrop makes it quick and easy to send files between 
any two devices with a web browser over LAN, without the need for additional software. 

Libredrop is still at an early stage and under active development.


## Why is the signaling server needed?

For two peers to connect, an intermediary server is required for them to exchange messages to facilitate the connection.
The signaling server serves as a way for peers to offer and respond to transfer requests and communicate the necessary
information to create a WebRTC peer connection between them. The signaling server does **NOT** see any of the file data
transferred between the two clients. The tranfer process itself is entirely peer-to-peer, and does not involve the server 
in any way.

## Demo

![image](https://github.com/user-attachments/assets/f4520593-b521-48e4-b440-69ea29159f4a)

[Demo Video Here: ](https://github.com/user-attachments/assets/5d041b44-c85d-49d8-ac25-9b099d59221e)

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

To expose the web app and signaling server on your LAN, run `bun dev --host` and pass in your machine's LAN IP as a cli argument to
`go run main.go {IP HERE}`. Also, create a `.env` file in the `libredrop-web` directory with your LAN IP in the following format:

```
VITE_LAN_IP={IP HERE}
```
