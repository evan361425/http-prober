# Use multi-stage builds
FROM node:14.20.0-slim as builder

# Create app directory
WORKDIR /usr/src/app

# Using wildcard to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
# Set the SHELL option -o pipefail before RUN with a pipe in
# ref: https://github.com/hadolint/hadolint/wiki/DL4006
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# Install app dependencies
RUN npm install --ignore-scripts --only=production && \
  rm -rf /usr/local/lib/node_modules/npm

COPY index.js ./index.js

CMD [ "node", "index.js" ]
