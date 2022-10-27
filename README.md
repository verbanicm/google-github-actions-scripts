# Google Github Actions Scripts

The following codebase is used by the Google Github Actions team to maintain all the repos.

## Authentication

Set the `GITHUB_TOKEN` environment variable to a PAT token with repo:read scope.

```shell
export GITHUB_TOKEN=<your pat token>
```

## Commands

### deps

Use this command to update all dependencies to the latest version and create a pull request for a set of repos.

```shell
./main.mjs deps --repos="auth,deploy-cloud-run"
```

or

```shell
./main.mjs deps --repo-file="./config/all-repos.yaml"
```

To see all options run:

```shell
./main.mjs deps --help
```

### release

Use this command to trigger the draft release process for a set of repos.

```shell
./main.mjs release --repos="auth,deploy-cloud-run" --strategy="patch"
```

or

```shell
./main.mjs release --repo-file="./config/release-repos.yaml" --strategy="patch"
```

To see all options run:

```shell
./main.mjs release --help
```
