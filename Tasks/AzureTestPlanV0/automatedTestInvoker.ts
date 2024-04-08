import * as tl from 'azure-pipelines-task-lib/task'
import { executepythontests } from './Invokers/pythoninvoker'
import { executemaventests } from './Invokers/maveninvoker'
import { executegradletests } from './Invokers/gradleinvoker'

export async function testInvoker(testsToBeExecuted: string[]): Promise<number> {

    const testLanguageStrings = tl.getDelimitedInput('testLanguageInput', ',', true);

    let exitStatusCode = 0;
    let exitCode;

    for (const testLanguage of testLanguageStrings) {

        if (testLanguage === null || testLanguage === undefined) {
            console.log("Please select the test framework language from the task dropdown list to execute automated tests");
            return;
        }

        switch (testLanguage) {
            case 'Java-Maven':
                exitCode = await executemaventests(testsToBeExecuted);
                break;

            case 'Java-Gradle':
                exitCode = await executegradletests(testsToBeExecuted);
                break;

            case 'Python':
                exitCode =  await executepythontests(testsToBeExecuted);
                break;

            default:
                console.log('Invalid test Language Input selected.');
        }

        if(exitStatusCode == null){
            exitStatusCode = exitCode;
        }
        else{
            exitStatusCode = exitStatusCode || exitCode;
        }
    }
    
    return exitStatusCode
}