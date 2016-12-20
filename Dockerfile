FROM node

# Install system dependencies
RUN apt-get update
RUN apt-get -y install build-essential libmagick++-dev imagemagick
RUN ln -s /usr/lib/x86_64-linux-gnu/ImageMagick-6.8.9/bin-Q16/Magick++-config /usr/local/bin/Magick++-config

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app
RUN npm run build

# Make scripts executable
RUN chmod +x /usr/src/app/bin/*.sh

EXPOSE 4433
CMD [ "bin/docker-entrypoint.sh" ]
