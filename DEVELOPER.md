# Developer Documentation

This document contains internal details, development guidelines, and technical information for contributors and developers working on the n8n-nodes-jsonpost package.

## Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Building and Testing](#building-and-testing)
- [API Integration Details](#api-integration-details)
- [Node Implementation](#node-implementation)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)
- [Contributing Guidelines](#contributing-guidelines)

## Project Structure

```
n8n-nodes-jsonpost/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD pipeline
├── credentials/
│   └── JsonPostApi.credentials.ts    # API credential definition
├── nodes/
│   └── JsonPost/
│       ├── JsonPost.node.json        # Node metadata and configuration
│       ├── JsonPostTrigger.node.ts   # Main trigger node implementation
│       ├── jsonpost.png              # Node icon (light theme)
│       └── jsonpost.dark.png         # Node icon (dark theme)
├── dist/                             # Compiled output (generated)
├── .gitignore                        # Git ignore rules
├── .prettierrc.js                    # Code formatting configuration
├── CHANGELOG.md                      # Version history and changes
├── eslint.config.mjs                 # ESLint configuration
├── package.json                      # Package configuration and dependencies
├── package-lock.json                 # Locked dependency versions
├── README.md                         # User-facing documentation
├── tsconfig.json                     # TypeScript configuration
└── DEVELOPER.md                      # This file
```

### Key Files Explained

#### `credentials/JsonPostApi.credentials.ts`
- Defines the credential type for JSONPost API authentication
- Implements `ICredentialType` interface
- Handles API key validation and test requests
- **Export Issue**: Must export as named export `{ JSONPostApi as JsonPostApi }`

#### `nodes/JsonPost/JsonPostTrigger.node.ts`
- Main implementation of the webhook trigger node
- Implements `INodeType` and `IWebhookFunctions` interfaces
- Handles webhook lifecycle (create, receive, delete)
- **Export Issue**: Must export as named export `{ JSONPostTrigger as JsonPostTrigger }`

#### `package.json` - n8n Configuration
```json
{
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/JsonPostApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/JsonPost/JsonPostTrigger.node.js"
    ]
  }
}
```

**Critical**: The paths must point to compiled `.js` files, not `.ts` source files.

## Development Setup

### Prerequisites

- Node.js v14+ (recommended: v18+)
- npm or yarn
- n8n installed locally for testing
- TypeScript knowledge
- Understanding of n8n node development

### Initial Setup

1. **Clone and Install**:
```bash
git clone https://github.com/yourusername/n8n-nodes-jsonpost.git
cd n8n-nodes-jsonpost
npm install
```

2. **Development Build**:
```bash
npm run build
```

3. **Watch Mode** (for active development):
```bash
npm run dev
```

### Local n8n Setup for Testing

1. **Create a separate n8n directory**:
```bash
mkdir ~/n8n-local
cd ~/n8n-local
npm init -y
npm install n8n
```

2. **Install your node package**:
```bash
# From your node project directory
npm run build
npm pack

# In your n8n directory
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install /path/to/your/n8n-nodes-jsonpost-x.x.x.tgz
```

3. **Start n8n with community packages enabled**:
```bash
N8N_COMMUNITY_PACKAGES_ENABLED=true npx n8n start
```

## Building and Testing

### Build Process

The build process uses the n8n-node CLI tool:

```bash
# Development build with watch
npm run dev

# Production build
npm run build

# Create distributable package
npm pack
```

### Build Output

The `dist/` directory contains:
- Compiled JavaScript files (`.js`)
- TypeScript declaration files (`.d.ts`)
- Source maps (`.js.map`)
- Static assets (images, JSON files)

### Testing Workflow

1. **Build the package**:
```bash
npm run build
npm pack
```

2. **Install in test n8n instance**:
```bash
cd ~/.n8n/nodes
npm uninstall n8n-nodes-jsonpost  # Remove old version
npm install /path/to/n8n-nodes-jsonpost-x.x.x.tgz
```

3. **Restart n8n**:
```bash
# Stop current n8n instance (Ctrl+C)
N8N_LOG_LEVEL=debug N8N_COMMUNITY_PACKAGES_ENABLED=true npx n8n start
```

4. **Test in n8n UI**:
- Create new workflow
- Add JSONPost Trigger node
- Configure credentials and settings
- Test webhook functionality

### Common Build Issues

#### Constructor Errors
**Problem**: `require(...).JsonPostTrigger is not a constructor`

**Solution**: Ensure proper named exports:
```typescript
// At the end of your class file
export { JSONPostTrigger as JsonPostTrigger };
```

#### Module Not Found
**Problem**: `Cannot find module 'n8n-nodes-jsonpost/dist/nodes/JsonPost/JsonPostTrigger.node.ts'`

**Solution**: Check `package.json` n8n configuration points to `.js` files:
```json
{
  "n8n": {
    "nodes": [
      "dist/nodes/JsonPost/JsonPostTrigger.node.js"  // .js not .ts
    ]
  }
}
```

## API Integration Details

### JSONPost API Endpoints

#### Authentication
All requests require the `x-n8n-api-key` header with a valid API key.

#### Endpoint: GET /api/n8n/projects/endpoints
- **Purpose**: Credential validation and endpoint listing
- **Headers**: `x-n8n-api-key: {apiKey}`
- **Response**: Array of available endpoints

#### Endpoint: POST /api/n8n/subscribe
- **Purpose**: Create webhook subscription
- **Headers**: `x-n8n-api-key: {apiKey}`
- **Body**:
```json
{
  "endpointId": "string",
  "eventType": "string", 
  "webhookUrl": "string"
}
```
- **Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "string"
  }
}
```

#### Endpoint: DELETE /api/n8n/unsubscribe
- **Purpose**: Remove webhook subscription
- **Headers**: `x-n8n-api-key: {apiKey}`
- **Body**:
```json
{
  "endpointId": "string",
  "webhookUrl": "string"
}
```

### Error Handling

The node implements comprehensive error handling:

```typescript
try {
  const response = await this.helpers.httpRequest(options);
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    throw new NodeApiError(this.getNode(), error, {
      message: 'Invalid API key or unauthorized access',
    });
  }
  throw new NodeApiError(this.getNode(), error);
}
```

## Node Implementation

### Webhook Lifecycle

1. **Webhook Creation** (`webhookMethods.createWebhook`):
   - Called when workflow is activated
   - Creates subscription with JSONPost API
   - Stores subscription ID for cleanup

2. **Webhook Reception** (`webhook`):
   - Handles incoming webhook requests
   - Processes and validates data
   - Returns formatted response to n8n

3. **Webhook Deletion** (`webhookMethods.deleteWebhook`):
   - Called when workflow is deactivated
   - Removes subscription from JSONPost API
   - Cleans up resources

### Node Properties

The node defines these configuration properties:

```typescript
properties: INodeProperties[] = [
  {
    displayName: 'Credential',
    name: 'credential',
    type: 'credentials',
    default: '',
    credentialTypes: [
      {
        name: 'jsonPostApi',
        required: true,
      },
    ],
  },
  {
    displayName: 'Endpoint ID',
    name: 'endpointId',
    type: 'string',
    default: '',
    required: true,
  },
  {
    displayName: 'Event Type',
    name: 'eventType',
    type: 'options',
    options: [
      { name: 'POST', value: 'POST' },
      { name: 'GET', value: 'GET' },
      { name: 'PUT', value: 'PUT' },
      { name: 'DELETE', value: 'DELETE' },
    ],
    default: 'POST',
  },
];
```

## Deployment Process

### Version Management

1. **Update version** in `package.json`
2. **Update CHANGELOG.md** with changes
3. **Build and test** thoroughly
4. **Create git tag**: `git tag v1.0.1`
5. **Push changes**: `git push origin main --tags`

### npm Publishing

```bash
# Build the package
npm run build

