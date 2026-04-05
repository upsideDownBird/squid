## ADDED Requirements

### Requirement: Memory file storage
The system SHALL store memory files in `~/.squid/memory/` directory organized by type (user, feedback, project, reference).

#### Scenario: Memory file creation
- **WHEN** a new memory is created
- **THEN** system creates a Markdown file with YAML frontmatter in the appropriate type subdirectory

#### Scenario: Memory file format validation
- **WHEN** loading a memory file
- **THEN** system validates the frontmatter contains required fields (name, description, type, created, updated)

### Requirement: Memory file format
Memory files SHALL use Markdown format with YAML frontmatter containing metadata.

#### Scenario: Valid memory file structure
- **WHEN** a memory file is created
- **THEN** it contains frontmatter with name, description, type, created, and updated fields
- **THEN** it contains Markdown content body

### Requirement: Memory types
The system SHALL support four memory types: user, feedback, project, and reference.

#### Scenario: User memory type
- **WHEN** creating a user-type memory
- **THEN** system stores it in `~/.squid/memory/user/` directory

#### Scenario: Feedback memory type
- **WHEN** creating a feedback-type memory
- **THEN** system stores it in `~/.squid/memory/feedback/` directory

#### Scenario: Project memory type
- **WHEN** creating a project-type memory
- **THEN** system stores it in `~/.squid/memory/project/` directory

#### Scenario: Reference memory type
- **WHEN** creating a reference-type memory
- **THEN** system stores it in `~/.squid/memory/reference/` directory

### Requirement: Memory file count limit
The system SHALL limit memory file scanning to the most recent 200 files.

#### Scenario: Scan with file count limit
- **WHEN** scanning memory directory
- **THEN** system sorts all memory files by modification time (newest first)
- **THEN** system keeps only the most recent 200 files
- **THEN** older files are ignored (not deleted, just not loaded)

### Requirement: Memory index file
The system SHALL maintain a MEMORY.md index file listing all memories with brief descriptions.

#### Scenario: Index file update on memory creation
- **WHEN** a new memory is created
- **THEN** system adds an entry to MEMORY.md with format `- [Title](type/file.md) — description`

#### Scenario: Index file update on memory deletion
- **WHEN** a memory is deleted
- **THEN** system removes the corresponding entry from MEMORY.md

### Requirement: Memory index file size limit
The MEMORY.md index file SHALL be limited to 200 lines or 25KB.

#### Scenario: Index within limits
- **WHEN** MEMORY.md is under 200 lines and 25KB
- **THEN** system loads the complete index

#### Scenario: Index exceeds line limit
- **WHEN** MEMORY.md exceeds 200 lines
- **THEN** system truncates to first 200 lines
- **THEN** system appends warning about truncation

#### Scenario: Index exceeds byte limit
- **WHEN** MEMORY.md exceeds 25KB
- **THEN** system truncates at last newline before 25KB
- **THEN** system appends warning about truncation with size information

### Requirement: Memory retrieval
The system SHALL provide methods to retrieve memories by type, name, or all memories.

#### Scenario: Retrieve all memories
- **WHEN** requesting all memories
- **THEN** system returns all memory files from all type directories

#### Scenario: Retrieve memories by type
- **WHEN** requesting memories of a specific type
- **THEN** system returns only memories from that type's directory

#### Scenario: Retrieve memory by name
- **WHEN** requesting a memory by name
- **THEN** system returns the matching memory file or null if not found

### Requirement: Memory caching
The system SHALL cache loaded memories in memory to avoid repeated file I/O.

#### Scenario: Cache on first load
- **WHEN** memories are loaded for the first time
- **THEN** system caches them in memory

#### Scenario: Cache invalidation on update
- **WHEN** a memory is updated
- **THEN** system invalidates and refreshes the cache

### Requirement: Memory file size limit
Individual memory files SHALL NOT exceed 2KB in size.

#### Scenario: Size validation on save
- **WHEN** saving a memory file
- **THEN** system validates content size is under 2KB
- **THEN** system rejects files exceeding the limit with an error message
