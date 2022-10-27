const { green, red, blue, yellow } = chalk;

const COMMAND = "release";

export default async function release() {
  const showHelp = argv["help"] || argv["h"] || false;
  if (showHelp) {
    usage();
    return;
  }

  const branch = argv["branch"] || argv["b"] || "main";
  const dryRun = argv["dry-run"] || argv["d"] || false;
  const reposFile = argv["repo-file"] || argv["f"] || undefined;
  const reposString = argv["repos"] || argv["r"] || undefined;
  const strategy = argv["strategy"] || argv["s"] || "patch";

  branch && console.log(blue(`[${COMMAND}] branch ${branch}`));
  dryRun && console.log(blue(`[${COMMAND}] dry run mode`));
  strategy && console.log(blue(`[${COMMAND}] strategy ${strategy}`));

  let repos;
  if (reposString && reposString.length) {
    reposString && console.log(blue(`[${COMMAND}] using repos ${reposString}`));
    repos = reposString.split(",").map((r) => r.trim());
  } else if (reposFile && reposFile.length) {
    reposFile && console.log(blue(`[${COMMAND}] using repo file ${reposFile}`));
    repos = YAML.parse(await fs.readFile(reposFile, { encoding: "utf-8" }));
  }

  const rawRepos = JSON.parse(
    await $`gh repo list google-github-actions --json="name,nameWithOwner" --jq="map(.)"`
  );

  const targetRepos = rawRepos.filter((r) => {
    return repos ? repos.includes(r.name) : true;
  });

  await Promise.all(
    targetRepos.map(async (repo) =>
      within(async () => {
        console.log(`[${COMMAND}][${repo.name}] started`);
        if (!dryRun) {
          await $`gh workflow run draft-release.yml --repo="${repo.nameWithOwner}" --ref="${branch}" --raw-field="version_strategy=${strategy}"`;
        }
        console.log(green(`[${COMMAND}][${repo.name}] completed`));
      })
    )
  );
}

function usage() {
  console.log(`
  Usage: ./main.mjs ${COMMAND} <options>
  
  Options:
  
    -b, --branch        branch to run workflow on, default 'main'
    -d, --dry-run       execute in dry run mode
    -r, --repos         comma separated string of repo names to act on
    -f, --repo-file     absolute path to repos yaml config file (e.g. repos.yaml)
    -s, --strategy      version strategy (major, minor, patch), default 'patch'
`);
}
