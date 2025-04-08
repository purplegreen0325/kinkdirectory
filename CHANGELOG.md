# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-07-18

### Added
- New binary URL encoding system for extremely short list sharing URLs
- Migration system for handling legacy list formats
- Improved error handling for list imports
- Automatic error notification via toast messages
- Dutch error message translations

### Changed
- More efficient kink storage using numeric keys instead of string IDs
- Improved URL parameter handling for cleaner URLs after errors
- Optimized data format for selections to reduce localStorage footprint

### Fixed
- Backward compatibility for old shared list URLs
- Format detection for both binary and JSON data structures
- Error handling for unsupported legacy formats
- Automatic URL cleanup after import errors 