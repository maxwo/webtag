#!/bin/bash

USERNAME=$1;

cd ../certificates/clients/
openssl genrsa -out $USERNAME-key.pem 1024
openssl req -new -config $USERNAME.cnf -key $USERNAME-key.pem -out $USERNAME-csr.pem
openssl x509 -req -extfile $USERNAME.cnf -days 9999 -passin "pass:password" -in $USERNAME-csr.pem -CA ../ca/ca-crt.pem -CAkey ../ca/ca-key.pem -CAcreateserial -out $USERNAME-crt.pem
openssl pkcs12 -export -inkey $USERNAME-key.pem -in $USERNAME-crt.pem -name $USERNAME -out $USERNAME.p12
