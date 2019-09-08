# Use a LTS version of node
FROM node:10.16.0

# Use a custom working directory
WORKDIR /app

# Install yarn
RUN npm i -g yarn@1.17.3

# Copy the NodeJS package definition file
COPY package.json .

# Copy the lockfile from yarn
COPY yarn.lock .

# Install all dependencies
RUN yarn install

# Copy the TypeScript configuration file
COPY tsconfig.json .

# Copy all source files
COPY ./src/ ./src/

# Copy the credentials
COPY config.json .

# Transpile the source files
RUN yarn run compile

# Set the entrypoint for the application
CMD [ "node", "dist/index.js" ]
