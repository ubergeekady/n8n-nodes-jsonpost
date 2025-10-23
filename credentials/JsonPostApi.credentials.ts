import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class JsonPostApi implements ICredentialType {
	name = 'jsonPostApi';
	displayName = 'JsonPost API';
	documentationUrl = 'https://crispforms.com/docs';
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
			description: 'The CrispForms n8n API key from your dashboard (64 characters)',
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
			baseURL: 'https://crispforms.com',
			url: '/api/n8n/projects/endpoints',
			method: 'GET',
		},
	};
}