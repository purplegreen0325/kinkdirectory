# Release Process

This document describes how to create releases for this project.

## Creating a Release with Git Tags

This project uses Git tags to trigger releases. When you create and push a tag, a GitHub Action will automatically build the project and create a release.

To create a new release:

1. Make sure your changes are committed and pushed to the repository
2. Create a new tag with the desired version:
   ```bash
   git tag v1.0.3
   ```
3. Push the tag to GitHub:
   ```bash
   git push origin v1.0.3
   ```
4. The GitHub Action will automatically:
   - Build the project
   - Create a GitHub Release with the built files
   - Upload the dist folder as release assets

## Creating a Release with release-it

If you prefer to use release-it to handle versioning, changelog updates, and tagging:

```bash
# First, install dependencies
yarn install

# Then run release-it with the desired bump
yarn release patch   # Bump patch version (1.0.x)
yarn release minor   # Bump minor version (1.x.0)
yarn release major   # Bump major version (x.0.0)
```

This will:
1. Update the version in package.json
2. Create a git tag
3. Push changes and tag to GitHub
4. Trigger the GitHub Action workflow

## Semantic Versioning

When choosing a version number, follow [Semantic Versioning](https://semver.org/) principles:

- **Patch releases** (1.0.x): Bug fixes and minor changes that don't affect compatibility
- **Minor releases** (1.x.0): New features that don't break existing functionality
- **Major releases** (x.0.0): Breaking changes that require updates to consumer code

## Required GitHub Setup

For the automated release workflow to function, the repository needs:

1. A GitHub repository secret named `RELEASE_TOKEN` with a Personal Access Token that has the "contents:write" permission.
2. The `.github/workflows/release.yml` workflow file properly configured.
