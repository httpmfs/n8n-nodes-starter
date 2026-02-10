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
		description: 'Firma electrónica, contratos, documentos PDF. Create, sign, and manage documents with AllSign.',
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
			alias: ['Firma', 'Documento', 'Contrato', 'Signature', 'PDF', 'Sign'],
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
						name: 'Delete',
						value: 'delete',
						description: 'Delete a document',
						action: 'Delete a document',
					},
					{
						name: 'Download',
						value: 'download',
						description: 'Download the signed PDF document',
						action: 'Download a document',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Retrieve a document by ID',
						action: 'Get a document',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Retrieve multiple documents',
						action: 'Get many documents',
					},
					{
						name: 'Send',
						value: 'send',
						description: 'Send a document for signing',
						action: 'Send a document for signing',
					},
					{
						name: 'Void',
						value: 'void',
						description: 'Cancel/void a document signing process',
						action: 'Void a document',
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
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
					},
				},
			},

			// ====== GET / DELETE / DOWNLOAD / SEND / VOID fields ======
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['get', 'delete', 'download', 'send', 'void'],
					},
				},
			},

			// ====== DOWNLOAD fields ======
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyOutput',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property in which to store the downloaded file',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['download'],
					},
				},
			},

			// ====== GET ALL fields ======
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['getAll'],
					},
				},
			},

			// ====== SEND fields ======
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

			// ====== VOID fields ======
			{
				displayName: 'Reason',
				name: 'reason',
				type: 'string',
				default: '',
				placeholder: 'e.g. Document terms changed',
				description: 'Reason for voiding the document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['void'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('allSignApi');
				const environment = credentials.environment as string;
				const baseUrl = environment === 'sandbox'
					? 'https://api.sandbox.allsign.io'
					: 'https://api.allsign.io';

				try {
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/v2/templates`,
						json: true,
					});

					if (Array.isArray(response)) {
						return response.map((t: { name: string; id: string }) => ({
							name: t.name,
							value: t.id,
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
		const environment = credentials.environment as string;
		const baseUrl = environment === 'sandbox'
			? 'https://api.sandbox.allsign.io'
			: 'https://api.allsign.io';

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
								url: `${baseUrl}/v2/documents`,
								body,
								json: true,
							});
						}

						returnData.push({ json: response as IDataObject });
					}

					// ============ GET ============
					else if (operation === 'get') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v2/documents/${documentId}`,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ GET ALL ============
					else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v2/documents`,
							qs: { limit },
							json: true,
						});

						if (Array.isArray(response)) {
							for (const item of response) {
								returnData.push({ json: item as IDataObject });
							}
						} else {
							returnData.push({ json: response as IDataObject });
						}
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
							url: `${baseUrl}/v2/documents/${documentId}/send`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ DOWNLOAD ============
					else if (operation === 'download') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const binaryPropertyOutput = this.getNodeParameter('binaryPropertyOutput', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v2/documents/${documentId}/download`,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						});

						const headers = response.headers as Record<string, string>;
						let fileName = `document-${documentId}.pdf`;

						// Try extracting filename from Content-Disposition header
						const contentDisposition = headers['content-disposition'];
						if (contentDisposition) {
							const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
							if (match?.[1]) {
								fileName = match[1];
							}
						}

						const binaryData = await this.helpers.prepareBinaryData(
							response.body as unknown as Buffer,
							fileName,
							(headers['content-type'] as string) || 'application/pdf',
						);

						returnData.push({
							json: { documentId, fileName },
							binary: { [binaryPropertyOutput]: binaryData },
						});
					}

					// ============ VOID ============
					else if (operation === 'void') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const reason = this.getNodeParameter('reason', i, '') as string;

						const body: Record<string, string> = {};
						if (reason) body.reason = reason;

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/v2/documents/${documentId}/void`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ DELETE ============
					else if (operation === 'delete') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const response = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/v2/documents/${documentId}`,
							json: true,
						});
						returnData.push({ json: (response as IDataObject) ?? { success: true, documentId } });
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
