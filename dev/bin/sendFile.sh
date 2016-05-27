#!/bin/bash

if [ -z $1 ]
then
    echo "Usage: $0 USERNAME FILE [TAG1 TAG2 ...]"
fi

USERNAME=$1
shift;

FILENAME=$1
shift;

TAGS=$@;

function join { local IFS="$1"; shift; echo "$*"; }
TAGS=`join , ${TAGS[@]}`

curl --request POST --form tags=$TAGS --form "file=@$FILENAME" --insecure --cert ../certificates/clients/$USERNAME.p12:test https://localhost:4433/api/data/
