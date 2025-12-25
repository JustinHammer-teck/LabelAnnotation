## Usage

After installation, restart Claude Code (or start a new session). Then use:

```
/progress-report [description of what you want the report to cover]
```

### Examples

```bash
# Report on authentication feature
/progress-report authentication module implementation status

# Report on API development
/progress-report REST API endpoints for user management

# Report on testing progress
/progress-report unit test coverage for payment processing

# Report on a specific sprint
/progress-report sprint 5 deliverables and remaining work

# Report on bug fixes
/progress-report critical bug fixes in the last week
```

## How It Works

1. **User Input**: You provide a description of what the progress report should cover
2. **Context Gathering**: The command automatically collects:
   - Current date/time
   - Git branch information
   - Recent commits (last 5)
   - Modified files
3. **Agent Processing**: The `@agent-context-master` subagent optimizes the gathered information for:
   - Conciseness (removes redundancy)
   - AI retrieval (structured format with semantic tags)
   - Clarity (unambiguous language)
4. **Output**: Final report is written to `.claude/progress.md` 
   - you MUST override existed project.md

## Output Format

Reports are generated with:

- **Header**: Title, date, scope, author
- **Summary**: Executive summary (2-3 sentences)
- **Status Overview**: Table with status tags
- **Key Accomplishments**: Completed items with `[COMPLETE]` tags
- **Current Work**: Active tasks with `[IN-PROGRESS]` tags
- **Blockers & Risks**: Issues with `[BLOCKER]` and `[RISK]` tags
- **Next Steps**: Prioritized actions with `[ACTION]` tags
- **Metrics**: Quantifiable progress indicators

## Semantic Tags

The agent uses these semantic tags for AI-optimized retrieval:

| Tag | Meaning |
|-----|---------|
| `[COMPLETE]` | Finished work items |
| `[IN-PROGRESS]` | Currently active work |
| `[TODO]` | Planned but not started |
| `[BLOCKED]` | Blocked by external factors |
| `[RISK]` | Potential issues |
| `[ACTION]` | Required next steps |
| `[STATUS]` | General status indicator |

## Customization

### Modify the Command

Edit `.claude/commands/progress-report.md` to:
- Add more context gathering (additional bash commands)
- Change the report template structure
- Add project-specific sections
- Modify allowed tools

### Modify the Agent

Edit `.claude/agents/agent-context-master.md` to:
- Adjust optimization principles
- Change formatting preferences
- Add domain-specific knowledge
- Modify the response style

## File Structure

```
.claude/
├── commands/
│   └── progress-report.md    # The slash command
├── agents/
│   └── agent-context-master.md   # The optimization subagent
└── progress.md               # Generated reports go here
```

## Troubleshooting

### Command not appearing
- Restart Claude Code after adding files
- Verify files are in correct location
- Check file has `.md` extension

### Agent not being invoked
- Ensure `agent-context-master.md` is in the agents directory
- Check the agent file has proper frontmatter

### Git context not working
- Ensure you're in a git repository
- The command gracefully handles non-git directories