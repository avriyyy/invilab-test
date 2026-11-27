# syntax=docker/dockerfile:1
# Build context: folder backend/ (di Coolify, atur base directory ke /backend).
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /invilab-api ./cmd/api

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /invilab-api ./
EXPOSE 3000
CMD ["./invilab-api"]
