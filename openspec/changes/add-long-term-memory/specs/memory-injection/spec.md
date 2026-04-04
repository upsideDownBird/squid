## ADDED Requirements

### Requirement: Memory scanning and ranking
The system SHALL scan all memory files and rank them by modification time, keeping only the most recent 200 files.

#### Scenario: Scan memory directory
- **WHEN** preparing to inject memories
- **THEN** system scans all memory files from all type directories
- **THEN** system sorts files by modification time (newest first)
- **THEN** system keeps only the most recent 200 files

#### Scenario: Skip invalid memory files
- **WHEN** scanning encounters an invalid file
- **THEN** system logs a warning and continues scanning other memories

### Requirement: Intelligent memory selection
The system SHALL use an AI model to select the most relevant memories based on user query.

#### Scenario: Select relevant memories
- **WHEN** user sends a query
- **THEN** system uses AI to analyze query and memory descriptions
- **THEN** system selects up to 5 most relevant memories
- **THEN** selected memories are ranked by relevance

#### Scenario: No relevant memories
- **WHEN** no memories are relevant to the query
- **THEN** system returns empty selection
- **THEN** no memories are injected into context

### Requirement: Memory deduplication
The system SHALL track already-surfaced memories and avoid re-injecting them in the same conversation.

#### Scenario: Track surfaced memories
- **WHEN** memories are injected into context
- **THEN** system records their file paths in a surfaced set

#### Scenario: Filter already-surfaced memories
- **WHEN** selecting memories for a new turn
- **THEN** system excludes memories already in the surfaced set
- **THEN** AI selector only considers fresh candidates

### Requirement: Memory content compression
Individual memory files SHALL be limited to 200 lines or 4096 bytes when injected.

#### Scenario: Read within limits
- **WHEN** reading a memory file for injection
- **THEN** system reads up to 200 lines or 4096 bytes
- **THEN** content within limits is injected as-is

#### Scenario: Truncate oversized memory
- **WHEN** memory file exceeds 200 lines or 4096 bytes
- **THEN** system truncates content at the limit
- **THEN** system appends truncation notice with file path
- **THEN** notice suggests using Read tool to view complete file

### Requirement: Memory injection into AI context
The system SHALL inject selected memories into the AI system prompt with clear formatting.

#### Scenario: Format memory section
- **WHEN** injecting memories
- **THEN** system creates a "## Long-term Memories" section
- **THEN** each memory is formatted with header showing filename and type
- **THEN** memory content follows the header

#### Scenario: Memory context separation
- **WHEN** building AI context
- **THEN** memories appear before conversation history
- **THEN** memories are clearly separated from other context

### Requirement: Memory selection model
The system SHALL use a lightweight AI model (e.g., Haiku or Sonnet) for memory selection to minimize cost.

#### Scenario: Use efficient model
- **WHEN** selecting relevant memories
- **THEN** system uses a fast, cost-effective model
- **THEN** selection completes within 2 seconds

#### Scenario: Selection failure fallback
- **WHEN** memory selection fails or times out
- **THEN** system falls back to most recent 5 memories
- **THEN** conversation continues without blocking
