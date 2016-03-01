FROM centos:centos6

RUN yum install -y epel-release
RUN yum install -y node.js npm

COPY package.json /src/package.json
RUN cd /src; npm install

COPY . /src

EXPOSE 2501
CMD ["node", "/src/app.js"]
