# Libredrop

Libredrop is a peer-to-peer file sharing app powered by WebRTC, Vue, and Go Fiber (for the signaling server). 
Libredrop makes it quick and easy to send files between any two devices with a web browser 
over LAN, without the need for additional software.

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

To run libredrop over lan, use `bun dev --host` and `go run main.go {Local IP Here}`.

## Screenshots 
![Screenshot from 2024-07-17 23-15-14](https://github.com/user-attachments/assets/53e187aa-a41f-4ecf-85ed-ef1195f91c68)
![Screenshot from 2024-07-17 23-15-40](https://github.com/user-attachments/assets/d06b623f-b98c-4ffd-8d63-af567581cda2)
![Screenshot from 2024-07-17 23-15-53](https://github.com/user-attachments/assets/3653c509-d3c2-4f19-99f2-f2de699c1c84)
![Screenshot from 2024-07-17 23-14-51](https://github.com/user-attachments/assets/11057c12-4237-4680-9b6b-9bbed9131d8d)

