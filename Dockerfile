FROM node:0.11.16
EXPOSE 9000
RUN npm install -g grunt-cli bower
RUN mkdir /app
WORKDIR /app
