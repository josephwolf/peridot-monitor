FROM mhart/alpine-node:5.7.0

COPY package.json /src/package.json
COPY . /src

RUN cd /src; npm install

EXPOSE 2501
CMD ["node", "/src/app.js"]