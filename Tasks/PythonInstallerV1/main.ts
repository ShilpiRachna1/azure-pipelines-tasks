import * as path from 'path';
import * as task from 'azure-pipelines-task-lib/task';
import * as telemetry from 'azure-pipelines-tasks-utility-common/telemetry'
import { getPlatform } from './taskutil';
import { usePythonVersion } from './pythoninstaller';

(async () => {
    try {
        task.setResourcePath(path.join(__dirname, 'task.json'));
        const versionSpec = task.getInput('versionSpec', true);
        const downloadFromPythonDistribution = task.getBoolInput('downloadFromPythonDistribution', true)
        const disableDownloadFromRegistry = task.getBoolInput('disableDownloadFromRegistry');
        const allowUnstable = task.getBoolInput('allowUnstable');
        const addToPath = task.getBoolInput('addToPath', true);
        const architecture = task.getInput('architecture', true);
        const githubToken = task.getInput('githubToken', false);
        await usePythonVersion({
            versionSpec,
            downloadFromPythonDistribution,
            allowUnstable,
            disableDownloadFromRegistry,
            addToPath,
            architecture,
            githubToken
        },
        getPlatform());
        task.setResult(task.TaskResult.Succeeded, "");
        telemetry.emitTelemetry('TaskHub', 'PythonInstallerV1', {
            versionSpec,
            addToPath,
            architecture
        });
    } catch (error) {
        task.setResult(task.TaskResult.Failed, error.message);
    }
})();
