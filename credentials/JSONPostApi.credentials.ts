import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class JSONPostApi implements ICredentialType {
	name = 'jsonPostApi';
	displayName = 'JSONPost API';
	documentationUrl = 'https://jsonpost.com/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The JSONPost n8n API key from your dashboard (64 characters)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-n8n-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://jsonpost.com',
			url: '/api/n8n/projects/endpoints',
			method: 'GET',
		},
	};
}