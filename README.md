*** Make sure Docker is installed and running on your machine. ***

# Run the following cmd in VS Code WSL terminal: docker run -d --hostname my-rabbit --name some-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# RabbitMQ UI will be available at: http://localhost:15672
    Login with:
        username: guest
        password: guest