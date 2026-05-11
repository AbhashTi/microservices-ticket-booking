#!/bin/bash
set -e
cd ~/Movie-Booking-System-Microservices

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

for svc in discovery-server api-gateway user-service match-service booking-service payment-service notification-service; do
    echo "===== Building $svc ====="
    cd ~/Movie-Booking-System-Microservices/$svc
    chmod +x mvnw 2>/dev/null || true
    ./mvnw clean package -DskipTests -q 2>&1 | tail -5
    echo "DONE: $svc"
done

echo "ALL BUILDS COMPLETE"
