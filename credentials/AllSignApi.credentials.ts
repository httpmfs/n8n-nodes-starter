import type {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class AllSignApi implements ICredentialType {
    name = 'allSignApi';
    displayName = 'AllSign API';
    documentationUrl = 'https://docs.allsign.io';
    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            placeholder: 'allsign_live_sk_...',
            description: 'Your AllSign API Key. Visit your <a href="https://dashboard.allsign.io/developers/api-keys">AllSign Dashboard</a> to generate a key.',
        },
        {
            displayName: 'Environment',
            name: 'environment',
            type: 'options',
            default: 'production',
            options: [
                {
                    name: 'Production',
                    value: 'production',
                },
                {
                    name: 'Sandbox',
                    value: 'sandbox',
                },
            ],
            description: 'Select the AllSign environment to use',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.apiKey}}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.environment === "sandbox" ? "https://api.sandbox.allsign.io" : "https://api.allsign.io"}}',
            url: '/v2/test/security',
            method: 'GET',
        },
    };
}
