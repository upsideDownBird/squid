## ADDED Requirements

### Requirement: Extract and save memories from conversation automatically
The system SHALL analyze conversation history, identify content worth saving, and automatically create long-term memories without user confirmation.

#### Scenario: Successful extraction and save
- **WHEN** a conversation reaches the extraction trigger point
- **THEN** system analyzes recent messages, generates 0-5 memories, and saves them directly

#### Scenario: No valuable content found
- **WHEN** conversation contains only trivial exchanges
- **THEN** system completes without creating any memories

#### Scenario: Multiple memory types identified
- **WHEN** conversation contains user preferences, feedback, and project info
- **THEN** system creates separate memories for each type with appropriate classification

### Requirement: Classify memory type automatically
The system SHALL automatically determine the appropriate memory type (user/feedback/project/reference) for each extracted memory.

#### Scenario: User preference detected
- **WHEN** conversation contains "I prefer", "I like", "I am", "my role is"
- **THEN** system classifies as type "user"

#### Scenario: Feedback or guidance detected
- **WHEN** conversation contains "should", "avoid", "remember to", "don't"
- **THEN** system classifies as type "feedback"

#### Scenario: Project information detected
- **WHEN** conversation contains "project", "feature", "requirement", "task"
- **THEN** system classifies as type "project"

#### Scenario: Reference information detected
- **WHEN** conversation contains technical details, documentation, or general knowledge
- **THEN** system classifies as type "reference"

### Requirement: Generate memory name and description
The system SHALL automatically generate a concise name and description for each extracted memory.

#### Scenario: Name generation from content
- **WHEN** extracting memory from "我是一名全栈开发工程师，主要使用 TypeScript"
- **THEN** system generates name like "全栈开发工程师" and description "用户的职业角色和技术栈"

#### Scenario: Name length limit
- **WHEN** generated name exceeds 50 characters
- **THEN** system truncates to 50 characters and adds "..."

### Requirement: Detect and skip duplicate memories
The system SHALL check for existing similar memories and skip creating duplicates.

#### Scenario: High similarity detected
- **WHEN** extracted memory content has >70% similarity with existing memory
- **THEN** system skips creating this memory to avoid duplication

#### Scenario: No duplicates found
- **WHEN** extracted memory is unique
- **THEN** system proceeds to create the memory

### Requirement: Maintain extraction cursor
The system SHALL track which messages have been analyzed to avoid re-processing.

#### Scenario: Incremental analysis
- **WHEN** extraction runs multiple times on same conversation
- **THEN** system only analyzes messages after last cursor position

#### Scenario: Cursor reset on conversation clear
- **WHEN** user clears conversation history
- **THEN** system resets extraction cursor to beginning

### Requirement: Handle extraction failures gracefully
The system SHALL continue normal operation if extraction fails.

#### Scenario: AI API failure
- **WHEN** extraction AI call fails or times out
- **THEN** system logs error and continues without blocking conversation flow

#### Scenario: Invalid extraction response
- **WHEN** AI returns malformed extraction data
- **THEN** system discards invalid data and logs warning

### Requirement: Mark auto-created memories
The system SHALL optionally mark memories as auto-created for user reference.

#### Scenario: Auto-created flag in metadata
- **WHEN** system creates a memory automatically
- **THEN** memory metadata includes `autoCreated: true` field

#### Scenario: User can view all memories
- **WHEN** user opens memory page
- **THEN** system displays all memories including auto-created ones

### Requirement: Silent operation
The system SHALL perform extraction and saving without displaying notifications or UI.

#### Scenario: Background extraction
- **WHEN** extraction is triggered
- **THEN** system completes silently without user notification

#### Scenario: User discovers memories later
- **WHEN** user opens memory page after auto-extraction
- **THEN** user sees newly created memories with creation timestamps
