## ADDED Requirements

### Requirement: Manual memory extraction
The system SHALL provide a UI action to manually extract information from conversation and save as memory.

#### Scenario: Extract from conversation
- **WHEN** user selects text in a conversation message
- **THEN** system displays an "Add to Memory" action button

#### Scenario: Pre-fill extraction form
- **WHEN** user clicks "Add to Memory" on selected text
- **THEN** system opens memory creation form with content pre-filled from selection

### Requirement: Memory type suggestion
The system SHALL suggest appropriate memory type based on conversation context.

#### Scenario: Suggest user type
- **WHEN** conversation contains user preferences or personal information
- **THEN** system suggests "user" as the memory type

#### Scenario: Suggest feedback type
- **WHEN** conversation contains corrections or guidance
- **THEN** system suggests "feedback" as the memory type

#### Scenario: Suggest project type
- **WHEN** conversation contains project-specific information
- **THEN** system suggests "project" as the memory type

#### Scenario: Suggest reference type
- **WHEN** conversation contains technical references or documentation
- **THEN** system suggests "reference" as the memory type

### Requirement: Duplicate detection
The system SHALL detect potential duplicate memories before creation.

#### Scenario: Similar memory exists
- **WHEN** creating a memory with similar name or content to existing memory
- **THEN** system displays a warning about potential duplicate
- **THEN** system shows the similar existing memory for comparison

#### Scenario: User override duplicate warning
- **WHEN** user confirms creation despite duplicate warning
- **THEN** system creates the new memory

### Requirement: Memory name generation
The system SHALL suggest a memory name based on content.

#### Scenario: Generate name from content
- **WHEN** user creates memory without specifying a name
- **THEN** system generates a kebab-case name from first few words of content

#### Scenario: User override generated name
- **WHEN** user edits the suggested name
- **THEN** system uses the user-provided name instead
