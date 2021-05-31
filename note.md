
### cache
Dockerfile caches every layer.
Splitting up into 2 steps is chaching the package.json & npm install and only step change is "COPY . ./".

### commands
building container
```
docker build -t node-app-image . //do it everytime you chage Dockerfile
docker run -v $(pwd):/app -d -p 3000:3000 --name node-app node-app-image
docker exec -it node-app bash
docker logs
```

```
docker rm node-app -f // f flag force to delete even if the container is running
```

### nodemon
install nodemon and trigger automatic restart
```
"scripts": {
    "start": "node index.js",
    "dev": "nodemon -L index.js"
},
```

### node_modules local directory
Delete the node_modules folder in the local machine, docker get rid of the node_modules folder. Because it binds.
Add this flag which tells docker don't touch it.
keyword: "bind mount"
```
-v /app/node_modules
```

### Create files inside the container would also invoke the local machine to create the file 
If you don't want this, make it read only bind mount with :ro option.
```
docker run -v $(pwd)/:/app:ro -v /app/node_modules -d -p 3000:3000 --name node-app node-app-image
```
### env variable
```docker run -v $(pwd)/:/app:ro -v /app/node_modules -d --env PORT=4000 -p 3000:4000 --name node-app node-app-image```  
```printenv``` command checks env
or use this line
```docker run -v $(pwd)/:/app:ro -v /app/node_modules -d --env-file ./.env -p 3000:4000 --name node-app node-app-image```  

### docker volume
```docker rm node-app -f``` doesn't delete the volume. Persist the volume.
```docker rm node-app -fv``` -v flag delete the volume.
```
docker volume ls //check the volumes
docker volume prune //delete unnecessary(unused) volumes
```


### Actual Development
Automate them with ```docker-compose up -d```
```docker-compose down -v```v flag deletes container

### What docker-compose do
look for image. When you changed the Dockerfile, you need to tell build file has been changed with the --build flag.
```docker-compose up -d --build```

### production vs development
Push develop environment & production environment
docker-compose.yml, docker-compose.dev.yml, docker-compose.prod.yml
```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```
Depending on which mode, nodemon or other packages should not be installed. --only=production is a flag prevent installing devDependencies. 
```
ARG NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; \
        then npm install; \
        else npm install --only=production; \
        fi
```

### Mongo dbs
```
db
use mydb
show dbs
db.books.insert({"name": "harry potter"})
db.books.find()
show dbs
```
```
docker exec -it mongo -u "ianubos" -p "mypassword"
```
Problem is when the container deleted, the data would also be deleted.
Ensure the mongo service has the volumes and it has named volume.
```
volumes: 
    - mongo-db:/data/db
```
-v flag when compose down makes mongodb delete too. So don't use it anymore.

```docker inspect <container_name>``` shows ip address and you can use it as a mongodb's connection.


### docker exec
```docker exec <container> <unix_commands>``` can run inside docker. So, you can run ```bash``` or ```cat /bin/host```, and anything else.

### Custom Network
Containers can talk to each other.
Service name can be a host ip instead of real number because docker catched automatically.
If you want to see real number, ```docker exec -it <container_name> ping mongo```.
```
docker network ls
docker network inspect <container_name>
```
Plan for the future, we need to manage environmental variables. 


### Start just a specific service
```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d <service_name>
```

### Docker Volumes
The preferred way to save data over restarts of a container.
 - easy backup and migration
it is recommended to name volumes.


### redis
```docker exec -it docker_redis_1 redis-cli```
```
KEYS *
GET "sess:50-jxUBo3yuCt-wJ1S7ypj9sE57b_Nse"
```
express-session enabels req.session and user can login with the info when redis used.

