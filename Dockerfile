FROM node:9.7.1

# Install system dependencies
RUN apt-get update \
 && apt-get -y install build-essential libmagick++-dev imagemagick \
 && ln -s /usr/lib/x86_64-linux-gnu/ImageMagick-6.8.9/bin-Q16/Magick++-config /usr/local/bin/Magick++-config

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app
RUN npm install \
 && npm run build

EXPOSE 4433
CMD [ "npm", "run", "serve" ]
