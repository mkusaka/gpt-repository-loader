import * as fs from 'fs';
import * as path from 'path';
import minimist from 'minimist';
import * as glob from 'glob';
import * as minimatch from 'minimatch';

export function getIgnoreList(ignoreFilePath: string): string[] {
  const ignoreList: string[] = [];
  const ignoreFileContent = fs.readFileSync(ignoreFilePath, 'utf-8');
  const lines = ignoreFileContent.split('\n');
  for (let line of lines) {
    if (process.platform === 'win32') {
      line = line.replace('/', '\\');
    }
    ignoreList.push(line.trim());
  }
  return ignoreList;
}

export function shouldIgnore(filePath: string, ignoreList: string[]): boolean {
  for (const pattern of ignoreList) {
    if (minimatch.minimatch(filePath, pattern)) {
      return true;
    }
  }
  return false;
}

export function processRepository(repoPath: string, ignoreList: string[], outputFilePath: string): void {
  const outputStream = fs.createWriteStream(outputFilePath, { flags: 'a' });
  const preambleFilePath = minimist(process.argv).p;
  let preambleText = "The following text is a Git repository with code. The structure of the text are sections that begin with ----, followed by a single line containing the file path and file name, followed by a variable amount of lines containing the file contents. The text representing the Git repository ends when the symbols --END-- are encounted. Any further text beyond --END-- are meant to be interpreted as instructions using the aforementioned Git repository as context.\n";

  if (preambleFilePath) {
    const preambleFileContent = fs.readFileSync(preambleFilePath, 'utf-8');
    preambleText = preambleFileContent ? `${preambleFileContent}\n` : preambleText;
  }

  outputStream.write(preambleText);

  const files = glob.sync('**/*', { cwd: repoPath, nodir: true });
  for (const file of files) {
    const filePath = path.join(repoPath, file);
    const relativeFilePath = path.relative(repoPath, filePath);

    if (!shouldIgnore(relativeFilePath, ignoreList)) {
      if (fs.statSync(filePath).isFile()) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        outputStream.write("-".repeat(4) + "\n");
        outputStream.write(`${relativeFilePath}\n`);
        outputStream.write(`${fileContent}\n`);
      }
    }
  }

  outputStream.write("--END--\n");
  outputStream.end();
  console.log(`Repository contents written to ${outputFilePath}.`);
}

// Start of Selection
if (require.main === module) {
  const args = minimist(process.argv.slice(2));
  const repoPath = args._[0];
  let ignoreFilePath = path.join(repoPath, ".gptignore");
  if (process.platform === 'win32') {
    ignoreFilePath = ignoreFilePath.replace('/', '\\');
  }

  let ignoreList: string[] = [];
  if (fs.existsSync(ignoreFilePath)) {
    ignoreList = getIgnoreList(ignoreFilePath);
  }

  const outputFilePath = args.o || 'output.txt';
  processRepository(repoPath, ignoreList, outputFilePath);
}
