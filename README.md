# n8n-nodes-jsonpost

A custom n8n node for integrating with JSONPost.com webhooks. This node allows you to easily create, manage, and receive webhooks from JSONPost endpoints in your n8n workflows.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Development](#development)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Easy Webhook Management**: Create and delete webhooks for JSONPost endpoints
- **Real-time Data Reception**: Receive webhook data in real-time within your n8n workflows
- **Secure Authentication**: Uses API key authentication for secure access to JSONPost services
- **Event Filtering**: Subscribe to specific event types from your JSONPost endpoints
- **Automatic Cleanup**: Properly handles webhook cleanup when workflows are deactivated

## Installation

### From npm (Recommended)

```bash
npm install n8n-nodes-jsonpost
```

### From Source

1. Clone this repository:
```bash
git clone https://github.com/yourusername/n8n-nodes-jsonpost.git
cd n8n-nodes-jsonpost
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Create a package:
```bash
npm pack
```

5. Install the package in your n8n installation:
```bash
npm install n8n-nodes-jsonpost-0.1.0.tgz
```

### n8n Community Nodes

You can also install this node directly through n8n's community nodes feature:

1. Go to **Settings** > **Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-jsonpost`
4. Click **Install**

## Configuration

### Setting up JSONPost API Credentials

1. In n8n, go to **Credentials** and create a new **JSONPost API** credential
2. Enter your JSONPost API key
3. Test the connection to ensure it's working properly

### Node Configuration

When adding the JSONPost Trigger node to your workflow:

1. **Credential**: Select your JSONPost API credential
2. **Endpoint ID**: Enter the ID of your JSONPost endpoint
3. **Event Type**: Choose the event type you want to listen for (e.g., "POST", "GET", "PUT", "DELETE")

## Usage

### Basic Webhook Setup

1. Add the **JSONPost Trigger** node to your workflow
2. Configure the node with your credentials and endpoint settings
3. Activate the workflow
4. The node will automatically create a webhook subscription with JSONPost
5. When data is sent to your JSONPost endpoint, it will trigger your n8n workflow

### Handling Webhook Data

The JSONPost Trigger node outputs the complete webhook payload, including:
- Request headers
- Request body
- Query parameters
- Timestamp information

You can access this data in subsequent nodes using expressions like:
- `{{ $json.body }}` - The request body
- `{{ $json.headers }}` - Request headers
- `{{ $json.query }}` - Query parameters

## API Endpoints

This node integrates with the following JSONPost API endpoints:

### GET /api/n8n/projects/endpoints
- **Purpose**: Retrieve available endpoints for credential testing
- **Authentication**: x-n8n-api-key header
- **Response**: List of available endpoints

### POST /api/n8n/subscribe
- **Purpose**: Create a new webhook subscription
- **Authentication**: x-n8n-api-key header
- **Request Body**:
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

### DELETE /api/n8n/unsubscribe
- **Purpose**: Remove an existing webhook subscription
- **Authentication**: x-n8n-api-key header
- **Request Body**:
  ```json
  {
    "endpointId": "string",
    "webhookUrl": "string"
  }
  ```

## Project Structure

```
n8n-nodes-jsonpost/
├── credentials/
│   └── JSONPostApi.credentials.ts    # API credential definition
├── nodes/
│   └── JSONPostTrigger/
│       └── JSONPostTrigger.node.ts   # Main trigger node implementation
├── package.json                      # Package configuration and dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This documentation file
```

### Key Files

- **`credentials/JSONPostApi.credentials.ts`**: Defines the credential type for JSONPost API authentication
- **`nodes/JSONPostTrigger/JSONPostTrigger.node.ts`**: Main implementation of the trigger node, handles webhook creation, deletion, and data reception
- **`package.json`**: Contains package metadata, dependencies, and n8n-specific configuration
- **`tsconfig.json`**: TypeScript compiler configuration for the project

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- n8n installed locally for testing

### Setup Development Environment

1. Clone the repository:
```bash
git clone https://github.com/yourusername/n8n-nodes-jsonpost.git
cd n8n-nodes-jsonpost
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Testing

To test the node locally:

1. Build and pack the node:
```bash
npm run build
npm pack
```

2. Install in your local n8n instance:
```bash
npm install n8n-nodes-jsonpost-0.1.0.tgz
```

3. Restart n8n and test the node in a workflow

### Building

The project uses TypeScript and includes the following build scripts:

- `npm run build` - Compile TypeScript and copy static files
- `npm run dev` - Build in development mode with watch
- `npm pack` - Create a distributable package

## Changelog

### Version 0.1.0 (Current)

#### Added
- Initial release of the JSONPost Trigger node
- Support for webhook creation and deletion
- Real-time webhook data reception
- API key authentication for JSONPost services
- Event type filtering for webhook subscriptions

#### Features
- **JSONPost Trigger Node**: Complete implementation with webhook lifecycle management
- **Credential Management**: Secure API key storage and validation
- **Error Handling**: Comprehensive error handling for API interactions
- **TypeScript Support**: Full TypeScript implementation with proper type definitions

#### API Updates
- Updated to use new JSONPost API endpoints (`/api/n8n/subscribe` and `/api/n8n/unsubscribe`)
- Changed request body format to camelCase (`endpointId`, `eventType`, `webhookUrl`)
- Updated response handling to work with new API structure (`success` and `subscription.id`)
- Modified delete method to use `endpointId` and `webhookUrl` instead of `webhook_id`

#### Technical Improvements
- Removed debug logging statements for cleaner production code
- Improved error messages and user feedback
- Enhanced webhook cleanup process
- Better handling of API authentication and authorization

## Contributing

We welcome contributions to improve this n8n node! Here's how you can help:

### Reporting Issues

If you encounter any bugs or have feature requests:

1. Check existing issues to avoid duplicates
2. Create a new issue with detailed information:
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - n8n version and environment details
   - Error messages or logs

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test thoroughly
4. Commit with clear, descriptive messages
5. Push to your fork and submit a pull request

### Development Guidelines

- Follow the existing code style and conventions
- Add appropriate TypeScript types for new functionality
- Test your changes with a local n8n installation
- Update documentation for any new features or changes
- Ensure all builds pass before submitting

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub for bugs and feature requests
- Check the [n8n community forum](https://community.n8n.io/) for general n8n questions
- Visit [JSONPost.com](https://jsonpost.com) for API-related questions

---

**Note**: This is a community-maintained node and is not officially supported by n8n or JSONPost. Use at your own discretion and always test thoroughly in your environment before production use.
