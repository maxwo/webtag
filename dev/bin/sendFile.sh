#!/bin/bash

curl --request POST --form tags=test --form "file=@sendFile.sh" --insecure --cert ../certificates/clients/max.p12:max https://localhost:4433/api/data/
