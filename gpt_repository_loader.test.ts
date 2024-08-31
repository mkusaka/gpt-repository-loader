import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getIgnoreList, shouldIgnore, processRepository } from './gpt_repository_loader';

describe('gpt_repository_loader', () => {
  const testDataPath = path.join(__dirname, 'test_data');
  const exampleRepoPath = path.join(testDataPath, 'example_repo');
  let outputFilePath: string;

  beforeEach(() => {
    outputFilePath = path.join(testDataPath, 'output.txt');
  });

  afterEach(() => {
    if (fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);
    }
  });

  it('should process the repository and generate the expected output', () => {
    const expectedOutputFilePath = path.join(testDataPath, 'expected_output.txt');
    const ignoreFilePath = path.join(exampleRepoPath, '.gptignore');
    const ignoreList = getIgnoreList(ignoreFilePath);

    console.log(outputFilePath)
    processRepository(exampleRepoPath, ignoreList, outputFilePath);

    const outputContent = fs.readFileSync(outputFilePath, 'utf-8');
    const expectedOutputContent = fs.readFileSync(expectedOutputFilePath, 'utf-8');
    expect(outputContent).toEqual(expectedOutputContent);
  });

  it('should ignore files based on the ignore list', () => {
    const ignoreList = ['*.txt'];
    const filePath = 'file.txt';

    const result = shouldIgnore(filePath, ignoreList);

    expect(result).toBe(true);
  });
});
