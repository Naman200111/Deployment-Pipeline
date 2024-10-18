// this code will automate the process for generating ecs task given task definition and cluster name
// it will spin a container for a given github url and project-slug

const express = require('express');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const { generateSlug } = require('random-word-slugs');
const { config } = require('../config');

const app = express();

const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    AWS_ECS_SUBNETS,
    AWS_ECS_SECURITY_GROUPS,
    AWS_ECS_CLUSTER,
    AWS_ECS_TASK_DEFINITION,
    API_SERVER_PORT,
    REVERSE_PROXY_PORT,
} = config;

const ecsClient = new ECSClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});

// to convert the json body in req.body (in case of application/json contentType)
app.use(express.json());

app.post('/uploadProject',async (req, res) => {
    const { github_url, slug } = req.body;

    if (!github_url) {
        return res.status(400).send({
            Status: 400,
            Error: 'Github URL is required'
        });
    }

    const project_id = slug ? slug : generateSlug(3);
    
    // generate the ecs task for the given github url and project_slug
    // spin a container for the given github url and project_slug
    const command = new RunTaskCommand({
        cluster: AWS_ECS_CLUSTER,
        taskDefinition: AWS_ECS_TASK_DEFINITION,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: AWS_ECS_SUBNETS,
                assignPublicIp: 'ENABLED',
                securityGroups: AWS_ECS_SECURITY_GROUPS,
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        {
                            name: 'PROJECT_ID',
                            value: project_id,
                        },
                        {
                            name: 'GIT_REPOSITORY_URL',
                            value: github_url
                        }
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);
    console.log('Container spinned...');
    return res.status(200).send({
        Status: 200,
        Message: 'Container spinned successfully',
        Project_Id: project_id,
        URL: `http://${project_id}.localhost:${REVERSE_PROXY_PORT}`
    });
});

app.listen(API_SERVER_PORT, () => {
    console.log(`Server is running on port ${API_SERVER_PORT}`);
})