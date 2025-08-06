# QR Code Generator

## install and run

```bash
go mod tidy
```

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o qrimzn main.go
```

for different platforms:

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o qrimzn main.go
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -o qrimzn main.go
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o qrimzn.exe main.go
```

for alpine linux:

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o qrimzn main.go
```

## example Dockerfile

```dockerfile
## builder
FROM golang:1.21-alpine as builder

RUN apk add --no-cache git

WORKDIR /app
COPY . .

RUN go build -o /output/qrimzn main.go && strip /output/qrimzn


## final image
FROM alpine:latest

COPY --from=builder /output/qrimzn /usr/local/bin/qrimzn

ENTRYPOINT ["/usr/local/bin/qrimzn"]

```

## macos local test run

```bash
CGO_ENABLED=0 go build -o qrimzn main.go && strip qrimzn && ./qrimzn --content="https://example.com" --code="ABC12345678" | base64 -d > qr.png
```

## use it in nodejs

a simple example usage is given in index.mts. just call it with node

```bash
node --experimental-strip-types index.mts
```
