#!/usr/bin/env bash

/usr/src/app/bin/wait-for-it.sh elasticsearch:9200
/usr/src/app/bin/wait-for-it.sh redis:6379
/usr/src/app/bin/wait-for-it.sh rabbitmq:5672
/usr/src/app/bin/wait-for-it.sh mongo:27017
npm run serve
