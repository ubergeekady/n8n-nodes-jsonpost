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

			// Debug logging for endpoint loading
			this.logger?.info('🔍 [JSONPost] Loading endpoints...');
			this.logger?.info(`🔑 [JSONPost] API Key length: ${apiKey?.length || 0}`);

			try {
				const response = await this.helpers.request({
					method: 'GET',
					url: 'https://jsonpost.com/api/n8n/projects/endpoints',
					headers: {
						'x-n8n-api-key': apiKey,
					},
					json: true,
				});

				this.logger?.info(`✅ [JSONPost] Endpoints API response: ${JSON.stringify(response, null, 2)}`);

				if (response.endpoints && Array.isArray(response.endpoints)) {
					this.logger?.info(`📋 [JSONPost] Found ${response.endpoints.length} endpoints`);
					return response.endpoints.map((endpoint: any) => ({
						name: endpoint.name,
						value: endpoint.value,
					}));
				}

				this.logger?.warn('⚠️ [JSONPost] No endpoints found in response');
				return [];
			} catch (error) {
				this.logger?.error(`❌ [JSONPost] Failed to load endpoints: ${error}`);
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

			// Debug logging for webhook check
			this.logger?.info('🔍 [JSONPost] Checking if webhook exists...');
			this.logger?.info(`🔑 [JSONPost] API Key length: ${apiKey?.length || 0}`);

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
				
				this.logger?.info(`✅ [JSONPost] Webhook check API response: ${JSON.stringify(response, null, 2)}`);
				this.logger?.info('🔄 [JSONPost] Returning false to ensure webhook creation/update');
				return false; // Always return false to ensure we create/update the subscription
			} catch (error) {
				this.logger?.error(`❌ [JSONPost] Webhook check failed: ${error}`);
				return false;
			}
		},

			async create(this: IHookFunctions): Promise<boolean> {
			const webhookUrl = this.getNodeWebhookUrl('default') as string;
			const endpoint = this.getNodeParameter('endpoint') as string;
			const eventType = this.getNodeParameter('eventType', 'form_submission') as string;
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;

			// Debug logging for webhook creation
			this.logger?.info('🔧 [JSONPost] Creating webhook subscription...');
			this.logger?.info(`🔗 [JSONPost] Webhook URL: ${webhookUrl}`);
			this.logger?.info(`📍 [JSONPost] Endpoint: ${endpoint}`);
			this.logger?.info(`🎯 [JSONPost] Event Type: ${eventType}`);
			this.logger?.info(`🔑 [JSONPost] API Key length: ${apiKey?.length || 0}`);

			try {
				const requestBody = {
					endpoint_id: endpoint,
					webhook_url: webhookUrl,
					eventType: eventType,
				};

				this.logger?.info(`📤 [JSONPost] Request body: ${JSON.stringify(requestBody, null, 2)}`);

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

				this.logger?.info(`✅ [JSONPost] Webhook creation response: ${JSON.stringify(response, null, 2)}`);

				if (response.success) {
					// Store the subscription data for later use
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = response.subscription.id;
					webhookData.webhookUrl = webhookUrl;
					webhookData.endpointId = endpoint;
					
					this.logger?.info(`💾 [JSONPost] Stored webhook data: ${JSON.stringify(webhookData, null, 2)}`);
					this.logger?.info('🎉 [JSONPost] Webhook subscription created successfully!');
					return true;
				}

				this.logger?.warn('⚠️ [JSONPost] Webhook creation failed - response.success is false');
				return false;
			} catch (error) {
				this.logger?.error(`❌ [JSONPost] Failed to create webhook subscription: ${error}`);
				throw new Error(`Failed to create webhook subscription: ${error.message}`);
			}
		},

			async delete(this: IHookFunctions): Promise<boolean> {
			const webhookData = this.getWorkflowStaticData('node');
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;

			// Debug logging for webhook deletion
			this.logger?.info('🗑️ [JSONPost] Deleting webhook subscription...');
			this.logger?.info(`💾 [JSONPost] Webhook data: ${JSON.stringify(webhookData, null, 2)}`);
			this.logger?.info(`🔑 [JSONPost] API Key length: ${apiKey?.length || 0}`);

			if (!webhookData.webhookId) {
				this.logger?.warn('⚠️ [JSONPost] No webhook ID found - nothing to delete');
				return true;
			}

			try {
				const requestBody = {
					subscription_id: webhookData.webhookId,
				};

				this.logger?.info(`📤 [JSONPost] Delete request body: ${JSON.stringify(requestBody, null, 2)}`);

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

				this.logger?.info(`✅ [JSONPost] Webhook deletion response: ${JSON.stringify(response, null, 2)}`);

				// Clear the stored webhook data
				delete webhookData.webhookId;
				delete webhookData.webhookUrl;
				delete webhookData.endpointId;

				this.logger?.info('🧹 [JSONPost] Cleared stored webhook data');
				this.logger?.info('🎉 [JSONPost] Webhook subscription deleted successfully!');
				return true;
			} catch (error) {
				this.logger?.error(`❌ [JSONPost] Failed to delete webhook subscription: ${error}`);
				// Even if deletion fails, clear the local data
				delete webhookData.webhookId;
				delete webhookData.webhookUrl;
				delete webhookData.endpointId;
				this.logger?.info('🧹 [JSONPost] Cleared local webhook data despite deletion error');
				return true;
			}
		},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData();
		const queryData = this.getQueryData();

		// Debug logging for incoming webhook data
		this.logger?.info('📨 [JSONPost] Webhook received!');
		this.logger?.info(`📄 [JSONPost] Body data: ${JSON.stringify(bodyData, null, 2)}`);
		this.logger?.info(`📋 [JSONPost] Headers: ${JSON.stringify(headerData, null, 2)}`);
		this.logger?.info(`🔍 [JSONPost] Query params: ${JSON.stringify(queryData, null, 2)}`);

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

		this.logger?.info(`🚀 [JSONPost] Sending to workflow: ${JSON.stringify(webhookResponse, null, 2)}`);

		// Return the webhook data to the workflow
		return webhookResponse;
	}
}