# Use official RabbitMQ image with management plugin
FROM rabbitmq:3.13-management-alpine

# Set default user credentials and vhost
ENV RABBITMQ_DEFAULT_USER=admin \
    RABBITMQ_DEFAULT_PASS=admin123 \
    RABBITMQ_DEFAULT_VHOST=my_vhost

# Expose RabbitMQ ports (Render supports only HTTP ports externally)
EXPOSE 5672 15672
