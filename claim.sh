#!/bin/bash
if [ "$EUID" -ne 0 ]
then echo "You may only claim a box as a root user."
    exit
fi
curl --data "team=$1" $2:8000
