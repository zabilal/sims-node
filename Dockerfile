FROM node:alpine

RUN mkdir -p /usr/src/sims-node && chown -R node:node /usr/src/sims-node

WORKDIR /usr/src/sims-node

COPY package.json yarn.lock ./

USER node

RUN yarn install --pure-lockfile

COPY --chown=node:node . .

EXPOSE 3000
