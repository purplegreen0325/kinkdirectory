# Changelog

# [1.1.0](https://github.com/kdirectoryxo/kinkdirectory/compare/v1.0.5...v1.1.0) (2025-04-08)

## [Unreleased]

### Added
- Data migration system for preserving user list data when format changes
- Backward compatibility with old list formats during import
- Improved error handling with user-friendly notifications
- Dutch translations for all error messages
- Automatic URL cleanup after handling errors

### Changed
- Storage format migration from `categoryId_kinkId_position` to more efficient `kinkKey%position`
- More efficient data structure for storing selections
- Better URL sharing with optimized data format
- Enhanced usability with clearer error feedback

### Fixed
- Legacy list import handling
- Selection data preservation during format changes
- Error handling for unsupported list formats
- URL parameter handling for better user experience

## [1.0.5](https://github.com/kdirectoryxo/kinkdirectory/compare/v1.0.4...v1.0.5) (2025-04-08)
- Initial release with configuration for release-it

## [1.0.4] - 2024-04-08

### Added
- Migration system for kinkList storage formats
- Support for converting from old format (categoryId_kinkId_position) to new format (kinkKey%position)
- Error handling and translations for list imports

### Changed
- Improved URL sharing with more efficient data format
- Better error handling for unsupported list formats

### Fixed
- Bug with selections not properly transferring on import
