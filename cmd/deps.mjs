import { getDate } from "../lib/util.mjs";

const { green, red, blue, yellow } = chalk;

const COMMAND = "deps";

export default async function deps(subcommands = []) {
  const showHelp = argv["help"] || argv["h"] || false;
  if (showHelp) {
    usage();
    return;
  }

  const dryRun = argv["dry-run"] || argv["d"] || false;
  const skipCleanup = argv["skip-cleanup"] || argv["s"] || false;
  const reposFile = argv["repo-file"] || argv["f"] || undefined;
  const reposString = argv["repos"] || argv["r"] || undefined;

  dryRun && console.log(blue(`[${COMMAND}] dry run mode`));
  skipCleanup && console.log(blue(`[${COMMAND}] skip cleanup`));

  let repos;
  if (reposString && reposString.length) {
    reposString && console.log(blue(`[${COMMAND}] using repos ${reposString}`));
    repos = reposString.split(",").map((r) => r.trim());
  } else if (reposFile && reposFile.length) {
    reposFile && console.log(blue(`[${COMMAND}] using repo file ${reposFile}`));
    repos = YAML.parse(await fs.readFile(reposFile, { encoding: "utf-8" }));
  }

  const rawRepos = JSON.parse(
    await $`gh repo list google-github-actions --json="name,sshUrl" --jq="map(.)"`
  );

  const targetRepos = rawRepos.filter((r) => {
    return repos ? repos.includes(r.name) : true;
  });

  const prsCreated = [];
  const branchName = `${getDate()}-deps`;
  const commitMessage = "chore: update dependencies (automated)";
  const reposPath = path.join(__dirname, `repos`);

  await $`rm -rf ${reposPath}`;
  await $`mkdir -p ${reposPath}`;

  await Promise.all(
    targetRepos.map(async (repo) =>
      // within creates a new async context from zx library
      within(async () => {
        try {
          console.log(`[${COMMAND}][${repo.name}] started`);

          cd(reposPath);
          await $`git clone ${repo.sshUrl}`;
          cd(repo.name);
          await $`git pull origin main`;
          await $`git checkout -b ${branchName}`;

          if (!fs.existsSync("package.json")) {
            console.log(
              yellow(
                `[${COMMAND}][${repo.name}] package.json not found, skipping...`
              )
            );
            return;
          }

          await $`ncu -u`;
          await $`npm install`;

          const status = await $`git status -s --porcelain`;
          if (status.stdout.length == 0) {
            console.log(
              blue(
                `[${COMMAND}][${repo.name}] no dependency updates found, skipping...`
              )
            );
            return;
          }

          console.log(`[${COMMAND}][${repo.name}] updating dependencies...`);

          if (!dryRun) {
            await $`git add .`;
            await $`git commit --message=${commitMessage}`;
            await $`git push origin ${branchName} --force`;

            await sleep(1500);

            const prStatus =
              await $`gh pr create --base="main" --head="${branchName}" --fill`;
            prsCreated.push(
              `[${COMMAND}][${repo.name}] PR Created - ${prStatus.stdout}`
            );
          }

          console.log(green(`[${COMMAND}][${repo.name}] completed`));
        } catch (err) {
          console.log(red(`[${COMMAND}][${repo.name}] failed: `), err);
        }
      })
    )
  );

  if (prsCreated.length) {
    console.log("\n");
    prsCreated.forEach((pr) => console.log);
    console.log("\n");
  }

  !skipCleanup && (await $`rm -rf ${reposPath}`);
}

function usage() {
  console.log(`
  Usage: ./main.mjs ${COMMAND} <options>
  
  Options:
  
    -d, --dry-run       execute in dry run mode
    -s, --skip-cleanup  skip repo folder cleanup on exit
    -r, --repos         comma separated string of repo names to act on
    -f, --repo-file     absolute path to repos yaml config file (e.g. repos.yaml) 
  `);
}
