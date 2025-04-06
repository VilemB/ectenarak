# MongoDB Improvements

This document outlines the improvements made to the MongoDB data models and relationships in the Čtenářský Deník application.

## Overview of Changes

We've enhanced the MongoDB implementation to improve data relationships, add more metadata, and optimize performance. The key improvements include:

1. **Proper MongoDB References**: Changed string IDs to ObjectId references for better data integrity
2. **Enhanced Metadata**: Added more fields to all models for richer information
3. **Improved Reading Progress Tracking**: Added fields to track reading progress more granularly
4. **Pagination Support**: Implemented pagination for book fetching to handle large libraries
5. **Optimized Indexing**: Added indexes for common query patterns to improve performance
6. **Virtual References**: Added virtual fields for reverse references (e.g., books by author)

## Model Improvements

### User Model

- Added authentication information (provider, provider ID)
- Added virtual reference to books
- Added methods to update statistics

### Book Model

- Changed userId to ObjectId reference (with legacy support)
- Added more book metadata (ISBN, published year, genre, cover image)
- Enhanced reading progress tracking (current page, total pages, start/completion dates)
- Added virtual for calculating reading progress percentage
- Added methods for updating reading progress

### Author Model

- Added more author metadata (birth/death dates, nationality, genres)
- Added external identifiers for integration with other services
- Added virtual reference to books by this author

### Note Schema (Embedded in Book)

- Added createdBy field for future collaborative features

## API Improvements

- Added pagination support to the book fetching API
- Added filtering by status, genre, author, and search term
- Added sorting options
- Added automatic user statistics updates

## Migration

A migration script has been created to update existing data to the new schema format. To run the migration:

```bash
npm run migrate
```

The migration script:

1. Updates user documents with new fields and default values
2. Updates author documents with new fields
3. Converts string user IDs to ObjectId references in books
4. Ensures all books have proper author references
5. Sets default values for new book fields
6. Updates user statistics based on their books

## Performance Considerations

- Added indexes for common query patterns
- Implemented pagination to handle large libraries efficiently
- Used embedded documents for notes to reduce query complexity
- Added compound indexes for unique constraints and common filters

## Future Improvements

- Implement caching for frequently accessed data
- Add aggregation pipelines for complex statistics
- Consider sharding for very large datasets
- Implement change streams for real-time updates
