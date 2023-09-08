# @arrowood.dev/socket

A Node.js Implementation of the Cloudflare Socket API

## Installation

```
npm i @arrowood.dev/socket
```

## Contributing

Requirements:

- Node.js v18.x
- pnpm v8.6.12 (recommend using corepack)

The formatting, linting, and typechecking of this repo are based off of [@vercel/style-guide](https://github.com/vercel/style-guide).

### Building

This project uses [TypeScript](https://www.typescriptlang.org/) for building. This must be manually executed using:

```sh
pnpm build
```

Output will be in the `dist` folder.

### Formatting

This project uses [prettier](https://prettier.io/) for formatting. Code is formatted automatically when you commit, and you can run the formatter manually using:

```sh
pnpm format
```

All files (except those listed in [.prettierignore](./.prettierignore)) will be formatted.

Prettier is configured by [.prettierrc.js](./.prettierrc.js). It is based on [@vercel/style-guide/prettier](https://github.com/vercel/style-guide#prettier).

### Linting

This project uses [eslint](https://eslint.org/) for linting. Code is linted automatically when you commit, and you can run the linter manually using:

```sh
pnpm lint
```

All files (except those listed in [.eslintignore](./.eslintignore)) will be linted.

ESLint is configured by [.eslintrc.js](./.eslintrc.js). It is based on [@vercel/style-guide/eslint/node](https://github.com/vercel/style-guide#eslint)

### Testing

This project uses [node-tap](https://node-tap.org/) for testing. Run tests using:

```sh
pnpm test
```

Only test files matching the pattern `test/*.test.ts` will be executed.

Testing utility functions should be stored in `test/utils.ts` and be well documented.

### Type Checking

To manually type-check the repo without producing a build, use:

```sh
pnpm type-check
```

This project uses [TypeScript](https://www.typescriptlang.org/). There exists multiple TypeScript config files; each serves a different purpose.

- [tsconfig.base.json](./tsconfig.base.json)
  - The base configuration, itself based on [@vercel/style-guide/typescript](https://github.com/vercel/style-guide#typescript).
  - It does **not** _include_ any files as it is meant to be extended from.
- [tsconfig.json](./tsconfig.json)
  - The default configuration.
  - Used by various tools such as [eslint](#linting), the [`test` command](#testing), and the `type-check`` command.
  - Includes all TypeScript files in the repo.
  - Does **not** output anything.
- [tsconfig.build.json](./tsconfig.build.json)
  - The build configuration.
  - Only includes the `src` directory
  - Used by the [`build` command](#building) to output JavaScript
