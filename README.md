# n8n-nodes-jsonpost

This is an n8n community node that lets you integrate [JSONPost](https://jsonpost.com) form submissions into your n8n workflows.

JSONPost is a form builder software that allows you to create and manage forms. This node enables you to trigger n8n workflows when forms are submitted.

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-jsonpost` in the **Enter npm package name** field
4. Agree to the risks and click **Install**

### Manual Installation

Navigate to your n8n installation folder and run:

```bash
npm install n8n-nodes-jsonpost
```

For Docker installations, add the package to your environment:

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_COMMUNITY_PACKAGES="n8n-nodes-jsonpost" \
  n8nio/n8n
```

## Setup

### 1. Generate API Key in JSONPost

1. Log in to your [JSONPost dashboard](https://jsonpost.com)
2. Navigate to **Integrations** or **API Settings**
3. Generate a new **n8n API Key** (64 characters)
4. Copy the API key

### 2. Configure Credentials in n8n

1. In your n8n workflow, add the **JSONPost Trigger** node
2. Click on **Credentials** and select **Create New**
3. Enter your 64-character API key from JSONPost
4. Click **Save**
5. The credentials will be automatically validated

## Usage

### JSONPost Trigger Node

The JSONPost Trigger node listens for form submissions from your JSONPost forms.

#### Configuration

1. **Credentials**: Select your JSONPost API credentials
2. **Endpoint**: Choose which form endpoint to listen to (dynamically loaded from your JSONPost project)
3. **Event Type**: Select "Form Submission" (currently the only supported event type)

#### Output Data

When a form is submitted, the node outputs the following data structure:

```json
{
	"body": {
		// Form submission data
		"field1": "value1",
		"field2": "value2"
	},
	"headers": {
		// HTTP headers from the webhook request
	},
	"query": {
		// Query parameters if any
	}
}
```

## Example Workflow

Here's a simple workflow that sends an email when a contact form is submitted:

1. **JSONPost Trigger** - Listens for contact form submissions
2. **Set** node - Extract specific fields (name, email, message)
3. **Send Email** - Send notification to your team

## Component Interaction Flow

1. **User Setup**: Generate n8n API key in JSONPost dashboard
2. **Node Configuration**: Configure n8n node with API key and select endpoints
3. **Webhook Registration**: n8n node automatically registers webhook URLs with JSONPost
4. **Form Submission**: When forms are submitted, JSONPost sends data to registered webhooks
5. **Workflow Execution**: n8n receives webhook data and executes your workflow

## API Endpoints Used

This node interacts with the following JSONPost API endpoints:

- `POST /api/n8n/auth/validate` - Validates API key
- `GET /api/n8n/projects/endpoints` - Fetches available form endpoints
- `POST /api/n8n/subscribe` - Registers webhook subscription
- `DELETE /api/n8n/unsubscribe` - Removes webhook subscription

All API requests include the `x-n8n-api-key` header for authentication.

## Troubleshooting

### Credentials Not Valid

- Ensure your API key is exactly 64 characters
- Verify the API key is active in your JSONPost dashboard
- Check that your n8n instance can reach https://jsonpost.com

### No Endpoints Loading

- Verify your JSONPost project has at least one form endpoint created
- Check your API key has access to the project
- Ensure your n8n instance has internet access

### Webhook Not Receiving Data

- Verify your n8n workflow is active (not in draft mode)
- Check that your n8n instance is publicly accessible
- Test the webhook URL manually using a tool like Postman
- Review JSONPost webhook logs for delivery status

## Support

- JSONPost Documentation: https://jsonpost.com/docs
- n8n Community Forum: https://community.n8n.io
- Report Issues: [GitHub Issues](https://github.com/yourusername/n8n-nodes-jsonpost/issues)

## License

MIT

## Version History

### 1.0.0

- Initial release
- JSONPost Trigger node with form submission support
- API key authentication
- Dynamic endpoint loading
- Automatic webhook registration and cleanup
