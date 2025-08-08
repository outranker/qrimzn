# Use Node.js 22.17.0 Alpine as base image
FROM node:22.17.0-alpine


RUN npm i -g tsx
# Create app directory
WORKDIR /app
COPY image.jpg image.jpg
COPY qrimzn-binary qrimzn-binary
RUN chmod +x qrimzn-binary
COPY resize.ts resize.ts
COPY index.ts index.ts

# Build the application
RUN tsx index.ts

CMD ["tsx", "index.ts"]