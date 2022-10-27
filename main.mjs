#!/usr/bin/env zx

import deps from "./cmd/deps.mjs";
import release from "./cmd/release.mjs";

const { green, red, yellow } = chalk;

try {
  const [command, ...subcommands] = argv["_"];

  const showHelp = argv["help"] || argv["h"] || false;
  if (!command && showHelp) {
    usage();
    process.exit(0);
  }

  $.verbose = argv["verbose"] || argv["v"] || false;

  switch (command) {
    case "custom":
      //TODO: enable ability to supply a file to run a custom script over a set of repositories
      break;

    case "deps":
      deps(subcommands);
      break;

    case "release":
      release(subcommands);
      break;

    default:
      usage(subcommands);
      break;
  }
} catch (err) {
  console.error(red(`${err}`));
}

function usage() {
  console.log(`
  Usage: ./main.mjs [command] <options>
  
  Commands:
  
    deps      run update deps
    release   run the draft release process
  
  Options:

    -h, --help      show the usage text for the current command
    -v, --verbose   display verbose output for debugging
  `);
}
