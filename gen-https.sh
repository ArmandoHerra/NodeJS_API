#!/bin/bash -x

mkdir src/https
cd src/https
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem