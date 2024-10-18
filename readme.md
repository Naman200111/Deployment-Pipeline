Docker Container is pushed to AWS-ECR

api-server:
    1. nodejs server which gets the github url from the FE
    2. spins a docker container task on aws ecs

build-server:
    1. docker file executes a shell script 
    2. shell script clones the project and calls another js script
    3. this script, builds the project and pushes it to S3 bucket

reverse-proxy:
    1. node js server for redirecting requests to the appropriate project url in S3 buckets
    2. For eg: `http://project-1.localhost:8000` is redirected to project with project-id = project-1 index.html built file in S3 bucket

socket-io:
    1. socket server used to show real time logs to the user of the complete process
    2. user subscribe to the specific channel of their project => `logs:${project-id}`
    3. pub-sub redis architecture is used
    4. pub to channel `logs:${project-id}` and each user listen to their channel `logs:${project-id}`
    5. subscriber listens to all the logs `logs:*` channel


Parallel project deployment is achieved using spinning of parallel dockers and publishing the logs to channel
`logs:${project-id}`

Extra Points to cover:
1. dynamic support of build/dist folders
2. FE option to give slug for uploading the changes on the same github url 
    / anytime github push is done automatic re-upload.
3. using config files instead of hardcoding

