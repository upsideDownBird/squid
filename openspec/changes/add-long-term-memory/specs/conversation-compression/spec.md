## ADDED Requirements

### Requirement: Conversation token monitoring
The system SHALL monitor conversation token count and trigger compression when approaching context limit.

#### Scenario: Monitor token usage
- **WHEN** adding messages to conversation
- **THEN** system estimates total token count
- **THEN** system tracks token usage percentage

#### Scenario: Trigger compression threshold
- **WHEN** conversation tokens exceed 80% of model context limit
- **THEN** system triggers automatic compression

### Requirement: Conversation compression
The system SHALL compress old conversation history into a detailed summary when context limit is approached.

#### Scenario: Generate conversation summary
- **WHEN** compression is triggered
- **THEN** system uses AI model to generate detailed summary of old messages
- **THEN** summary includes: user requests, technical concepts, files modified, errors encountered, user feedback, pending tasks, current work

#### Scenario: Preserve recent messages
- **WHEN** compressing conversation
- **THEN** system preserves the most recent 10 messages uncompressed
- **THEN** older messages are replaced with summary

#### Scenario: Insert compression boundary
- **WHEN** compression completes
- **THEN** system inserts a boundary marker indicating compression point
- **THEN** marker separates summary from recent messages

### Requirement: Compression model selection
The system SHALL use a lightweight model for generating compression summaries to minimize cost.

#### Scenario: Use efficient model for compression
- **WHEN** generating compression summary
- **THEN** system uses a fast, cost-effective model (e.g., Haiku)
- **THEN** compression completes within 5 seconds

### Requirement: Manual compression trigger
The system SHALL allow users to manually trigger conversation compression.

#### Scenario: User triggers compression
- **WHEN** user clicks "Compress Conversation" button
- **THEN** system generates summary regardless of token count
- **THEN** system displays compression success message

### Requirement: Compression summary format
Compression summaries SHALL follow a structured format for consistency.

#### Scenario: Summary structure
- **WHEN** generating compression summary
- **THEN** summary includes sections: Primary Request, Key Technical Concepts, Files and Code, Errors and Fixes, User Messages, Pending Tasks, Current Work, Optional Next Step
- **THEN** each section contains detailed information

### Requirement: Compression failure handling
The system SHALL handle compression failures gracefully without blocking conversation.

#### Scenario: Compression fails
- **WHEN** compression summary generation fails
- **THEN** system logs error
- **THEN** system falls back to simple truncation (keep recent 20 messages)
- **THEN** conversation continues without interruption
