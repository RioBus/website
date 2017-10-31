FROM node:7.2.0
EXPOSE 9000
RUN git clone https://github.com/RioBus/website.git -b master --single-branch app
WORKDIR app
RUN npm install -g grunt-cli bower http-server
RUN npm run configure
RUN grunt build
WORKDIR dist
ENTRYPOINT http-server -p 9000 .
