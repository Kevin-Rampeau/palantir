const path = require('path');
const fs = require('fs');
const glob = require('glob');
const marked = require('marked');
const mkp = require('mkp');
const { banner, log, logDate, logSuccess, logWarning } =
  require(path.resolve(__dirname, '../command-console-format'));

const fillTree = (tree, fileSplitted, index = 0) => {
  let actualTree = -1;
  const file = fileSplitted[index];

  for (let i = 0; i < tree.length; i++) {
    if (tree[i].path === file) {
      actualTree = i;
    }
  }

  if (actualTree < 0) {
    const isFile = fileSplitted.length === index + 1;

    tree.push(isFile ? { file, link: fileSplitted.join('/') } : { path: file, tree: [] });
    actualTree = tree.length - 1;

    if (isFile) {
      return;
    }
  }

  fillTree(tree[actualTree].tree, fileSplitted, index + 1);
};

const handler = (argv) => {
  banner();

  const { source, destination, origin = '' } = argv;

  const files = glob.sync(source);
  const jsonTree = [];

  if (!files.length) {
    logWarning('No file to be generated found\n');

    return;
  }

  logDate(`Found ${files.length} files to generate`);

  files.forEach((file) => {
    const markdown = fs.readFileSync(file, 'utf8');
    const html = marked(markdown);

    const newFile = file.replace(origin, '').replace(/.md$/i, '.html');
    const newFilePath = `${destination}/${newFile}`;
    const newDir = path.dirname(newFilePath);

    fillTree(jsonTree, newFile.split('/'));

    mkp.sync(newDir);

    fs.writeFileSync(newFilePath, html);
  });

  logDate(`Generate the glossary`);

  fs.writeFileSync(`${destination}/glossary.json`, JSON.stringify(jsonTree));

  logSuccess('Finished');

  log();
};

module.exports = {
  command: 'doc <source> <destination> [origin]',
  desc: 'Generate a HTML documentation from a markdown one',
  builder: yargs => yargs
    .positional('source', {
      describe: 'Files path(s) to parse (glob syntax)',
      type: 'string',
    })
    .positional('destination', {
      describe: 'Folder to push the new HTML files',
      type: 'string',
    })
    .positional('origin', {
      describe: 'Origin path to strip from the source',
      type: 'string',
    }),
  handler,
};