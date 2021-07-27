# Base image
# Node LTS (Long Term Support) 14
FROM node:14

# Application work directory selection
WORKDIR /usr/src/app

# Application dependencies install
COPY package*.json ./

RUN npm install

# Application source bundling
COPY . .

# Port exposure
EXPOSE 3000

CMD [ "npm", "start" ]

