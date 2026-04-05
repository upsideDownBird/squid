## ADDED Requirements

### Requirement: Automatically manage memory count limit
The system SHALL automatically clean up low-value memories when approaching the 200 memory limit.

#### Scenario: Trigger cleanup at threshold
- **WHEN** total memory count reaches 180
- **THEN** system triggers automatic cleanup process

#### Scenario: No cleanup needed
- **WHEN** total memory count is below 180
- **THEN** system skips cleanup process

### Requirement: Calculate memory value score
The system SHALL calculate a value score for each memory based on age, access frequency, and type.

#### Scenario: Score calculation
- **WHEN** system evaluates a memory
- **THEN** score = (accessCount + 1) * typeWeight / ageInDays

#### Scenario: Type weight priority
- **WHEN** calculating score
- **THEN** user memories have highest weight (1.5), followed by feedback (1.3), project (1.2), and reference (1.0)

### Requirement: Clean up low-value memories
The system SHALL remove up to 20 lowest-scoring memories during cleanup.

#### Scenario: Remove low-scoring memories
- **WHEN** cleanup is triggered
- **THEN** system removes up to 20 memories with lowest scores

#### Scenario: Preserve recent memories
- **WHEN** evaluating memories for cleanup
- **THEN** system never removes memories created within last 30 days

### Requirement: Track memory access
The system SHALL track how many times each memory has been loaded into AI context.

#### Scenario: Increment access count
- **WHEN** memory is selected and injected into AI context
- **THEN** system increments memory's accessCount field

#### Scenario: Initialize access count
- **WHEN** new memory is created
- **THEN** system sets accessCount to 0

### Requirement: Log cleanup actions
The system SHALL log all automatic cleanup actions for user reference.

#### Scenario: Log cleaned memories
- **WHEN** cleanup removes memories
- **THEN** system logs memory IDs, names, and scores to cleanup log file

#### Scenario: User can view cleanup history
- **WHEN** user checks cleanup log at ~/.squid/memory-cleanup.log
- **THEN** user sees history of all automatic cleanups with timestamps
