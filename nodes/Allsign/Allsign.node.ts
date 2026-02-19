import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Allsign implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AllSign',
		name: 'allsign',
		icon: 'file:allsign.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Create, sign, and manage documents with AllSign e-signature platform. Firma electrónica, NOM-151, FEA, eIDAS.',
		defaults: {
			name: 'AllSign',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'allSignApi',
				required: true,
			},
		],
		codex: {
			alias: [
				'Firma',
				'Documento',
				'Contrato',
				'Signature',
				'PDF',
				'Sign',
				'Biometrica',
				'NOM-151',
				'FEA',
				'eIDAS',
				'Signer',
				'Firmante',
			],
		},
		properties: [
			// ------ Resource ------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'document',
				options: [
					{
						name: 'Document',
						value: 'document',
						description: 'Create, send, and manage documents for signing',
					},
				],
			},
			// ------ Operation ------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['document'],
					},
				},
				default: 'create',
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create and upload a new document for signing',
						action: 'Create a document',
					},
					{
						name: 'Send',
						value: 'send',
						description: 'Send a document for signing (or resend reminders)',
						action: 'Send a document for signing',
					},
				],
			},

			// ====== CREATE fields ======
			{
				displayName: 'Document Name',
				name: 'documentName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. Contract Q1 2026',
				description: 'Name for the new document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'File Source',
				name: 'fileSource',
				type: 'options',
				default: 'binary',
				options: [
					{
						name: 'Binary Input',
						value: 'binary',
						description: 'Use binary data from a previous node',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'Provide a public URL to the PDF file',
					},
				],
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property containing the PDF file',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
						fileSource: ['binary'],
					},
				},
			},
			{
				displayName: 'File URL',
				name: 'fileUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/document.pdf',
				description: 'Public URL of the PDF file to upload',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
						fileSource: ['url'],
					},
				},
			},
			{
				displayName: 'Template Name or ID',
				name: 'templateId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTemplates',
				},
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
					},
				},
			},

			// ====== SEND fields ======
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the document to send for signing',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['send'],
					},
				},
			},
			{
				displayName: 'Signers',
				name: 'signers',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Signer',
				description: 'People who need to sign the document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['send'],
					},
				},
				options: [
					{
						name: 'signerValues',
						displayName: 'Signer',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Full name of the signer',
							},
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								placeholder: 'name@email.com',
								default: '',
								description: 'Email address of the signer',
							},
						],
					},
				],
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				placeholder: 'Please sign this document...',
				description: 'Optional message to include in the signing invitation',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['send'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('allSignApi');
					const baseUrl = (credentials.baseUrl as string) || 'https://api.allsign.io';
					const apiKey = credentials.apiKey as string;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/v2/templates`,
						headers: { Authorization: `Bearer ${apiKey}` },
						json: true,
					});

					if (Array.isArray(response)) {
						return response.map((template: { id: string; name: string }) => ({
							name: template.name,
							value: template.id,
						}));
					}
					return [{ name: 'No Templates Found', value: '' }];
				} catch {
					return [{ name: 'Could not load templates', value: '' }];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('allSignApi');
		const baseUrl = (credentials.baseUrl as string) || 'https://api.allsign.io';
		const apiKey = credentials.apiKey as string;
		const authHeaders = { Authorization: `Bearer ${apiKey}` };

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'document') {
					// ============ CREATE ============
					if (operation === 'create') {
						const documentName = this.getNodeParameter('documentName', i) as string;
						const fileSource = this.getNodeParameter('fileSource', i) as string;
						const templateId = this.getNodeParameter('templateId', i, '') as string;

						let response;

						if (fileSource === 'url') {
							const fileUrl = this.getNodeParameter('fileUrl', i) as string;
							const body: Record<string, string> = {
								name: documentName,
								file_url: fileUrl,
							};
							if (templateId) body.template_id = templateId;

							response = await this.helpers.httpRequest({
								method: 'POST',
								headers: authHeaders,
								url: `${baseUrl}/v2/documents`,
								body,
								json: true,
							});
						} else {
							// Binary upload
							const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
							const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
							const buffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);

							const body: Record<string, string | object> = {
								name: documentName,
								file_data: buffer.toString('base64'),
								file_name: binaryData.fileName || 'document.pdf',
							};

							if (templateId) {
								body.template_id = templateId;
							}

							response = await this.helpers.httpRequest({
								method: 'POST',
								headers: authHeaders,
								url: `${baseUrl}/v2/documents`,
								body,
								json: true,
							});
						}

						returnData.push({ json: response as IDataObject });
					}

					// ============ SEND ============
					else if (operation === 'send') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const signersData = this.getNodeParameter('signers.signerValues', i, []) as Array<{
							name: string;
							email: string;
						}>;
						const message = this.getNodeParameter('message', i, '') as string;

						const body: Record<string, unknown> = {
							signers: signersData,
						};
						if (message) body.message = message;

						const response = await this.helpers.httpRequest({
							method: 'POST',
							headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}/send`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}

				const err = error as {
					response?: { data?: { message?: string; error?: string }; status?: number };
					message?: string;
					context?: { itemIndex?: number };
				};
				const errorData = err.response?.data || {};
				const apiMessage = errorData.message || errorData.error || err.message || 'Unknown error';

				throw new NodeOperationError(this.getNode(), `AllSign API Error: ${apiMessage}`, {
					itemIndex: i,
					description: `HTTP Status Code: ${err.response?.status || 'N/A'}`,
				});
			}
		}

		return [returnData];
	}
}
