#!/bin/sh

file=$1
tags=''

for thing in "$@"
do
	if [ $file != $thing ]
	then
		tags="$tags,$thing"
	fi
done

tags=`echo $tags | cut -c2- | sed 's/\\,/","/g'`

tags="[\"$tags\"]"

json=`curl -u max:secret -XPOST http://192.168.1.10:1227/data -d @$file`
echo "$json"

id=`echo $json | sed 's/.*"\([a-f0-9]\{20,\}\)".*/\1/'`

echo $id

file=`basename $file`
inode="{\"id\":\"$id\",\"filename\":\"$file\",\"tags\":$tags}"

#sleep 1

echo $inode > /tmp/inode.txt

update="curl -u max:secret -XPUT http://192.168.1.10:1227/inode/$id -d '$inode'"
echo $update
curl -u max:secret -XPUT http://192.168.1.10:1227/inode/$id -H 'Content-Type: application/json' -d @/tmp/inode.txt
