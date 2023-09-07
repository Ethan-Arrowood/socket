# socket

A Node.js Implementation of the Cloudflare Socket API

## Contributing

- Node.js v18.x
- pnpm v8.6.12 (recommended to use corepack)

The formatting, linting, and typechecking of this repo are based off of [@vercel/style-guide](https://github.com/vercel/style-guide).

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
