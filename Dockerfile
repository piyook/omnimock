FROM node:24.18.0-alpine
ENV NODE_ENV=development
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# note this can be started in production mode with --production flag, so any dev dependencies will not be installed
RUN npm install --silent && mv node_modules ../
COPY . .
# The dashboard is built into ui/dist, which the server serves at /
RUN npm --prefix ui ci --silent && npm run compile-ui
EXPOSE 9090
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "run","dev"]
