// build the code and publish to S3 the build folder
// exec is used to execute any command

// for logging purposes, ioredis will be used

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const { Redis } = require('ioredis');

// in docker container the location of config file is in the same folder
const { config } = require('./config');
const { exit } = require('process');
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REDIS_AIVEN_URL} = config;

const publisher = new Redis(REDIS_AIVEN_URL);

const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});

const PROJECT_ID = process.env.PROJECT_ID;

const publishLogs = async (logs) => {
    publisher.publish(`logs:${PROJECT_ID}`, logs);
};

const init = async () => {
    // build the git code
    const codeFolderPath = path.join(__dirname, 'output');

    const cmd = `cd ${codeFolderPath} && npm install && npm run build`;
    const runCmd = exec(cmd);
    publishLogs('Build Started...');

    runCmd.stdout.on('data', (data) => {
        console.log(data);
        publishLogs(data);
    });

    runCmd.stdout.on('error', (data) => {
        console.log('Error:', data);
        publishLogs(`Error: ${data}`);
    });

    runCmd.on('close', async () => {
        console.log('Build Completed');
        publishLogs('Build Completed...');
        const buildFolderPath = path.join(__dirname, 'output', 'build');

        // read all the files of build folder and publish to S3, recursive to read file inside another
        let buildFolderContents;
        if (fs.existsSync(buildFolderPath)) {
            buildFolderContents = fs.readdirSync(buildFolderPath, { recursive: true });
        } else {
            console.log('Error: Base application should create build folder for this to work... (create-react-app works, vite does not work)')
            publishLogs('Error: Base application should create build folder for this to work... (create-react-app works, vite does not work)')
            return;
        }

        // publish the build folder to S3
        publishLogs('S3 Publish Started...');
        for (const file of buildFolderContents) {
            // avoid taking folders
            const filePath = path.join(buildFolderPath, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                continue;
            }

            const putCmd = new PutObjectCommand({
                Bucket: 'deployment-pipeline-s3-bucket',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath),
            });

            await s3Client.send(putCmd);
            publishLogs(`S3 -> ${file} uploaded...`);
        }
        console.log('Done...');
        await publishLogs('Done...');
        exit(0);
    });
};

init();