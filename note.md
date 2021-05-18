
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


### Start just specific service
```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d <service_name>
