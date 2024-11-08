import path = require('path');
import { TaskMockRunner } from 'azure-pipelines-task-lib/mock-run';
import * as answers from './answers';

let taskPath = path.join(__dirname, '..', 'anttask.js');
let runner: TaskMockRunner = new TaskMockRunner(taskPath);

runner.setInput('antBuildFile', '/build/build.xml'); // Make that checkPath returns true for this filename in the response file
runner.setInput('javaHomeSelection', 'JDKVersion');
runner.setInput('jdkVersion', 'default');
runner.setInput('testResultsFiles', '**/TEST-*.xml');
runner.setInput('publishJUnitResults', 'true');

runner.setAnswers(answers.successAnswers);

process.env['System.DefaultWorkingDirectory'] = '/user/build';

runner.run();
