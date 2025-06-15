#!/bin/bash
VERSION=$1

declare -A SERVICES=(
  [auth]=./backend/Auth
  [chatbot]=./backend/chatbot
  [history]=./backend/chatbot_history
  [vector]=./backend/vector_services
)

for service in "${!SERVICES[@]}"; do
  IMAGE="lewis254/${service}-service"
  CONTEXT=${SERVICES[$service]}

  echo "🔧 Building $IMAGE:$VERSION from $CONTEXT..."
  docker build -t $IMAGE:$VERSION -t $IMAGE:latest $CONTEXT

  echo "📦 Pushing $IMAGE:$VERSION and :latest..."
  docker push $IMAGE:$VERSION
  docker push $IMAGE:latest
done
