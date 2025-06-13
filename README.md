To run this project, do the following:

1. clone the repo by running "git clone https://github.com/shodievSA/internship-project-backend.git". This will install the repo to the "internship-project-backend" folder on its own.

2. Once inside the root folder, run npm i.

3. Create .env file in the root folder and create the following environment variables: DB_NAME (you'll need to create new DB in pgAdmin), DB_USERNAME, DB_PASSWORD and DB_HOST (should be localhost).

4. Run "npm run dev" from the root folder and it'll start the express app together with sequelize. However, if you want to compile ts code into js code in the dist folder first before running the server, you can execute npm run build command and then npm start in terminal.

After completing all these steps, make sure to create new branch with your name (e.g fanil) and switch to it. After this, feel free to make changes to the repository.


*** TO RUN THE PROJECT FROM DOCKER CONTAINER IN DEVELOPMENT MODE EXECUTE THE FOLLOWING COMMAND: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build ***

*** TO RUN THE PROJECT FROM DOCKER CONTAINER IN PRODUCTION MODE EXECUTE THE FOLLOWING COMMAND: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build ***

* docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --scale node_app=2 -d // For second node server instance.

# However note, first you must have a docker desktop app running on your machine to execute the commands above.