# Test the package locally first
npm pack
# Test installation in local n8n

# Publish to npm
npm publish
```

### GitHub Release

1. Create release from git tag
2. Upload the `.tgz` package file
3. Include changelog in release notes

## Troubleshooting

### Debug Mode

Enable debug logging in n8n:

```bash
N8N_LOG_LEVEL=debug npx n8n start
```

### Common Issues

#### Node Not Loading
- Check `package.json` n8n configuration
- Verify file paths point to compiled `.js` files
- Ensure proper exports in TypeScript files

#### Webhook Not Triggering
- Verify API credentials are correct
- Check JSONPost endpoint configuration
- Review n8n webhook URL accessibility
- Check network connectivity and firewall settings

#### Build Failures
- Clear `dist/` directory and rebuild
- Check TypeScript errors in source files
- Verify all dependencies are installed

### Logging and Debugging

Add debug logging in your node:

```typescript
// In your node methods
console.log('Debug info:', data);

// Use n8n's logger
this.logger.debug('Webhook received', { data });
```

## Contributing Guidelines

### Code Style

- Use TypeScript for all source files
- Follow existing code formatting (Prettier)
- Use ESLint configuration provided
- Add proper type annotations

### Testing Requirements

- Test all webhook lifecycle methods
- Verify error handling scenarios
- Test with different API responses
- Validate credential functionality

### Pull Request Process

1. Fork the repository
2. Create feature branch: `git checkout -b feature/description`
3. Make changes with proper testing
4. Update documentation if needed
5. Submit pull request with detailed description

### Code Review Checklist

- [ ] TypeScript compilation passes
- [ ] All exports are properly named
- [ ] Error handling is comprehensive
- [ ] Documentation is updated
- [ ] Local testing completed
- [ ] No hardcoded values or secrets

---

## Internal Notes

### Known Issues

1. **Export Naming**: n8n requires specific named exports that match the class names expected by the module loader.

2. **File Path Configuration**: The `package.json` must reference compiled `.js` files, not source `.ts` files.

3. **Webhook URL**: Must be accessible from external services (use ngrok for local testing).

### Future Improvements

- Add support for multiple event types per subscription
- Implement webhook signature verification
- Add retry logic for failed API calls
- Support for custom headers in webhook requests