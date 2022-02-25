# IV1201-Recruitment-API Project
This is the recruitment application's API backend project. The purpose of this project is to provide the backend functionalities that facilitate building a web based recruitment solution.

## Used tools

The following software were used during the course of development:

- Version control (Git)
- JavaScript runtime environment (Node.js)
- Project and package management (npm)
- Automatic restarts when files change (nodemon)
- Code editor (Visual Studio Code)
- Static analysis (ESLint)

## Frameworks

The following frameworks were used in this project:

- express
- express-validator
- dotenv-safe
- cross-env
- body-parser
- cookie-parser
- cors
- jsonwebtoken
- pbkdf2
- pg
- swedish-personal-identity-number-validator
- validator
- winston

## Installation

- Install the latest LTS version of [Node.js](https://nodejs.org/), (Node.js v16.13.2 was used for the development of this project).
- Clone this repository.
- Install all the required dependencies using npm by running the command `npm install` in the base directory.

## Start the Application

This project only contains the REST API backend for the recruitment project, thus provides no client. The API endpoints can be called and tested using a REST client, for example [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/).

1. Make a copy of the file .env.example and call it .env
2. Edit the .env file and enter the proper values for each field.
3. Make sure that the Postgres database is running and correctly set up.
4. Start the application by running the command `npm run start-dev` to start the application in the development mode, or `npm run start` to start the application in the production mode.
5. Start Insomnia.
6. Import the file `insomnia-recruitment-api-requests.json` which contains sample requests to all the available api endpoints in this project.

## Static Analysis

In order to run static analysis check on the project, do the following:

- Run the command `npm run escheck` in order to run a static analysis check on the project using ESLint (This WILL NOT attempt to fix any problems).
- Run the command `npm run esfix` in order to run a static analysis check on the project using ESLint and attempt to fix problems that might be fixable (This may sometimes result in unwanted code changes, use with caution).


## More Documentation

All the public definitions in this project are well documented to provide a greater understanding of each part of the project. 
