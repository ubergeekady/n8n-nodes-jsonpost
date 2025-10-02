import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

export class JSONPostTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JSONPost Trigger',
		name: 'jsonPostTrigger',
		icon: { light: 'file:jsonpost.png', dark: 'file:jsonpost.dark.png' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["endpoint"]}}',
		description: 'Starts the workflow when a form is submitted to JSONPost',
		defaults: {
			name: 'JSONPost Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'jsonPostApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Endpoint',
				name: 'endpoint',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEndpoints',
				},
				required: true,
				default: '',
				description: 'The JSONPost endpoint to listen to for form submissions',
			},
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{
						name: 'Form Submission',
						value: 'form_submission',
						description: 'Trigger when a form is submitted',
					},
				],
				required: true,
				default: 'form_submission',
				description: 'The type of event to listen for',
			},
		],
	};

	methods = {
		loadOptions: {
			async getEndpoints(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;

			try {
				const response = await this.helpers.request({
					method: 'GET',
					url: 'https://jsonpost.com/api/n8n/projects/endpoints',
					headers: {
						'x-n8n-api-key': apiKey,
					},
					json: true,
				});

				if (response.endpoints && Array.isArray(response.endpoints)) {
					return response.endpoints.map((endpoint: any) => ({
						name: endpoint.name,
						value: endpoint.value,
					}));
				}

				return [];
			} catch (error) {
				throw new Error(`Failed to load endpoints: ${error.message}`);
			}
		},
		},
	};

	// @ts-ignore
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;

			// Check if subscription exists by trying to get endpoints
			// If we can successfully communicate with the API, we assume the webhook might exist
			try {
				const response = await this.helpers.request({
					method: 'GET',
					url: 'https://jsonpost.com/api/n8n/projects/endpoints',
					headers: {
						'x-n8n-api-key': apiKey,
					},
					json: true,
				});
				
				return false; // Always return false to ensure we create/update the subscription
			} catch (error) {
				return false;
			}
		},

			async create(this: IHookFunctions): Promise<boolean> {
			const webhookUrl = this.getNodeWebhookUrl('default') as string;
			const endpoint = this.getNodeParameter('endpoint') as string;
			const eventType = this.getNodeParameter('eventType', 'form_submission') as string;
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;

			try {
				const requestBody = {
					endpoint_id: endpoint,
					webhook_url: webhookUrl,
					eventType: eventType,
				};

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://jsonpost.com/api/n8n/subscribe',
					headers: {
						'x-n8n-api-key': apiKey,
						'Content-Type': 'application/json',
					},
					body: requestBody,
					json: true,
				});

				if (response.success) {
					// Store the subscription data for later use
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = response.subscription.id;
					webhookData.webhookUrl = webhookUrl;
					webhookData.endpointId = endpoint;
					
					return true;
				}

				return false;
			} catch (error) {
				throw new Error(`Failed to create webhook subscription: ${error.message}`);
			}
		},

			async delete(this: IHookFunctions): Promise<boolean> {
			const webhookData = this.getWorkflowStaticData('node');
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;

			if (!webhookData.webhookId) {
				return true;
			}

			try {
				const requestBody = {
					subscription_id: webhookData.webhookId,
				};

				const response = await this.helpers.request({
					method: 'DELETE',
					url: 'https://jsonpost.com/api/n8n/unsubscribe',
					headers: {
						'x-n8n-api-key': apiKey,
						'Content-Type': 'application/json',
					},
					body: requestBody,
					json: true,
				});

				// Clear the stored webhook data
				delete webhookData.webhookId;
				delete webhookData.webhookUrl;
				delete webhookData.endpointId;

				return true;
			} catch (error) {
				// Even if deletion fails, clear the local data
				delete webhookData.webhookId;
				delete webhookData.webhookUrl;
				delete webhookData.endpointId;
				return true;
			}
		},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData();
		const queryData = this.getQueryData();

		const webhookResponse = {
			workflowData: [
				[
					{
						json: {
							body: bodyData,
							headers: headerData,
							query: queryData,
						},
					},
				],
			],
		};

		// Return the webhook data to the workflow
		return webhookResponse;
	}
}