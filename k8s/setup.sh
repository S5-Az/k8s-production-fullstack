#!/bin/bash

echo "CLUSTER CREATING..... "

kind create cluster --config kind-config.yml #created cluster 

echo "CLUSTER CREATED!!!!!"

kubectl cluster-info || docker ps

echo "CREATING NAMESPACE....."