### Load balancing by Nginx
I don't know why but I need to run ```docker container start docker_nginx_1``` by my hand...
[express behind proxies](https://expressjs.com/en/guide/behind-proxies.html#:~:text=When%20running%20an%20Express%20app,return%20different%20values%20than%20expected.&text=If%20false%20%2C%20the%20app%20is,socket.)

Run 2 instances(containers) of node-app
```
docker-compose up -f docker-compose.yml -f docker-compose.dev.yml up -d --scale node-app=2
```

## production step
We use digitalocean as a server. It has $100 promotion, and $5 for minimum plan, so we can use it for 20 months free.
It has ssh password reset from website.
```ssh root@<global_ip>```

### install docker on ubuntu engine
[automatic script here](https://get.docker.com/) just two commands!
```
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```
Also do not forget to install docker-compose
```
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Set environmental variable
Inside the docker-compose.prod.yml, use env variables like this ```MONGO_USER=${MONGO_USER}```.
It can be set by ```export MONGO_USER="hello"``` like this.
Check by ```printenv```.

But it quite slow. Please make .env file under root (the location is not recommended lest you push this file to github...)
And also add this line at the end of .profile in root directory.
```
set -o allexport; source /root/.env; set +o allexport
```

### How to install on remote machine current project
Use git clone! Wow! And docker-compose!
```
git pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --building
```
Here, tips of update by docker-compose up!
```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --building --no-deps node_app // just update node_app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --building --scale node-app=2 // run two instances of node-app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --building --help node_app // see help
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate --no-deps node_app // recreate container
```

Build image should not be outsourced because of its cpu usage.
So how?

### Use dockerhub
 - build image on dev server
 - push build node image to docker hub
 - pull node image to production server and docker-compose up

Create dockerhub account and use public repository. It is free.
But you need to reconsider image name. Dockerhub accept <username>/<repository>.
```
docker image tag <image_name> <dockerhub_username>/<repository>
docker image tag docker_node-app ianubos/node-app // my case
```
```
docker push --help
docker images
docker login
docker push <image_name>
```

### Deploy cycle
on the local machine
```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build node-app // just a specific app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml push node-app // just a specific app
```
on the production env
```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps node-app
```
Add image name to specify the image name, and it is useful to deploy to dockerhub.
```
    node-app:
        image: ianubos/blog-node-app
```


### watchtower
Automatically detect changes on dockerhub and restart production server with watchtower.[source](https://containrrr.dev/watchtower/)
in prod server
```
docker run -d --name watchtower -e WATCHTOWER_TRACE=true -e WATCHTOWER_DEBUG=true -e WATCHTOWER_POLL_INTERVAL=50 -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower app_node-app_1
```
This time specified app_node-app_1.
Test by pushing image.
```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build node-app // just a specific app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml push node-app // just a specific app
```
Check logs```docker logs watchtower -f```
Do not forget when restart and check other apps.```docker rm watchtower -f```


### Upgrade process
When compose down, there is a loss of time.
Use Container Orchestration. 
Kubernetes is good choice but this time, for the remained time reason, use Docker swarm which is built in container orchestration.
Very easy, and it clearly shows why we need container orchestration.

### Docker swarm
docker-compose -> just one server, just run dockerfile
docker swarm -> spread server, spin up new container across servers

Manager Node, Worker Node idea.
Worker node run tasks. 
Manager node can be worker node and it works as manager.

```docker info```shows swarm is inactive.
```ip add``` checks public and private ips.
Use public ip and ```docker swarm init --advertise-addr <public_ip>```

swarm is not a container but like a service.
```docker service --help```

See docker official document. 
[docker v3](https://docs.docker.com/compose/compose-file/compose-file-v3/)
[watchtower](https://containrrr.dev/watchtower/)
Add new flags to docker-compose.prod.yml
```
node-app:
    deploy:
        replicas: 8
        restart_policy:
            condition: any
        update_config:
            parallelism: 2
            delay: 15s
```


deploy application by docker swarm
```docker stack --help```
```docker stack deploy --help```
```docker stack deploy -c docker-compose.prod.yml --help```
```docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml myapp```

check commands
```
docker node ls
docker stack ls
docker stack services myapp
docker stack ps myapp

docker stack deploy -c docker-compose.yml -c docker-compose.pro.yml myapp
```

And you build and pushed to dockerhub, check by ```docker stack ps myapp```. 2 of the containers are shutdowned!


### Add Frontend???


