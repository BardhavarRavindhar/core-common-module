# [✨SochomatPuchlo API✨](https://github.com/BardhavarRavindhar/core-platform-api)

> SochomatPuchlo is a platform designed for everyone. Access advice from industry professionals, influencers, career mentors, and more, or share what you know and connect with those who appreciate your expertise. Join us to learn, earn, and grow—wherever you are.

## Features

- Secure user authentication with JSON Web Tokens
- Role-based authorization for effective access control
- Performance optimization through caching with Redis
- Rate limiting to prevent API abuse by users
- Server-side form data validation to ensure integrity and prevent invalid or malicious submissions

## Technologies

This app utilizes modern technologies to build robust features that ensure seamless functionality and performance:

- [Node.js (22.12.0)](https://nodejs.org/): A JavaScript runtime built on Chrome's V8 JavaScript engine, used for building the backend API.
- [Express (4.21.2)](https://expressjs.com/en/4x/api.html): A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
- [MongoDB (8.0.4)](https://www.mongodb.com): A NoSQL database known for its high performance, high availability, and easy scalability, used for storing application data.
- [Redis (7.4)](https://redis.io/): An open-source, in-memory data structure store, used as a database, cache, and message broker to enhance application performance.
- [Docker (2.32.0)](https://www.docker.com/): A platform for developing, shipping, and running applications in containers, ensuring consistency across multiple development and release cycles.

These technologies collectively ensure that the application is scalable, efficient, and easy to maintain.

## Prerequisites

- [Node.js](https://nodejs.org/) - Version 22 or higher
- [MongoDB](https://www.mongodb.com) - Local or cloud instance with the latest version
- [Docker](https://www.docker.com/) - Latest version for containerization

##Deployement

##### Step1: Clone the repository

```sh
git clone git@github.com:BardhavarRavindhar/core-platform-api.git
cd core-platfrom-api
```

##### Step2: Init and update [Submodule](https://github.com/BardhavarRavindhar/core-common-modules)

under project root folder,run

```sh
git submodule init
git submodule update

```

To update submodule from main repo to update submodule code

```sh
git pull --recurse-submodules
```

##### Step3: Install npm dependencies on main and submodule

Go to project root folder, run

```sh
npm install
```

For submodule

```sh
cd api\core
git checkout main
npm install
```

##### Step4: Setup config

Create .env file on root folder and update required variables

##### Step5: Start server using pm2 tool or Systemd

##Update code and dependecies on server

##### Step1: Update main repo and dependencies

Under project folder

```sh
git pull origin main
npm install
```

##### Step2: Update submodule and their dependencies

Under project folder

```sh
cd api/core
git fetch origin main
git pull origin main
npm install
```

##### Step3: Restart server using pm2 tool or Systemd

Make sure env is fully updated for project
