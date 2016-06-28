#!/bin/bash

curl --insecure --cert ../certificates/clients/max.p12:max https://localhost:4433/api/data/$1
