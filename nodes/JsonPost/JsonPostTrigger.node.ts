import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	NodeApiError,
	NodeOperationError,
	IHttpRequestMethods,
} from 'n8n-workflow';

interface EndpointResponse {
	name: string;
	value: string;
}

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
				displayName: 'Endpoint Name or ID',
				name: 'endpoint',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEndpoints',
				},
				required: true,
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
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
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://jsonpost.com/api/n8n/projects/endpoints',
					headers: {
						'x-n8n-api-key': apiKey,
					},
					json: true,
				});

				if (response.endpoints && Array.isArray(response.endpoints)) {
					return response.endpoints.map((endpoint: EndpointResponse) => ({
						name: endpoint.name,
						value: endpoint.value,
					}));
				}

				return [];
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				throw new NodeApiError(this.getNode(), { message: `Failed to load endpoints: ${errorMessage}` });
			}
		},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;

			try {
				const webhookData = this.getWorkflowStaticData('node');

				// Make API call to check if webhook exists
				const requestOptions = {
					method: 'POST' as IHttpRequestMethods,
					url: 'https://jsonpost.com/api/n8n/webhooks/check',
					headers: {
						'Content-Type': 'application/json',
						'x-n8n-api-key': apiKey,
					},
					body: {
						webhook_id: webhookData.webhookId as string,
					},
					json: true,
				};

				await this.helpers.httpRequest(requestOptions);

				return true;
			} catch {
				return false;
			}
		},

			async create(this: IHookFunctions): Promise<boolean> {
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;
			const endpoint = this.getNodeParameter('endpoint') as string;
			const eventType = this.getNodeParameter('eventType') as string;
			const webhookUrl = this.getNodeWebhookUrl('default') as string;

			try {
				const requestBody = {
					endpointId: endpoint,
					eventType: eventType,
					webhookUrl: webhookUrl,
				};

				const requestOptions = {
					method: 'POST' as IHttpRequestMethods,
					url: 'https://jsonpost.com/api/n8n/subscribe',
					headers: {
						'Content-Type': 'application/json',
						'x-n8n-api-key': apiKey,
					},
					body: requestBody,
					json: true,
				};

				const createResponse = await this.helpers.httpRequest(requestOptions);

				if (createResponse.success && createResponse.subscription?.id) {
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = createResponse.subscription.id;
					return true;
				}

				throw new NodeOperationError(this.getNode(), 'Failed to create webhook - no subscription ID returned');
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				throw new NodeApiError(this.getNode(), { message: `Failed to create webhook: ${errorMessage}` });
			}
		},

			async delete(this: IHookFunctions): Promise<boolean> {
			const credentials = await this.getCredentials('jsonPostApi');
			const apiKey = credentials.apiKey as string;
			const webhookData = this.getWorkflowStaticData('node');

			if (!webhookData.webhookId) {
				return true;
			}

			try {
				const endpoint = this.getNodeParameter('endpoint') as string;
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				
				const requestBody = {
					endpointId: endpoint,
					webhookUrl: webhookUrl,
				};

				const requestOptions = {
					method: 'DELETE' as IHttpRequestMethods,
					url: 'https://jsonpost.com/api/n8n/unsubscribe',
					headers: {
						'Content-Type': 'application/json',
						'x-n8n-api-key': apiKey,
					},
					body: requestBody,
					json: true,
				};

				await this.helpers.httpRequest(requestOptions);

				// Clear the webhook data
				delete webhookData.webhookId;

				return true;
			} catch {
				delete webhookData.webhookId;
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

// Export the class as default for n8n to load it correctly
export { JSONPostTrigger as JsonPostTrigger };