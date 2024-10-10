import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as task from 'azure-pipelines-task-lib/task';

import { MockTestRunner } from 'azure-pipelines-task-lib/mock-test';

function didSetVariable(testRunner: MockTestRunner, variableName: string, variableValue: string): boolean {
    return testRunner.stdOutContained(`##vso[task.setvariable variable=${variableName};isOutput=false;issecret=false;]${variableValue}`);
}

function didPrependPath(testRunner: MockTestRunner, toolPath: string): boolean {
    return testRunner.stdOutContained(`##vso[task.prependpath]${toolPath}`);
}

describe('UsePythonVersion L0 Suite', function () {
    this.timeout(parseInt(process.env.TASK_TEST_TIMEOUT) || 5000);

    describe('usepythonversion.ts', function () {
        require('./L0_usepythonversion');
    });

    describe('versionspec.ts', function () {
        require('./L0_versionspec');
    });

    it('succeeds when version is found', async function () {
        const testFile = path.join(__dirname, 'L0SucceedsWhenVersionIsFound.js');
        const testRunner = new MockTestRunner(testFile);

        await testRunner.runAsync();

        const pythonDir = path.join('/', 'Python', '3.6.4', 'x64');
        const pythonBinDir = task.getPlatform() === task.Platform.Windows
            ? path.join(pythonDir, 'Scripts')
            : path.join(pythonDir, 'bin');

        assert(didSetVariable(testRunner, 'pythonLocation', pythonDir));
        assert(didPrependPath(testRunner, pythonDir));
        assert(didPrependPath(testRunner, pythonBinDir));
        assert.strictEqual(testRunner.stderr.length, 0, 'should not have written to stderr');
        assert(testRunner.succeeded, 'task should have succeeded');
    });

    it('downloads python from registry on Windows', async function () {
        const testFile = path.join(__dirname, 'L0DownloadsFromRegistryWindows.js');
        const testRunner = new MockTestRunner(testFile);

        await testRunner.runAsync();

        const pythonDir = path.join('C', 'tools', 'Python', '3.10.1', 'x64');
        const pythonBinDir = path.join(pythonDir, 'Scripts');
        const pythonAppdataDir = path.join('testappdata', 'Python', 'Python310', 'Scripts');

        assert(didSetVariable(testRunner, 'pythonLocation', pythonDir));
        assert(didPrependPath(testRunner, pythonDir));
        assert(didPrependPath(testRunner, pythonBinDir));
        assert(didPrependPath(testRunner, pythonAppdataDir));
        assert(testRunner.stdout.includes("loc_mock_MissingGithubToken"), 'should log warning when github token is missing');
        assert.strictEqual(testRunner.stderr.length, 0, 'should not have written to stderr');
        assert(testRunner.succeeded, 'task should have succeeded');
    });

    it('downloads python from registry on Ubuntu', async function () {
        const testFile = path.join(__dirname, 'L0DownloadsFromRegistryUbuntu.js');
        const testRunner = new MockTestRunner(testFile);

        await testRunner.runAsync();

        const pythonDir = path.join('opt', 'hostedtoolcache', 'Python', '3.10.1', 'x64');
        const pythonBinDir = path.join(pythonDir, 'bin');

        assert(didSetVariable(testRunner, 'pythonLocation', pythonDir));
        assert(didPrependPath(testRunner, pythonDir));
        assert(didPrependPath(testRunner, pythonBinDir));
        assert.strictEqual(testRunner.stderr.length, 0, 'should not have written to stderr');
        assert(testRunner.succeeded, 'task should have succeeded');
    });

    it('downloads unstable python from registry', async function () {
        const testFile = path.join(__dirname, 'L0DownloadsUnstable.js');
        const testRunner = new MockTestRunner(testFile);

        await testRunner.runAsync();

        const pythonDir = path.join('opt', 'hostedtoolcache', 'Python', '3.11.1', 'x64');
        const pythonBinDir = path.join(pythonDir, 'bin');

        assert(didSetVariable(testRunner, 'pythonLocation', pythonDir));
        assert(didPrependPath(testRunner, pythonDir));
        assert(didPrependPath(testRunner, pythonBinDir));
        assert.strictEqual(testRunner.stderr.length, 0, 'should not have written to stderr');
        assert(testRunner.succeeded, 'task should have succeeded');
    });

    it('fails when version is not found', async function () {
        const testFile = path.join(__dirname, 'L0FailsWhenVersionIsMissing.js');
        const testRunner = new MockTestRunner(testFile);

        await testRunner.runAsync();

        assert(testRunner.createdErrorIssue('loc_mock_DownloadFailed Error: loc_mock_DownloadNotFound 3.11.x x64'));

        const errorMessage = [
            'loc_mock_VersionNotFound 3.11.x x64',
            'loc_mock_ListAvailableVersions $(Agent.ToolsDirectory)',
            '2.6.0 (x86)',
            '2.7.13 (x86)',
            '2.6.0 (x64)',
            '2.7.13 (x64)',
            'loc_mock_ToolNotFoundMicrosoftHosted Python https://aka.ms/hosted-agent-software',
            'loc_mock_ToolNotFoundSelfHosted Python https://go.microsoft.com/fwlink/?linkid=871498',
        ].join('\r\n');

        assert(testRunner.createdErrorIssue(errorMessage));
        assert(testRunner.failed, 'task should have failed');
    });

    it('selects architecture passed as input', async function () {
        const testFile = path.join(__dirname, 'L0SelectsArchitecture.js');
        const testRunner = new MockTestRunner(testFile);

        await testRunner.runAsync();

        assert(didSetVariable(testRunner, 'pythonLocation', 'x86ToolPath'));
        assert.strictEqual(testRunner.stderr.length, 0, 'should not have written to stderr');
        assert(testRunner.succeeded, 'task should have succeeded');
    });

    it('finds PyPy2', async function () {
        const testFile = path.join(__dirname, 'L0PyPy2.js');
        const testRunner = new MockTestRunner(testFile);

        await testRunner.runAsync();

        const pypyDir = path.join('/', 'PyPy', '2.7.9', 'x64');
        const pypyBinDir = path.join(pypyDir, 'bin');
        const pythonLocation = task.getPlatform() === task.Platform.Windows
            ? pypyDir
            : pypyBinDir;

        assert(didSetVariable(testRunner, 'pythonLocation', pythonLocation));
        assert(didPrependPath(testRunner, pypyDir));
        assert(didPrependPath(testRunner, pypyBinDir));
        assert.strictEqual(testRunner.stderr.length, 0, 'should not have written to stderr');
        assert(testRunner.succeeded, 'task should have succeeded');
    });

    it('finds PyPy3', async function () {
        const testFile = path.join(__dirname, 'L0PyPy3.js');
        const testRunner = new MockTestRunner(testFile);

        await testRunner.runAsync();

        const pypyDir = path.join('/', 'PyPy', '3.5.2', 'x64');
        const pypyBinDir = path.join(pypyDir, 'bin');
        const pythonLocation = task.getPlatform() === task.Platform.Windows
            ? pypyDir
            : pypyBinDir;

        assert(didSetVariable(testRunner, 'pythonLocation', pythonLocation));
        assert(didPrependPath(testRunner, pypyDir));
        assert(didPrependPath(testRunner, pypyBinDir));
        assert.strictEqual(testRunner.stderr.length, 0, 'should not have written to stderr');
        assert(testRunner.succeeded, 'task should have succeeded');
    });
});
