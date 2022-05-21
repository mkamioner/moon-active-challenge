#! /bin/bash

set -e

cd tester_src
go build -o tester main.go
mv tester ..
cd ..
./tester
