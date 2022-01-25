import * as path from 'path';
import * as fs from 'fs';

import { TaskMockRunner } from 'azure-pipelines-task-lib/mock-run';
import { extractTar } from 'azure-pipelines-tool-lib';

const taskPath = path.join(__dirname, '..', 'main.js');
const taskRunner = new TaskMockRunner(taskPath);

taskRunner.setInput('versionSpec', '3.10.x');
taskRunner.setInput('addToPath', 'true');
taskRunner.setInput('architecture', 'x64');

// `getVariable` is not supported by `TaskLibAnswers`
process.env['AGENT_TOOLSDIRECTORY'] = '$(Agent.ToolsDirectory)';

let pythonWasInstalled = false;

// Mock azure-pipelines-tool-lib
taskRunner.registerMock('azure-pipelines-tool-lib/tool', {
    findLocalTool() {
        if (!pythonWasInstalled) {
            return null;
        }

        return path.join('C', 'tools', 'Python', '3.10.1', 'x64');
    },
    findLocalToolVersions: () => ['2.6.0', '2.7.13'],
    downloadTool: () => Promise.resolve('C:/downloaded/python.zip'),
    extractZip: () => Promise.resolve('C:/extracted/python'),
    extractTar() {
        throw new Error('This should never be called');
    },
});

taskRunner.registerMock('os', {
    platform() {
        return 'win32';
    },
    arch() {
        return 'x64';
    },
    EOL: '\r\n'
});

taskRunner.registerMock('child_process', {
    exec(command, options, callback) {
        if (command !== 'powershell ./setup.ps1') {
            throw new Error(`Invalid command: ${command}`);
        }

        if (options.cwd !== 'C:/extracted/python') {
            throw new Error(`Invalid python installer dir path: ${options.cwd}`);
        }

        pythonWasInstalled = true;
        callback();
    }
});

// Test manifest contains python 3.10.1, so the task should find it
taskRunner.registerMock('typed-rest-client', {
    RestClient: class {
        get(_url: string) {
            return Promise.resolve({
                result: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'versions-manifest.json')).toString())
            });
        }
    }
});

taskRunner.run();
